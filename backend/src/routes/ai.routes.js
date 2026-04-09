// backend/src/routes/ai.routes.js

import { Router } from "express";
import {
  chat,
  saveMemory,
  getContextSnapshot,
  getQuickSuggestion,
} from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ─── Chat Route ───────────────────────────────────────────────────────────────
// The main chat endpoint — heart of the MindOS AI system
// Body: { message: String, history: Array }
router.post("/chat", protect, chat);

// ─── Memory Route ─────────────────────────────────────────────────────────────
// Save important info as a note for AI context
// Body: { title, content, type, tags, isPinned }
router.post("/memory", protect, saveMemory);

// ─── Context Snapshot Route ───────────────────────────────────────────────────
// Returns everything the AI currently knows about the user
// Used by the frontend transparency panel
router.get("/context", protect, getContextSnapshot);

// ─── Quick Suggestion Route ───────────────────────────────────────────────────
// Returns one proactive AI suggestion for the Dashboard
// No body needed — AI reads context automatically
router.get("/suggest", protect, getQuickSuggestion);

export default router;