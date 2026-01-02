import { el } from "../../utils/dom/uiSnippets.js";
import { setLanguage, hasLanguageSet } from "../../utils/language/language.js";
import { initPopup } from "../../initApp.js";

// VYBER JAZYKA
export function selectionLanguage() {
  if (hasLanguageSet()) return;

  const wrapper = el("div", null, {}, { class: "language-tooltip" })
  const content = el("div", null, {}, { class: "tooltip-content" })

  const wrapperTitle = el("div", null, {
    fontSize: "1rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "4px",
    textTransform: "uppercase",
     textAlign: "center",
    letterSpacing: "0.5px",
   
    textShadow: "1px 2px 3px rgba(0, 0, 0, 1.5)",
    color: "#ffe5f0",
    
})

const hackTitle = el("h1", "hack", {}, {
    class: "hack-title"
})

const mindsetTitle = el("h1", "mindset", {}, {
    class: "hack-title"
})

const bulbIcon = el("img", null, {
    width: "42px",
    height: "42px",
    transform: "translateY(-6px)"
  }, {
    src: "../assets/icons/logo-bulb.svg"
  })
  
  wrapperTitle.append(hackTitle, bulbIcon, mindsetTitle)
  
  const title = el("h3", "Do you want the extension in Czech or English?", {
    marginBottom: "30px",
  })
  const buttons = el("div", null, {

  }, { class: "language-buttons" })

  const btnCZ = el("button", "Čeština", {}, { class: "lang-button" })
  const btnEN = el("button", "English", {}, { class: "lang-button" })

  btnCZ.addEventListener("click", () => {
    setLanguage("cz");
    chrome.storage.local.set({ onboardingCompleted: true }, () => {
      wrapper.remove()
      initPopup()
    })
  })

  btnEN.addEventListener("click", () => {
    setLanguage("en")
    chrome.storage.local.set({ onboardingCompleted: true }, () => {
      wrapper.remove()
      initPopup()
    })
  })

  buttons.append(btnCZ, btnEN)
  content.append(wrapperTitle, title, buttons)
  wrapper.append(content)
  document.body.append(wrapper)
}
