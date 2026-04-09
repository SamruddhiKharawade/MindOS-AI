// backend/src/controllers/ai.controller.js

import * as aiService from "../services/ai.service.js";
import Task           from "../models/Task.js";
import Goal           from "../models/Goal.js";
import Note           from "../models/Note.js";

const getUserId = (req) => {
  if (!req.user) {
    throw Object.assign(new Error("Not authenticated"), { statusCode: 401 });
  }
  return req.user._id;
};
// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const result = await aiService.chat(
      message.trim(),
      Array.isArray(history) ? history : [],
      req.user._id,
      req.user.username,
    );

    res.status(200).json({
      success: true,
      data: {
        reply:       result.reply,
        contextUsed: result.contextUsed,
        timestamp:   new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SAVE MEMORY ──────────────────────────────────────────────────────────────
export const saveMemory = async (req, res, next) => {
  try {
    const { title, content, type, tags, isPinned } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const note = await aiService.saveMemory(
      { title, content, type, tags, isPinned },
      req.user._id,
    );

    res.status(201).json({
      success: true,
      message: "Memory saved",
      data:    note,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CONTEXT SNAPSHOT ─────────────────────────────────────────────────────────
export const getContextSnapshot = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [pendingTasks, activeGoals, pinnedNotes, recentNotes] =
      await Promise.all([
        Task.find({ user: userId, status: { $ne: "done" } })
          .select("title status priority dueDate")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Goal.find({ user: userId, status: "active" })
          .select("title category deadline")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Note.find({ user: userId, isPinned: true, isArchived: false })
          .select("title content type tags")
          .lean(),
        Note.find({ user: userId, isPinned: false, isArchived: false })
          .select("title content type tags createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    const safe = (arr) => (arr || []).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          pendingTasksCount: pendingTasks.length,
          activeGoalsCount:  activeGoals.length,
          pinnedNotesCount:  pinnedNotes.length,
          recentNotesCount:  recentNotes.length,
        },
        pendingTasks: safe(pendingTasks),
        activeGoals:  safe(activeGoals),
        pinnedNotes:  safe(pinnedNotes),
        recentNotes:  safe(recentNotes),
      },
    });
  } catch (error) {
    console.error("Context snapshot error:", error.message);
    res.status(200).json({
      success: true,
      data: {
        summary: {
          pendingTasksCount: 0,
          activeGoalsCount:  0,
          pinnedNotesCount:  0,
          recentNotesCount:  0,
        },
        pendingTasks: [],
        activeGoals:  [],
        pinnedNotes:  [],
        recentNotes:  [],
      },
    });
  }
};

// ─── QUICK SUGGESTION ─────────────────────────────────────────────────────────
export const getQuickSuggestion = async (req, res, next) => {
  try {
    const prompt =
      "Based on my current tasks, goals, and notes, " +
      "give me ONE specific, actionable suggestion for what " +
      "I should focus on right now. Keep it under 3 sentences. " +
      "Be direct and specific.";

    const result = await aiService.chat(
      prompt,
      [],
      req.user._id,
      req.user.username,
    );

    res.status(200).json({
      success: true,
      data: {
        suggestion:  result.reply,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Suggestion error:", error.message);
    res.status(200).json({
      success: true,
      data: {
        suggestion:  "Start your day by reviewing your highest priority task.",
        generatedAt: new Date().toISOString(),
      },
    });
  }
};