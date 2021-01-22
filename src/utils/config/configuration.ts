import jwt from 'jsonwebtoken';

export type Configuration = ReturnType<typeof configFactory>;

const APP_NAME = 'nest_app';
const ALGO: jwt.Algorithm = 'RS256';

const configFactory = () => ({
  app: {
    name: APP_NAME,
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    production: process.env.NODE_ENV === 'production',
  },
  database: {
    uri: process.env.MONGO_CONNECT_STRING || `mongodb://localhost/${APP_NAME}`,
    redisUri: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  session: {
    secret: process.env.SESSION_SECRET!,
    expiry: 60 * 60 * 24 * 7, // 1 week in seconds (7 days)
  },
  auth: {
    jwt: {
      algo: ALGO as jwt.Algorithm,
      RS256PK: process.env.JWT_RS256_KEY_PUB!,
      RS256SK: process.env.JWT_RS256_KEY!,
      expiry: '1h', // Token must be refreshed every hour
    },
  },
});

export default configFactory;
