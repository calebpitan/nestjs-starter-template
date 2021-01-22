import { Request } from 'express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthHelper } from './auth/auth.helper';
import { VerifiedAuthPayload } from './auth/interfaces';
import { AppLogger } from './utils/logger/logger.service';
import { UnauthorizedException, UnauthenticatedException, ErrorMessage } from './utils/exceptions';
import { NonDeterministicAuthorizationException, ForbiddenException } from './utils/exceptions';
import { CacheService } from './utils/caching/cache.service';

const getTTL = (exp: number) => exp - Math.floor(Date.now() / 1e3);

export const getSessionTokens = async (cache: CacheService, sessionID: string) => {
  const pattern = `${cache.TOKEN_TRACKING_KEY}:*:${sessionID}`; // (*) = userId
  const userKeys = await cache.matchKeys(pattern);
  if (userKeys.length === 0) {
    return null;
  }
  return cache.getKeys(...userKeys);
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly helper: AuthHelper,
    private readonly logger: AppLogger,
    private readonly cacheSerice: CacheService,
  ) {
    this.logger.setContext(AuthGuard.name);
  }

  /**
   * Checks whether a handler can be activated.
   *
   * @param context Execution context
   * @throws {UnauthenticatedException}
   * @throws {UnauthorizedException}
   * @throws {ForbiddenException}
   * @throws {NonDeterministicAuthorizationException}
   * @throws {TokenExpiredException}
   * @throws {Error}
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest<Request>();
    const { authorization } = req.headers;
    const nobearer = [undefined, undefined];
    const [, bearer] =
      typeof authorization === 'string'
        ? /bearer\s+(.+)/i.exec(authorization) ?? nobearer
        : nobearer;

    if (!req.session || !req.session.account) {
      this.logger.log('API accessed without being authenticated');
      throw new UnauthenticatedException(ErrorMessage.UNAUTHENTICATED);
    }

    if (!bearer) {
      this.logger.log('API accessed without any known form of authorization');
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }

    const trackedTokens: Array<string | null> | null = await getSessionTokens(
      this.cacheSerice,
      req.sessionID,
    );

    if (!trackedTokens) {
      this.logger.error('Session-token record could not be found in cache while authenticated');
      throw new Error('Unknown error!');
    }

    const filteredTrackedTokens = trackedTokens.filter(Boolean) as Array<string>;

    // If there's no match, among the tokens mapped/associated with this session, with the one provided
    // then authorization could be ambiguous. Fail early enough before any compromise.
    if (!filteredTrackedTokens.some(token => token === bearer)) {
      // This would mean a user cannot have two or more usable tokens under the same session.
      this.logger.log('Token possibly compromised');
      throw new ForbiddenException(ErrorMessage.TOKEN_COMPROMISED);
    }

    this.logger.log('Fetching decoded token from cache...');
    let auth = await this.cacheSerice.getJSON<VerifiedAuthPayload>(bearer);

    if (!auth /* Cache miss */) {
      this.logger.log('Token not found in cache, decoding and adding token to cache...');
      auth = await this.helper.verifyToken(bearer);
      auth.lastAccessed = Date.now();
    }

    if (auth.id !== req.session.account.id) {
      // may never happen
      this.logger.log('Ambiguous authorization detected');
      throw new NonDeterministicAuthorizationException(ErrorMessage.NON_DETEMINISTIC_AUTHORIZATION);
    }

    auth.lastAccessed = Date.now();
    req.auth = auth;
    await this.cacheSerice.setJSON(bearer, auth, getTTL(auth.exp));

    return true;
  }
}
