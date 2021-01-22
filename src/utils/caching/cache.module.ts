import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from 'nestjs-redis';
import { Configuration } from '../config/configuration';

const RedisDynamicModule = RedisModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  async useFactory(configService: ConfigService<Configuration>) {
    const database = configService.get<Configuration['database']>('database')!;
    return { url: database.redisUri };
  },
});

@Module({ imports: [RedisDynamicModule] })
export class CacheModule {}
