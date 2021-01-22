import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from './entity';
import { TypegooseModule } from 'nestjs-typegoose';
import { AuthHelper } from '../auth/auth.helper';
import { CacheService } from '../utils/caching/cache.service';

@Module({
  imports: [TypegooseModule.forFeature([Account])],
  controllers: [AccountController],
  providers: [CacheService, AuthHelper, AccountService],
})
export class AccountModule {}
