import rateLimit from "express-rate-limit";
import { addToBlacklist } from "./ipBlacklist.js";
import { notifyBlockedIP } from "../utils/discordNotification.js";

// Rate limit middleware pro API
// Omezovani poctu pozadavku + sledovani opakovaneho zneuziti
// Pri opakovanem prekroceni limitu se IP pridava na blacklist

const offenders = new Map();

// Casove okno pro sledovani zneuziti
const WINDOW_MS = 10 * 60 * 1000; // 10 minut
const THRESHOLD = 10; // počet RL hitů během okna pro blacklist

// Unikatni klic: IP + User-Agent
const makeKey = (ip, ua) => `${ip}::${ua}`;

const normalizeIp = (ip) => {
  if (!ip) return ip;
  const m = String(ip).match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return m ? m[1] : ip;
};

// ------------------------------------------------------------
// Hlavni rate limit konfigurace
// ------------------------------------------------------------
const limiterApi = rateLimit({
  windowMs: 60 * 1000,
  // Vyssi limit pro vydavani tokenu, nizsi pro bezne API
  max: (req) => req.originalUrl.includes("/get-token") ? 60 : 300,

  standardHeaders: true,
  legacyHeaders: false,

  // Rate limit klic je IP adresa
  keyGenerator: (req) => normalizeIp(req.ip),

  // ------------------------------------------------------------
  // Vyjimky z rate limitu
  // Chrome Extension requesty nechavame projit
  // ------------------------------------------------------------
  skip: (req) => {
    const origin = req.headers.origin || req.headers.referer || "";
    const ua = req.get("User-Agent") || "";
    return (
      origin.startsWith("chrome-extension://") ||
      ua.includes("Chrome/") && ua.includes("Safari")
    );
  },

  // ------------------------------------------------------------
  // Handler pri prekroceni rate limitu
  // ------------------------------------------------------------
  handler: async (req, res) => {
    const ip = normalizeIp(req.ip);
    const ua = req.get("User-Agent") || "Unknown-UA";

    const key = makeKey(ip, ua);
    const now = Date.now();

    let record = offenders.get(key);

    // --------------------------------------------------------
    // 1) Reset sledovaciho okna (pokud je nove nebo expirovane)
    // --------------------------------------------------------
    if (!record || now - record.firstHit > WINDOW_MS) {
      record = {
        count: 0,            // reset
        firstHit: now,       // nové okno
        notified: false      // ještě jsme neposílali hlášení
      };
    }

    // pricteni az po resetu
    record.count += 1;
    offenders.set(key, record);

    // -----------------------
    // 3) Jednorazova notifikace (prvni poruseni v okne)
    // -----------------------
    if (!record.notified) {
      record.notified = true;
      await notifyBlockedIP({
        ip,
        reason: "Rate limit exceeded (first warning in window)",
        path: req.originalUrl,
        userAgent: ua,
      });
    }

    // -----------------------
    // 4) Opakovane zneuziti -> blacklist (10x za 1O min)
    // -----------------------
    if (record.count >= THRESHOLD) {
      await addToBlacklist(ip, "Repeated rate-limit abuse", {
        userAgent: ua,
        path: req.originalUrl,
      });

      // po blacklistu cisti zaznam
      offenders.delete(key);
    }

    return res.status(429).json({
      error: "Rate limit exceeded. Try again later.",
    });
  },
});

export default limiterApi;
