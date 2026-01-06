import jwt from "jsonwebtoken";
import { CHROME_EXTENSION_ALL_URL, JWT_SECRET, API_BASE_URL } from "../config.js";
import crypto from "crypto";
import type { Request, Response } from "express";

// Endpoint vydava krakodoby JWT token pouze userum, 
// kteri vypadaji jako moje Chrome rozsireni. 
// Token slouzi k docasnemu overenei pristupu k API bez nutnosti
// vystavovat API klic ve frontendovém kodu.

export function getToken(req: Request, res: Response) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const userAgent = req.get("User-Agent") || "";

  // 🛡️ overeni, ze pozadavek je z rozsireni
  const isFromExtension =
    origin.includes(CHROME_EXTENSION_ALL_URL) ||
    referer.includes(CHROME_EXTENSION_ALL_URL);

  if (!isFromExtension || !userAgent.includes("Chrome")) {
    return res.status(403).json({ error: "Unauthorized access to token" });
  }

  // 📦 Payload tokenu
  const payload = {
    extId: CHROME_EXTENSION_ALL_URL, // overeni, podle ID z extension
    sub: "chrome-extension",
    aud: API_BASE_URL,
    jti: crypto.randomUUID(),
  };

  // 🔐 vytvoreni JWT 
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "5m",
  });

  return res.json({ token });
}