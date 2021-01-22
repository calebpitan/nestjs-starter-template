import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { CacheService } from '../utils/caching/cache.service';
import { AppLogger } from '../utils/logger/logger.service';
import { AuthService } from './auth.service';
import { AuthHelper } from './auth.helper';
import { ConfigDynamicModule } from '../utils/config/config.mock';
import { TypegooseConnectionOptions, TypegooseModule } from 'nestjs-typegoose';
import { Account } from '../account/entity/account.entity';
import { ConfigService } from '@nestjs/config';

jest.mock('../utils/caching/cache.service', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CacheServiceMock } = require('../__mocks__/utils/caching/cache.service');
  return { CacheService: CacheServiceMock };
});

const typegooseConnectionOptions: TypegooseConnectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const TM = TypegooseModule.forRootAsync({
      imports: [ConfigDynamicModule],
      inject: [ConfigService],
      async useFactory(configService: ConfigService) {
        return {
          uri: configService.get<string>('database.uri')!,
          ...typegooseConnectionOptions,
        };
      },
    });
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigDynamicModule, TM, TypegooseModule.forFeature([Account])],
      controllers: [AuthController],
      providers: [AppLogger, CacheService, AuthHelper, AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
