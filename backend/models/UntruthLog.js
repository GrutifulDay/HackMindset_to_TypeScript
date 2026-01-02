import mongoose from "mongoose";
import connectFrontendDB from "../db/connectFrontendDB.js";

const frontendConnection = connectFrontendDB()

const schema = new mongoose.Schema({
  date: String, 
  story: { abuseCount: { type: Number, default: 0 } },
  retro: { abuseCount: { type: Number, default: 0 } },
  digital: { abuseCount: { type: Number, default: 0 } }
})

export default frontendConnection.model("UntruthLimitStat", schema)
