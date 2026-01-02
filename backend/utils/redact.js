import { maskToken } from "./discordNotification.js";

// Univerzalni utilita pro redakci HTTP hlavicek
// Maskuje citliva data (tokeny, API klice, cookies) pred logovanim nebo notifikacemi

export function redactHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();

    if (key === "authorization" || key === "proxy-authorization") {
      out[k] = maskToken(String(v));   // částečně zamaskuje
    } else if (key === "x-api-key" || key === "postman-token") {
      const t = String(v);
      out[k] = t.length > 8
        ? `${t.slice(0, 4)}...${t.slice(-4)}`
        : t.replace(/.(?=.{2})/g, "*");
    } else if (key === "cookie" || key === "set-cookie") {
      out[k] = "[REDACTED]";
    } else {
      out[k] = v;
    }
  }
  return out;
}
