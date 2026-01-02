import express from "express";
import { validateApiKey } from "../middlewares/validateApiKey.js";
import { postUntruthLimit } from "../controllers/untruthLimitController.js";

const router = express.Router()

router.post(
    "/untruth-limit-log",
    validateApiKey("untruth-limit-log"),
    postUntruthLimit
)

export default router