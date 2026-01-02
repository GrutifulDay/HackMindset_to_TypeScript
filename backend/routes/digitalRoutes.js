import express from "express"
import { validateApiKey } from "../middlewares/validateApiKey.js"
// import stripUntruthVotes from "../middlewares/stripUntruthVotes.js"
import { getDigital } from "../controllers/digitalController.js"
import { debug} from "../utils/logger.js";


const router = express.Router()

debug("{digitalRoutes.js} pripojeno");

router.get(
    "/digitalSignpost",
    validateApiKey("digitalSignpost"),
    getDigital
  )

export default router


