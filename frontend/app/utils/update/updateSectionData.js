import { DEV_MODE } from "../config.js"; 
import { debug, info } from "../logger/logger.js";

// Pomocna utilita pro rizeni obnovy dat v rozsireni
// Rozhoduje, zda se maji data znovu stahnout podle casoveho intervalu
// (daily / weekly) a posledniho fetch timestampu ulozeneho v chrome.storage

export async function updateSectionData(key, interval = "daily") {
    const now = new Date()
  
    if (DEV_MODE) {
      info(`[${key}] 🧪 DEV_MODE aktivní – stahuji data znovu.`);
      return true
    }
  
    const { lastFetch } = await new Promise((resolve) => {
      chrome.storage.local.get([`${key}_lastFetch`], (result) => {
        resolve({ lastFetch: result[`${key}_lastFetch`] })
      })
    })
  
    if (!lastFetch) {
      debug(`[${key}] 📥 První fetch – data se stahují.`)
      return true
    }
  
    const lastFetchDate = new Date(lastFetch)
  
    if (interval === "weekly") {
      const isNewWeek =
        now.getFullYear() !== lastFetchDate.getFullYear() ||
        getMonday(now) !== getMonday(lastFetchDate)
  
      if (isNewWeek) {
        debug(`[${key}] 🔁 Nový týden – data se aktualizují.`);
        return true
      }
  
      debug(`[${key}] ✅ Týdenní data jsou aktuální.`);
      return false
    }
  
    // Default: daily
    const isDifferentDay =
      now.getFullYear() !== lastFetchDate.getFullYear() ||
      now.getMonth() !== lastFetchDate.getMonth() ||
      now.getDate() !== lastFetchDate.getDate()
  
    if (isDifferentDay) {
      debug(`[${key}] 🔁 Nový den – data se aktualizují.`);
      return true
    }
  
    debug(`[${key}] ✅ Denní data jsou aktuální.`);
    return false
  }
  
  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toDateString()
  }
  
