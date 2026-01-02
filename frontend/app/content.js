// Content script pro Chrome extension:
// Zobrazuje nenápadný reminder přímo na stránce (např. Instagram),
// který uživatele upozorní na denní obsah v HackMindsetu.
// Reminder se vykreslí pouze jednou (kontrola přes ID v DOM),
// respektuje jazyk z message nebo localStorage,
// reaguje na zprávu z background.js
// a po určité době se automaticky zavře.

// pomocna funkce pro tvorbu HTML el
const el = (tag, text, style = {}, attributes = {}) => {
  const element = document.createElement(tag)

  if (text) element.textContent = text
  Object.assign(element.style, style)

  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("data-") || key === "aria-label" || key.includes("-")) {
      element.setAttribute(key, value)
    } else if (key === "class") {
      element.className = value
    } else {
      element[key] = value
    }
  })

  return element
}

// Fallback: ziska jazyk z localStorage
function getLanguage() {
  return localStorage.getItem("hackmindset_language") || "en"
}

// fce pro zobrazeni upozorneni
function showHackMindsetReminder(langFromMessage) {
  if (document.getElementById("showContent")) return

  const lang = langFromMessage || getLanguage()

  const messages = {
    en: "Have you checked today’s update in HackMindset?",
    cz: "Už jsi dnes viděl/a novinky a vybrané Insta tipy v rozšíření HackMindset?"
  }

  const popup = el("div", null, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "linear-gradient(to left, #ffffff, #f0f0f0)",
    color: "#05054e",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
    zIndex: 9999,
    fontSize: ".9em",
    fontFamily: "'JetBrains Mono', monospace",
    maxWidth: "300px",
    lineHeight: "1.5",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    border: "2px solid #6c6c7a"
  }, { id: "showContent" })

  // nadpis + logo
  const titleWrapper = el("div", null, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: "600",
    fontSize: "1.8em",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textShadow: "1px 2px 3px rgba(0, 0, 0, 1.5)",
    color: "#ffe5f0"
  })

  const hackTitle = el("span", "Hack")
  const icon = el("img", null, {
    width: "22px",
    height: "22px"
  }, {
    src: chrome.runtime.getURL("frontend/assets/icons/logo-bulb.svg"),
    alt: "logo"
  })
  const mindsetTitle = el("span", "Mindset")

  titleWrapper.append(hackTitle, icon, mindsetTitle)

  // dekorativni cara
  const underline = el("div", null, {
    height: "2px",
    width: "80%",
    marginTop: "-10px",
    background: "linear-gradient(to right, transparent, #e9e9f2 40%, #e9e9f2 60%, transparent)"
  })

  // zprava
  const messageText = el("p", `${messages[lang] || messages.en}`, {
    margin: 0
  })

  // zaviraci krizek
  const closeBtn = el("span", "✕", {
    position: "absolute",
    top: "3px",
    right: "12px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#6c6c7a"
  })
  closeBtn.addEventListener("click", () => popup.remove())

  popup.append(closeBtn, titleWrapper, underline, messageText)
  document.body.appendChild(popup)

  setTimeout(() => {
    if (document.body.contains(popup)) popup.remove()
  }, 90000)
}

// Listener na zpravy z background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "hackmindset_reminder") {
    // 🔔 Tady máš tvou logiku pro zobrazení reminderu
    showHackMindsetReminder(message.lang);

    // ✅ Pošli odpověď zpět — tím zabráníš chybě
    sendResponse({ status: "ok" });
  }

  // ⚠️ Důležité: vracíme true, aby port zůstal otevřený dokud nepošleme odpověď
  return true;
});

