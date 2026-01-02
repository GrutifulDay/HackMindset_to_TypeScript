import mongoose from "mongoose";

const blacklistedIPSchema = new mongoose.Schema({
  ipHash: {
    type: String,
    required: true,
    index: true, // vyhledávací pole
  },
  userAgent: {
    type: String,
    default: "Neznámý",
  },
  browser: {
    type: String,
    default: "Neznámý",
  },
  os: {
    type: String,
    default: "Neznámý",
  },
  deviceType: {
    type: String,
    default: "Neznámý",
  },
  reason: {
    type: String,
    default: "Automatické blokování",
  },
  city: {
    type: String,
    default: "Neznámá",
  }, 
  method: {
    type: String,
    default: "Neznámá",
  },
  path: {
    type: String,
    default: "Neznámá",
  },
  headers: {
    type: Object, // uloží se JSON redaktnutých hlaviček
    default: {},
  },
  attempts: {
    type: Number,
    default: 1,
  },
  date: {
    type: Date,
    default: Date.now,
    expires: 86400, // automaticky smaze po 24 h
  }
}, { timestamps: true });

const BlacklistedIP = mongoose.model("BlacklistedIP", blacklistedIPSchema);
export default BlacklistedIP;
