import Digital from "../models/Digital.js"
import { getControllerDay } from "./dayController.js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// kompatibilni JSON nacitani
const demoDigital = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../demo-data/digital.json"), "utf8")
  );

// kontrola data vs prepisnani v demo mode
export function getDigital(req, res) {
    return getControllerDay(Digital, req, res, { demoData: demoDigital})
}