import mongoose from "mongoose";

const SecurityLogSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 },
  src:       { type: String, enum: ["openresty","express"], required: true },
  kind:      { type: String, default: "info" },
  ip:        { type: String, index: true },
  method:    String,
  host:      String,
  path:      String,
  status:    Number,
  ua:        String,
  ref:       String,
  rule:      String,
  note:      String,
  raw:       mongoose.Schema.Types.Mixed,
}, { versionKey: false });

export default mongoose.model("SecurityLog", SecurityLogSchema, "securitylogs");

