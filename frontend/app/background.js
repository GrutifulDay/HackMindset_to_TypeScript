// Reminder logika pro Chrome extension:
// Sleduje otevreni Instagramu a zobrazi upozorneni maximalne jednou denne.
// Zaroven hlida, aby se reminder nespoustel opakovane na stejnem tabu
// a pocka na nacteni content skriptu pred odeslanim zpravy.


// 🧠 Uložíme ID tabů, kde už reminder běžel
const shownTabs = new Set();

// kontrolni fce zda uz dnes popup okno bezelo
function alreadyShownToday(callback) {
  chrome.storage.local.get("lastReminderDate", (data) => {
    const today = new Date().toISOString().split("T")[0];
    if (data.lastReminderDate === today) {
      callback(true);
    } else {
      chrome.storage.local.set({ lastReminderDate: today }, () => callback(false));
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("instagram.com")
  ) {
    // pokud uz reminder na tomhle tabu bezel, neotevre se
    if (shownTabs.has(tabId)) return;
    shownTabs.add(tabId);

    // console.log("✅ Uživatel otevřel Instagram");

    // overeni, jestli dnes reminder bezel
    alreadyShownToday((wasShownToday) => {
      if (wasShownToday) {
        console.log("⏸️ Reminder už dnes byl zobrazen, přeskočeno.");
        return;
      }

      chrome.storage.local.get("preferredLanguage", (data) => {
        const lang = data.preferredLanguage || "cz";

        // pocka, az se content.js nacte
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { type: "hackmindset_reminder", lang }, () => {
            // pokud se nedoruci, zkusi znovu
            if (chrome.runtime.lastError) {
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, { type: "hackmindset_reminder", lang }, () => {
                });
              }, 3000);
            }
          });
        }, 1500);
      });
    });
  }
});

// kdyz se tab zavre, smaze z pameti
chrome.tabs.onRemoved.addListener((tabId) => {
  shownTabs.delete(tabId);
});





// // Volání honeypointu – bez osobních údajů
// fetch("https://localhost:3000/api/feedbackForm", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     "Authorization": "Bearer HACK_EXTENSION"
//   },
//   body: JSON.stringify({
//     context: "extension-check",
//     timestamp: Date.now()
//   })
// })
// .then(res => res.json())
// .then(data => {
//   debug("✅ Honeypoint odpověděl:", data.message)
// })
// .catch(err => {
//   console.warn("❌ Honeypoint fetch selhal:", err.message)
// })

