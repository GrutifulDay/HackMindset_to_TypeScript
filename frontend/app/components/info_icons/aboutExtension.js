import { el } from "../../utils/dom/uiSnippets.js";
import { getLanguage } from "../../utils/language/language.js";
import { createAddTooltip } from "../../utils/dom/tooltip.js";

export function createAboutExtensionWindow() {
    const lang = getLanguage();

    const texts = {
        cz: {
            title: "O rozšíření",
            line1: "Hack Mindset ti každý den nabízí zajímavosti z minulosti i současnosti světa technologií a vědy.",
            line2: "Je rozděleno do pěti sekcí:",
            line8: "Texty jsou generované pomocí AI a následně ručně zkontrolované a upravené. Občas může dojít k nepřesnosti – pokud na něco narazíš, můžeš chybu snadno nahlásit.",
            line9: "Rozšíření je zcela anonymní – nesleduje a nesbírá žádná data, jde jen o sdílení inspirace a jednoduché statistiky hlasování."
        },
        en: {
            title: "About the extension",
            line1: "Hack Mindset offers you daily insights from both the present and the past of the world of technology and science.",
            line2: "It is divided into five sections:",
            line8: "All texts are generated using AI and then manually reviewed and edited. Occasionally, inaccuracies may occur – if you notice anything, you can easily report the error.",
            line9: "The extension is completely anonymous – it does not track or collect any data; it’s all about sharing inspiration and simple voting statistics."
        }
    };

    const sections = {
        cz: [
            "NASA obrázek dne – každodenní pohled do vesmíru",
            "Digitální rozcestník – jednou týdně informace a tipy pro orientaci v online světě",
            "Story of the day – historická událost spojená s dnešním datem",
            "Retro machine – návrat do minulosti technologií: od 70. let po současnost, skrze konkrétní zařízení a vzpomínky",
            "Moje Insta tipy – inspirativní profily z oblastí: vesmír, příroda, technologie"
        ],
        en: [
            "NASA Picture of the Day – a daily glimpse into space",
            "Digital Signpost – weekly tips and information to help you navigate the online world",
            "Story of the Day – a historical event linked to today’s date",
            "Retro Machine – a journey through the history of technology, from the 1970s to today, via specific devices and memories",
            "My Insta Tips – inspiring profiles in these areas: space, nature, technology"
        ]
    };

    const t = texts[lang] || texts.en;
    const s = sections[lang] || sections.en;

    const container = el("div", null, {
        position: "absolute",
        top: "36px",
        right: "32px",
        backgroundColor: "#ffe5f0",
        padding: "15px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        zIndex: "1000",
        maxWidth: "300px",
        display: "none",
        textAlign: "center" 
    }, {
        id: "info-panel"
    });
    

    const closeBtn = el("span", "×", {
        position: "absolute",
        top: "5px",
        right: "10px",
        cursor: "pointer",
        fontSize: "20px",
        fontWeight: "bold",
        color: "#333"
    });

    // fce click zavreni mimo element container
    function closeContainer() {
        container.style.display = "none";
        document.removeEventListener("click", handleOutsideClick)
    }

    // zavreni klik na X
    closeBtn.addEventListener("click", closeContainer)

    // Zavření kliknutím mimo container
    function handleOutsideClick(e) {
        if (!container.contains(e.target)) {
            closeContainer();
        }
    }

    container.show = function () {
        container.style.display = "block";
        setTimeout(() => {
            document.addEventListener("click", handleOutsideClick);
        }, 0);
    };

    const title = el("strong", t.title, {
        fontSize: "1.2em",
        color: "#273E64",
        textTransform: "uppercase",
        textDecoration: "underline",
        marginBottom: "10px"
    });

    const para1 = el("p", t.line1, { marginBottom: "10px" });
    const para2 = el("p", t.line2, {
        marginBottom: "10px",
        fontWeight: "bold"
    });
    
    const sectionList = el("ul", null, {
        paddingLeft: "20px",
        marginBottom: "14px"
    });

    s.forEach(text => {
        sectionList.append(el("li", text, {
            marginBottom: "6px"
        }));
    });

    const para8 = el("p", t.line8, { marginTop: "12px" });
    const para9 = el("p", t.line9, { marginTop: "12px" });

    const creditLine = el("p", null, { marginTop: "10px" });
    const creditLink = el("a", "r.adeek777", {
        display: "inline-block", // ← Tohle je klíčové
        textTransform: "uppercase",
        fontSize: "1.1em",
        color: "#666",
        fontWeight: "bold",
        textDecoration: "none",
        transition: "transform 0.2s ease-in-out"
    }, {
        href: "https://www.instagram.com/r.adeek777/",
        target: "_blank",
        rel: "noopener noreferrer"
    });
    
    creditLink.addEventListener("mouseenter", () => {
        creditLink.style.transform = "scale(1.1)";
        creditLink.style.color = "#000";
    });
    creditLink.addEventListener("mouseleave", () => {
        creditLink.style.transform = "scale(1)";
        creditLink.style.color = "#666";
    });
    

    if (lang === "cz") {
        creditLine.append("Ilustraci v sekci Story of the day vytvořil ", creditLink);
    } else {
        creditLine.append("The illustration in the Story of the Day section was created by ", creditLink);
    }

    // GitHub footer
    const footer = el("footer", null, { marginTop: "16px", textAlign: "center" });
    const gitHubIcon = el("img", null, {
        width: "30px",
        height: "auto",
        cursor: "pointer",
        transition: "transform 0.2s ease-in-out"
    }, {
        src: "../assets/icons/github.svg",
    });

    const gitHubLink = el("a", null, {
        display: "inline-block"
    }, {
        href: "https://github.com/GrutifulDay/HackMindset/blob/main/README.md",
        target: "_blank",
        rel: "noopener noreferrer"
    });

    gitHubIcon.addEventListener("mouseenter", () => {
        gitHubIcon.style.transform = "scale(1.10)";
    });
    gitHubIcon.addEventListener("mouseleave", () => {
        gitHubIcon.style.transform = "scale(1)";
    });

    createAddTooltip(gitHubIcon, "GitHub");
    gitHubLink.append(gitHubIcon);
    footer.append(gitHubLink);

    container.append(
        closeBtn,
        title,
        para1,
        para2,
        sectionList,
        para8,
        para9,
        creditLine,
        footer
    );

    return container;
}
