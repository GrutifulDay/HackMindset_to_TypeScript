// play 
export function playSound(filename) {
    const path = `frontend/assets/sounds/${filename}`
    const audio = new Audio(chrome.runtime.getURL(path))
    audio.play()
}

let currentAudio = null

// prepinani 
export function toggleSound(filename, soundIcon) {
  const path = chrome.runtime.getURL(`frontend/assets/sounds/${filename}`) 

  // zapnout / vypnout zvuk 
  if (!currentAudio || currentAudio.paused) {
    currentAudio = new Audio(path)
    currentAudio.play()
    soundIcon.textContent = "🔇"

    currentAudio.addEventListener("ended", () => {
      soundIcon.textContent = "📢"
      currentAudio = null
    })
  } else {
    currentAudio.pause()
    currentAudio.currentTime = 0
    soundIcon.textContent = "📢"
    currentAudio = null
  }
}

