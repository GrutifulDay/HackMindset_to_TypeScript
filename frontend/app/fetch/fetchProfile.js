import { updateSectionData } from "../utils/update/updateSectionData.js"
import { API } from "../utils/config.js";
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{fetchProfile.js} 📡 je načtený")


export async function fetchProfile() {
  debug("{funkce fetchProfile} ✅ funguje");

  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token fetchProfile – fetch se neprovede.");
    return null;
  }

  const shouldUpdate = await updateSectionData("profile")

  if (!shouldUpdate) {
    debug("[profile] ⏳ Data jsou aktuální – čtu z cache.");

    const { profileData } = await new Promise((resolve) => {
      chrome.storage.local.get("profileData", (result) => resolve(result))
    })

    return profileData || null
  }

  try {
    const response = await fetch(API.profile, {
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
          profileData: data,
          profile_lastFetch: Date.now(),
        },
        resolve
      )
    })

    debug("[profile] ✅ Nová data uložena");
    return data
  } catch (error) {
    error("❌ fetchProfile error", error);
    return null
  }
}



