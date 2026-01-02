import express from "express"
import { validateApiKey } from "../middlewares/validateApiKey.js"
import { getProfile } from "../controllers/profileController.js"
import { debug } from "../utils/logger.js";

const router = express.Router()

debug("{profileRoutes.js} pripojeno");

router.get(
    "/profile",
    validateApiKey("profile"),
    getProfile
)

export default router
