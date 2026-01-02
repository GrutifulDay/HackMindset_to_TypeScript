import Story from "../models/Story.js"
import { getControllerDay } from "./dayController.js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoStory = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../demo-data/story.json"), "utf8")
  );

export function getStoryOfTheDay(req, res) {
    return getControllerDay(Story, req, res, {demoData: demoStory })
}

