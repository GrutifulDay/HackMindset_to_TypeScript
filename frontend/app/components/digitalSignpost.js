import { el, createFadeLine } from "../utils/dom/uiSnippets.js";
import { getLanguage } from "../utils/language/language.js";
import { fetchDigitalSignpost } from "../fetch/fetchDigitalSignpost.js"
import { createUntruthIcon } from "./icons_import/untruthIcon.js";
import { createUntruthVotingWindow } from "./interactions_users/untruthVoting.js";
import { getCachedData, setCachedData } from "../utils/cache/localStorageCache.js";
import { debug, warn } from "../utils/logger/logger.js";

debug("{digitalSignpost.js} 🧩 sekce se generuje...");

export async function createDigitalSignpost() {
  debug("{funkce createDigitalSignpost} ✅ funguje");

  const lang = getLanguage()
  const CACHE_KEY = `digital_cache_${lang}`

  let digitalData = getCachedData(CACHE_KEY)

  if (digitalData) {
      debug("[retro] ⏳ Data jsou aktuální – čtu z cache.")
  } else {
      debug("🌐 Načítám nová data ze serveru")
      digitalData = await fetchDigitalSignpost()

      if (!digitalData) {
          warn("⚠️ DigitalSignpost se nevykreslí – fetch vrátil null.")
          return null            // ⬅⬅⬅ Tohle je to hlavní!
      }

      setCachedData(CACHE_KEY, digitalData)
  }

  if (!digitalData) {
      warn("⚠️ Žádný příběh nenalezen.");
      return null
  }

  const article = el("article", null, { position: "relative" })

  const digitalWrapper = el("div", null, {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "10px",
      marginTop: "17px",
      marginLeft: "53px"
  })

  const titleDigitalSignpost = el("h2",
      lang === "cz" ? "Digitální rozcestník" : "Digital signpost",
      { margin: "0" }
  )

  const signpostIcon = el("img", null, {
      width: "40px",
      height: "auto",
      opacity: ".8",
      transform: "translateY(-9px)"
  }, {
      src: "../assets/icons/signpost.svg"
  })
  digitalWrapper.append(titleDigitalSignpost, signpostIcon)

  const infoTime = el("p",
      lang === "cz" ? "> Vychází každé pondělí <"
                    : "> Published every Monday <",
      {},
      { id: "info-TimeDescription" }
  )

  const title = el("h3", digitalData.title?.[lang] || "", {})
  const content = el("p", digitalData.content?.[lang] || "", {})
  const recommendation = el("p", digitalData.recommendation?.[lang] || "", {})

  // neni clanek = neni ikona
  const articleIsEmpty =
    (!digitalData.title?.[lang] || digitalData.title[lang].trim() === "") &&
    (!digitalData.content?.[lang] || digitalData.content[lang].trim() === "") &&
    (!digitalData.recommendation?.[lang] || digitalData.recommendation[lang].trim() === "")


  const untruthIcon = createUntruthIcon()
  const untruthVotingWindow = createUntruthVotingWindow()
  document.body.append(untruthVotingWindow)

  if (articleIsEmpty) {
    untruthIcon.style.display = "none"
  }

  const section = "digital"
  const date = `${digitalData.day}-${digitalData.month}-${digitalData.year}`

  untruthIcon.dataset.section = section

  const untruthWrapper = el("div", null, {
      position: "absolute",
      top: "8px",
      left: "0px",
      zIndex: "9999",
      pointerEvents: "auto",
      opacity: "0.6",
      transition: "opacity 0.2s",
  })

  untruthIcon.addEventListener("click", () => {
      debug("🧪 CLICK DETEKTOVÁN NA untruthIcon")
      untruthVotingWindow.show(untruthIcon, { section, date })
  })

  untruthWrapper.addEventListener("mouseenter", () => {
      untruthWrapper.style.opacity = "1"
  })
  untruthWrapper.addEventListener("mouseleave", () => {
      untruthWrapper.style.opacity = "0.6"
  })

  untruthWrapper.append(untruthIcon)

  article.append(
      createFadeLine(),
      untruthWrapper,
      digitalWrapper,
      infoTime,
      title,
      content,
      recommendation
  )

  return article
}
