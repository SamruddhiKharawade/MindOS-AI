import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

console.log("Key:", process.env.GEMINI_API_KEY?.slice(0, 12) + "...");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test 1: gemini-1.5-flash
try {
  const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent("Say hello in one word");
  console.log("✅ gemini-1.5-flash works:", result.response.text());
} catch (e) {
  console.error("❌ gemini-1.5-flash failed:", e.message);
}

// Test 2: gemini-2.0-flash
try {
  const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent("Say hello in one word");
  console.log("✅ gemini-2.0-flash works:", result.response.text());
} catch (e) {
  console.error("❌ gemini-2.0-flash failed:", e.message);
}

// Test 3: gemini-pro
try {
  const model  = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent("Say hello in one word");
  console.log("✅ gemini-pro works:", result.response.text());
} catch (e) {
  console.error("❌ gemini-pro failed:", e.message);
}