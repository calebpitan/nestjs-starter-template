import 'express-session';

declare module 'express-session' {
  type VerifiedAuthPayload = import('../../src/auth/interfaces/verified-auth.interface').VerifiedAuthPayload;
  interface Session {
    account?: VerifiedAuthPayload & { email: string; scope?: string };
  }
}
