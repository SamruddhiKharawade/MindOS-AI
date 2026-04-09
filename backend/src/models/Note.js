/*Stores user notes — free-form text, thoughts, ideas, references
Tags notes by type — so AI knows what kind of memory it's reading
Controls which notes are fed to AI — via the isPinned and isArchived flags*/

// backend/src/models/Note.js

import mongoose from "mongoose";

// ─── Note Schema ──────────────────────────────────────────────────────────────
const noteSchema = new mongoose.Schema(
  {
    // The main content of the note
    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
      maxlength: [5000, "Note cannot exceed 5000 characters"],
    },

    // Short title for display in the UI
    title: {
      type: String,
      trim: true,
      default: "Untitled Note",
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Type of note — helps AI understand context
    // "general"    → everyday thoughts or ideas
    // "reflection" → personal insights, journal-style entries
    // "reference"  → facts, links, resources to remember
    // "ai-memory"  → notes the AI itself generates and saves
    type: {
      type: String,
      enum: {
        values: ["general", "reflection", "reference", "ai-memory"],
        message: "Type must be general, reflection, reference, or ai-memory",
      },
      default: "general",
    },

    // Tags for grouping and filtering notes
    // e.g. ["productivity", "health", "mindset"]
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          // Max 10 tags per note, each tag max 30 chars
          return (
            arr.length <= 10 && arr.every((tag) => tag.length <= 30)
          );
        },
        message: "Max 10 tags allowed, each under 30 characters",
      },
    },

    // Pinned notes are ALWAYS included in AI context
    // Use this for critical personal info the AI must always know
    // e.g. "I am a software developer based in Mumbai"
    isPinned: {
      type: Boolean,
      default: false,
    },

    // Archived notes are excluded from AI context
    // Keeps old notes without polluting AI memory
    isArchived: {
      type: Boolean,
      default: false,
    },

    // Optional link to a related goal
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    user: {
  type:     mongoose.Schema.Types.ObjectId,
  ref:      "User",
  required: true,
}
  },

  // ─── Schema Options ──────────────────────────────────────────────────────────
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// isPinned + isArchived are queried together constantly by ai.service.js
noteSchema.index({ isPinned: 1, isArchived: 1 });
noteSchema.index({ type: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ createdAt: -1 }); // Latest notes first

// ─── Export Model ─────────────────────────────────────────────────────────────
const Note = mongoose.model("Note", noteSchema);

export default Note;