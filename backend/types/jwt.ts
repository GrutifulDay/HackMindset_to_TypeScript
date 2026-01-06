import type { JwtPayload } from "jsonwebtoken";

export type TokenPayload = JwtPayload & {
  extId: string;
  sub: string;
  aud: string;
  jti: string;
};


export type TokenUsageInput = {
  jti: string;
  ip: string;
  userAgent: string;
  path: string;
};

