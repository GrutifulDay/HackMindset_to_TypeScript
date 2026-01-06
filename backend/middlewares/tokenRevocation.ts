import { notifyBlockedIP } from "../utils/discordNotification.js";
import { debug } from "../utils/logger.js";
import type { BlockMeta } from "../types/discord.js";

// Jednoducha pametova revokace JWT tokenu
// Slouzi k okamzitemu zneplatneni tokenu (napr. pri podezrelem chovani)
// Revokovane tokeny jsou ukladany v pameti procesu

const revokedTokens = new Set();

// ------------------------------------------------------------
// Revokace tokenu podle JTI
// Token je oznacen jako neplatny a nelze ho dale pouzit
// ------------------------------------------------------------
export function revokeToken(jti: string, meta: BlockMeta = {}) {
  revokedTokens.add(jti);
  debug("🚫 Revokován token s JTI:", jti);

  // discord notifikace
  notifyBlockedIP?.({
    ip: meta.ip || "Neznámá",
    city: meta.city || "Neznámé",
    userAgent: meta.userAgent || "Neznámý",
    reason: `Token revoked [jti=${jti}]`,
    method: meta.method || "REVOKE",
    path: meta.path || "/api/revoke-token",
    headers: meta.headers || {},
    requests: []
  }).catch(() => {});
}

export function isRevoked(jti: string) {
  return revokedTokens.has(jti);
}
