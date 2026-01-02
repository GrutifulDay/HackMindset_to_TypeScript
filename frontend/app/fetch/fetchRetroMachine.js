import { updateSectionData } from "../utils/update/updateSectionData.js"
import { API } from "../utils/config.js";
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{fetchRetroMachine.js} 📡 je načtený")

export async function fetchRetroMachine() {
  debug("{funkce fetchRetroMachine} ✅ funguje");
  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token fetchRetroMachine – fetch se neprovede.");
    return null;
  }

  const shouldUpdate = await updateSectionData("retro")

  if (!shouldUpdate) {
    debug("[retro] ⏳ Data jsou aktuální – čtu z cache.");

    const { retroData } = await new Promise((resolve) => {
      chrome.storage.local.get("retroData", (result) => resolve(result))
    })

    return retroData || null
  }

  try {
    const response = await fetch(API.retroMachine, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })

    const data = await response.json()

    await new Promise((resolve) => {
      chrome.storage.local.set(
        {
          retroData: data,
          retro_lastFetch: Date.now(),
        },
        resolve
      )
    })

    debug("[retro] ✅ Nová data uložena");
    return data
  } catch (error) {
    error("❌ fetchRetroMachine error", error);
    return null
  }
}
