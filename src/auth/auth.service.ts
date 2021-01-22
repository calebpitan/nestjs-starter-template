import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { mongoose, ReturnModelType } from '@typegoose/typegoose';
import { getConnectionToken, InjectModel } from 'nestjs-typegoose';
import { CredentialDto } from './dto';
import { AuthHelper } from './auth.helper';
import { CreateAccountDto } from '../account/dto';
import { Account } from '../account/entity';
import { CacheService } from '../utils/caching/cache.service';
import { AppLogger } from '../utils/logger/logger.service';
import { ErrorMessage } from '../utils/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly helper: AuthHelper,
    private readonly logger: AppLogger,
    private readonly cacheService: CacheService,
    @Inject(getConnectionToken()) private readonly connection: mongoose.Connection,
    @InjectModel(Account) private readonly account: ReturnModelType<typeof Account>,
  ) {}

  async create(credential: CreateAccountDto) {
    const { password, ...rest } = credential;
    const account = await this.account.create({
      ...rest,
      password: await this.helper.hashPassword(password),
    });
    return account;
  }

  async login(credential: CredentialDto) {
    const account = await this.account
      .findOne({ ...credential.identifier })
      .select('+password')
      .lean();

    if (!account) {
      throw new BadRequestException('Account not found!');
    }

    if (await this.helper.comparePassword(credential.password, account.password)) {
      return account;
    }

    throw new BadRequestException('Incorrect password!');
  }

  /**
   * Revokes a session and unassociates authentication tokens
   *
   * @param userId ID of the user to revoke for
   * @param sid ID of the session to revoke
   * @throws {ForbiddenException}
   */
  async revokeSession(userId: string, sid: string) {
    const track = await this.cacheService.getTokenTrack(userId);

    if (!track) {
      return { success: true, message: `No sessions to revoke` };
    }

    const token = track.get(sid);
    const authorized = Boolean(token);

    if (authorized) {
      try {
        await Promise.all([
          this.connection.db.collection('sessions').deleteOne({ _id: sid }),
          this.cacheService.delete(token!),
          this.cacheService.delTokenTrack(userId, sid),
        ]);
        return { sid, success: true, message: `Session revoked successfully!` };
      } catch (e) {
        this.logger.error(e.message);
        return { success: false, message: `Unable to revoke session "${sid}" at the moment` };
      }
    }

    throw new ForbiddenException(ErrorMessage.UNASSOCIATED_SESSION);
  }

  /**
   * Unassociates authentication token with current session.
   *
   * @param userId ID of the user to reset session for
   * @param sid ID of the current session
   */
  async unassociateTokenWithSession(userId: string, sid: string) {
    const track = await this.cacheService.getTokenTrack(userId);

    if (!track) return false;

    const token = track.get(sid);

    if (!token) return false;

    // Delete decoded access token in cache using the token as key
    // Delete session to token association
    await Promise.all([
      this.cacheService.delete(token),
      this.cacheService.delTokenTrack(userId, sid),
    ]);

    return true;
  }
}
