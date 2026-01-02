import express from "express"
import { validateApiKey } from "../middlewares/validateApiKey.js"
import { fetchNasaImage } from "../controllers/nasaController.js"
import { debug } from "../utils/logger.js";

const router = express.Router()

debug("{nasaRoutes.js} pripojeno");

router.get(
    "/nasa",
    validateApiKey("nasa"),
    fetchNasaImage
)

export default router

