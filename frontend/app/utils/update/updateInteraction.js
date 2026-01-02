import { debug } from "../logger/logger.js"

debug("{updateInteractions.js} 🧹 připraven na úklid")
/**
 * Projde zadané localStorage klíče a odstraní jejich hodnoty,
 * pokud nejsou z dnešního dne.
 *
 * @param {string[]} keys - Pole klíčů (např. story_like, retro_like...)
 */

export function clearOldInteractions(keys = []) {
    const today = new Date().toISOString().slice(0, 10) // "2025-05-01"
  
    keys.forEach((key) => {
      const dateKey = `${key}_date`
      const storedDate = localStorage.getItem(dateKey)
  
      if (storedDate !== today) {
        debug(`🧹 Mazu hodnoty pro ${key}, ulozene: ${storedDate}`)
        localStorage.removeItem(key);
        localStorage.setItem(dateKey, today)
      }
    })
}

debug("{clearOldInteractions.js} 🧹 připraven na testování")

