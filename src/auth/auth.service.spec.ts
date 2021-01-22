import { Test, TestingModule } from '@nestjs/testing';
import { AuthHelper } from './auth.helper';
import { AuthService } from './auth.service';
import { CacheService } from '../utils/caching/cache.service';
import { ConfigService } from '@nestjs/config';
import { ConfigDynamicModule } from '../utils/config/config.mock';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigDynamicModule],
      providers: [ConfigService, AuthHelper, CacheService, AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
