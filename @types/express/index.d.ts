declare namespace Express {
  type VerifiedAuthPayload = import('../../src/auth/interfaces/verified-auth.interface').VerifiedAuthPayload;
  type SessionData = import('express-session').SessionData;
  interface Request {
    auth?: VerifiedAuthPayload;
  }
}
