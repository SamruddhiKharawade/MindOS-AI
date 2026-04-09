// backend/src/routes/task.routes.js

import { Router } from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTodaysTasks,
} from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ─── IMPORTANT: Specific routes BEFORE dynamic routes ─────────────────────────
// /today must come before /:id
// Otherwise Express reads "today" as a dynamic :id value
// and calls getTaskById("today") which fails

// Protected Planner Route
router.get("/today", protect, getTodaysTasks);

// Protected Collection Routes
router.get("/", protect, getAllTasks);
router.post("/", protect, createTask);

// Protected Single Resource Routes
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

export default router;