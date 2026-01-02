import express from "express"
import { getToken } from "../controllers/tokenController.js"
import { validateToken } from "../middlewares/validateToken.js"
import { EXTENSION_SIGNATURE } from "../config.js"

const router = express.Router()

router.get(
  "/get-token",
  validateToken(EXTENSION_SIGNATURE, "Pokus o získání tokenu"),
  getToken
)

export default router
