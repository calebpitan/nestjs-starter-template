import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypegooseModule, TypegooseConnectionOptions } from 'nestjs-typegoose';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { LoggerModule } from './utils/logger/logger.module';
import configuration from './utils/config/configuration';
import { CacheModule } from './utils/caching/cache.module';
import { SessionMiddleware } from './middleware';

const typegooseConnectionOptions: TypegooseConnectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

const TypegooseDynamicModule = TypegooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  async useFactory(configService: ConfigService) {
    return {
      uri: configService.get<string>('database.uri')!,
      ...typegooseConnectionOptions,
    };
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    TypegooseDynamicModule,
    CacheModule,
    LoggerModule,
    AuthModule,
    AccountModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
