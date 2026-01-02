import { fetchNasaImage } from "../controllers/nasaController.js";
import { getDigital } from "../controllers/digitalController.js"; 
import { getStoryOfTheDay } from "../controllers/storyController.js";
import { getRetroMachine } from "../controllers/retroControllers.js";
import { getProfile } from "../controllers/profileController.js";
import { debug, info, error } from "../utils/logger.js";


// Interni refresh vsech obsahovych sekci
// Spousti controllery primo (bez HTTP fetch) - bez fetch, krome Nasa (jiny princip nacitani)
// Pouziva se pro prednacteni dat, aktualizaci cache a cron ulohy

let isRefreshing = false;

export async function refreshAllSections() {
  if (isRefreshing) {
    info("⚠️ [refreshAll] Refresh už probíhá – přeskočeno.");
    return;
  }

  isRefreshing = true;
  debug("♻️ [refreshAll] Spouštím interní refresh všech sekcí...");

  try {
    const fakeReq = { internal: true };
    const fakeRes = {
      status: () => fakeRes,
      json: () => {},
    };
    
    await Promise.all([
      fetchNasaImage(fakeReq, fakeRes),
      getDigital(fakeReq, fakeRes),
      getStoryOfTheDay(fakeReq, fakeRes),
      getRetroMachine(fakeReq, fakeRes),
      getProfile(fakeReq, fakeRes),
    ]);

    info("✅ [refreshAll] Všechny sekce úspěšně přednačteny (interně).");
  } catch (err) {
    error("❌ [refreshAll] Chyba při interním refreshi:", err.message);
  } finally {
    isRefreshing = false;
  }
}

