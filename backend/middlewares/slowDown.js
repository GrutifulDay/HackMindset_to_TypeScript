import slowDown from "express-slow-down";
import { UAParser } from "ua-parser-js";
import { notifyBlockedIP } from "../utils/discordNotification.js";
import { redactHeaders } from "../utils/redact.js";
import { warn } from "../utils/logger.js";

// ------------------------------------------------------------------
// ARCHIVNI MIDDLEWARE – express-slow-down
// ------------------------------------------------------------------
// Tento middleware byl drive pouzivan pro zpomaleni nadmernych requestu.
// Slouzi zde pouze jako ukazka alternativni ochrany (rate -> slowdown).
//
// V aktualni architekture NENI aktivne pouzivan, protoze:
// - zpomaloval odezvu Chrome Extension
// - ochrana je nyni resena na sitove vrstve serveru (NGINX / proxy)
// - kombinace rate limit + blacklist je efektivnejsi
//
// Kod je ponechan zamerne jako reference a dokumentace vyvoje
// ------------------------------------------------------------------

// Zpomaleni requestu po prekroceni limitu
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 min 
  delayAfter: 50,         // az po X pozadavcich
  delayMs: () => 500,      // kazdy dalsi request zpomali o Xms
  message: "Too many requests – you are being slowed down."
});

// Logovani zpomalenych requestu (audit / monitoring)
async function logSlowRequests(req, res, next) {
  const used = req.slowDown?.current || 0;
  const limit = req.slowDown?.limit || 0;

  if (used > limit) {
    const uaString = req.get("User-Agent") || "Unknown";
    const parser = new UAParser(uaString);
    const result = parser.getResult();

    warn(`🐌 IP ${req.ip} is slowed down: ${used}/${limit}`);
    res.setHeader("X-Slowed-Down", "true");

    await notifyBlockedIP({
      ip: req.ip,
      city: "Unknown",
      userAgent: uaString,
      browser: result.browser?.name || "Unknown",
      os: result.os?.name || "Unknown",
      deviceType: result.device?.type || "Unknown",
      reason: "Speed limiter triggered",
      method: req.method,
      path: req.originalUrl,
      headers: redactHeaders(req.headers), 
      origin: req.get("Origin"),
      referer: req.get("Referer"),
      requests: used
    });
  }

  next();
}

export default [speedLimiter, logSlowRequests];
