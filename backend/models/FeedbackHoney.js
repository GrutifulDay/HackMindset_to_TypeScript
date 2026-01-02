import mongoose from "mongoose"

const honeySessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: { type: String },
  referer: { type: String },
  notes: { type: String, default: "První vstup do honeypointu" }
})

export default mongoose.model("HoneySession", honeySessionSchema)
