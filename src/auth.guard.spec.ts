import { Request } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { AuthHelper } from './auth/auth.helper';
import { AppLogger } from './utils/logger/logger.service';
import {
  UnauthenticatedException,
  UnauthorizedException,
  TokenExpiredException,
  ForbiddenException,
} from './utils/exceptions';
import { CacheService } from './utils/caching/cache.service';
import { ConfigDynamicModule } from './utils/config/config.mock';
import { wait } from './utils';

jest.mock('./utils/caching/cache.service', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CacheServiceMock } = require('./__mocks__/utils/caching/cache.service');
  return { CacheService: CacheServiceMock };
});

async function createExecContext<T extends Partial<Request>>(req: T) {
  const executionCtx = {
    switchToHttp: jest.fn(() => ({
      getRequest: () => ({ ...req }),
    })),
  };
  return executionCtx;
}

async function mockRequest(helper: AuthHelper) {
  const auth = { id: 1234 };
  const token = await helper.createToken(auth, '2s');
  const sessionID = '1a2b3c';
  const req: Partial<Request> = {
    headers: { authorization: `Bearer ${token}` },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    session: { id: sessionID, account: { ...auth } },
    sessionID,
  };
  return req;
}

const setSessionTokenTrack = async (cache: CacheService, req: Partial<Request>, ttl = 3) => {
  const cacheKey = `${cache.TOKEN_TRACKING_KEY}:${req.session!.account!.id}:${req.sessionID}`;
  const [, token] = req.headers!.authorization!.split(' ');
  await cache.setKey(cacheKey, token, ttl);
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let cacheService: CacheService;
  let helper: AuthHelper;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigDynamicModule],
      providers: [ConfigService, CacheService, AppLogger, AuthHelper, AuthGuard],
    }).compile();

    jest.setTimeout(10000);

    guard = moduleRef.get<AuthGuard>(AuthGuard);
    cacheService = moduleRef.get<CacheService>(CacheService);
    helper = moduleRef.get<AuthHelper>(AuthHelper);
  });

  afterEach(async () => {
    await cacheService.clear();
    return await cacheService.close();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should get the request from the execution context', async () => {
    const execCtx = await createExecContext({});
    try {
      await guard.canActivate((execCtx as unknown) as ExecutionContext);
    } catch {
      expect(execCtx.switchToHttp).toBeCalled();
    }
  });

  it('should return `true`', async () => {
    const req = await mockRequest(helper);
    await setSessionTokenTrack(cacheService, req);
    const execCtx = await createExecContext(req);
    const result = await guard.canActivate((execCtx as unknown) as ExecutionContext);
    expect(result).toBeTruthy();
  });

  it("should fail with `UnauthenticatedException` when there's no session", async () => {
    const req = await mockRequest(helper);
    await setSessionTokenTrack(cacheService, req);
    delete req.session;
    const execCtx = await createExecContext(req);
    const result = guard.canActivate((execCtx as unknown) as ExecutionContext);
    expect(result).rejects.toThrow(UnauthenticatedException);
  });

  it("should fail with `UnauthorizedException` when there's no bearer", async () => {
    const req = await mockRequest(helper);
    await setSessionTokenTrack(cacheService, req);
    req.headers!.authorization = undefined;
    const execCtx = await createExecContext(req);
    const result = guard.canActivate((execCtx as unknown) as ExecutionContext);
    expect(result).rejects.toThrow(UnauthorizedException);
  });

  it("should fail with `ForbiddenException` when there's probable ambiguity", async () => {
    const req = await mockRequest(helper);
    await setSessionTokenTrack(cacheService, req);
    req.headers!.authorization = 'Bearer fake-token-that-dont-match-the-track';
    const execCtx = await createExecContext(req);
    const result = guard.canActivate((execCtx as unknown) as ExecutionContext);
    expect(result)
      .rejects.toThrow(ForbiddenException)
      .catch(e => console.log(e.message));
  });

  it('should fail with `TokenExpiredException`', async () => {
    const req = await mockRequest(helper);
    await setSessionTokenTrack(cacheService, req, 5); // should be greater than wait time.
    const execCtx = await createExecContext(req);
    await wait(2000);
    const result = guard.canActivate((execCtx as unknown) as ExecutionContext);
    await expect(result)
      .rejects.toThrow(TokenExpiredException)
      .catch(e => console.log('a', e.message));
  });
});
