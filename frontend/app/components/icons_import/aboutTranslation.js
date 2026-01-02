import { el } from "../../utils/dom/uiSnippets.js";
import { createAddTooltip } from "../../utils/dom/tooltip.js";

// info o prekladu ikona
export function createTranslationIcon() {

  const icon = el("img", null, {
    width: "20px",
    height: "auto",
    cursor: "pointer",
    position: "absolute",
    top: "-26px",
    right: "10px",
    opacity: ".8",
  }, {
    src: "../assets/icons/infoTranslation.svg",
  })

  createAddTooltip(icon, "Proč není text česky?")

  return icon
}
