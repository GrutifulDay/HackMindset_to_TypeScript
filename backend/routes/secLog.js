import express from "express";
import crypto from "crypto";
import { saveSecurityLog } from "../services/securityLogService.js";
import { SHARED_KEY } from "../config.js"
import { error } from "../utils/logger.js";


const router = express.Router();

// Interni endpoint pro prijem security logu z OpenResty
// Pristup povolen pouze z localhostu s tajnym podpisem
// Slouzi k bezpecnemu predani a ukladani sitovych bezpecnostnich udalosti

// const SHARED_KEY = process.env.SECLOG_SHARED_KEY || "";

// 🧪 Chrani proti timing utokum
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// 🧹 sanitizace textu (omezi delku, odstrani CR/LF - zjistit vic)
function sanitize(text, max = 256) {
  if (typeof text !== "string") return "";
  return text.replace(/[\r\n]+/g, " ").slice(0, max);
}

// 🛡️ AUTH před parsingem: jen localhost + tajná hlavička + POST + JSON
function preAuth(req, res, next) {
  // Skutečná peer IP (ignorujeme XFF)
  const ip = req.socket?.remoteAddress || "";
  const isLoopback =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1";

  if (!isLoopback) {
    return res.status(403).json({ error: "Only localhost." });
  }

  // Jen POST na JSON
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const ct = req.headers["content-type"] || "";
  if (!ct.toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "Unsupported Media Type" });
  }

  // Tajný podpis z proxy
  const header = req.headers["x-internal-auth"] || req.headers["X-Internal-Auth"];
  if (!header || !SHARED_KEY || !timingSafeEqual(String(header), String(SHARED_KEY))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

// 🚧 Neautorizované pokusy na /_sec-log (cokoli mimo POST/JSON) skončí dřív
router.all("/_sec-log", preAuth);

// 📦 Malý JSON parser až PO auth (16 kB)
router.use("/_sec-log", express.json({ limit: "16kb", type: "application/json" }));

// ✅ Přijímáme security logy pouze z OpenResty přes localhost
router.post("/_sec-log", async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Expected JSON object." });
  }

  // Omez délky a vyčisti pole (žádné řídicí znaky, max. délky)
  const entry = {
    src: "openresty",
    kind: sanitize(body.kind, 64),
    ip: sanitize(body.ip, 64),
    method: sanitize(body.method, 16),
    host: sanitize(body.host, 128),
    path: sanitize(body.path, 256),
    status: Number.isInteger(body.status) ? body.status : undefined,
    ua: sanitize(body.ua, 256),
    ref: sanitize(body.ref, 256),
    rule: sanitize(body.rule, 128),
    note: sanitize(body.note, 256),
    raw: sanitize(body.raw, 512),
    ts: new Date().toISOString(),
  };

  try {
    await saveSecurityLog(entry);
  } catch (err) {
    // Tichý fail – nechceme prozrazovat detaily
    error("sec-log save error:", err?.message || String(err));
  }

  // 202 Accepted – log zpracujeme asynchronně
  return res.status(202).json({ ok: true });
});

// 🧱 Jistota: cokoli jiné na /_sec-log vrací 405 (už ošetřeno preAuth, ale ať je to čitelné)
router.get("/_sec-log", (_req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.put("/_sec-log", (_req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.delete("/_sec-log", (_req, res) => res.status(405).json({ error: "Method Not Allowed" }));

export default router;
