import { API, DEMO_MODE } from "../utils/config.js";
import { getJwtToken } from "../utils/auth/jwtToken.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{fetchStoryVotes.js} 📡 načten");

// ziskani postu hlasu pro dany den 
export async function fetchGetVoteStory(date) {
  // demo hlasovani
  if (DEMO_MODE === true) {
    const keyBase = `story-${date}`;
  
    const currentLike = parseInt(localStorage.getItem(`${keyBase}-like`)) || 0;
    const currentDislike = parseInt(localStorage.getItem(`${keyBase}-dislike`)) || 0;
  
    return {
      like: currentLike,
      dislike: currentDislike
    };
  }
  

  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token – fetch se neprovede.");
    return null;
  }
  try {
    const response = await fetch(`${API.storyVotesGet}/${date}`, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })

    return await response.json()
  } catch (error) {
    error("❌ Chyba při získávání hlasů:", error);
    return { like: 0, dislike: 0 }
  }
}

// odesilani hlasu
export async function fetchPostVoteStory(date, option) {
   // DEMO mode - hlasovani se neodesle na backend
   if (DEMO_MODE === true) {
    const keyBase = `story-${date}`;

    const currentLike = parseInt(localStorage.getItem(`${keyBase}-like`)) || 0;
    const currentDislike = parseInt(localStorage.getItem(`${keyBase}-dislike`)) || 0;

    if (option === "like") {
        localStorage.setItem(`${keyBase}-like`, currentLike + 1);
    } else {
        localStorage.setItem(`${keyBase}-dislike`, currentDislike + 1);
    }

    return {
        like: option === "like" ? currentLike + 1 : currentLike,
        dislike: option === "dislike" ? currentDislike + 1 : currentDislike
    };
}

  const token = await getJwtToken() 

  if (!token) {
    error("❌ Chybí JWT token – fetch se neprovede.");
    return null;
  }

  try {
    const response = await fetch(API.storyVotesPost, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, option })
    })

    return await response.json()
  } catch (error) {
    error("❌ Chyba při odesílání hlasu:", error);
    return null
  }
}
