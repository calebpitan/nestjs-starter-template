type BasePayload = { id: string; acid: string; email: string };
export type SessionAndTokenData = BasePayload & {
  meta: {
    deviceName: string;
    localization: {
      locale: string;
      city: string;
      countryCode: string;
      region: string;
      timezone: string;
      coords: [number, number];
    };
  };
};

export interface VerifiedAuthPayload {
  id: string;
  acid: string;
  lastAccessed: number;
  iat: number;
  exp: number;
}
