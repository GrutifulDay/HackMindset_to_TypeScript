// cron/dailyRefresh.js
import cron from "node-cron";
import { refreshAllSections } from "../refreshAll.js";
import { debug, error } from "../logger.js";

// nacitani kazdy den v urcity cas - rychlejsi

export function startDailyCron() {
  cron.schedule("01 00 * * *", async () => {
    debug("🕛 [CRON] Spouštím noční refresh všech sekcí...");
    try {
      await refreshAllSections();
      debug("✅ [CRON] Přednačtení všech sekcí dokončeno.");
    } catch (err) {
      error("❌ [CRON] Chyba při nočním refreshi:", err.message);
    }
  });
}
