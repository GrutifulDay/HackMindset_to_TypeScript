// middlewares/ipBlocker.js
import jwt from "jsonwebtoken";
import BlacklistedIP from "../models/BlacklistedIP.js";
import { notifyBlockedIP } from "../utils/discordNotification.js";
import { saveSecurityLog } from "../services/securityLogService.js";
import { hashIp } from "../utils/hashIp.js";
import { isRevoked } from "./tokenRevocation.js";
import { CHROME_EXTENSION_ALL_URL, JWT_SECRET } from "../config.js";
import util from "util";
import { debug, info, warn, error } from "../utils/logger.js";

// Middleware pro blokovani IP adres
// Slouzi jako centralni ochrana proti opakovanemu zneuzivani API
// Kombinuje pametovy blacklist + DB + vyjimky pro Chrome Extension

// ------------------------------------------------------------
// Pametovy blacklist (hashovane IP adresy)
// Slouzi pro rychlou kontrolu bez DB dotazu
// ------------------------------------------------------------

const blacklistedIPs = new Set();

// Normalizace IP (IPv6 -> IPv4)
const normalizeIp = (ip) => {
  if (!ip) return ip;
  const m = String(ip).match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return m ? m[1] : ip;
};

// redakce citlivych hodnot
const redact = (obj = {}) => {
  const SENSITIVE = new Set([
    "password",
    "pass",
    "token",
    "apikey",
    "api_key",
    "authorization",
    "cookie",
  ]);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? "[REDACTED]" : v;
  }
  return out;
};

// Middleware pro blokovani IP
export default async function ipBlocker(req, res, next) {
  global.util = util;
  const clientIP = normalizeIp(req.ip);
  const ipHash = hashIp(clientIP);
  if (req.method === "OPTIONS") return next();

  const origin = req.headers.origin || req.headers.referer || "";
  const ua = req.get("user-agent") || "";
  const isFromExtensionOrigin = origin.includes(CHROME_EXTENSION_ALL_URL);
  const isChromeUA = ua.includes("Chrome");
  const isTokenIssueRoute = req.path === "/api/get-token";

  // 1) IP neni na blacklistu -> request pokracuje
  if (!blacklistedIPs.has(ipHash)) return next();

  // 🚨 IP JE NA BLACKLISTU → zkontroluje vyjimky
  // /api/get-token z rozsireni → povolen
  if (isTokenIssueRoute && isFromExtensionOrigin && isChromeUA) {
    debug(`⚠️ IP ${clientIP} je na blacklistu, ale povoluji /get-token pro rozšíření.`);
    return next();
  }

  // jiny /api/* pozadave z extension → overi JWT
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      debug("🔍 Decoded JWT payload:", decoded);
  
      const okExt = decoded?.extId === CHROME_EXTENSION_ALL_URL;
      const okSub = decoded?.sub === "chrome-extension";
      const okAud = decoded?.aud?.includes("/api");
      const revoked = decoded?.jti ? isRevoked(decoded.jti) : false;
  
      debug("✅ Kontrola JWT:", { okExt, okSub, okAud, revoked });
  
      if (okExt && okSub && okAud && !revoked) {
        debug(`🧩 IP ${clientIP} je na blacklistu, ale má platný JWT z rozšíření → POVOLENO`);
        req.tokenPayload = decoded;
        return next();
      } else {
        warn(`🚫 Token neprošel validací – extId/sub/aud nesedí nebo je revokován`);
      }
    } catch (err) {
      warn("❌ ipBlocker: JWT verify failed:", err.message);
    }
  }
  

  // kdyz se sem dostane, IP zustava blokovana
  try {
    await saveSecurityLog({
      src: "express",
      kind: "blocked",
      ip: clientIP,
      method: req.method,
      host: req.headers.host,
      path: req.path,
      status: 403,
      ua: ua,
      ref: req.get("referer"),
      rule: "ip_blacklist",
      note: "Blocked by ipBlacklist middleware",
      raw: {
        query: redact(req.query),
        headers: redact({
          origin: req.get("origin"),
          authorization: req.get("authorization"),
          "content-type": req.get("content-type"),
        }),
        body: redact(req.body || {}),
      },
    });
  } catch (e) {
    error("sec-log save error:", e.message);
  }

  await notifyBlockedIP({
    ip: clientIP,
    city: "Neznámé",
    userAgent: ua,
    reason: "IP Blacklist",
    method: req.method,
    path: req.originalUrl,
    headers: req.headers, // ← prida skutecne hlavicky
  });
  

  return res.status(403).json({ error: "Access denied" });
}

// Pridani IP do blacklistu (DB + pamet)
export async function addToBlacklist(ip, reason = "Automatické blokování", info = {}) {
  if (!ip || ip === "null" || ip === "undefined") {
    warn("⚠️ Skipped saving to blacklist — IP undefined or invalid:", ip);
    return false;
  }

  ip = normalizeIp(ip);
  if (!ip) return false;

  const ipHash = hashIp(ip);
  if (blacklistedIPs.has(ipHash)) return false;

  blacklistedIPs.add(ipHash);
  warn(`🧨 IP ${ip} přidána do Setu (důvod: ${reason})`);

  try {
    const exists = await BlacklistedIP.findOne({ ipHash });
    if (!exists) {
      const newIP = new BlacklistedIP({
        ipHash,
        reason,
        userAgent: info.userAgent || "Neznámý",
        browser: info.browser || "Neznámý",
        os: info.os || "Neznámý",
        deviceType: info.deviceType || "Neznámý",
        city: info.city || "Neznámý",
        method: info.method || "Neznámá",
        path: info.path || "Neznámá",
      });
      await newIP.save();
      debug(`🛑 IP ${ip} uložena do databáze (hash: ${ipHash})`);

      await notifyBlockedIP({
        ip,
        city: info.city || "Neznámé",
        userAgent: info.userAgent || "Neznámý",
        reason,
        method: info.method || "?",
        path: info.path || "?",
        headers: info.headers || {},
      });
    } else {
      debug(`⚠️ IP ${ip} (hash: ${ipHash}) už v databázi existuje`);
    }
  } catch (err) {
    error("❌ Chyba při ukládání IP do DB:", err.message);
  }

  return true;
}

// nacteni blacklistu z DB do pameti
export async function loadBlacklistFromDB() {
  try {
    const allBlocked = await BlacklistedIP.find({}, { ipHash: 1 });
    blacklistedIPs.clear();

    allBlocked.forEach((entry) => {
      if (entry.ipHash) blacklistedIPs.add(entry.ipHash);
    });

    info(`✅ Načteno ${blacklistedIPs.size} IP adres z DB do paměti`);
  } catch (err) {
    error("❌ Chyba při načítání blacklistu z DB:", err.message);
  }
}

// kontrola, jestli IP existuje v blacklistu
export async function isBlacklisted(ip) {
  try {
    ip = normalizeIp(ip);
    const found = await BlacklistedIP.findOne({ ipHash: hashIp(ip) });
    return !!found;
  } catch (err) {
    error("❌ Chyba při kontrole blacklistu:", err.message);
    return false;
  }
}
