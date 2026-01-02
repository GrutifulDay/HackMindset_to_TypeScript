import Retro from "../models/Retro.js"
import { getControllerDay } from "./dayController.js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoRetro = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../demo-data/retro.json"), "utf8")
  );

export function getRetroMachine(req, res) {
    return getControllerDay(Retro, req, res, { demoData: demoRetro })
}


