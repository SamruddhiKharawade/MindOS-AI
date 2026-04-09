// backend/src/controllers/task.controller.js
import * as taskService from "../services/task.service.js";

// Add this at the top of the file after imports:
const getUserId = (req) => {
  if (!req.user) {
    throw Object.assign(new Error("Not authenticated"), { statusCode: 401 });
  }
  return req.user._id;
};

// Then in each function use getUserId(req) instead of req.user._id:
export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, getUserId(req));
    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) { next(error); }
};

export const getAllTasks = async (req, res, next) => {
  try {
    const filters = {
      status:   req.query.status,
      priority: req.query.priority,
      goalId:   req.query.goalId,
    };
    const tasks = await taskService.getAllTasks(filters, getUserId(req));
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) { next(error); }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, getUserId(req));
    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) { next(error); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id, getUserId(req));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) { next(error); }
};

export const getTodaysTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getTodaysTasks(getUserId(req));
    res.status(200).json({
      success: true,
      count:   tasks.length,
      data:    tasks,
      date:    new Date().toDateString(),
    });
  } catch (error) { next(error); }
};