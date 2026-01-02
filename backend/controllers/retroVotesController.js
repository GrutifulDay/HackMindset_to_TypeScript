import Retro from "../models/Retro.js";

// podle tohoto data najde zaznam v DB
// a bud vrati aktualni pocet hlasu, nebo zapise novy hlas.

export async function getRetroVotes(req, res) {
  const { date } = req.params;

  try {
    const [day, month, year] = date.split("-").map(Number)
    const retro = await Retro.findOne({ day, month, year })
    if (!retro) {
      return res.status(404).json({ message: "Příběh Retro nenalezen" });
    }

    res.json({
      like: retro.like || 0,
      dislike: retro.dislike || 0
    });
  } catch (err) {
    res.status(500).json({ message: "Chyba při získávání hlasů", error: err });
  }
}

export async function addRetroVote(req, res) {
  const { date, option } = req.body;

  if (!["like", "dislike"].includes(option)) {
    return res.status(400).json({ message: "Neplatná volba" })
  }

  try {
    const [day, month, year] = date.split("-").map(Number)
    const retro = await Retro.findOne({ day, month, year })
    if (!retro) {
      return res.status(404).json({ message: "Příběh Retro nenalezen" });
    }

    retro[option] = (retro[option] || 0) + 1
    await retro.save()

    res.json({
      like: retro.like,
      dislike: retro.dislike
    })
  } catch (err) {
    res.status(500).json({ message: "Chyba při ukládání hlasu z retro", error: err });
  }
}
