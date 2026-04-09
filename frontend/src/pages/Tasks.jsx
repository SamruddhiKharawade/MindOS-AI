// frontend/src/pages/Tasks.jsx
import VoiceButton from "../components/VoiceButton";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import { taskAPI, goalAPI, safeData }       from "../services/api";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, x: -12 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const STATUS_FILTERS = [
  { label: "All",         value: ""            },
  { label: "To Do",       value: "todo"        },
  { label: "In Progress", value: "in-progress" },
  { label: "Done",        value: "done"        },
];

const PRIORITY_FILTERS = [
  { label: "All",    value: ""       },
  { label: "High",   value: "high"   },
  { label: "Medium", value: "medium" },
  { label: "Low",    value: "low"    },
];

export default function Tasks() {
  const [tasks,          setTasks]          = useState([]);
  const [goals,          setGoals]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showModal,      setShowModal]      = useState(false);
  const [error,          setError]          = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await taskAPI.getAll({
        status:   statusFilter   || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(safeData(res));
    } catch (err) {
      const msg = err?.userMessage || err?.message || "Failed to load tasks";
      setError(typeof msg === "string" ? msg : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalAPI.getAll({ status: "active" });
      setGoals(safeData(res));
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const toggleStatus = async (task) => {
    if (!task?._id) return;
    const next = {
      "todo":        "in-progress",
      "in-progress": "done",
      "done":        "todo",
    }[task.status];
    setTasks((prev) =>
      prev.map((t) => t?._id === task._id ? { ...t, status: next } : t)
    );
    try {
      await taskAPI.update(task._id, { status: next });
    } catch {
      setTasks((prev) =>
        prev.map((t) => t?._id === task._id ? { ...t, status: task.status } : t)
      );
    }
  };

  const deleteTask = async (taskId) => {
    if (!taskId) return;
    setTasks((prev) => prev.filter((t) => t?._id !== taskId));
    try {
      await taskAPI.delete(taskId);
    } catch {
      fetchTasks();
    }
  };

  const handleTaskCreated = (newTask) => {
    if (!newTask?._id) return;
    setTasks((prev) => [newTask, ...prev]);
    setShowModal(false);
  };

  const counts = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t?.status === "todo").length,
    inProgress: tasks.filter((t) => t?.status === "in-progress").length,
    done:       tasks.filter((t) => t?.status === "done").length,
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-medium tracking-widest
                        uppercase text-white/30 mb-1">
            Task Manager
          </p>
          <h1 className="text-4xl font-light text-white/90 tracking-tight">
            Your{" "}
            <span className="bg-gradient-to-r from-sky-300 to-indigo-300
                             bg-clip-text text-transparent font-normal">
              tasks
            </span>
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 mt-2
                     rounded-xl bg-indigo-500/20 border border-indigo-400/30
                     text-indigo-300 text-sm font-medium
                     hover:bg-indigo-500/30 transition-colors duration-200"
        >
          <span className="text-lg leading-none">+</span>
          New Task
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",       value: counts.total,      color: "text-white/70"       },
          { label: "To Do",       value: counts.todo,       color: "text-sky-300/80"     },
          { label: "In Progress", value: counts.inProgress, color: "text-amber-300/80"   },
          { label: "Done",        value: counts.done,       color: "text-emerald-300/80" },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="rounded-xl bg-white/[0.04] border border-white/[0.07]
                       px-4 py-3 text-center">
            <p className={`text-2xl font-light ${color}`}>{value}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1
                        rounded-xl bg-white/[0.04] border border-white/[0.07]">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200
                ${statusFilter === f.value
                  ? "bg-indigo-500/25 text-indigo-200 border border-indigo-400/30"
                  : "text-white/40 hover:text-white/60"}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 p-1
                        rounded-xl bg-white/[0.04] border border-white/[0.07]">
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPriorityFilter(f.value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200
                ${priorityFilter === f.value
                  ? "bg-indigo-500/25 text-indigo-200 border border-indigo-400/30"
                  : "text-white/40 hover:text-white/60"}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setPriorityFilter(""); }}
            className="text-xs text-white/30 hover:text-white/60
                       transition-colors duration-200 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && typeof error === "string" && (
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

      {loading ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-2.5"
        >
          <AnimatePresence>
            {tasks.map((task) =>
              task?._id ? (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggle={() => toggleStatus(task)}
                  onDelete={() => deleteTask(task._id)}
                />
              ) : null
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <CreateTaskModal
            goals={goals}
            onClose={() => setShowModal(false)}
            onCreated={handleTaskCreated}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  if (!task?._id) return null;

  const statusConfig = {
    "todo":        { label: "To Do",       classes: "text-sky-300/80 bg-sky-500/10 border-sky-400/20"             },
    "in-progress": { label: "In Progress", classes: "text-amber-300/80 bg-amber-500/10 border-amber-400/20"       },
    "done":        { label: "Done",        classes: "text-emerald-300/80 bg-emerald-500/10 border-emerald-400/20" },
  }[task.status] ?? { label: task.status, classes: "text-white/40 bg-white/5 border-white/10" };

  const priorityDot = {
    high:   "bg-red-400/80",
    medium: "bg-amber-400/80",
    low:    "bg-emerald-400/80",
  }[task.priority] ?? "bg-slate-400/80";

  return (
    <motion.div
      variants={cardVariants}
      layout
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl
                 bg-white/[0.04] border border-white/[0.07]
                 hover:bg-white/[0.07] transition-colors duration-200 group"
    >
      <button
        onClick={onToggle}
        className={`
          w-5 h-5 rounded-full border-[1.5px] flex items-center
          justify-center shrink-0 transition-all duration-200
          ${task.status === "done"
            ? "bg-emerald-500/20 border-emerald-400/60"
            : task.status === "in-progress"
            ? "bg-amber-500/20 border-amber-400/60"
            : "border-white/20 hover:border-white/50"}
        `}
      >
        <AnimatePresence>
          {task.status === "done" && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{    scale: 0 }}
              width="10" height="10" viewBox="0 0 10 10" fill="none"
            >
              <path d="M2 5L4 7L8 3"
                stroke="#6ee7b7" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          )}
          {task.status === "in-progress" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{    scale: 0 }}
              className="w-2 h-2 rounded-full bg-amber-400/80"
            />
          )}
        </AnimatePresence>
      </button>

      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot}`} />

      <div className="flex-1 min-w-0">
        <p className={`
          text-sm leading-snug transition-all duration-200
          ${task.status === "done" ? "line-through text-white/30" : "text-white/80"}
        `}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.dueDate && (
            <span className="text-[11px] text-white/30">
              Due {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              })}
            </span>
          )}
          {task.goal?.title && (
            <span className="text-[11px] text-indigo-300/50">
              ◎ {task.goal.title}
            </span>
          )}
          {task.isAIGenerated && (
            <span className="text-[11px] text-violet-300/50">✦ AI generated</span>
          )}
        </div>
      </div>

      <span className={`
        text-[10px] font-medium tracking-wide uppercase
        px-2 py-1 rounded-full border shrink-0 ${statusConfig.classes}
      `}>
        {statusConfig.label}
      </span>

      <AnimatePresence>
        {showDelete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1   }}
            exit={{    opacity: 0, scale: 0.8 }}
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-400/20
                       flex items-center justify-center shrink-0
                       hover:bg-red-500/20 transition-colors duration-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3H10M4.5 3V2H7.5V3M4 3V10H8V3"
                stroke="#f87171" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateTaskModal({ goals, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium",
    status: "todo", dueDate: "", goal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Task title is required"); return; }
    try {
      setSubmitting(true);
      setError("");
      const res = await taskAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        status:      form.status,
        dueDate:     form.dueDate || undefined,
        goal:        form.goal    || undefined,
      });
      const created = res?.data?.data;
      if (created?._id) onCreated(created);
    } catch (err) {
      const msg = err?.userMessage || err?.message || "Failed to create task";
      setError(typeof msg === "string" ? msg : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 8  }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed inset-0 flex items-center justify-center
                   z-50 pointer-events-none px-4"
      >
        <div className="w-full max-w-md bg-[#1a1740] border border-white/10
                        rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-white/[0.07]">
            <h2 className="text-base font-medium text-white/85">New Task</h2>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center
                         justify-center text-white/40 hover:text-white/70
                         hover:bg-white/10 transition-colors duration-200">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            <AnimatePresence>
              {error && typeof error === "string" && (
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

            <div>
  <label className="text-[11px] font-medium tracking-wider
                    uppercase text-white/35 mb-1.5 block">
    Title *
  </label>
  <div className="flex items-center gap-2">
    <input
      autoFocus
      type="text"
      placeholder="What needs to be done?"
      value={form.title}
      onChange={(e) => handleChange("title", e.target.value)}
      className="flex-1 bg-white/[0.05] border border-white/10
                 rounded-xl px-4 py-2.5 text-sm text-white/80
                 placeholder:text-white/25 outline-none
                 focus:border-indigo-400/40 focus:bg-white/[0.08]
                 transition-all duration-200"
    />
    <VoiceButton
      size="sm"
      onTranscript={(text) => handleChange("title", text)}
    />
  </div>
</div>

            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Description
              </label>
              <textarea
                placeholder="Optional details…"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={2}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/80
                           placeholder:text-white/25 outline-none resize-none
                           focus:border-indigo-400/40 focus:bg-white/[0.08]
                           transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  field: "priority",
                  label: "Priority",
                  options: [
                    { value: "low",    label: "Low"    },
                    { value: "medium", label: "Medium" },
                    { value: "high",   label: "High"   },
                  ],
                },
                {
                  field: "status",
                  label: "Status",
                  options: [
                    { value: "todo",        label: "To Do"       },
                    { value: "in-progress", label: "In Progress" },
                    { value: "done",        label: "Done"        },
                  ],
                },
              ].map(({ field, label, options }) => (
                <div key={field}>
                  <label className="text-[11px] font-medium tracking-wider
                                    uppercase text-white/35 mb-1.5 block">
                    {label}
                  </label>
                  <select
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10
                               rounded-xl px-3 py-2.5 text-sm text-white/70
                               outline-none focus:border-indigo-400/40
                               transition-all duration-200 cursor-pointer"
                  >
                    {options.map((o) => (
                      <option key={o.value} value={o.value}
                        className="bg-[#1a1740]">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-4 py-2.5 text-sm text-white/70
                           outline-none focus:border-indigo-400/40
                           transition-all duration-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium tracking-wider
                                uppercase text-white/35 mb-1.5 block">
                Link to Goal
              </label>
              <select
                value={form.goal}
                onChange={(e) => handleChange("goal", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10
                           rounded-xl px-3 py-2.5 text-sm text-white/70
                           outline-none focus:border-indigo-400/40
                           transition-all duration-200 cursor-pointer"
              >
                <option value="" className="bg-[#1a1740]">No goal</option>
                {goals.map((goal) =>
                  goal?._id ? (
                    <option key={goal._id} value={goal._id}
                      className="bg-[#1a1740]">
                      {goal.title}
                    </option>
                  ) : null
                )}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button" onClick={onClose}
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
                           bg-gradient-to-r from-indigo-500 to-violet-500
                           text-white text-sm font-medium
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:opacity-90 active:scale-[0.98]
                           transition-all duration-200"
              >
                {submitting ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl
                     bg-white/[0.04] border border-white/[0.07]">
          <div className="w-5 h-5 rounded-full bg-white/8 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/8 rounded-full animate-pulse"
              style={{ width: `${50 + i * 8}%` }} />
            <div className="h-2 bg-white/5 rounded-full animate-pulse w-24" />
          </div>
          <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-4xl opacity-15">✓</span>
      <p className="text-sm text-white/35 font-medium">No tasks found</p>
      <p className="text-[11px] text-white/20">Create your first task to get started</p>
      <button
        onClick={onAdd}
        className="mt-2 px-4 py-2 rounded-xl bg-indigo-500/15
                   border border-indigo-400/25 text-indigo-300 text-xs
                   font-medium hover:bg-indigo-500/25 transition-colors duration-200"
      >
        + New Task
      </button>
    </div>
  );
}