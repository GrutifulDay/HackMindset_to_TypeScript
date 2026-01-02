import SecurityLog from "../models/SecurityLog.js";

// Pomocna funkce pro ukladani bezpecnostnich udalosti do databaze
// Normalizuje IP adresu a uklada strukturovany security log

function normalizeIp(ip){
  if (!ip) return ip;
  const m = String(ip).match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return m ? m[1] : ip;
}

export async function saveSecurityLog(data){
  const doc = new SecurityLog({
    createdAt: data.createdAt || Date.now(),
    src:   data.src,
    kind:  data.kind || "info",
    ip:    normalizeIp(data.ip),
    method:data.method,
    host:  data.host,
    path:  data.path,
    status:data.status,
    ua:    data.ua,
    ref:   data.ref,
    rule:  data.rule,
    note:  data.note,
    raw:   data.raw,
  });
  await doc.save();
}
