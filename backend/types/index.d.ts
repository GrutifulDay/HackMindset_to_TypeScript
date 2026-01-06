import "express";
import type { TokenPayload } from "./jwt.ts";

declare module "express-serve-static-core" {
  type DemoTokenPayload = { demo: true };

  interface Request {
    tokenPayload?: TokenPayload | DemoTokenPayload;
  }
}
