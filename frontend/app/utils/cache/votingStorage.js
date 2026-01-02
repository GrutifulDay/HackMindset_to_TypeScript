export function setVoteRecord(key) {
    chrome.storage.local.set({ [key]: true })
}

export function hasVoted(key) {
    return new Promise(resolve => {
        chrome.storage.local.get([key], result => {
            resolve(!!result[key])
        })
    })
}

export function clearVoteRecord(key) {
    chrome.storage.local.remove([key])
}

