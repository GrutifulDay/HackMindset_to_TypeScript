import crypto from "crypto";
import { HASH_KEY, DEMO_MODE } from "../config.js";

// Hashovani IP adresy pomoci HMAC (SHA-256)
// Slouzi k anonymizaci IP pro logovani a notifikace
// IP nelze z hashe zpetne zjistit bez tajneho klice

export function hashIp(ip) {
  if (DEMO_MODE) return null;
  
  if (!ip) return null;
  return crypto
    .createHmac("sha256", HASH_KEY)
    .update(ip)
    .digest("hex");
}
