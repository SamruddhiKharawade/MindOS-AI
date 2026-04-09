/*Defines the goal schema — title, description, status, deadline
Stores an array of task references — a goal contains many tasks
Tracks AI breakdown status — did the AI already generate tasks for this goal?
Adds a progress virtual field — auto-calculates % complete without storing it*/

// backend/src/models/Goal.js

import mongoose from "mongoose";

// ─── Goal Schema ──────────────────────────────────────────────────────────────
const goalSchema = new mongoose.Schema(
  {
    // Core Fields
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Status of the goal
    // "active"    → currently being pursued
    // "completed" → all tasks done, goal achieved
    // "paused"    → temporarily on hold
    // "archived"  → no longer relevant
    status: {
      type: String,
      enum: {
        values: ["active", "completed", "paused", "archived"],
        message: "Status must be active, completed, paused, or archived",
      },
      default: "active",
    },

    // Category helps AI give better contextual suggestions
    category: {
      type: String,
      enum: {
        values: [
          "health",
          "career",
          "learning",
          "finance",
          "relationships",
          "creativity",
          "personal",
          "other",
        ],
        message: "Invalid category",
      },
      default: "personal",
    },

    // Optional target deadline for this goal
    deadline: {
      type: Date,
      default: null,
    },

    // Array of Task IDs that belong to this goal
    // One goal → many tasks
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task", // refers to the Task model
      },
    ],

    // Tracks whether AI has already broken this goal into tasks
    // Prevents duplicate AI breakdowns
    isAIProcessed: {
      type: Boolean,
      default: false,
    },

    // The raw AI response stored for reference
    // Useful for debugging and displaying AI suggestions
    aiSuggestions: {
      type: String,
      default: "",
    },
    user: {
  type:     mongoose.Schema.Types.ObjectId,
  ref:      "User",
  required: true,
},
  },

  // ─── Schema Options ──────────────────────────────────────────────────────────
  {
    timestamps: true,

    // Enable virtual fields to be included
    // when converting document to JSON or Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: taskCount ───────────────────────────────────────────────────────
// A virtual field is computed on-the-fly, never stored in DB
// Returns the total number of tasks linked to this goal
goalSchema.virtual("taskCount").get(function () {
  return this.tasks?.length ?? 0;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Speed up frequent queries
goalSchema.index({ status: 1 });
goalSchema.index({ category: 1 });
goalSchema.index({ deadline: 1 });

// ─── Export Model ─────────────────────────────────────────────────────────────
const Goal = mongoose.model("Goal", goalSchema);

export default Goal;