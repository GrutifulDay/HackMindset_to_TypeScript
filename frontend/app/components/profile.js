import { el, createFadeLine } from "../utils/dom/uiSnippets.js";
import { getLanguage } from "../utils/language/language.js";
import { fetchProfile } from "../fetch/fetchProfile.js";
import { createAddTooltip } from "../utils/dom/tooltip.js";
import { debug, error } from "../utils/logger/logger.js";

debug("{profile.js} 🧩 sekce se generuje...");

export async function createProfile() {
  debug("{funkce createProfile} ✅ funguje");

  const lang = getLanguage()
  const profileData = await fetchProfile()

  if (!profileData || typeof profileData !== "object") {
    error("❌ fetchProfile vrátil null – přeskočuji Profile sekci.");
    return null;
  }

  const aside = el("aside", null, {})

  const ul = el("ul", null, {
    listStyle: "none",
    padding: "0",
    margin: "0",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center"
  })

  const profileWrapper = el("div", null, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    marginTop: "-9px",
  })

  const instaIcon = el("img", null, {
    width: "40px",
    height: "auto",
    opacity: ".8",
  }, {
    src: "../assets/icons/insta.svg"
  })

  const hint = el("h2", lang === "cz" ? "Moje Insta Tipy:" : "My Insta Tips:", {})

  profileWrapper.append(instaIcon, hint)

  const instaTipsKeys = [
    "space_learning",
    "nature_travel_wildlife",
    "science_tech_ai"
  ]

  instaTipsKeys.forEach(key => {
    const tag = profileData[key];
    if (!tag) return

    const li = el("li", null, {
      alignItems: "center",
      display: "flex"
    })

    const span = el("span", tag, {});
    const button = el("button", null, {
      marginLeft: "3px",
      cursor: "pointer",
      border: "none",
      padding: "4px",
      background: "transparent",
    })

    createAddTooltip(button, lang === "cz" ? "Zkopíruj" : "Copy")

    const copy = el("img", null, {
      width: "20px",
      height: "20px",
      pointerEvents: "none",
    }, {
      src: "../assets/icons/copy.svg", 
    })

    const check = el("img", null, {
      width: "20px",
      height: "20px",
      pointerEvents: "none"
    }, {
      src: "../assets/icons/check.svg",
    })

    const copyIcon = copy.cloneNode(true) 
    const checkIcon = check.cloneNode(true)

    button.appendChild(copyIcon);

    button.addEventListener("click", () => {
      navigator.clipboard.writeText(tag)
        .then(() => {
          debug(`✅ Zkopírováno: ${tag}`)
          button.replaceChildren(checkIcon)
          setTimeout(() => {
            button.textContent = ""
            button.appendChild(copyIcon)
          }, 1000)
        })
        .catch(err => {
          error("❌ Chyba při kopírování:", err)
        })
    })

    li.append(span, button)
    ul.appendChild(li)
  })

  aside.append(createFadeLine(), profileWrapper, ul)
  return aside
}

