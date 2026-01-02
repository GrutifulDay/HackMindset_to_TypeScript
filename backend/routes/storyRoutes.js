import express from "express";
import { validateApiKey } from "../middlewares/validateApiKey.js";
import { getStoryOfTheDay } from "../controllers/storyController.js";
import { getStoryVotes, addStoryVote } from "../controllers/storyVotesController.js";
import { debug } from "../utils/logger.js";

const router = express.Router()

debug("{storyRoutes.js} pripojeno");

router.get(
    "/story-of-the-day",
    validateApiKey("story-of-the-day"),
    getStoryOfTheDay
)

router.get(
    "/story-of-the-day/storyVotesGet/:date",
    validateApiKey("story-of-the-day"),
    getStoryVotes
)

router.post(
    "/story-of-the-day/storyVotesPost",
    validateApiKey("story-of-the-day"),
    addStoryVote
)

export default router

