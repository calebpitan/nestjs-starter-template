import configFactory, { Configuration } from './configuration';
import { ConfigModule } from '@nestjs/config';

const config = configFactory();

export const testConfig: Configuration = {
  ...config,
  auth: {
    ...config.auth,
    jwt: {
      ...config.auth.jwt,
      algo: 'HS256',
      RS256PK: 'secret',
      RS256SK: 'secret',
    },
  },
};

export const ConfigDynamicModule = ConfigModule.forRoot({ load: [() => testConfig] });
