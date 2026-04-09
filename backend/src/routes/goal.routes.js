// backend/src/routes/goal.routes.js

import { Router } from "express";
import {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  breakGoalIntoTasks,
  getGoalProgress,
} from "../controllers/goal.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ─── IMPORTANT: Nested specific routes BEFORE dynamic /:id ────────────────────
// Same rule as task routes — specific paths must come first
// Otherwise "/:id/breakdown" would need /:id to be registered first
// which is fine here since nested routes don't conflict with /:id alone

// ─── Protected Collection Routes ────────────────────────────────────────────
router.get("/", protect, getAllGoals);
router.post("/", protect, createGoal);

// ─── AI Powered Route ─────────────────────────────────────────────────────────
// POST /:id/breakdown → triggers Gemini to break goal into tasks
// This is the most powerful endpoint in the entire backend ⚡
router.post("/:id/breakdown", protect, breakGoalIntoTasks);

// ─── Progress Route ───────────────────────────────────────────────────────────
// GET /:id/progress → lightweight progress summary for Dashboard
router.get("/:id/progress", protect, getGoalProgress);

// ─── Single Resource Routes ───────────────────────────────────────────────────
router.get("/:id", protect, getGoalById);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);

export default router;
