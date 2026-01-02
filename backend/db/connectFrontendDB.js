import mongoose from "mongoose"
import { MONGO_URI_FRONTEND } from "../config.js"
import { info, error, debug } from "../utils/logger.js";

let frontendConnection

export default function connectFrontendDB() {
  try {
    frontendConnection = mongoose.createConnection(MONGO_URI_FRONTEND, {
      dbName: "frontendData"  
    })

    frontendConnection.on("connected", () => {
      info("✅ Připojeno k MongoDB")
    })

    frontendConnection.on("error", (err) => {
      if (
        process.env.DEMO_MODE === "true" &&
        err.message?.includes("Invalid scheme")
      ) {
        debug("🗂️ DEMO_MODE → frontend Mongo není připojena (očekávané)");
        return;
      }

      error("❌ Chyba v připojení k MongoDB:", err.message);
    });

    return frontendConnection;

  } catch (err) {
    error("❌ Nepodařilo se připojit k MongoDB:", err.message);
  }
}
