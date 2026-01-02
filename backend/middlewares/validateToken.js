import { EXTENSION_SIGNATURE } from "../config.js";
import { debug, warn } from "../utils/logger.js";

// Jednoducha validace pristupu pomoci sdileneho tajneho klice
// Slouzi jako lehka ochrana endpointu bez JWT 
// (napr. interni nebo servisni volani)

export function validateToken() {
  return function (req, res, next) {

    const raw = req.headers.authorization || "";
    const authValue = raw.startsWith("Bearer ")
      ? raw.split(" ")[1]
      : "";

    // alias → skutecne heslo z env
    const resolvedKey =
      authValue === "EXTENSION_SIGNATURE"
        ? EXTENSION_SIGNATURE
        : authValue;

    if (resolvedKey === EXTENSION_SIGNATURE) {
      debug("✔ Validace EXTENSION_SIGNATURE úspěšná");
      return next();
    }

    warn("✖ Validace EXTENSION_SIGNATURE selhala");
    return res.status(403).json({ error: "Access denied" });
  };
}
