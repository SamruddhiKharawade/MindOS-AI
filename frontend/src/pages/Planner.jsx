// frontend/src/pages/Planner.jsx

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import { taskAPI, aiAPI, safeData } from "../services/api";


// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS  = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getWeekDates(offsetWeeks = 0) {
  const today  = new Date();
  const day    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - day + 1 + offsetWeeks * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return (
    a.getDate()     === b.getDate()     &&
    a.getMonth()    === b.getMonth()    &&
    a.getFullYear() === b.getFullYear()
  );
}

function isToday(date) {
  return isSameDay(date, new Date());
}

// ─── Planner Page ─────────────────────────────────────────────────────────────
export default function Planner() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [allTasks,      setAllTasks]      = useState([]);
  const [todayTasks,    setTodayTasks]    = useState([]);
  const [suggestion,    setSuggestion]    = useState("");
  const [loadingTasks,  setLoadingTasks]  = useState(true);
  const [loadingSuggest,setLoadingSuggest]= useState(true);
  const [weekOffset,    setWeekOffset]    = useState(0);
  const [selectedDay,   setSelectedDay]   = useState(new Date());
  const [error,         setError]         = useState("");

  const weekDates = getWeekDates(weekOffset);

  // ── Fetch all tasks with due dates ─────────────────────────────────────────
 const fetchTasks = useCallback(async () => {
  try {
    setLoadingTasks(true);
    setError("");
    const res = await taskAPI.getAll();
    const withDates = safeData(res).filter((t) => t?.dueDate);
    setAllTasks(withDates);
  } catch (err) {
    const msg = err?.userMessage || err?.message || "Failed to load tasks";
    setError(typeof msg === "string" ? msg : "Failed to load tasks");
  } finally {
    setLoadingTasks(false);
  }
}, []);

const fetchTodayTasks = useCallback(async () => {
  try {
    const res = await taskAPI.getToday();
    setTodayTasks(safeData(res));
  } catch {
    // Non-critical
  }
}, []);

  // ── Fetch AI suggestion ────────────────────────────────────────────────────
  const fetchSuggestion = useCallback(async () => {
  try {
    setLoadingSuggest(true);
    const res  = await aiAPI.getSuggestion();
    const text = res?.data?.data?.suggestion;
    setSuggestion(
      typeof text === "string" && text.trim()
        ? text
        : "Focus on your highest priority task first."
    );
  } catch {
    setSuggestion("Focus on your highest priority task first.");
  } finally {
    setLoadingSuggest(false);
  }
}, []);

  useEffect(() => {
    fetchTasks();
    fetchTodayTasks();
    fetchSuggestion();
  }, [fetchTasks, fetchTodayTasks, fetchSuggestion]);

  // ── Toggle task status ─────────────────────────────────────────────────────
  const toggleTask = async (task) => {
    const next = task.status === "done" ? "todo" : "done";

    setAllTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: next } : t))
    );
    setTodayTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: next } : t))
    );

    try {
      await taskAPI.update(task._id, { status: next });
    } catch {
      fetchTasks();
      fetchTodayTasks();
    }
  };

  // ── Tasks for selected day ─────────────────────────────────────────────────
  const tasksForDay = (date) =>
    allTasks.filter((t) => isSameDay(new Date(t.dueDate), date));

  const selectedDayTasks = tasksForDay(selectedDay);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayDone  = todayTasks.filter((t) => t.status === "done").length;
  const todayTotal = todayTasks.length;
  const todayPct   = todayTotal === 0 ? 0 : Math.round((todayDone / todayTotal) * 100);

  // ── Week summary: tasks per day ────────────────────────────────────────────
  const weekSummary = weekDates.map((date) => ({
    date,
    tasks: tasksForDay(date),
    done:  tasksForDay(date).filter((t) => t.status === "done").length,
  }));

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
      <div className="mb-8">
        <p className="text-[11px] font-medium tracking-widest
                      uppercase text-white/30 mb-1">
          Daily Planner
        </p>
        <h1 className="text-4xl font-light text-white/90 tracking-tight">
          {MONTHS[new Date().getMonth()]}{" "}
          <span className="bg-gradient-to-r from-teal-300 to-cyan-300
                           bg-clip-text text-transparent font-normal">
            {new Date().getFullYear()}
          </span>
        </h1>
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

      {/* ── Top Row: Today Card + AI Suggestion ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Today summary card */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-1 rounded-2xl
                     bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-transparent
                     border border-teal-400/20 p-5"
        >
          {/* Shimmer top line */}
          <div className="h-[1px] bg-gradient-to-r from-transparent
                          via-teal-400/30 to-transparent mb-4 -mx-5" />

          <p className="text-[11px] font-medium tracking-wider
                        uppercase text-teal-300/70 mb-1">
            Today
          </p>
          <p className="text-3xl font-light text-white/85 mb-1">
            {new Date().getDate()}
          </p>
          <p className="text-sm text-white/40 mb-4">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", month: "long",
            })}
          </p>

          {/* Today's progress ring */}
          <div className="flex items-center gap-4">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22"
                fill="none" stroke="rgba(255,255,255,0.05)"
                strokeWidth="4" />
              <motion.circle
                cx="28" cy="28" r="22"
                fill="none" stroke="url(#plannerRing)"
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 22 * (1 - todayPct / 100),
                }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                transform="rotate(-90 28 28)"
              />
              <defs>
                <linearGradient id="plannerRing" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <text x="28" y="25"
                textAnchor="middle" fill="rgba(248,250,252,0.85)"
                fontSize="12" fontWeight="300"
                fontFamily="Inter, sans-serif">
                {todayPct}%
              </text>
              <text x="28" y="36"
                textAnchor="middle" fill="rgba(248,250,252,0.25)"
                fontSize="7" fontFamily="Inter, sans-serif">
                done
              </text>
            </svg>

            <div>
              <p className="text-2xl font-light text-white/80">
                {todayDone}
                <span className="text-base text-white/30">
                  /{todayTotal}
                </span>
              </p>
              <p className="text-[11px] text-white/35 mt-0.5">
                tasks complete
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Suggestion */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-2 rounded-2xl
                     bg-white/[0.04] border border-white/[0.07]
                     p-5 flex flex-col gap-3"
        >
          <p className="text-[11px] font-medium tracking-wider
                        uppercase text-white/30">
            ✦ AI Focus Suggestion
          </p>

          {loadingSuggest ? (
            <div className="space-y-2">
              <div className="h-3.5 bg-white/8 rounded-full w-full animate-pulse" />
              <div className="h-3.5 bg-white/8 rounded-full w-4/5 animate-pulse" />
              <div className="h-3.5 bg-white/8 rounded-full w-3/5 animate-pulse" />
            </div>
          ) : (
            <p className="text-sm text-white/70 leading-relaxed flex-1">
              {suggestion}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {todayTasks
              .filter((t) => t.status !== "done")
              .slice(0, 3)
              .map((t) => (
                <span
                  key={t._id}
                  className="text-[11px] px-2.5 py-1 rounded-full
                             bg-teal-500/10 border border-teal-400/20
                             text-teal-300/70"
                >
                  {t.title.length > 28
                    ? t.title.substring(0, 28) + "…"
                    : t.title}
                </span>
              ))}
          </div>
        </motion.div>
      </div>

      {/* ── Week Navigator ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07]
                      p-5 mb-5">

        {/* Week header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((v) => v - 1)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
                       flex items-center justify-center text-white/40
                       hover:text-white/70 hover:bg-white/10
                       transition-colors duration-200 text-sm"
          >
            ‹
          </button>

          <p className="text-sm font-medium text-white/60">
            {weekDates[0].toLocaleDateString("en-US", {
              month: "short", day: "numeric",
            })}
            {" "}—{" "}
            {weekDates[6].toLocaleDateString("en-US", {
              month: "short", day: "numeric",
            })}
            {weekOffset === 0 && (
              <span className="ml-2 text-[11px] text-teal-300/60">
                (this week)
              </span>
            )}
          </p>

          <button
            onClick={() => setWeekOffset((v) => v + 1)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
                       flex items-center justify-center text-white/40
                       hover:text-white/70 hover:bg-white/10
                       transition-colors duration-200 text-sm"
          >
            ›
          </button>
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 gap-2">
          {weekSummary.map(({ date, tasks, done }) => {
            const isSelected = isSameDay(date, selectedDay);
            const dayToday   = isToday(date);
            const hasTasks   = tasks.length > 0;

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDay(date)}
                className={`
                  flex flex-col items-center gap-1.5 py-3 px-1
                  rounded-xl border transition-all duration-200
                  ${isSelected
                    ? "bg-teal-500/15 border-teal-400/30"
                    : "bg-transparent border-transparent hover:bg-white/5"}
                `}
              >
                {/* Day name */}
                <p className={`
                  text-[10px] font-medium tracking-wider uppercase
                  ${isSelected ? "text-teal-300/80" : "text-white/30"}
                `}>
                  {DAYS[(date.getDay())]}
                </p>

                {/* Day number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-medium transition-all duration-200
                  ${dayToday
                    ? "bg-teal-500/30 text-teal-200 border border-teal-400/40"
                    : isSelected
                    ? "text-white/85"
                    : "text-white/50"}
                `}>
                  {date.getDate()}
                </div>

                {/* Task dots */}
                {hasTasks ? (
                  <div className="flex gap-0.5">
                    {tasks.slice(0, 3).map((t, i) => (
                      <div
                        key={i}
                        className={`
                          w-1 h-1 rounded-full
                          ${t.status === "done"
                            ? "bg-teal-400/60"
                            : "bg-white/25"}
                        `}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-1 h-1" />
                )}

                {/* Done count */}
                {hasTasks && (
                  <p className={`
                    text-[9px]
                    ${isSelected ? "text-teal-300/60" : "text-white/20"}
                  `}>
                    {done}/{tasks.length}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Day Tasks ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5">

        {/* Selected day header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-white/80">
              {isToday(selectedDay)
                ? "Today's tasks"
                : selectedDay.toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
            </h2>
            {selectedDayTasks.length > 0 && (
              <p className="text-[11px] text-white/30 mt-0.5">
                {selectedDayTasks.filter((t) => t.status === "done").length}
                {" "}of {selectedDayTasks.length} complete
              </p>
            )}
          </div>

          {/* Jump to today */}
          {!isToday(selectedDay) && (
            <button
              onClick={() => {
                setSelectedDay(new Date());
                setWeekOffset(0);
              }}
              className="text-xs text-teal-300/60 hover:text-teal-300/90
                         transition-colors duration-200"
            >
              Jump to today →
            </button>
          )}
        </div>

        {/* Task list */}
        {loadingTasks ? (
          <PlannerSkeleton />
        ) : selectedDayTasks.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <span className="text-3xl opacity-15">📅</span>
            <p className="text-sm text-white/30">
              No tasks scheduled for this day
            </p>
            <p className="text-[11px] text-white/20">
              Set a due date on a task to see it here
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-2"
          >
            {selectedDayTasks.map((task) => (
              <PlannerTaskRow
                key={task._id}
                task={task}
                onToggle={() => toggleTask(task)}
              />
            ))}
          </motion.div>
        )}
      </div>

    </motion.div>
  );
}

// ─── Planner Task Row ─────────────────────────────────────────────────────────
function PlannerTaskRow({ task, onToggle }) {
  const isDone = task.status === "done";

  const priorityConfig = {
    high:   { dot: "bg-red-400/80",     bar: "bg-red-400/20"     },
    medium: { dot: "bg-amber-400/80",   bar: "bg-amber-400/20"   },
    low:    { dot: "bg-emerald-400/80", bar: "bg-emerald-400/20" },
  }[task.priority] ?? { dot: "bg-slate-400/80", bar: "bg-slate-400/20" };

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border
        transition-all duration-200 cursor-pointer
        ${isDone
          ? "bg-white/[0.02] border-white/[0.04] opacity-60"
          : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07]"}
      `}
      onClick={onToggle}
    >
      {/* Priority bar */}
      <div className={`
        w-1 h-8 rounded-full shrink-0 ${priorityConfig.bar}
      `} />

      {/* Checkbox */}
      <div className={`
        w-5 h-5 rounded-full border-[1.5px] flex items-center
        justify-center shrink-0 transition-all duration-200
        ${isDone
          ? "bg-teal-500/20 border-teal-400/50"
          : "border-white/20 hover:border-white/50"}
      `}>
        <AnimatePresence>
          {isDone && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{    scale: 0 }}
              width="10" height="10" viewBox="0 0 10 10" fill="none"
            >
              <path d="M2 5L4 7L8 3"
                stroke="#5eead4" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={`
          text-sm leading-snug transition-all duration-200
          ${isDone ? "line-through text-white/25" : "text-white/80"}
        `}>
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
          <span className="text-[11px] text-white/30 capitalize">
            {task.priority} priority
          </span>
          {task.goal && (
            <span className="text-[11px] text-indigo-300/45">
              ◎ {task.goal.title}
            </span>
          )}
          {task.isAIGenerated && (
            <span className="text-[11px] text-violet-300/40">✦ AI</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`
        text-[10px] font-medium tracking-wide uppercase
        px-2 py-1 rounded-full border shrink-0
        ${isDone
          ? "text-teal-300/70 bg-teal-500/10 border-teal-400/20"
          : task.status === "in-progress"
          ? "text-amber-300/70 bg-amber-500/10 border-amber-400/20"
          : "text-white/30 bg-white/5 border-white/10"}
      `}>
        {task.status === "in-progress" ? "In Progress" : task.status}
      </span>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PlannerSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i}
          className="flex items-center gap-3 px-4 py-3
                     rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <div className="w-1 h-8 bg-white/8 rounded-full animate-pulse shrink-0" />
          <div className="w-5 h-5 rounded-full bg-white/8 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/8 rounded-full animate-pulse"
              style={{ width: `${55 + i * 10}%` }} />
            <div className="h-2 bg-white/5 rounded-full animate-pulse w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}