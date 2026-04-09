// backend/server.js

// Step 1: Load dotenv synchronously using the path trick
import "./src/config/env.js";  // MUST BE FIRST LINE

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join }  from "path";



// Now safe to import everything else
import mongoose from "mongoose";
import app      from "./src/app.js";

const PORT      = process.env.PORT      || 5001;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    // Verify keys loaded
if (!process.env.GROQ_API_KEY) {
  console.log("❌ GROQ_API_KEY not configured");
} else {
  console.log("🔑 Groq key loaded:", process.env.GROQ_API_KEY ? true : false);
}
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connect hogya!");

    app.listen(PORT, () => {
      console.log(`Wohooo server running on http://localhost:${PORT} !!!`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error.message);
    process.exit(1);
  }
};

startServer();