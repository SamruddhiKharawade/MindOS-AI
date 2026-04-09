// backend/src/services/goal.service.js

import Goal from "../models/Goal.js";
import Task from "../models/Task.js";

// ─── Helper ───────────────────────────────────────────────────────────────────
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ─── CREATE GOAL ──────────────────────────────────────────────────────────────
export const createGoal = async (goalData, userId) => {
  const { title, description, category, deadline } = goalData;

  if (!title || title.trim() === "") {
    throw createError("Goal title is required", 400);
  }

  const goal = await Goal.create({
    title:       title.trim(),
    description: description?.trim() || "",
    category:    category || "personal",
    deadline:    deadline || null,
    status:      "active",
    tasks:       [],
    isAIProcessed: false,
    user:        userId,              // ← scope to user
  });

  return goal;
};

// ─── GET ALL GOALS ────────────────────────────────────────────────────────────
export const getAllGoals = async (filters = {}, userId) => {
  const { status, category } = filters;

  // Always filter by userId
  const query = { user: userId };
  if (status)   query.status   = status;
  if (category) query.category = category;

  const goals = await Goal.find(query)
    .populate({
      path:    "tasks",
      select:  "title status priority dueDate isAIGenerated",
      options: { sort: { createdAt: -1 } },
    })
    .sort({ createdAt: -1 })
    .lean();

  const goalsWithProgress = goals.map((goal) => ({
    ...goal,
    taskCount:          goal.tasks.length,
    completedTaskCount: goal.tasks.filter((t) => t.status === "done").length,
    progress:           calculateProgress(goal.tasks),
  }));

  return goalsWithProgress;
};

// ─── GET SINGLE GOAL ──────────────────────────────────────────────────────────
export const getGoalById = async (goalId, userId) => {
  // Always include user in query — ownership check
  const goal = await Goal.findOne({ _id: goalId, user: userId })
    .populate({
      path:   "tasks",
      select: "title status priority dueDate isAIGenerated description",
    })
    .lean();

  if (!goal) {
    throw createError("Goal not found", 404);
  }

  return {
    ...goal,
    taskCount:          goal.tasks.length,
    completedTaskCount: goal.tasks.filter((t) => t.status === "done").length,
    progress:           calculateProgress(goal.tasks),
  };
};

// ─── UPDATE GOAL ──────────────────────────────────────────────────────────────
export const updateGoal = async (goalId, updates, userId) => {
  const allowedFields = [
    "title",
    "description",
    "status",
    "category",
    "deadline",
    "aiSuggestions",
    "isAIProcessed",
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

  const updatedGoal = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },   // ← ownership check
    { $set: sanitizedUpdates },
    { new: true, runValidators: true }
  ).populate({
    path:   "tasks",
    select: "title status priority dueDate",
  });

  if (!updatedGoal) {
    throw createError("Goal not found", 404);
  }

  return updatedGoal;
};

// ─── DELETE GOAL ──────────────────────────────────────────────────────────────
export const deleteGoal = async (goalId, userId) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    throw createError("Goal not found", 404);
  }

  // Cascade delete — only delete tasks belonging to this user + goal
  const deletedTasks = await Task.deleteMany({
    goal: goalId,
    user: userId,
  });

  await goal.deleteOne();

  return {
    message:      "Goal and all linked tasks deleted successfully",
    tasksDeleted: deletedTasks.deletedCount,
  };
};

// ─── SAVE AI TASKS TO GOAL ────────────────────────────────────────────────────
export const saveAITasksToGoal = async (
  goalId,
  taskTitles,
  aiSuggestions,
  userId
) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    throw createError("Goal not found", 404);
  }

  if (!Array.isArray(taskTitles) || taskTitles.length === 0) {
    throw createError("No tasks provided to save", 400);
  }

  // Create all AI tasks in one batch — all scoped to the user
  const taskDocs = taskTitles.map((title) => ({
    title:        title.trim(),
    goal:         goalId,
    user:         userId,             // ← scope to user
    isAIGenerated:true,
    status:       "todo",
    priority:     "medium",
  }));

  const createdTasks = await Task.insertMany(taskDocs);
  const taskIds      = createdTasks.map((t) => t._id);

  await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    {
      $push: { tasks: { $each: taskIds } },
      $set:  {
        isAIProcessed: true,
        aiSuggestions: aiSuggestions || "",
      },
    }
  );

  return await getGoalById(goalId, userId);
};

// ─── PRIVATE HELPER ───────────────────────────────────────────────────────────
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
};