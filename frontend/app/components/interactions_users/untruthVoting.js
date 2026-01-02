import { el } from "../../utils/dom/uiSnippets.js";
import { getLanguage } from "../../utils/language/language.js";
import { fetchUntruthVotes } from "../../fetch/fetchUntruthVotes.js";
import { fetchUntruthLimit } from "../../fetch/fetchUntruthLimit.js";
import { increaseUntruthVote, initUntruthLimit } from "../../utils/cache/untruthLimit.js";
import { createFeedbackUntruth } from "../interactions_users/votingReport.js";

// UI komponenta pro hlaseni nepravdivych nebo chybnych informaci
// Zobrazuje interaktivni okno s feedbackem, odesila hlasy na backend
// a obsahuje jednoduchou logiku pro detekci abuse (hromadne oznaceni)

export function createUntruthVotingWindow() {
  const lang = getLanguage();

  const container = el("div", null, {
    position: "absolute",
    padding: "15px",
    zIndex: "1000",
    maxWidth: "300px",
    display: "none",
    backgroundColor: "#f7f3ff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    fontFamily: "'JetBrains Mono', monospace",
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

  closeBtn.addEventListener("click", () => {
    container.style.display = "none";
    document.removeEventListener("click", handleOutsideClick);
  });

  function handleOutsideClick(e) {
    if (!container.contains(e.target)) {
      container.style.display = "none";
      document.removeEventListener("click", handleOutsideClick);
    }
  }

  const title = el("h3", "", {
    display: "block",
    marginTop: "14px",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#273E64"
  });

  // seznam feedback
  const listItems = [
    lang === "cz" ? "Rok je špatně" : "The year is wrong",
    lang === "cz" ? "Není to dnešní datum" : "This is not today's date",
    lang === "cz" ? "Událost se stala jinak" : "It happened differently",
    lang === "cz" ? "Celý článek je špatně" : "The entire story is incorrect"
  ];

  let selectedStates = [];   // bude resetováno při každém otevření
  const listWrapper = el("div", null, {
    marginTop: "12px",
    fontSize: "1em",
    color: "#05054e"
  });


  const submitButton = el("button",
    lang === "cz" ? "Odeslat" : "Submit",
    {},
    { class: "untruth-btn" }
  );

  initUntruthLimit(); // reset denního limitu


  container.show = function (referenceElement, metadata = {}) {

    // 1) ulozi data
    container.dataset.section = metadata.section || "unknown";
    container.dataset.date = metadata.date || "";
  
    const section = container.dataset.section;
    const date = container.dataset.date;
  
    // 2) dynamicky jazyk (aktualni)
    const currentLang = getLanguage();
    title.textContent = currentLang === "cz"
      ? `Našli jste chybu? (${section})`
      : `Did you find a mistake? (${section})`;
  
    // 3) Zobrazit okno
    container.style.display = "block";
    submitButton.disabled = false;
  
    // 4) Reset UI
    listWrapper.innerHTML = "";
    selectedStates = [];
  
    // 5) LocalStorage
    const today = new Date().toISOString().slice(0, 10);
    const voteKey = `untruth-${section}-${date}-${today}`;
    const stored = JSON.parse(localStorage.getItem(voteKey));
    const alreadySubmitted = !!stored;
  
    // 6) vykresleni moznosti
    listItems.forEach(text => {
      const stateObj = { text, value: stored?.includes(text) || false };
      selectedStates.push(stateObj);
  
      const icon = el("img", null, {
        width: "20px",
        height: "20px",
        cursor: alreadySubmitted ? "default" : "pointer",
        opacity: alreadySubmitted ? "0.6" : "1",
        userSelect: "none",
      }, {
        src: stateObj.value
          ? "../assets/icons/mark-on.svg"
          : "../assets/icons/mark-off.svg",
          draggable: "false"
      });
  
      if (!alreadySubmitted) {
        icon.addEventListener("click", () => {
          stateObj.value = !stateObj.value;
          icon.src = stateObj.value
            ? "../assets/icons/mark-on.svg"
            : "../assets/icons/mark-off.svg";
        });
      }
  
      const row = el("div", null, {
        display: "flex",
        marginBottom: "6px",
        marginLeft: "54px"
      });
  
      row.append(
        icon,
        el("span", text, { marginLeft: "10px" })
      );
  
      listWrapper.appendChild(row);
    });
  
    // 7) nastaveni button
    if (alreadySubmitted) {
      submitButton.disabled = true;
      submitButton.textContent = currentLang === "cz" ? "Odesláno" : "Submitted";
      submitButton.style.opacity = "0.6";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = currentLang === "cz" ? "Odeslat" : "Submit";
      submitButton.style.opacity = "1";
    }
  
    // 8) Pozice
    requestAnimationFrame(() => {
      const rect = referenceElement.getBoundingClientRect();
      const top = window.scrollY + rect.top - container.offsetHeight - 5;
      const screenCenter = window.innerWidth / 2;
  
      const left = rect.left < screenCenter
        ? window.scrollX + rect.right + 5
        : window.scrollX + rect.left - container.offsetWidth - 5;
  
      container.style.top = `${top}px`;
      container.style.left = `${left}px`;
  
      document.addEventListener("click", handleOutsideClick);
    });
  };
  
  // submit logika
  submitButton.addEventListener("click", async () => {
    const section = container.dataset.section;
    const date = container.dataset.date;

    const selected = selectedStates
      .filter(i => i.value)
      .map(i => i.text);

    if (selected.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const voteKey = `untruth-${section}-${date}-${today}`;

    // Abuse = vsech 4
    const isAbuse = selected.length === 4;

    if (isAbuse) {
      await fetchUntruthLimit(section, date);
      localStorage.setItem(voteKey, JSON.stringify(selected));
      createFeedbackUntruth(lang === "cz"
        ? "Děkujeme za nahlášení chyby 👍"
        : "Thank you for reporting the error 👍"
      );
    } else {
      await fetchUntruthVotes(date, selected, section);
      increaseUntruthVote();
      localStorage.setItem(voteKey, JSON.stringify(selected));
      createFeedbackUntruth(lang === "cz"
        ? "Děkujeme za nahlášení chyby 👍"
        : "Thank you for reporting the error 👍"
      );
    }

    submitButton.disabled = true;
    submitButton.textContent = lang === "cz" ? "Odesláno" : "Submitted";
    submitButton.style.opacity = "0.6";
  });

  container.append(closeBtn, title, listWrapper, submitButton);
  return container;
}
