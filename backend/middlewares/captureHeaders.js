import { notifyBlockedIP, maskToken } from "../utils/discordNotification.js";
import { warn, error, debug } from "../utils/logger.js";
import { DEBUG, NODE_ENV } from "../config.js";


// Middleware pro zaznamenani a maskovani HTTP hlavicek.
// Slouzi k ladeni, bezpecnostnimu logovani a notifikacim podezrelych pozadavku.

// fce pro detekci hlavicek
const SENSITIVE = new Set([
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "Authorization"
]);

function redactHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? "[REDACTED]" : v;
  }
  return out;
}

function detectSensitiveHeaders(headers) {
  const sensitive = [];

  if (headers["authorization"]) {
    sensitive.push(`Authorization: ${maskToken(headers["authorization"])}`);
  }

  if (headers["x-api-key"]) {
    sensitive.push(`X-API-Key: ${maskToken(headers["x-api-key"])}`);
  }

  if (headers["cookie"]) {
    sensitive.push("Cookie: [REDACTED]");
  }

  if (headers["proxy-authorization"]) {
    sensitive.push("Proxy-Authorization: [REDACTED]");
  }

  return sensitive;
}

function formatHeaders(headers = {}) {
  const keys = [
    "origin",
    "user-agent",
    "x-hackmindset",
    "postman-token",
    "x-forwarded-for",
    "host",
    "accept",
    "accept-encoding",
    "connection",
  ];

  const lines = [];
  for (const k of keys) {
    const v = headers[k] ?? headers[k.toLowerCase()] ?? null;
    if (v !== null && v !== undefined) lines.push(`→ ${k}: ${v}`);
  }

  if (lines.length === 0) {
    const small = Object.entries(headers).slice(0, 8);
    for (const [k, v] of small) lines.push(`→ ${k}: ${v}`);
  }

  return lines.join("\n");
}

export default function captureHeaders(options = {}) {
  const notifyOn = options.notifyOn;

  return async function (req, res, next) {
    try {
      const raw = redactHeaders(req.headers || {});
      const summary = formatHeaders(raw);
      const sensitive = detectSensitiveHeaders(req.headers || {});

      req._headersSummary = summary;
      req._redactedHeaders = raw;

      if (DEBUG && NODE_ENV !== "production") {
        debug("📦 PŘÍCHOZÍ HLAVIČKY:");
        summary.split("\n").forEach(line => debug(line));
      }
      
      if (NODE_ENV !== "production" && DEBUG) {
        if (sensitive.length > 0) {
          warn("🔑 Sensitive headers detected:", sensitive);
        }
      }

      if (typeof notifyOn === "function" && notifyOn(req)) {
        try {
          await notifyBlockedIP({
            ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
            city: "Unknown",
            userAgent: req.get("User-Agent") || "Unknown",
            reason: options.notifyReason || "Suspicious client",
            method: req.method,
            path: req.originalUrl,
            headers: raw,
            sensitive,
          });
        } catch (notifyErr) {
          error("Notify error in captureHeaders:", notifyErr.message || notifyErr);
        }
      }
    } catch (err) {
      error("captureHeaders error:", err.message || err);
    }

    return next();
  };
}
