// frontend/src/pages/Notes.jsx
import api, { safeData } from "../services/api";
import VoiceButton from "../components/VoiceButton";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";


// ─── We call the notes endpoints directly via aiAPI.saveMemory
// ─── and fetch via a custom notes fetch (we'll add to api.js below)


// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, scale: 0.97 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { label: "All",         value: ""           },
  { label: "General",     value: "general"    },
  { label: "Reflection",  value: "reflection" },
  { label: "Reference",   value: "reference"  },
  { label: "AI Memory",   value: "ai-memory"  },
];

const TYPE_COLORS = {
  "general":    "text-sky-300/80     bg-sky-500/10     border-sky-400/20",
  "reflection": "text-violet-300/80  bg-violet-500/10  border-violet-400/20",
  "reference":  "text-amber-300/80   bg-amber-500/10   border-amber-400/20",
  "ai-memory":  "text-indigo-300/80  bg-indigo-500/10  border-indigo-400/20",
};

// ─── Notes Page ───────────────────────────────────────────────────────────────
export default function Notes() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [typeFilter,  setTypeFilter]  = useState("");
  const [showPinned,  setShowPinned]  = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editNote,    setEditNote]    = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error,       setError]       = useState("");

  // ── Fetch notes ────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
  try {
    setLoading(true);
    setError("");
    const params = {};
    if (typeFilter) params.type     = typeFilter;
    if (showPinned) params.isPinned = true;
    const res = await api.get("/notes", { params });
    setNotes(safeData(res));
  } catch (err) {
    const msg = err?.userMessage || err?.message || "Failed to load notes";
    setError(typeof msg === "string" ? msg : "Failed to load notes");
  } finally {
    setLoading(false);
  }
}, [typeFilter, showPinned]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Toggle pin ─────────────────────────────────────────────────────────────
  const togglePin = async (note) => {
    setNotes((prev) =>
      prev.map((n) =>
        n._id === note._id ? { ...n, isPinned: !n.isPinned } : n
      )
    );
    try {
      await api.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
    } catch {
      fetchNotes();
    }
  };

  // ── Toggle archive ─────────────────────────────────────────────────────────
  const toggleArchive = async (note) => {
    setNotes((prev) => prev.filter((n) => n._id !== note._id));
    try {
      await api.put(`/notes/${note._id}`, { isArchived: !note.isArchived });
    } catch {
      fetchNotes();
    }
  };

  // ── Delete note ────────────────────────────────────────────────────────────
  const deleteNote = async (noteId) => {
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
    try {
      await api.delete(`/notes/${noteId}`);
    } catch {
      fetchNotes();
    }
  };

  // ── After note saved ───────────────────────────────────────────────────────
  const handleNoteSaved = (savedNote, isEdit) => {
    if (isEdit) {
      setNotes((prev) =>
        prev.map((n) => (n._id === savedNote._id ? savedNote : n))
      );
    } else {
      setNotes((prev) => [savedNote, ...prev]);
    }
    setShowModal(false);
    setEditNote(null);
  };

  // ── Search filter (client-side) ────────────────────────────────────────────
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  // ── Separate pinned and regular ────────────────────────────────────────────
  const pinnedNotes  = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-full px-8 py-8"
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-medium tracking-widest
                        uppercase text-white/30 mb-1">
            Memory Layer
          </p>
          <h1 className="text-4xl font-light text-white/90 tracking-tight">
            Your{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-300
                             bg-clip-text text-transparent font-normal">
              notes
            </span>
          </h1>
          <p className="text-[12px] text-white/30 mt-1.5 max-w-xs leading-relaxed">
            Everything here feeds the AI's memory. Pinned notes are always read.
          </p>
        </div>

        <button
          onClick={() => { setEditNote(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 mt-2
                     rounded-xl bg-amber-500/15 border border-amber-400/25
                     text-amber-300 text-sm font-medium
                     hover:bg-amber-500/25 transition-colors duration-200"
        >
          <span className="text-lg leading-none">+</span>
          New Note
        </button>
      </div>

      {/* ── Search + Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-2.5
                        rounded-xl bg-white/[0.04] border border-white/[0.07]
                        focus-within:border-white/15 transition-colors duration-200">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            className="shrink-0">
            <circle cx="6" cy="6" r="4.5"
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <path d="M10 10L12.5 12.5"
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"
              strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search notes, tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white/70
                       placeholder:text-white/25 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-white/25 hover:text-white/50
                         transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Type filter */}
          <div className="flex items-center gap-1 p-1
                          rounded-xl bg-white/[0.04] border border-white/[0.07]">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${typeFilter === f.value
                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/25"
                    : "text-white/40 hover:text-white/60"}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Pinned toggle */}
          <button
            onClick={() => setShowPinned((v) => !v)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl
              border text-xs font-medium transition-all duration-200
              ${showPinned
                ? "bg-amber-500/15 border-amber-400/25 text-amber-300"
                : "bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/60"}
            `}
          >
            <span>📌</span>
            Pinned only
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            className="mb-4 px-4 py-3 rounded-xl bg-red-500/10
                       border border-red-400/20 text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notes Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <NotesSkeleton />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          hasSearch={!!searchQuery}
          onAdd={() => setShowModal(true)}
          onClear={() => setSearchQuery("")}
        />
      ) : (
        <div className="flex flex-col gap-6">

          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <div>
              <p className="text-[11px] font-medium tracking-wider
                            uppercase text-white/25 mb-3 flex items-center gap-2">
                <span>📌</span> Pinned · always in AI memory
              </p>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <AnimatePresence>
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onPin={() => togglePin(note)}
                      onArchive={() => toggleArchive(note)}
                      onDelete={() => deleteNote(note._id)}
                      onEdit={() => {
                        setEditNote(note);
                        setShowModal(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Regular notes section */}
          {regularNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <p className="text-[11px] font-medium tracking-wider
                              uppercase text-white/25 mb-3">
                  Recent notes
                </p>
              )}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <AnimatePresence>
                  {regularNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onPin={() => togglePin(note)}
                      onArchive={() => toggleArchive(note)}
                      onDelete={() => deleteNote(note._id)}
                      onEdit={() => {
                        setEditNote(note);
                        setShowModal(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ── Note Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <NoteModal
            note={editNote}
            onClose={() => { setShowModal(false); setEditNote(null); }}
            onSaved={handleNoteSaved}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({ note, onPin, onArchive, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false);

  const typeColor = TYPE_COLORS[note.type] ?? TYPE_COLORS["general"];

  return (
    <motion.div
      variants={cardVariants}
      layout
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="relative rounded-2xl bg-white/[0.04] border border-white/[0.07]
                 p-4 hover:bg-white/[0.07] transition-colors duration-200
                 flex flex-col gap-3 min-h-[140px] cursor-pointer group"
      onClick={onEdit}
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <div className="absolute top-3 right-3">
          <span className="text-[11px]">📌</span>
        </div>
      )}

      {/* Type badge */}
      <span className={`
        inline-flex w-fit text-[10px] font-medium tracking-wider
        uppercase px-2 py-0.5 rounded-full border
        ${typeColor}
      `}>
        {note.type === "ai-memory" ? "✦ AI" : note.type}
      </span>

      {/* Title */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white/80 leading-snug mb-1.5">
          {note.title}
        </h3>
        <p className="text-[12px] text-white/40 leading-relaxed line-clamp-3">
          {note.content}
        </p>
      </div>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag}
              className="text-[10px] text-white/30 bg-white/[0.05]
                         px-1.5 py-0.5 rounded-full border border-white/[0.06]">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-white/20">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/20">
          {new Date(note.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          })}
        </span>

        {/* Action buttons — appear on hover */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1   }}
              exit={{    opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pin */}
              <ActionBtn
                onClick={onPin}
                title={note.isPinned ? "Unpin" : "Pin"}
                active={note.isPinned}
              >
                📌
              </ActionBtn>

              {/* Archive */}
              <ActionBtn onClick={onArchive} title="Archive">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="1" y="1" width="9" height="3" rx="1"
                    stroke="currentColor" strokeWidth="1.1" />
                  <path d="M1.5 4V9.5H9.5V4"
                    stroke="currentColor" strokeWidth="1.1"
                    strokeLinecap="round" />
                  <path d="M3.5 6.5H7.5"
                    stroke="currentColor" strokeWidth="1.1"
                    strokeLinecap="round" />
                </svg>
              </ActionBtn>

              {/* Delete */}
              <ActionBtn onClick={onDelete} title="Delete" danger>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 2.5H9.5M4 2.5V1.5H7V2.5M3.5 2.5V9H7.5V2.5"
                    stroke="currentColor" strokeWidth="1.1"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ActionBtn>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ children, onClick, title, active, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-6 h-6 rounded-lg flex items-center justify-center
        transition-colors duration-200 text-[11px]
        ${danger
          ? "bg-red-500/10 border border-red-400/15 text-red-400/70 hover:bg-red-500/20"
          : active
          ? "bg-amber-500/15 border border-amber-400/20 text-amber-300/80"
          : "bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70"}
      `}
    >
      {children}
    </button>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ note, onClose, onSaved }) {
  const isEdit = !!note;

  const [form, setForm] = useState({
    title:     note?.title    || "",
    content:   note?.content  || "",
    type:      note?.type     || "general",
    tags:      note?.tags?.join(", ") || "",
    isPinned:  note?.isPinned || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) {
      setError("Note content is required");
      return;
    }

    // Parse comma-separated tags into array
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title:    form.title.trim() || "Untitled Note",
      content:  form.content.trim(),
      type:     form.type,
      tags,
      isPinned: form.isPinned,
    };

    try {
      setSubmitting(true);
      setError("");

      let res;
      if (isEdit) {
        res = await api.put(`/notes/${note._id}`, payload);
      } else {
        res = await aiAPI.saveMemory(payload);
      }

      onSaved(res.data.data, isEdit);
    } catch (err) {
      setError(err.userMessage || "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{    opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 8  }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed inset-0 flex items-center justify-center
                   z-50 pointer-events-none px-4"
      >
        <div className="w-full max-w-lg bg-[#1a1740]
                        border border-white/10 rounded-2xl
                        shadow-2xl pointer-events-auto overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-white/[0.07]">
            <h2 className="text-base font-medium text-white/85">
              {isEdit ? "Edit Note" : "New Note"}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center
                         justify-center text-white/40 hover:text-white/70
                         hover:bg-white/10 transition-colors duration-200"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{    opacity: 0         }}
                  className="text-xs text-red-300 bg-red-500/10
                             border border-red-400/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Title */}
            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Title
              </label>
              <input
                autoFocus
                type="text"
                placeholder="Give this note a title…"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none
                           focus:border-amber-400/40 focus:bg-white/[0.08]
                           transition-all duration-200"
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Content *
              </label>
              <textarea
                placeholder="Write anything — the AI will remember this…"
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={5}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none resize-none
                           focus:border-amber-400/40 focus:bg-white/[0.08]
                           transition-all duration-200 leading-relaxed"
              />
            </div>

            {/* Type + Pin row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium tracking-wider
                                  uppercase text-white/35 mb-1.5 block">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10
                             rounded-xl px-3 py-2.5 text-sm text-white/70
                             outline-none focus:border-amber-400/40
                             transition-all duration-200 cursor-pointer"
                >
                  <option value="general"    className="bg-[#1a1740]">General</option>
                  <option value="reflection" className="bg-[#1a1740]">Reflection</option>
                  <option value="reference"  className="bg-[#1a1740]">Reference</option>
                  <option value="ai-memory"  className="bg-[#1a1740]">AI Memory</option>
                </select>
              </div>

              {/* Pin toggle */}
              <div>
                <label className="text-[11px] font-medium tracking-wider
                                  uppercase text-white/35 mb-1.5 block">
                  Pin to AI Memory
                </label>
                <button
                  type="button"
                  onClick={() => handleChange("isPinned", !form.isPinned)}
                  className={`
                    w-full py-2.5 rounded-xl border text-sm
                    font-medium transition-all duration-200
                    flex items-center justify-center gap-2
                    ${form.isPinned
                      ? "bg-amber-500/15 border-amber-400/25 text-amber-300"
                      : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white/60"}
                  `}
                >
                  <span>📌</span>
                  {form.isPinned ? "Pinned" : "Pin it"}
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Tags
                <span className="normal-case text-white/20 ml-1 font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                placeholder="productivity, mindset, health…"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none
                           focus:border-amber-400/40 focus:bg-white/[0.08]
                           transition-all duration-200"
              />
            </div>

            {/* AI context hint */}
            {form.isPinned && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{    opacity: 0, height: 0    }}
                className="flex items-start gap-2.5 px-3 py-2.5
                           rounded-xl bg-amber-500/8 border border-amber-400/15"
              >
                <span className="text-amber-300/60 text-sm mt-0.5">📌</span>
                <p className="text-[11px] text-amber-300/60 leading-relaxed">
                  This note will be{" "}
                  <span className="text-amber-300/80 font-medium">
                    always included
                  </span>{" "}
                  in the AI's context. Use this for important personal
                  information you want the AI to always know.
                </p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10
                           text-sm text-white/40 hover:text-white/60
                           hover:bg-white/5 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.content.trim()}
                className="flex-1 py-2.5 rounded-xl
                           bg-gradient-to-r from-amber-500 to-orange-500
                           text-white text-sm font-medium
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:opacity-90 active:scale-[0.98]
                           transition-all duration-200"
              >
                {submitting
                  ? isEdit ? "Saving…" : "Creating…"
                  : isEdit ? "Save Note" : "Create Note"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function NotesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}
          className="rounded-2xl bg-white/[0.04] border border-white/[0.07]
                     p-4 min-h-[140px] flex flex-col gap-3">
          <div className="h-2.5 bg-white/8 rounded-full w-16 animate-pulse" />
          <div className="h-3.5 bg-white/8 rounded-full w-3/4 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-2.5 bg-white/5 rounded-full animate-pulse" />
            <div className="h-2.5 bg-white/5 rounded-full w-4/5 animate-pulse" />
            <div className="h-2.5 bg-white/5 rounded-full w-3/5 animate-pulse" />
          </div>
          <div className="h-2 bg-white/5 rounded-full w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasSearch, onAdd, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center
                    py-20 gap-3 text-center">
      <span className="text-4xl opacity-15">📝</span>
      <p className="text-sm text-white/35 font-medium">
        {hasSearch ? "No notes match your search" : "No notes yet"}
      </p>
      <p className="text-[11px] text-white/20">
        {hasSearch
          ? "Try a different search term"
          : "Write your first note and feed it to the AI"}
      </p>
      {hasSearch ? (
        <button
          onClick={onClear}
          className="mt-2 px-4 py-2 rounded-xl bg-white/5
                     border border-white/10 text-white/40 text-xs
                     hover:text-white/60 transition-colors duration-200"
        >
          Clear search
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="mt-2 px-4 py-2 rounded-xl bg-amber-500/15
                     border border-amber-400/25 text-amber-300 text-xs
                     font-medium hover:bg-amber-500/25
                     transition-colors duration-200"
        >
          + New Note
        </button>
      )}
    </div>
  );
}