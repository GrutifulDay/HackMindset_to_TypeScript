// dotevn
import { PORT, DEMO_MODE, NODE_ENV } from "./config.js"

// importy TS 
import type { Request } from "express";

// node token = util
import util from "util";
// global.util = util;

import { debug, info, warn, error } from "./utils/logger.js";

// zaklad
import fs from "fs"

// lokalni testovani 
import https from "https"

// NPM knihovny 
import express from "express"
import helmet from "helmet"

// Routes
import nasaRoutes from "./routes/nasaRoutes.js"
import storyRoutes from "./routes/storyRoutes.js"
import retroRoutes from "./routes/retroRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import digitalRoutes from "./routes/digitalRoutes.js"
import untruthRoutes from "./routes/untruthRoutes.js"
import untruthLimitRoutes from "./routes/untruthLimit.js"
import secLogRoutes from "./routes/secLog.js"
import tokenRoutes from "./routes/tokenRoutes.js"
// import feedbackRoutes from "./routes/feedbackRoutes.js"


// Middleware
import limiterApi from "./middlewares/rateLimit.js"
import corsOptions from "./middlewares/corsConfig.js"
import botProtection from "./middlewares/botProtection.js"
import ipBlocker, { loadBlacklistFromDB } from "./middlewares/ipBlacklist.js"
import captureHeaders from "./middlewares/captureHeaders.js";
// import detectSecretLeak from "./middlewares/detectSecretLeak.js";

// Utils 
import { startDailyCron } from "./utils/cron/dailyRefresh.js"
//import { startWatchForIPChanges } from "./utils/watch/startWatchForIPChanges.js"

// Databaze 
import connectDB from "./db/db.js"
import connectFrontendDB from "./db/connectFrontendDB.js"
import path from "path"

const app = express()
app.set("trust proxy", 1); // pokud by byl Cloudflare, nutno navysit 
// app.set("trust proxy", false); // true = proxy / false = vyvoj 

app.disable("etag")
app.disable("x-powered-by")

// upozorneni na NODE / DEMO rezim
if (NODE_ENV) {
  debug("🛠️ Bezis v development rezimu");
}

if (DEMO_MODE) {
  warn("⭐️ Bezis v DEMO rezimu - mas nacteny data z JSON, vse je staticke!");
}

// Request log (lehký)
app.use((req, res, next) => {
  debug(`➡️  ${req.method} ${req.url}`);
  next();
});

// start cas serveru 
const startTime = new Date().toLocaleString("cs-CZ", {
  timeZone: "Europe/Prague",
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})
info(`💣 Server spuštěn: ${startTime}`);

const __dirname = path.resolve() // pri pouziti ES modulů

if (DEMO_MODE === false) {
  await connectDB();
  await connectFrontendDB();
  await loadBlacklistFromDB();
} else {
  debug("🗂️ DEMO_MODE → MongoDB pripojeni prekoceno.");
}


// DEMO MODE → vypnout CORS ochranu
if (DEMO_MODE === true) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    debug("🗂️ DEMO_MODE → cors preskoceny");

    next();
  });
}


// kazdy den refresh CRON v 00:01
startDailyCron();
// startWatchForIPChanges()


// Helmet – CSP -> povoleni jen pro muj server (img, url, css atd.)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],    // vychozi zdroj pro obsah nacitani
      "script-src": ["'self'"],     // js scripty odkud
      "style-src": ["'self'", "'unsafe-inline'"], // ✅ povolí tvé i inline CSS
      "font-src": ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"], // ✅ povolí fonty
      "img-src": [
        "'self'",
        "https://apod.nasa.gov",
        "https://mars.nasa.gov",
        "https://images-assets.nasa.gov"
      ],
      "connect-src": ["'self'", "https://api.nasa.gov"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'none'"]
    }
  })
);

// Základní health endpointy
app.get("/ping", (_req, res) => {
  res.status(200).send("pong")
})

app.get("/health", async (_req, res) => {
  try {
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    const message = 
      err instanceof Error
          ? err.message
          : String(err)
    if (message.includes("timeout")) {
      warn("⏱️ Mongo ping timeout");
      return res.status(504).json({ status: "timeout", detail: "MongoDB did not respond in time" });
    }
    error("💥 /health error:", message);
    return res.status(500).json({ status: "error", detail: message });
  }
});

// detekce uniklych hesel
// app.use(detectSecretLeak({
//   blockOnLeak: true,          // blokuje pozadavek
//   blacklistOnLeak: true       // prida IP na blacklist
// }));

// ─────────────────────────────────────────────────────────────
// interni servisni router pro /_sec-log
// (uvnitr ma vlastni pre-auth + JSON parser)
// ─────────────────────────────────────────────────────────────
app.use(secLogRoutes)

// Vary: Origin – kvůli CORS cache
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});


app.use(corsOptions);

// nesmi poslat vetsi nez je limit v tele requestu
app.use(express.json({ limit: "25kb" }));

// ❗️zakomentovat po testech❗️ - Otevřený test endpoint (bez ochranných middleware)
// app.get("/api/test-open", (req, res) => {
//   res.status(200).json({
//     ok: true,
//     ip: req.ip,
//     ua: req.get("User-Agent")
//   });
// });

// Hlavičky a logování (jen jednou)
app.use(captureHeaders({
  notifyOn: (req: Request) => {
    const ua = (req.get("User-Agent") || "").toLowerCase();
    const hasPostman = !!req.headers["postman-token"];
    const isPostmanUA = ua.includes("postman");
    return hasPostman || isPostmanUA;
  },
  notifyReason: "Client using Postman / test tool"
}));

// globalni Middleware
app.use(ipBlocker);       
app.use(botProtection);   
app.use(limiterApi);  

// routes
app.use("/api", tokenRoutes);
app.use("/api", nasaRoutes)
app.use("/api", storyRoutes)
app.use("/api", retroRoutes)
app.use("/api", profileRoutes)
app.use("/api", digitalRoutes)
app.use("/api", untruthRoutes)
app.use("/api", untruthLimitRoutes)
// app.use("/api", feedbackRoutes)


// Debug vypis testovacich endpointu
try {
  const routes = app._router?.stack
  ?.map((r: unknown) => (r as { route?: { path?: string } })?.route?.path)
  .filter(Boolean)
  if (routes?.length) debug(routes)
} catch { /* ignore */ }


// prepinani mezi demo mode a node env - developmen / production 
const USE_HTTPS =
  DEMO_MODE === true || NODE_ENV === "development";

  if (USE_HTTPS) {
    const options = {
      key: fs.readFileSync("./cert/key.pem"),
      cert: fs.readFileSync("./cert/cert.pem"),
    };
  
    https.createServer(options, app).listen(PORT, "127.0.0.1", () => {
      debug(`⭐ HTTPS server běží na https://127.0.0.1:${PORT} (DEMO nebo DEV)`);
    });
  
  } else {
    app.listen(PORT, "127.0.0.1", () => {
      info(`🚀 Server běží na http://127.0.0.1:${PORT} (PROD)`);
    });
  }
  

