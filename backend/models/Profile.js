import mongoose from "mongoose";
import connectFrontendDB from "../db/connectFrontendDB.js";

const frontendConnection = connectFrontendDB();

const profileSchema = new mongoose.Schema ({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
  
    space_learning: String, 
    nature_travel_wildlife: String,
    science_tech_ai: String, 
})

export default frontendConnection.model("profile", profileSchema)