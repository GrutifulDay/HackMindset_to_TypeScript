import mongoose from "mongoose"
import { MONGO_URI } from "../config.js"
import { info, error } from "../utils/logger.js";

// pripojeni DB 
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5s snaha pripojit se, pak hodi chybu, rychlejsi
    })

    const dbName = mongoose.connection.name
    const host = mongoose.connection.host

    info(`✅ MongoDB connected to ${host}/${dbName}`)
    } catch (err) {
      error("❌ MongoDB error:", err.message)
    process.exit(1)
  }
}

export default connectDB
