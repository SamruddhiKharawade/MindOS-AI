// frontend/src/pages/Goals.jsx
import { goalAPI, safeData } from "../services/api";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";

// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, scale: 0.97 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "all", "health", "career", "learning",
  "finance", "relationships", "creativity", "personal", "other",
];

const STATUS_FILTERS = [
  { label: "Active",   value: "active"   },
  { label: "Paused",   value: "paused"   },
  { label: "Done",     value: "completed"},
  { label: "Archived", value: "archived" },
];

const CATEGORY_COLORS = {
  career:        "text-indigo-300/80  bg-indigo-500/10  border-indigo-400/20",
  health:        "text-emerald-300/80 bg-emerald-500/10 border-emerald-400/20",
  learning:      "text-sky-300/80     bg-sky-500/10     border-sky-400/20",
  finance:       "text-amber-300/80   bg-amber-500/10   border-amber-400/20",
  relationships: "text-pink-300/80    bg-pink-500/10    border-pink-400/20",
  creativity:    "text-violet-300/80  bg-violet-500/10  border-violet-400/20",
  personal:      "text-slate-300/80   bg-slate-500/10   border-slate-400/20",
  other:         "text-slate-300/80   bg-slate-500/10   border-slate-400/20",
};

// ─── Goals Page ───────────────────────────────────────────────────────────────
export default function Goals() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [goals,          setGoals]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal,      setShowModal]      = useState(false);
  const [expandedGoal,   setExpandedGoal]   = useState(null);
  const [error,          setError]          = useState("");

  // ── Fetch goals ────────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
  try {
    setLoading(true);
    setError("");
    const res = await goalAPI.getAll({
      status:   statusFilter                          || undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
    });
    setGoals(safeData(res));
  } catch (err) {
    const msg = err?.userMessage || err?.message || "Failed to load goals";
    setError(typeof msg === "string" ? msg : "Failed to load goals");
  } finally {
    setLoading(false);
  }
}, [statusFilter, categoryFilter]);
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // ── Delete goal ────────────────────────────────────────────────────────────
  const deleteGoal = async (goalId) => {
    if (!goalId) return;
    setGoals((prev) => prev.filter((g) => g?._id !== goalId));
    try {
      await goalAPI.delete(goalId);
    } catch {
      fetchGoals();
    }
  };

  // ── Update goal status ─────────────────────────────────────────────────────
  const updateGoalStatus = async (goalId, status) => {
    if (!goalId) return;
    setGoals((prev) =>
      prev.map((g) => (g?._id === goalId ? { ...g, status } : g))
    );
    try {
      await goalAPI.update(goalId, { status });
    } catch {
      fetchGoals();
    }
  };

  // ── After AI breakdown — refresh that goal ─────────────────────────────────
  const handleBreakdownComplete = (updatedGoal) => {
    if (!updatedGoal || !updatedGoal._id) return;
    setGoals((prev) =>
      prev.map((g) => (g?._id === updatedGoal._id ? updatedGoal : g))
    );
    setExpandedGoal(updatedGoal._id);
  };

  // ── After goal created ─────────────────────────────────────────────────────
  const handleGoalCreated = (newGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
    setShowModal(false);
  };

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
            Goal Tracker
          </p>
          <h1 className="text-4xl font-light text-white/90 tracking-tight">
            Your{" "}
            <span className="bg-gradient-to-r from-violet-300 to-pink-300
                             bg-clip-text text-transparent font-normal">
              goals
            </span>
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 mt-2
                     rounded-xl bg-violet-500/20 border border-violet-400/30
                     text-violet-300 text-sm font-medium
                     hover:bg-violet-500/30 transition-colors duration-200"
        >
          <span className="text-lg leading-none">+</span>
          New Goal
        </button>
      </div>

      {/* ── Status Filter Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 mb-5
                      rounded-xl bg-white/[0.04] border border-white/[0.07]
                      w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${statusFilter === f.value
                ? "bg-violet-500/25 text-violet-200 border border-violet-400/30"
                : "text-white/40 hover:text-white/60"}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Category Filter ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`
              px-3 py-1 rounded-full text-[11px] font-medium
              capitalize tracking-wide border
              transition-all duration-200
              ${categoryFilter === cat
                ? "bg-violet-500/20 border-violet-400/30 text-violet-200"
                : "bg-transparent border-white/10 text-white/35 hover:text-white/55"}
            `}
          >
            {cat}
          </button>
        ))}
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

      {/* ── Goal Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <GoalGridSkeleton />
      ) : goals.filter((g) => g?._id).length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {goals.filter((g) => g?._id).map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                isExpanded={expandedGoal === goal._id}
                onToggleExpand={() =>
                  setExpandedGoal((prev) =>
                    prev === goal._id ? null : goal._id
                  )
                }
                onDelete={() => deleteGoal(goal._id)}
                onStatusChange={(status) => updateGoalStatus(goal._id, status)}
                onBreakdownComplete={handleBreakdownComplete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Create Goal Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <CreateGoalModal
            onClose={() => setShowModal(false)}
            onCreated={handleGoalCreated}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  isExpanded,
  onToggleExpand,
  onDelete,
  onStatusChange,
  onBreakdownComplete,
}) {
  const [breaking, setBreaking] = useState(false);
  const [breakError, setBreakError] = useState("");

  const safeGoal = goal ?? {};
  const progress      = safeGoal.progress     ?? 0;
  const taskCount     = safeGoal.taskCount    ?? 0;
  const doneTasks     = safeGoal.completedTaskCount ?? 0;
  const categoryColor = CATEGORY_COLORS[safeGoal.category] ?? CATEGORY_COLORS.other;

  // ── Trigger AI breakdown ──────────────────────────────────────────────────
  const handleBreakdown = async (e) => {
    e.stopPropagation();
    try {
      setBreaking(true);
      setBreakError("");
      if (!safeGoal._id) {
        setBreakError("Goal id is missing");
        return;
      }
      const res = await goalAPI.breakdown(safeGoal._id);
      onBreakdownComplete(res?.data?.data);
    } catch (err) {
      setBreakError(err.userMessage || "AI breakdown failed");
    } finally {
      setBreaking(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      layout
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      className="rounded-2xl bg-white/[0.04] border border-white/[0.07]
                 overflow-hidden hover:bg-white/[0.06]
                 transition-colors duration-200"
    >
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <div
        className="px-5 pt-5 pb-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <span className={`
              inline-flex text-[10px] font-medium tracking-wider
              uppercase px-2 py-0.5 rounded-full border mb-2
              ${categoryColor}
            `}>
              {safeGoal.category}
            </span>

            {/* Title */}
            <h3 className="text-sm font-medium text-white/85
                           leading-snug">
              {safeGoal.title}
            </h3>

            {/* Description */}
            {safeGoal.description && (
              <p className="text-[12px] text-white/35 mt-1
                            leading-relaxed line-clamp-2">
                {safeGoal.description}
              </p>
            )}
          </div>

          {/* Expand chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/20 mt-1 shrink-0 text-xs"
          >
            ▾
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full
                       bg-gradient-to-r from-violet-400 to-pink-400"
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/30">
            {doneTasks} / {taskCount} tasks · {progress}%
          </span>

          {/* Deadline */}
          {safeGoal.deadline && (
            <span className="text-[11px] text-white/25">
              Due {new Date(safeGoal.deadline).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* ── AI Breakdown Button ────────────────────────────────────────── */}
      {!safeGoal.isAIProcessed && (
        <div className="px-5 pb-4">
          {breakError && (
            <p className="text-[11px] text-red-300/70 mb-2">{breakError}</p>
          )}
          <button
            onClick={handleBreakdown}
            disabled={breaking}
            className="w-full py-2 rounded-xl
                       bg-gradient-to-r from-violet-500/20 to-indigo-500/20
                       border border-violet-400/25
                       text-violet-300 text-xs font-medium
                       hover:from-violet-500/30 hover:to-indigo-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200
                       flex items-center justify-center gap-2"
          >
            {breaking ? (
              <>
                <div className="w-3 h-3 border-2 border-violet-400/40
                                border-t-violet-300 rounded-full animate-spin" />
                AI is thinking…
              </>
            ) : (
              <>
                <span>✦</span>
                Break into tasks with AI
              </>
            )}
          </button>
        </div>
      )}

      {/* AI processed badge */}
      {safeGoal.isAIProcessed && (
        <div className="px-5 pb-3">
          <span className="text-[11px] text-violet-300/50
                           flex items-center gap-1">
            ✦ AI tasks generated
          </span>
        </div>
      )}

      {/* ── Expanded: Task List ────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && safeGoal.tasks?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0    }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-white/[0.06] pt-4
                            flex flex-col gap-2">
              <p className="text-[10px] font-medium tracking-wider
                            uppercase text-white/25 mb-1">
                Tasks
              </p>
              {(safeGoal.tasks || []).filter((task) => task && task._id).map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  <div className={`
                    w-4 h-4 rounded-full border flex items-center
                    justify-center shrink-0
                    ${task.status === "done"
                      ? "border-emerald-400/50 bg-emerald-500/15"
                      : task.status === "in-progress"
                      ? "border-amber-400/50 bg-amber-500/15"
                      : "border-white/15"}
                  `}>
                    {task.status === "done" && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2"
                          stroke="#6ee7b7" strokeWidth="1.2"
                          strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {task.status === "in-progress" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                    )}
                  </div>
                  <span className={`
                    text-xs leading-snug
                    ${task.status === "done"
                      ? "line-through text-white/25"
                      : "text-white/60"}
                  `}>
                    {task.title}
                  </span>
                  {task.isAIGenerated && (
                    <span className="text-[10px] text-violet-300/40 ml-auto shrink-0">
                      ✦
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Footer: Actions ───────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-white/[0.05]
                      flex items-center gap-2">

        {/* Status selector */}
        <select
          value={goal.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-white/[0.04] border border-white/[0.08]
                     rounded-lg px-2 py-1.5 text-[11px] text-white/50
                     outline-none cursor-pointer
                     focus:border-violet-400/30 transition-colors"
        >
          <option value="active"    className="bg-[#1a1740]">Active</option>
          <option value="paused"    className="bg-[#1a1740]">Paused</option>
          <option value="completed" className="bg-[#1a1740]">Completed</option>
          <option value="archived"  className="bg-[#1a1740]">Archived</option>
        </select>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg bg-red-500/8 border border-red-400/15
                     flex items-center justify-center shrink-0
                     hover:bg-red-500/20 transition-colors duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3H10M4.5 3V2H7.5V3M4 3V10H8V3"
              stroke="#f87171" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

    </motion.div>
  );
}

// ─── Create Goal Modal ────────────────────────────────────────────────────────
function CreateGoalModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title:       "",
    description: "",
    category:    "personal",
    deadline:    "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Goal title is required");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const res = await goalAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        deadline:    form.deadline || undefined,
      });
      onCreated(res.data.data);
    } catch (err) {
      setError(err.userMessage || "Failed to create goal");
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
        <div className="w-full max-w-md bg-[#1a1740]
                        border border-white/10 rounded-2xl
                        shadow-2xl pointer-events-auto overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-white/[0.07]">
            <h2 className="text-base font-medium text-white/85">
              New Goal
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
                Title *
              </label>
              <input
                autoFocus
                type="text"
                placeholder="What do you want to achieve?"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none
                           focus:border-violet-400/40 focus:bg-white/[0.08]
                           transition-all duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Description
              </label>
              <textarea
                placeholder="Why is this goal important to you?"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={2}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none resize-none
                           focus:border-violet-400/40 focus:bg-white/[0.08]
                           transition-all duration-200"
              />
            </div>

            {/* Category + Deadline row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium tracking-wider
                                  uppercase text-white/35 mb-1.5 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10
                             rounded-xl px-3 py-2.5 text-sm text-white/70
                             outline-none focus:border-violet-400/40
                             transition-all duration-200 cursor-pointer capitalize"
                >
                  {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1a1740] capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium tracking-wider
                                  uppercase text-white/35 mb-1.5 block">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10
                             rounded-xl px-3 py-2.5 text-sm text-white/70
                             outline-none focus:border-violet-400/40
                             transition-all duration-200 cursor-pointer"
                />
              </div>
            </div>

            {/* AI hint */}
            <div className="flex items-start gap-2.5 px-3 py-2.5
                            rounded-xl bg-violet-500/8 border border-violet-400/15">
              <span className="text-violet-300/60 text-sm mt-0.5">✦</span>
              <p className="text-[11px] text-violet-300/60 leading-relaxed">
                After creating your goal, use the{" "}
                <span className="text-violet-300/80 font-medium">
                  AI breakdown
                </span>{" "}
                button to automatically generate tasks with Gemini.
              </p>
            </div>

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
                disabled={submitting || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl
                           bg-gradient-to-r from-violet-500 to-indigo-500
                           text-white text-sm font-medium
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:opacity-90 active:scale-[0.98]
                           transition-all duration-200"
              >
                {submitting ? "Creating…" : "Create Goal"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function GoalGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}
          className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5">
          <div className="h-2.5 bg-white/8 rounded-full w-16 animate-pulse mb-3" />
          <div className="h-4 bg-white/8 rounded-full w-3/4 animate-pulse mb-2" />
          <div className="h-3 bg-white/5 rounded-full w-full animate-pulse mb-4" />
          <div className="h-[3px] bg-white/5 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center
                    py-20 gap-3 text-center">
      <span className="text-4xl opacity-15">◎</span>
      <p className="text-sm text-white/35 font-medium">No goals found</p>
      <p className="text-[11px] text-white/20">
        Set your first goal and let AI break it down
      </p>
      <button
        onClick={onAdd}
        className="mt-2 px-4 py-2 rounded-xl bg-violet-500/15
                   border border-violet-400/25 text-violet-300 text-xs
                   font-medium hover:bg-violet-500/25
                   transition-colors duration-200"
      >
        + New Goal
      </button>
    </div>
  );
}