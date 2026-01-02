import express from "express"
import { validateApiKey } from "../middlewares/validateApiKey.js"
import { getRetroMachine } from "../controllers/retroControllers.js"
import { getRetroVotes, addRetroVote } from "../controllers/retroVotesController.js"
import { debug } from "../utils/logger.js";

const router = express.Router()

debug("{storyRoutes.js} pripojeno");

router.get(
    "/retro-machine",
    validateApiKey("retro-machine"),
    getRetroMachine
)

router.get(
    "/retro-machine/retroVotesGet/:date",
    validateApiKey("Zavolání GET /retroVotesGet"),
    getRetroVotes
)

router.post(
    "/retro-machine/retroVotesPost",
    validateApiKey("Zavolání POST /retroVotesPost"),
    addRetroVote
)

export default router

