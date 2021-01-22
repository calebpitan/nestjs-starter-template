import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from 'nestjs-typegoose';
import session from 'express-session';
import mongostore from 'connect-mongo';
import { v4 as uuidV4 } from 'uuid';
import { Configuration } from '../utils/config/configuration';
import { AppLogger } from '../utils/logger/logger.service';

type SessionMiddlewareFactoryOptions = {
  secret: string;
  production: boolean;
  connection: mongoose.Connection;
  maxAge?: number;
};

const sessionMiddlewareFactory = ({
  secret,
  production,
  connection,
  maxAge,
}: SessionMiddlewareFactoryOptions) => {
  const MongoStore = mongostore(session);
  const store = new MongoStore({ mongooseConnection: connection });
  return session({
    genid: () => uuidV4(),
    name: 'nest-app',
    store,
    secret,
    saveUninitialized: false,
    unset: 'keep',
    resave: false,
    proxy: production,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: 'strict',
      maxAge,
    },
  });
};

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService<Configuration>,
    private readonly logger: AppLogger,
    @Inject(getConnectionToken()) private connection: mongoose.Connection,
  ) {
    this.logger.setContext(SessionMiddleware.name);
  }

  // session middleware interceptor
  use(req: Request, res: Response, next: NextFunction) {
    const appConfig = this.configService.get<Configuration['app']>('app')!;
    const sessionConfig = this.configService.get<Configuration['session']>('session')!;
    const sessionMiddleware = sessionMiddlewareFactory({
      secret: sessionConfig.secret,
      production: appConfig.production,
      connection: this.connection,
      maxAge: sessionConfig.expiry * 1e3, // seconds to milliseconds
    });
    // delegate to main middleware
    sessionMiddleware(req, res, next);
  }
}
