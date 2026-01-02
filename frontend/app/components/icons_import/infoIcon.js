import { el } from "../../utils/dom/uiSnippets.js";
import { getLanguage } from "../../utils/language/language.js";
import { createAddTooltip } from "../../utils/dom/tooltip.js";

// info ikona
export function createInfoIcon() {
  const lang = getLanguage();

  const icon = el("img", null, {
    width: "29px",
    height: "auto",
    cursor: "pointer",
    position: "absolute",
    right: "10px",
    top: "13px", 
  }, {
    src: "../assets/icons/info.svg"
  })

  createAddTooltip(icon, lang === "cz" ? "O rozšíření" : "About Extension");

  return icon;
}
