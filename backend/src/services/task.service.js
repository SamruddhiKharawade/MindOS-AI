// backend/src/services/task.service.js

import Task from "../models/Task.js";
import Goal from "../models/Goal.js";

// ─── Helper ───────────────────────────────────────────────────────────────────
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ─── CREATE TASK ──────────────────────────────────────────────────────────────
export const createTask = async (taskData, userId) => {
  const { title, description, status, priority, dueDate, goal } = taskData;

  if (!title || title.trim() === "") {
    throw createError("Task title is required", 400);
  }

  const task = await Task.create({
    title:       title.trim(),
    description: description?.trim() || "",
    status:      status   || "todo",
    priority:    priority || "medium",
    dueDate:     dueDate  || null,
    goal:        goal     || null,
    user:        userId,              // ← scope to user
  });

  if (goal) {
    const parentGoal = await Goal.findOne({ _id: goal, user: userId });

    if (!parentGoal) {
      throw createError("Linked goal not found", 404);
    }

    parentGoal.tasks.push(task._id);
    await parentGoal.save();
  }

  return task;
};

// ─── GET ALL TASKS ────────────────────────────────────────────────────────────
export const getAllTasks = async (filters = {}, userId) => {
  const { status, priority, goalId } = filters;

  // Always filter by userId — users only see their own tasks
  const query = { user: userId };

  if (status)   query.status   = status;
  if (priority) query.priority = priority;
  if (goalId)   query.goal     = goalId;

  const tasks = await Task.find(query)
    .populate("goal", "title status category")
    .sort({ createdAt: -1 })
    .lean();

  return tasks;
};

// ─── GET SINGLE TASK ──────────────────────────────────────────────────────────
export const getTaskById = async (taskId, userId) => {
  // Find by both _id AND user — prevents users accessing each other's tasks
  const task = await Task.findOne({ _id: taskId, user: userId })
    .populate("goal", "title status category")
    .lean();

  if (!task) {
    throw createError("Task not found", 404);
  }

  return task;
};

// ─── UPDATE TASK ──────────────────────────────────────────────────────────────
export const updateTask = async (taskId, updates, userId) => {
  const allowedFields = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "goal",
  ];

  const sanitizedUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw createError("No valid fields provided for update", 400);
  }

  // findOneAndUpdate with user check — ensures ownership
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: sanitizedUpdates },
    { new: true, runValidators: true }
  ).populate("goal", "title status category");

  if (!updatedTask) {
    throw createError("Task not found", 404);
  }

  return updatedTask;
};

// ─── DELETE TASK ──────────────────────────────────────────────────────────────
export const deleteTask = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw createError("Task not found", 404);
  }

  // Remove from parent goal if linked
  if (task.goal) {
    await Goal.findOneAndUpdate(
      { _id: task.goal, user: userId },
      { $pull: { tasks: task._id } }
    );
  }

  await task.deleteOne();

  return { message: "Task deleted successfully" };
};

// ─── GET TODAY'S TASKS ────────────────────────────────────────────────────────
export const getTodaysTasks = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    user:    userId,                  // ← scope to user
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status:  { $ne: "done" },
  })
    .populate("goal", "title category")
    .sort({ priority: -1 })
    .lean();

  return tasks;
};