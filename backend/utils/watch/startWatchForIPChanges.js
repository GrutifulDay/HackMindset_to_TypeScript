// watch/startWatchForIPChanges.js
import BlacklistedIP  from "../../models/BlacklistedIP.js"
import { refreshAllSections } from "../refreshAll.js";
import { debug, error } from "../logger.js";

// ARCHIVNI / NEPOUZIVANY WATCHER
// Tento watcher sledoval zmeny v kolekci BlacklistedIP a reagoval na nove inserty.
// V aktualni architekture s existujici sitovou vrstvou (NGINX pozdeji OpenResty)
// a pametovym blacklistem uz neni potreba reagovat v realnem case.
// Logika je ponechana pouze jako koncept a dokumentace vyvoje,
// ale zamerne neni aktivni kvuli zbytecne komplexite.


let lastUpdateTime = 0;     // cas kdy naposled probehl refresh 
const MIN_INTERVAL = 10 * 60 * 1000; // 10 minut ochranna pauza


 //sleduje models blacklistedips, pri nove IP spousti refresh systemu.
export function startWatchForIPChanges() {
  debug("👁️ [Watcher] Sleduji kolekci blacklistedips...");

  try {
    const changeStream = BlacklistedIP.watch();

    changeStream.on("change", async (change) => {
      if (change.operationType === "insert") {
        const now = Date.now();

        // ochrana proti prilis castemu spousteni
        if (now - lastUpdateTime < MIN_INTERVAL) {
          debug("⚠️ [Watcher] Příliš brzy od posledního refreshi – přeskočeno.");
          return;
        }

        debug("🚨 [Watcher] Nová IP přidána – spouštím interní refresh všech sekcí...");
        await refreshAllSections();
        lastUpdateTime = now;
      }
    });

    changeStream.on("error", (err) => {
      error("❌ [Watcher] Chyba:", err.message);
      debug("🔁 [Watcher] Restart za 5 sekund...");
      setTimeout(startWatchForIPChanges, 5000);
    });
  } catch (err) {
    error("❌ [Watcher] Nelze spustit sledování:", err.message);
  }
}
