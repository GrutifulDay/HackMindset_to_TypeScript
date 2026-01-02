import { fetchRetroMachine } from "../fetch/fetchRetroMachine.js";
import { fetchGetVoteRetro, fetchPostVoteRetro } from "../fetch/fetchRetroVotes.js";
import { createVotingReportUsers } from "./interactions_users/votingReport.js";
import { el, createFadeLine } from "../utils/dom/uiSnippets.js";
import { getLanguage } from "../utils/language/language.js";
import { getCachedData, setCachedData } from "../utils/cache/localStorageCache.js";
import { createUntruthIcon } from "./icons_import/untruthIcon.js";
import { createUntruthVotingWindow } from "./interactions_users/untruthVoting.js";
import { createAddTooltip } from "../utils/dom/tooltip.js";
import { createModemSound } from "./sound_section/modem.js";
import { debug, warn } from "../utils/logger/logger.js";


debug("{retroMachine.js} 🧩 sekce se generuje...");

export async function createRetroMachine() {
  debug("{funkce createRetroMachine} ✅ funguje");

  const lang = getLanguage();
  const CACHE_KEY = `retro_cache_${lang}`;

  let retroData = getCachedData(CACHE_KEY);

  if (retroData) {
    debug("[retro] ⏳ Data jsou aktuální – čtu z cache.");
  } else {
    debug("🌐 Načítám nová data ze serveru");
    retroData = await fetchRetroMachine();
    if (retroData) setCachedData(CACHE_KEY, retroData);
  }

  if (!retroData || typeof retroData !== "object") {
    warn("⚠️ Retro data nejsou dostupná – sekce se nepřidá.");
    return null;
  }

  const article = el("article", null, {
    position: "relative"
  });

  const retroMachineTitle = el("h2", "Retro Machine")
  const retroWrapper = el("div", null, {
    position: "relative",
    marginTop: "10px"
  })

  const televisionIcon = el("img", null, {
    width: "40px",
    height: "auto",
    position: "absolute",
    top: "-18px",
    right: "101px",
    opacity: ".8"
  }, {
    src: "../assets/icons/television.svg"
  })

  retroWrapper.append(televisionIcon, retroMachineTitle)

  const eventYear = el("h3", retroData.eventYear ? `> ${retroData.eventYear} <` : "")
  const title = el("h3", retroData.title?.[lang] || "")
  const nostalgiggle = el("p", retroData.nostalgiggle?.[lang] || "")
  const voteTitle = el("p", lang === "cz" 
      ? "Chceš vidět výsledky hlasování? Klikni na jeden z obrázků a hlasuj i ty." 
      : "Do you want to see the voting results? Click on one of the images and cast your vote too.", 
  {
    textTransform: "uppercase",
    fontSize: ".8rem",
    fontWeight: "bold",
    marginTop: "30px"

  })
  // FCE PRO ZVUK 
  createModemSound(retroData, lang, title)

  // HLASOVANI  
  const feedbackWrapper = el("div", null, {
    display: "flex",
    gap: "40px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "0px"
  })
  

  const rememberIMG = el("img", null, {
    width: "56px",
    cursor: "pointer"
  }, {
    src: "../assets/icons/zazil-white.png",
    class: "vote-img"
  })
  createAddTooltip(rememberIMG,
    lang === "cz" ? "To jsem zažil/a!" : "I've experienced this!"
    )

  const rememberCount = el("span", "", {
    display: "none",
  }, {
    className: "vote-count"
  })
  

  const notExperienceIMG = el("img", null, {
    width: "57px",
    cursor: "pointer"
  }, {
    src: "../assets/icons/nezazil-white.png",
    class: "vote-img"
  })
  createAddTooltip(notExperienceIMG,
    lang === "cz" ? "To jsem nezažil/a." : "I haven’t experienced this."
    )

  const notExperienceCount = el("span", "", {
    display: "none"
  }, {
    className: "vote-count"
  })
  
  
  // fce hlasovani 
  function createVoteElement(imgElement, countSpan) {
    // Wrapper pro img i cislo
    const imageWrapper = el("div", null, {
      position: "relative",
      height: "100px", 
      width: "80px",
      display: "flex",
      alignItems: "flex-end", 
      justifyContent: "center",
      paddingTop: "26px" 
    })
  
    // Obrazek 
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "contain";
  
    // cislo nad img 
    Object.assign(countSpan.style, {
      position: "absolute",
      fontFamily: "monospace",
      top: "0px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "14px",
      fontWeight: "bold",
      padding: "2px 8px",
      borderRadius: "6px",
      backgroundColor: "#ffffff",
      color: "#000",
      lineHeight: "20px",
      minWidth: "32px", 
      textAlign: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
    })
  
    imageWrapper.append(imgElement, countSpan)
  
    // Celý hlasovací blok
    const wrapper = el("div", null, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "80px",
      height: "130px" 
    })
  
    wrapper.append(imageWrapper)
    return wrapper
  }
  
  // pridani fce k wrapper
  const rememberWrapper = createVoteElement(rememberIMG, rememberCount) 
  const notExperienceWrapper = createVoteElement(notExperienceIMG, notExperienceCount)
  feedbackWrapper.append(notExperienceWrapper, rememberWrapper)
  
  // Kontrola, zda uzivatel jz hlasoval
  const todayKey = `${retroData.day}-${retroData.month}-${retroData.year}`
  const localStorageKey = `retroVotedToday_${todayKey}` 
  debug("🧪 todayKey:", todayKey)
  
  const voteCounts = await fetchGetVoteRetro(todayKey)
  const votedToday = localStorage.getItem(localStorageKey)
  
  
  // zablokuje hlasovani, ukaze barevny img 
  if (votedToday) {
    rememberIMG.style.pointerEvents = "none"
    notExperienceIMG.style.pointerEvents = "none"
  
    rememberIMG.style.opacity = votedToday === "like" ? "1" : "0.4"
    notExperienceIMG.style.opacity = votedToday === "dislike" ? "1" : "0.4"
  
    if (votedToday === "like") {
    rememberIMG.src = "../assets/icons/zazil-green.png"
  } else {
    notExperienceIMG.src = "../assets/icons/nezazil-green.png"
  }
  
  rememberCount.textContent = voteCounts.like
  notExperienceCount.textContent = voteCounts.dislike
  rememberCount.style.display = "inline"
  notExperienceCount.style.display = "inline"
  }
  
  // zablokuj hlasovani, zobraz barevny/vybranny img a aktual. pocty z db 
  async function handleVote(option) {
    const updated = await fetchPostVoteRetro(todayKey, option)
    if (!updated) return
  
    rememberCount.textContent = updated.like
    notExperienceCount.textContent = updated.dislike
    rememberCount.style.display = "inline"
    notExperienceCount.style.display = "inline"
  
    rememberIMG.style.pointerEvents = "none"
    notExperienceIMG.style.pointerEvents = "none"
  
    if (option === "like") {
      rememberIMG.src = "../assets/icons/zazil-green.png"
      rememberIMG.style.opacity = "1"
      notExperienceIMG.style.opacity = "0.4"
    } else {
      notExperienceIMG.src = "../assets/icons/nezazil-green.png"
      notExperienceIMG.style.opacity = "1"
      rememberIMG.style.opacity = "0.4"
    }
  
    localStorage.setItem(localStorageKey, option)
  
    createVotingReportUsers(lang === "cz" ? "Děkujeme, že hlasujete každý den 💚" : "Thank you for voting every day 💚")
  }
  
    // Event listenery
    rememberIMG.addEventListener("click", () => {
      handleVote("like")
    })
  
    notExperienceIMG.addEventListener("click", () => {
      handleVote("dislike")
    })
  
// OZNACENI CHYBNE INFORMACE
const untruthIcon = createUntruthIcon()
const untruthVotingWindow = createUntruthVotingWindow()
document.body.append(untruthVotingWindow)

const section = "retro"
const date = `${retroData.day}-${retroData.month}-${retroData.year}`

untruthIcon.dataset.section = section

// wrapper pro pozici + hover efekt
const untruthWrapper = el("div", null, {
  position: "absolute",
  top: "8px",
  left: "0px",
  zIndex: "9999",
  opacity: "0.6",
  transition: "opacity 0.2s", 
})

untruthIcon.addEventListener("click", () => {
  untruthVotingWindow.show(untruthIcon, {
    section,
    date
  })
})

// hover efekt
untruthWrapper.addEventListener("mouseenter", () => {
  untruthWrapper.style.opacity = "1"
})
untruthWrapper.addEventListener("mouseleave", () => {
  untruthWrapper.style.opacity = "0.6"
})

debug("🧪 untruthIcon:", untruthIcon)

untruthWrapper.append(untruthIcon)


article.append(
  createFadeLine(),
  untruthWrapper,
  retroWrapper,
  eventYear,
  title,
  nostalgiggle,
  voteTitle,
  feedbackWrapper
)

return article

}
