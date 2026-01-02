import Story from "../models/Story.js";

// podle tohoto data najde zaznam v DB
// a bud vrati aktualni pocet hlasu, nebo zapise novy hlas.

export async function getStoryVotes(req, res) {
  const { date } = req.params;

  try {
    const [day, month, year] = date.split("-").map(Number)
    const story = await Story.findOne({ day, month, year })
    if (!story) {
      return res.status(404).json({ message: "Příběh Story nenalezen" });
    }

    res.json({
      like: story.like || 0,
      dislike: story.dislike || 0
    });
  } catch (err) {
    res.status(500).json({ message: "Chyba při získávání hlasů z story", error: err });
  }
}

export async function addStoryVote(req, res) {
  const { date, option } = req.body;

  if (!["like", "dislike"].includes(option)) {
    return res.status(400).json({ message: "Neplatná volba" })
  }

  try {
    const [day, month, year] = date.split("-").map(Number)
    const story = await Story.findOne({ day, month, year })
    if (!story) {
      return res.status(404).json({ message: "Příběh Story nenalezen" });
    }

    story[option] = (story[option] || 0) + 1
    await story.save()

    res.json({
      like: story.like,
      dislike: story.dislike
    })
  } catch (err) {
    res.status(500).json({ message: "Chyba při ukládání hlasu", error: err });
  }
}
