import { debug } from "../logger/logger.js"

debug("{uiSnippets.js} ✅ funguje")

// POMOCNE FUNKCE

/**
 * vytvori HTML element s vol. textem, stylem a atributy.
 *
 * @param {string} tag - HTML tag (např. 'div', 'a', 'p', 'img', ...)
 * @param {string|null} text - Textový obsah prvku (ne HTML)
 * @param {object} style - CSS styly jako objekt (např. { color: 'red' })
 * @param {object} attributes - Libovolné atributy (např. { src, alt, href, id, ... })
 * @param {HTMLElement} element - Element, který chceš obalit tooltipem
 * @param {string} tooltipText - Text tooltipu
 * @returns {HTMLElement} Wrapper s tooltipem
 * @param {HTMLElement} trigger Ikona, která spouští zobrazení
 * @param {HTMLElement} target Element s obsahem info boxu
 * @param {Function} [customShow] Volitelná funkce pro zobrazení (např. target.show())
 */


// style fce -  kratsi zapis 
export const setStyle = (element, styles) => {
    Object.assign(element.style, styles)
}



// novy zapis components = rozsirena verze tooltip
export const el = (tag, text, style = {}, attributes = {}) => {
  const element = document.createElement(tag)

  if (text) element.textContent = text
  Object.assign(element.style, style)

  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("data-") || key === "aria-label" || key.includes("-")) {
      element.setAttribute(key, value) // pro atributy jako data-tooltip
    } else if (key === "class") {
      element.className = value
    } else {
      element[key] = value // klasické DOM vlastnosti
    }
  })

  return element
}


// delici cara 
export function createFadeLine() {
  return el("div", null, {
    height: "2px",
    width: "100%",
    background: "linear-gradient(to right, transparent, #000, transparent)",
    // margin: "5px 0"
    marginBottom: "10px",
    marginTop: "10px"
  }, {
    class: "fade-line"
  })
}

// fce pro otevirani oken 
export function attachInfoToggle(trigger, target, customShow) {
  const handleOutsideClick = (event) => {
    if (!target.contains(event.target) && event.target !== trigger) {
      target.style.display = "none"
      document.removeEventListener("click", handleOutsideClick)
    }
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = target.style.display === "block";
    if (isVisible) {
      target.style.display = "none"
      document.removeEventListener("click", handleOutsideClick)
    } else {
      if (customShow) {
        customShow()
      } else {
        target.style.display = "block"
      }
      setTimeout(() => document.addEventListener("click", handleOutsideClick), 0)
    }
  })
}






