import { el } from "../../utils/dom/uiSnippets.js";
import { toggleSound } from "../../utils/sounds/playSound.js"; // místo playSound

// PREHRAVANI ZVUKU pro urcitou sekci 
export function createModemSound(retroData, lang, titleEl) {
  const modemTitleCZ = "Hayes Micromodem 100 – Modem pro domácí uživatele"
  const modemTitleEN = "Hayes Micromodem 100 – Modem for the Masses"

  const shouldAddSound =
    retroData.title?.cz === modemTitleCZ ||
    retroData.title?.en === modemTitleEN

  if (!shouldAddSound) return;

  const soundIcon = el("img", null, {
    marginLeft: "10px",
    width: "17px",
    cursor: "pointer",
    fontSize: "18px",
    title: lang === "cz" ? "Přehraj zvuk připojení" : "Play connection sound"
  }, {
    src: "../assets/icons/modem.svg"
  })

  soundIcon.addEventListener("click", () => {
    toggleSound("modemSound.mp3", soundIcon)
  })

  titleEl.appendChild(soundIcon)
}
