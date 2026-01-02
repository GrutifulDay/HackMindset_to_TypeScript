import { el } from "../../utils/dom/uiSnippets.js";
import { getLanguage } from "../../utils/language/language.js";
import { createAddTooltip } from "../../utils/dom/tooltip.js";

// nahlaseni chyb v sekcich - ikona 
export function createUntruthIcon() {

  const lang = getLanguage();

  const icon = el("img", null, {
    position: "absolute",
    width: "26px",
    height: "auto",
    cursor: "pointer",
  }, {
    src: "../assets/icons/warning.svg",
  })

  createAddTooltip(icon, lang === "cz" ? "Chceš nahlásit chybu?" : "Do you want to report false information?")

  return icon
}


