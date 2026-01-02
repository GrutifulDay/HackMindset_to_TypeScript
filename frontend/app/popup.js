import { selectionLanguage } from "./components/onboarding/promptLanguage.js";
import { initPopup } from "./initApp.js";

// Entry point popup skriptu pro Chrome extension:
// Pri nacteni zkontroluje, zda uzivatel dokoncil onboarding.
// Pokud ne, spusti vyber jazyka (onboarding flow).
// Pokud ano, rovnou inicializuje hlavni UI popupu.
// Logika bezi az po DOMContentLoaded, aby bylo UI pripravene.


function runOnboardingIfNeeded() {
  chrome.storage.local.get("onboardingCompleted", (result) => {
    const completed = result.onboardingCompleted

    if (!completed) {
      selectionLanguage()
    } else {
        initPopup() // hlavni UI
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  runOnboardingIfNeeded()
})
