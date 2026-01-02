import { updateSectionData } from "../utils/update/updateSectionData.js";
import { API } from "../utils/config.js";
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, warn, error } from "../utils/logger/logger.js";

debug("{fetchNasa.js} 📡 je načtený");

export async function fetchNasaImage() {
  debug("{funkce fetchNasaImage} ✅ funguje");

  const token = await getJwtToken();

  if (!token) {
    error("❌ Chybí JWT token fetchNasaImage – fetch se neprovede.");
    return { 
      error: true,
      message: "Chybí JWT token – NASA sekce se nenačte."
    };
  }

  const shouldUpdate = await updateSectionData("nasa");
  if (!shouldUpdate) {
    debug("[nasa] ⏳ Data jsou aktuální – čtu z cache.");

    const { nasaData } = await new Promise((resolve) => {
      chrome.storage.local.get("nasaData", (result) => resolve(result));
    });

    if (nasaData && nasaData.url) return nasaData;
    warn("[nasa] ⚠️ Cache je prázdná nebo neobsahuje URL – načítám znovu.");
  }

  try {
    debug("JWT token:", token);

    const response = await fetch(API.nasa, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      warn(`⚠️ fetchNasaImage: Server vrátil ${response.status}`);
      warn(`🔹 Response text: ${text}`);

      const { nasaData } = await new Promise((resolve) => {
        chrome.storage.local.get("nasaData", (result) => resolve(result));
      });
      if (nasaData) {
        warn("[nasa] Používám starší data z cache (server error).");
        return nasaData;
      }
      return { 
        error: true,
        message: "NASA API nedostupné a žádná cache neexistuje."
      };
    }

    const data = await response.json();

    // overeni dat z backendu
    if (!data || !data.url) {
      warn("⚠️ fetchNasaImage: Data z backendu neobsahují URL");
      return { 
        error: true,
        message: "NASA data nejsou platná – backend nevrátil obrázek."
      };
    }

    // ulozeni do Chrome storage
    await new Promise((resolve) => {
      chrome.storage.local.set(
        {
          nasaData: data,
          nasa_lastFetch: Date.now(),
        },
        resolve
      );
    });

    debug("[nasa] ✅ Nová data uložena");
    return data;

  } catch (error) {
    error("❌ fetchNasaImage error", error);

    // fallback – zkusi z cache
    const { nasaData } = await new Promise((resolve) => {
      chrome.storage.local.get("nasaData", (result) => resolve(result));
    });

    if (nasaData) {
      warn("[nasa] ⚠️ Používám starší cache (fetch selhal).");
      return nasaData;
    }

    return { 
      error: true,
      message: "fetchNasaImage selhal – žádná data ani cache."
    };
  }
}
