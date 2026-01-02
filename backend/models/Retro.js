import mongoose from "mongoose";
import connectFrontendDB from "../db/connectFrontendDB.js";

const frontendConnection = connectFrontendDB()

const retroSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    
    eventYear: String,
    title: {
        cz: String,
        en: String
    },
    nostalgiggle: {
        cz: String,
        en: String
    },
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 },
    
    untruthVotes: {
        type: Map,
        of: Number,
        default: {}
      }
})

export default frontendConnection.model("retro", retroSchema)

