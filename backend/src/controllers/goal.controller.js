// backend/src/controllers/goal.controller.js
import * as goalService from "../services/goal.service.js";
import * as aiService   from "../services/ai.service.js";

const getUserId = (req) => {
  if (!req.user) {
    throw Object.assign(new Error("Not authenticated"), { statusCode: 401 });
  }
  return req.user._id;
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.body, getUserId(req));
    res.status(201).json({ success: true, message: "Goal created", data: goal });
  } catch (error) { next(error); }
};

export const getAllGoals = async (req, res, next) => {
  try {
    const filters = { status: req.query.status, category: req.query.category };
    const goals   = await goalService.getAllGoals(filters, getUserId(req));
    res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (error) { next(error); }
};

export const getGoalById = async (req, res, next) => {
  try {
    const goal = await goalService.getGoalById(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: goal });
  } catch (error) { next(error); }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.body, getUserId(req));
    res.status(200).json({ success: true, message: "Goal updated", data: goal });
  } catch (error) { next(error); }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const result = await goalService.deleteGoal(req.params.id, getUserId(req));
    res.status(200).json({
      success:      true,
      message:      result.message,
      tasksDeleted: result.tasksDeleted,
    });
  } catch (error) { next(error); }
};

export const breakGoalIntoTasks = async (req, res, next) => {
  try {
    const userId       = getUserId(req);
    const existingGoal = await goalService.getGoalById(req.params.id, userId);

    if (existingGoal.isAIProcessed) {
      return res.status(200).json({
        success:          true,
        message:          "Already processed by AI.",
        alreadyProcessed: true,
        data:             existingGoal,
      });
    }

    const updatedGoal = await aiService.breakGoalIntoTasks(req.params.id, userId);
    res.status(200).json({
      success: true,
      message: `AI generated ${updatedGoal.taskCount} tasks`,
      data:    updatedGoal,
    });
  } catch (error) { next(error); }
};

export const getGoalProgress = async (req, res, next) => {
  try {
    const goal = await goalService.getGoalById(req.params.id, getUserId(req));
    res.status(200).json({
      success: true,
      data: {
        goalId:             goal._id,
        title:              goal.title,
        status:             goal.status,
        progress:           goal.progress,
        taskCount:          goal.taskCount,
        completedTaskCount: goal.completedTaskCount,
        deadline:           goal.deadline,
      },
    });
  } catch (error) { next(error); }
};