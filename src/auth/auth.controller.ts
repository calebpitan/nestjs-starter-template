import { Request } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateAccountDto } from '../account/dto';
import { AuthService } from './auth.service';
import { CredentialDto, RevokeSessionDto } from './dto';
import { AuthQuery, VerifiedAuthPayload } from './interfaces';
import { AuthGuard } from '../auth.guard';
import { AuthHelper } from './auth.helper';
import { CacheService } from '../utils/caching/cache.service';
import { AppLogger } from '../utils/logger/logger.service';
import { DataInterceptor } from '../data.interceptor';
import { ResolvePromise } from '../utils/types';
import {
  MongoDBErrorCodes,
  BadRequestException,
  UnauthenticatedException,
  ErrorMessage,
} from '../utils/exceptions';

@Controller('auth')
@UseInterceptors(DataInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly helper: AuthHelper,
    private readonly cacheService: CacheService,
    private readonly logger: AppLogger,
  ) {}

  @Post('create')
  async create(
    @Req() req: Request,
    @Body() credential: CreateAccountDto,
    @Query() query: AuthQuery,
  ) {
    type CreateAccount = InstanceType<typeof AuthService>['create'];
    let account!: ResolvePromise<ReturnType<CreateAccount>>;

    try {
      account = await this.authService.create(credential);
    } catch (e) {
      if (e.code === MongoDBErrorCodes.DUPLICATE) {
        const message = `The input ${Object.keys(e.keyPattern).join(' and')} already exists`;
        throw new BadRequestException(message, e.keyPattern);
      }
      this.logger.log(e.message);
      throw e;
    }

    // If there's an active session, unassociate it with currently associated token
    if (req.session && req.session.account) {
      this.authService.unassociateTokenWithSession(req.session.account.id, req.sessionID);
    }

    const [clientPayload, serverSessionPayload] = this.helper.payloadFromData({
      id: account._id,
      acid: '',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      meta: { deviceName: query.device_name, localization: { locale: 'en' } },
    });

    this.helper.createSession(req, { account: serverSessionPayload });

    const token = await this.helper.createToken(clientPayload);
    const ttl = Math.floor((Date.now() + req.session.cookie.originalMaxAge) / 1e3); // Milliseconds to seconds

    await this.cacheService.setTokenTrack(account._id, req.sessionID, token, ttl);

    return { id: account._id, token, success: true, message: `Account created successfully!` };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Body() credential: CredentialDto, @Query() query: AuthQuery) {
    const account = await this.authService.login(credential);

    // If there's an active session, unassociate it with currently associated token
    if (req.session && req.session.account) {
      this.authService.unassociateTokenWithSession(req.session.account.id, req.sessionID);
    }

    const [clientPayload, serverSessionPayload] = this.helper.payloadFromData({
      id: account._id,
      acid: '',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      meta: { deviceName: query.device_name, localization: { locale: 'en' } },
    });

    this.helper.createSession(req, { account: serverSessionPayload });

    const token = await this.helper.createToken(clientPayload);
    const ttl = Math.floor((Date.now() + req.session.cookie.originalMaxAge) / 1e3); // Milliseconds to seconds

    await this.cacheService.setTokenTrack(account._id, req.sessionID, token, ttl);

    return { id: account._id, token, success: true, message: `Logged in successfully!` };
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async getSessions(@Req() req: Request) {
    // const maxage = req.session.cookie.maxAge;
    // const omaxage = req.session.cookie.originalMaxAge;
    // console.log('MaxAge', maxage, new Date(Date.now() + maxage));
    // console.log('OMaxAge', omaxage, new Date(Date.now() + omaxage));

    const auth = req.auth!;
    const track = await this.cacheService.getTokenTrack(auth.id);
    const sessions: Array<VerifiedAuthPayload & { sid: string; obsolete: boolean }> = [];

    if (!track) return { sessions: [] };

    for (const [sid, token] of track.entries()) {
      try {
        const decoded = await this.helper.verifyToken(token);
        const cachedDecoded = await this.cacheService.getJSON<VerifiedAuthPayload>(token);
        const { id, ...rest } = Object.assign({}, decoded, cachedDecoded);
        sessions.push({ id, sid, ...rest, obsolete: false });
      } catch (e) {
        if (e.name === 'TokenExpiredException') {
          const { id, ...rest } = await this.helper.decodeToken(token);
          sessions.push({ id, sid, ...rest, obsolete: true });
        }
        // At this point, the token is just invalid and shouldn't have found its way into the store
        // in the first place
        await this.cacheService.delTokenTrack(auth.id, sid);
      }
    }

    return { sessions };
  }

  @Get('sessions/refresh')
  async refreshToken(@Req() req: Request, @Query() query: AuthQuery) {
    const session = req.session;
    const { account, id: sid } = session;

    if (!account) {
      throw new UnauthenticatedException(ErrorMessage.UNAUTHENTICATED);
    }

    const [clientPayload, serverSessionPayload] = this.helper.payloadFromData({
      id: account.id,
      acid: '',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      meta: { deviceName: query.device_name, localization: { locale: 'en' } },
    });

    this.helper.createSession(req, { account: serverSessionPayload });

    const token = await this.helper.createToken(clientPayload);
    const ttl = Math.floor((Date.now() + req.session.cookie.originalMaxAge) / 1e3); // Milliseconds to seconds

    await this.cacheService.setTokenTrack(account.id, sid, token, ttl);

    return { token, success: true, message: `Refreshed successfully!` };
  }

  @Delete('sessions/revoke')
  @UseGuards(AuthGuard)
  async revokeSession(@Req() req: Request, @Body() revokeSessionDto: RevokeSessionDto) {
    const auth = req.auth!;
    const sid = revokeSessionDto.sid;
    return await this.authService.revokeSession(auth.id, sid);
  }

  @Delete('sessions/reset')
  @UseGuards(AuthGuard)
  async resetSession(@Req() req: Request) {
    const auth = req.auth!;
    const sid = req.sessionID;

    try {
      await this.authService.unassociateTokenWithSession(auth.id, sid);

      await new Promise<void>((resolve, reject) => {
        req.session.destroy(err => {
          if (err) return reject(err);
          resolve();
        });
      });

      return { success: true, message: 'Current session reset successfully!' };
    } catch (e) {
      this.logger.error(e.message);
      return { success: false, message: `Unable to reset session at the moment` };
    }
  }
}
