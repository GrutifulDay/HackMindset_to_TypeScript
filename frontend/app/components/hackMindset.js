import { el } from "../utils/dom/uiSnippets.js"
import { getLanguage } from "../utils/language/language.js"
import { debug } from "../utils/logger/logger.js"

debug("{hackMindset.js} 🧩 sekce se generuje...")

export async function createHackMindset() {
    debug("{funkce createHackMindset} ✅ funguje")

    const lang = getLanguage() 
    
    const header = el("header", null, {})

    // title + logo
    const wrapper = el("div", null, {
        fontSize: "1rem",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        marginBottom: "-34px",
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
      
    wrapper.append(hackTitle, bulbIcon, mindsetTitle)
   
    // CZ / EN > text + datum
    const translations = {
        cz: {
            todayPrefix: "Dnes je ",
            todaySuffix: " a stalo se...",
            title: "HackMindset"
        },
        en: {
            todayPrefix: "Today is ",
            todaySuffix: " and this happened...",
            title: "HackMindset"
        }
    }
    const t = translations[lang] || translations["en"] // vychozi ["en"]
    
    const today = new Date().toLocaleDateString(lang === "cz" ? "cs-CZ" : "en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric"
    })

    const date = el("h3", null, {
        marginBottom: "6px",
        marginTop: "12px"
    })

    const prefix = document.createTextNode(t.todayPrefix)

    const dateSpan = el("span", today, {
        fontWeight: "bold",
        fontFamily: "'Rubik', sans-serif",
        fontWeight: "700",
        fontSize: "1rem"
    })
    const suffix = document.createTextNode(t.todaySuffix)

    date.append(prefix, dateSpan, suffix)      


    header.append(wrapper, date)
    return header
}
