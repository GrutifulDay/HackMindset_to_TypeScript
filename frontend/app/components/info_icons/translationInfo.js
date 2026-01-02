import { el } from "../../utils/dom/uiSnippets.js";

// VISUAL - "INFO O PREKLADU" - okno / pouze pri CZ vyberu
export function createTranslationInfoWindow() {
    const container = el("div", null, {
        position: "absolute",
        bottom: "-66px",
        right: "47px",
        padding: "15px",
        zIndex: "1000",
        maxWidth: "300px",
        display: "none", 

        backgroundColor: "#fff8e1",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)", 
    })

    const closeBtn = el("span", "×", {
        position: "absolute",
        top: "5px",
        right: "10px",
        cursor: "pointer",
        
        fontSize: "20px",
        fontWeight: "bold",
        color: "#333"
    })

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

    // fce pro zobraceni volana zvenku 
    container.show = function () {
        container.style.display = "block";
        // prodleva mezi klikem a zavrenim
        setTimeout(() => {
            document.addEventListener("click", handleOutsideClick);
        }, 0);
    };

    const translationIcon = el("img", null, {
        width: "23px",
        height: "auto",
    }, {
        src: "../assets/icons/googleTranslation.svg"
    })

    const urlTranslation = el("a", "Google Translation", {
        cursor: "pointer",
        display: "inline-block",
        textTransform: "uppercase",
        alignItems: "center",
        fontFamily: "`JetBrains Mono`",
        fontSize: "1.1em",
        color: "#666",
        fontWeight: "bold",
        textDecoration: "none",
        transition: "transform 0.2s ease-in-out"
    }, {
        href: "https://chromewebstore.google.com/detail/google-translate/aapbdbdomjkkjkaonfhkkikfgjllcleb?utm_source=ext_app_menu",
        target: "_blank",
        rel: "noopener noreferrer" 
    });

    urlTranslation.addEventListener("mouseenter", () => {
        urlTranslation.style.transform = "scale(1.10)";
    });
    urlTranslation.addEventListener("mouseleave", () => {
        urlTranslation.style.transform = "scale(1)";
    });

    const moreText = el("strong", "Chceš vědět víc?");

    const moreIcon = el("img", null, {
        width: "12px",
        height: "auto",   
    }, {
        src: "../assets/icons/more.svg"
    });

    moreText.append(
        moreIcon
    )
    

    // texty 
    const title = el("strong", "O překladu", {
        fontSize: "1.2em",
        color: "#273E64",
        textTransform: "uppercase",
        textDecoration: "underline"
    });

    const line1 = el("p", null)

    line1.append(
        el("p", "Tato stránka je zatím dostupná pouze v angličtině."),
    
        el("p",
            "Pokud chceš přeložit text do češtiny, klikni na odkaz pod anglickým článkem "
        ),
        moreText,

        el("p", "Otevře se oficiální web NASA."),
    
        el("p", "Pokud máš v prohlížeči aktivovaný překladač, stačí kliknout na tuto ikonu:"),
        translationIcon,
    
        el("p", "a poté zvolit jazyk, který ti vyhovuje."),
    
        el("p", [
            "Pokud překladač v prohlížeči nemáš, můžeš si ho zdarma stáhnout zde: ",
        ]),
        urlTranslation
    )
    
    container.append(closeBtn, title, line1);
    return container;
}


