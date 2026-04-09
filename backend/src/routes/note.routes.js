// backend/src/routes/note.routes.js
import { Router } from "express";
import Note       from "../models/Note.js";

const router = Router();
const err = (msg, code = 500) => { const e = new Error(msg); e.statusCode = code; return e; };

router.get("/", async (req, res, next) => {
  try {
    const query = { isArchived: false };
    if (req.query.type)     query.type     = req.query.type;
    if (req.query.isPinned) query.isPinned = req.query.isPinned === "true";
    const notes = await Note.find(query).sort({ isPinned: -1, createdAt: -1 }).lean();
    res.json({ success: true, count: notes.length, data: notes });
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, content, type, tags, isPinned } = req.body;
    if (!content?.trim()) throw err("Content is required", 400);
    const note = await Note.create({ title: title || "Untitled Note", content, type, tags, isPinned });
    res.status(201).json({ success: true, data: note });
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowed = ["title", "content", "type", "tags", "isPinned", "isArchived"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const note = await Note.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!note) throw err("Note not found", 404);
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) throw err("Note not found", 404);
    await note.deleteOne();
    res.json({ success: true, message: "Note deleted" });
  } catch (e) { next(e); }
});

export default router;