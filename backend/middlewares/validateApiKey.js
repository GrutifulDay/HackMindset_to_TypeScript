import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { addToBlacklist, isBlacklisted } from "./ipBlacklist.js";
import { getCityByIP } from "../utils/getCityByIP.js";
import { CHROME_EXTENSION_ALL_URL, JWT_SECRET } from "../config.js";
import { notifyBlockedIP } from "../utils/discordNotification.js";  
import { redactHeaders } from "../utils/redact.js";
import { isRevoked } from "../middlewares/tokenRevocation.js"
import { registerTokenUsage } from "../middlewares/tokenUsage.js";
import { debug, warn } from "../utils/logger.js";
import { DEBUG, NODE_ENV, DEMO_MODE, API_BASE_URL } from "../config.js";

// Centralni bezpecnostni middleware pro API
// Overuje JWT tokeny z Chrome Extension, hlida zneuziti tokenu,
// kontroluje IP blacklist a pri podezrelem chovani request blokuje
// Zaroven neblokuje extension - pouze blokace z venku 

export function validateApiKey(routeDescription) {
  // 🔧 DEMO MODE → prekoci veskerou bezpecnost, povoli request
  if (DEMO_MODE) {
    return function(req, res, next) {
      req.tokenPayload = { demo: true };
      return next();
    };
  }
  

  debug("validateApiKey funguje");

  return async function (req, res, next) {
    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "neznámá IP";

    const userAgentString = req.get("User-Agent") || "Neznámý";
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";
    const extensionID = CHROME_EXTENSION_ALL_URL;
    const rawAuthHeader = req.headers.authorization || "";
    const tokenFromHeader = rawAuthHeader.startsWith("Bearer ")
      ? rawAuthHeader.split(" ")[1]
      : "";

      // Vyjimka pokud ma request platny JWT z extension → povoli dal, i kdyz je IP blokovana 
      if (req.tokenPayload?.sub === "chrome-extension") {
        debug("🧩 validateApiKey: požadavek z rozšíření s platným JWT → povoleno (přeskakuji IP blacklist)");
        return next();
      }
  
      // kontrola IP blacklistu - adresa je na BL 
      if (await isBlacklisted(userIP)) {
        return res.status(403).json({ error: "Access blocked" });
      }


      if (DEBUG && NODE_ENV !== "production") {
        debug("📦 PŘÍCHOZÍ HLAVIČKY:");
        Object.entries(req.headers).forEach(([key, value]) => {
          debug(`→ ${key}: ${value}`);
        });
      }

    // kontrola zdroje pozadavku
    // const isLikelyFromChrome =
    //   userAgentString.includes("Chrome") && !userAgentString.includes("Postman");

    const isFromAllowedSource =
      origin.includes(extensionID) ||
      referer.includes(extensionID)
      // isLikelyFromChrome;

    // overeni JWT tokenu
    let decodedToken;
    try {
      decodedToken = jwt.verify(tokenFromHeader, JWT_SECRET);

      // kontrola audience pro vydani tokenu jen pro muj server v rozsireni 
    if (decodedToken.aud !== API_BASE_URL) {
      warn("❌ Token má špatnou audience:");
      warn("→ expected:", expectedAudience);
      warn("→ received:", decodedToken.aud);
      return await blockRequest(
        req,
        res,
        userIP,
        userAgentString,
        routeDescription,
        "Invalid audience"
    );
  }

  // pokud vrati true, token byl revokovan
const abuseDetected = registerTokenUsage({
  jti: decodedToken.jti,
  ip: userIP,
  userAgent: userAgentString,
  path: req.originalUrl
});

if (abuseDetected) {
  // token revokovan -> blokace ip adresy
  return await blockRequest(req, res, userIP, userAgentString, routeDescription, "Token abuse detected and revoked");
}
  debug("✅ JWT audience je platná:", decodedToken.aud);

  if (isRevoked(decodedToken.jti)) {
    warn("🚫 Token byl revokován:", decodedToken.jti);
    return await blockRequest(
      req,
      res,
      userIP,
      userAgentString,
      routeDescription,
      "Revoked JWT"
    );
  }
  
  debug("✅ JWT není revokován:", decodedToken.jti);

    } catch (err) {
      warn("❌ Neplatný JWT token:", err.message);
      return await blockRequest(req, res, userIP, userAgentString, routeDescription, "Invalid JWT token");
    }

    // povoleni jen pokud sedi i extension ID
    const isFromExtension = isFromAllowedSource && decodedToken.extId === CHROME_EXTENSION_ALL_URL;

    if (isFromExtension) {
      debug("✅ Povolen přístup z rozšíření (JWT validní)");
      req.tokenPayload = decodedToken;
      return next();
    }

    // pokud nesedi – blokuje
    warn("⛔️ Token validní, ale zdroj neodpovídá.");
    return await blockRequest(req, res, userIP, userAgentString, routeDescription, "Valid JWT, bad origin/referer");
  };
}

async function blockRequest(req, res, userIP, userAgentString, routeDescription, reason = "Access denied") {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  const city = await getCityByIP(userIP);

  await addToBlacklist(userIP, routeDescription, {
    userAgent: userAgentString,
    browser: result.browser?.name || "Neznámý",
    os: result.os?.name || "Neznámý",
    deviceType: result.device?.type || "Neznámý",
    city: city || "Neznámý",
    method: req.method,
    path: req.originalUrl
  });

  await notifyBlockedIP({
    ip: userIP,
    city: city || "Neznámé",
    userAgent: userAgentString,
    reason,
    method: req.method,
    path: req.originalUrl,
    headers: redactHeaders(req.headers), 
  });

  return res.status(403).json({ error: "Access denied" });
}
