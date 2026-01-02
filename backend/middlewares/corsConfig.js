import cors from "cors";
import { CHROME_EXTENSION_ALL_URL } from "../config.js";
import { notifyBlockedIP } from "../utils/discordNotification.js";
import { addToBlacklist } from "./ipBlacklist.js";
import { UAParser } from "ua-parser-js";
import { redactHeaders } from "../utils/redact.js";
import { warn } from "../utils/logger.js";

// Bezpecnostni CORS middleware s explicitni podporou Chrome Extension
// Neplatne originy jsou blokovany, logovany a pridany na blacklist


// Povolene originy (produkce + local + chrome extension)
const allowedOrigins = [
  "https://hackmindset.app",
  "http://127.0.0.1:5501",
  CHROME_EXTENSION_ALL_URL  // Např. chrome-extension://abcd...
];

// Zakladni CORS nastaveni sdilene pro vsechny povolene requesty
const corsOptionsBase = {
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};

// Detekce requestu z Chrome Extension (pres origin nebo referer)
function isChromeExtension(origin, referer) {
  return (
    (origin && origin.startsWith("chrome-extension://")) ||
    (referer && referer.startsWith("chrome-extension://"))
  );
}

// Detekce lokalniho vyvoje
function isLocalOrigin(origin) {
  return (
    origin === "http://localhost" ||
    origin === "http://127.0.0.1:5501"
  );
}

export default async function corsWithLogging(req, res, next) {
  const origin = req.headers.origin || null;
  const referer = req.headers.referer || null;
  const ua = req.get("User-Agent") || "";

  const extensionRequest = isChromeExtension(origin, referer);

  // --------------------------------------------------------------------
  // 1) Preflight OPTIONS request
  // Musi vratit stejne CORS hlavicky, jake budou platit pro realny request
  // --------------------------------------------------------------------
  if (req.method === "OPTIONS") {

    // Chrome extension
    if (extensionRequest) {
      return res
        .status(204)
        .set({
          "Access-Control-Allow-Origin": CHROME_EXTENSION_ALL_URL,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
          "Access-Control-Allow-Credentials": "true"
        })
        .end();
    }

    // Lokalni vyvoj
    if (isLocalOrigin(origin)) {
      return res
        .status(204)
        .set({
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        })
        .end();
    }

    // Povoleny produkcni origin
    if (allowedOrigins.includes(origin)) {
      return res
        .status(204)
        .set({
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        })
        .end();
    }

    // Vse ostatni je blokovano
    return res.status(403).json({ error: "Access blocked by CORS policy" });
  }

  // --------------------------------------------------------------------
  // 2) Request z Chrome Extension
  // --------------------------------------------------------------------
  if (extensionRequest) {
    return cors({
      ...corsOptionsBase,
      origin: CHROME_EXTENSION_ALL_URL,
    })(req, res, next);
  }

  // --------------------------------------------------------------------
  // 3) Lokalni vyvoj
  // --------------------------------------------------------------------
  if (isLocalOrigin(origin)) {
    return cors({
      ...corsOptionsBase,
      origin: origin,
    })(req, res, next);
  }

  // --------------------------------------------------------------------
  // 4) Neopravneny origin (existuje, ale neni povoleny)
  // Request je blokovan + zalogovan + IP jde na blacklist
  // --------------------------------------------------------------------
  if (origin && !allowedOrigins.includes(origin)) {
    const clientIP = req.ip || "Neznámé";
    const parser = new UAParser(ua);
    const parsedUA = parser.getResult();

    warn(`[CORS BLOCKED] Origin: ${origin} - ${new Date().toISOString()}`);

    await notifyBlockedIP({
      ip: clientIP,
      reason: "CORS Blocked",
      userAgent: ua,
      method: req.method,
      path: req.originalUrl,
      city: "Neznámé",
      origin,
      browser: parsedUA.browser?.name,
      os: parsedUA.os?.name,
      deviceType: parsedUA.device?.type,
      referer,
      headers: redactHeaders(req.headers),
    });

    await addToBlacklist(clientIP, "CORS Blocked", {
      userAgent: ua,
      method: req.method,
      path: req.originalUrl,
    });

    return res.status(403).json({ error: "Access blocked by CORS policy" });
  }

  // --------------------------------------------------------------------
  // 5) Request bez Origin hlavicky (curl, bot, server-to-server)
  // CORS se netyka, ale dalsi middleware ho muze odfiltrovat
  // --------------------------------------------------------------------
  if (!origin) {
    return next();
  }

  // --------------------------------------------------------------------
  // 6) Validni request z povoleneho originu
  // --------------------------------------------------------------------
  return cors({
    ...corsOptionsBase,
    origin: origin
  })(req, res, next);
}
