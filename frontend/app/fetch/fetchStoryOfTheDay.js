import { updateSectionData } from "../utils/update/updateSectionData.js"
import { API } from "../utils/config.js";
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{fetchStoryOfTheDay.js} 📡 je načtený")

export async function fetchStoryOfTheDay() {
  debug("{funkce fetchStoryOfTheDay} ✅ funguje");
  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token – fetch se neprovede.");
    return null;
  }

  const shouldUpdate = await updateSectionData("story")

  if (!shouldUpdate) {
    debug("[story] ⏳ Data jsou aktuální – čtu z cache.");

    const { storyData } = await new Promise((resolve) => {
      chrome.storage.local.get("storyData", (result) => resolve(result))
    })

    return storyData || null
  }

  try {
    const response = await fetch(API.storyOfTheDay, {
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
          storyData: data,
          story_lastFetch: Date.now(),
        },
        resolve
      )
    })

    debug("[story] ✅ Nová data uložena");
    return data
  } catch (error) {
    error("❌ fetchStoryOfTheDay error", error);
    return null
  }
}



