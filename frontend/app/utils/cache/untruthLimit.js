// 🟩 nastavi novy den
export function initUntruthLimit() {
    const today = new Date().toISOString().slice(0, 10)
    const existing = JSON.parse(localStorage.getItem("untruthLimit"))
  
    if (!existing || existing.day !== today) {
      localStorage.setItem("untruthLimit", JSON.stringify({
        day: today,
        count: 0
      }))
    }
  }
  
  // vrati true, pokud dnes jeste neprekrocil limit
  export function canVoteUntruth(max = 1) {
    const data = JSON.parse(localStorage.getItem("untruthLimit"));
    return data?.count < max;
  }
  
  // 🟩 zvysi pocet hlasu +1
  export function increaseUntruthVote() {
    const data = JSON.parse(localStorage.getItem("untruthLimit"))
    if (!data) return
  
    data.count += 1;
    localStorage.setItem("untruthLimit", JSON.stringify(data))
  }
  