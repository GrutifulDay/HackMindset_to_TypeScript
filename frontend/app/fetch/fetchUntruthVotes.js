import { API, DEMO_MODE } from "../utils/config.js"
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{fetchPostUntruthVotes.js} 📡 načten")

/**
 * Odeslání hlasování o nepravdivé informaci
 * @param {String} date - např. "10-07-2025"
 * @param {Array<String>} feedback - pole označených bodů (např. ["Rok je špatně"])
 * @returns {Object|null} - odpověď ze serveru nebo null při chybě
 */

export async function fetchUntruthVotes(date, feedback, section) {
  // 🔧 DEMO MODE — nic se neodesila, pouze simulace
  if (DEMO_MODE === true) {
    const key = `untruth-${section}-${date}`;
    localStorage.setItem(key, "voted");

    return {
      demo: true,
      status: "ok",
      message: "Demo mode: feedback stored locally."
    };
  }

  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token – fetch se neprovede.");
    return null;
  }
  try {
    const response = await fetch(API.untruthVotesPost, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        date, 
        feedback, 
        section 
      })
    })

    return await response.json()
  } catch (error) {
    error("❌ Chyba při odesílání untruth feedback:", error)
    return null
  }
}
