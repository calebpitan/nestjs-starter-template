import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { Account } from '../account/entity';
import { AuthHelper } from './auth.helper';
import { CacheService } from '../utils/caching/cache.service';

@Module({
  imports: [TypegooseModule.forFeature([Account])],
  controllers: [AuthController],
  providers: [AuthService, AuthHelper, CacheService],
})
export class AuthModule {}
