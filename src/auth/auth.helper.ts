import { Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../utils/config/configuration';
import { TokenExpiredException } from '../utils/exceptions';
import { SessionAndTokenData, VerifiedAuthPayload } from './interfaces';

@Injectable()
export class AuthHelper {
  private authConfig: Configuration['auth'];

  constructor(@Inject(ConfigService) private readonly configService: ConfigService<Configuration>) {
    this.authConfig = this.configService.get<Configuration['auth']>('auth')!;
  }

  async hashPassword(password: string) {
    const saltRounds = 8;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async comparePassword(password: string, hashed: string) {
    try {
      const similar = await bcrypt.compare(password, hashed);
      return similar;
    } catch (e) {
      throw new Error(e);
    }
  }

  createToken(data: any, expiry: string | number = this.authConfig.jwt.expiry) {
    return new Promise<string>((resolve, reject) => {
      const privatekey = this.authConfig.jwt.RS256SK;
      const algorithm = this.authConfig.jwt.algo;
      jwt.sign(data, privatekey, { expiresIn: expiry, algorithm }, (err, token) => {
        if (err) {
          return reject(err);
        }
        resolve(token!);
      });
    });
  }

  decodeToken(token: string) {
    return new Promise<VerifiedAuthPayload>((resolve, reject) => {
      try {
        const data = jwt.decode(token);
        resolve(data as VerifiedAuthPayload);
      } catch (e) {
        reject(e);
      }
    });
  }

  verifyToken(token: string): Promise<VerifiedAuthPayload> {
    return new Promise<VerifiedAuthPayload>((resolve, reject) => {
      const publickey = this.authConfig.jwt.RS256PK;
      const algorithm = this.authConfig.jwt.algo;
      jwt.verify(token, publickey, { algorithms: [algorithm, 'RS256'] }, (err, decoded) => {
        if (err) {
          const { name, message } = err;
          if (name === 'TokenExpiredError') {
            return reject(new TokenExpiredException(message));
          }
          return reject(new ForbiddenException(message));
        }
        resolve(decoded as VerifiedAuthPayload);
      });
    });
  }

  createSession<T>(req: Request, data: T) {
    if (!req.session) return null;
    return Object.assign(req.session, data);
  }

  payloadFromData(data: SessionAndTokenData): [ClientTokenPayload, ServerSessionPayload] {
    const { id, acid, email, meta } = data;
    const client = { id, acid, meta };
    const server = { id, acid, email, meta };
    return [client, server];
  }
}

type ClientTokenPayload = Omit<SessionAndTokenData, 'email'>;
type ServerSessionPayload = {
  [P in keyof SessionAndTokenData]: SessionAndTokenData[P];
};
