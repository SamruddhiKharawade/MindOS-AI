// frontend/src/pages/Dashboard.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import { useNavigate }                              from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { taskAPI, goalAPI, aiAPI, safeData } from "../services/api";
import { useAuth }                           from "../context/AuthContext";

// ─── Variants ─────────────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const cardVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0  },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

// ─── Build activity data ───────────────────────────────────────────────────────
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildActivityData(tasks) {
  return WEEK_LABELS.map((day, i) => ({
    day,
    completed: Math.max(0, Math.floor(Math.random() * 5) + (i === 3 ? 6 : 1)),
    added:     Math.max(0, Math.floor(Math.random() * 3) + 1),
  }));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();

  const [tasks,          setTasks]          = useState([]);
  const [allTasks,       setAllTasks]       = useState([]);
  const [goals,          setGoals]          = useState([]);
  const [suggestion,     setSuggestion]     = useState("");
  const [loadingTasks,   setLoadingTasks]   = useState(true);
  const [loadingGoals,   setLoadingGoals]   = useState(true);
  const [loadingSuggest, setLoadingSuggest] = useState(true);
  const [newTaskTitle,   setNewTaskTitle]   = useState("");
  const [addingTask,     setAddingTask]     = useState(false);
  const [showAddTask,    setShowAddTask]    = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [showSearch,     setShowSearch]     = useState(false);
  const [activityData,   setActivityData]   = useState([]);
  const [error,          setError]          = useState("");

  const searchRef = useRef(null);

  // ── Safety: clear error if not a string ───────────────────────────────────
  useEffect(() => {
    if (error && typeof error !== "string") {
      setError("");
    }
  }, [error]);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const [todayRes, allRes] = await Promise.all([
        taskAPI.getToday(),
        taskAPI.getAll(),
      ]);
      const safeToday = safeData(todayRes);
      const safeAll   = safeData(allRes);
      setTasks(safeToday);
      setAllTasks(safeAll);
      setActivityData(buildActivityData(safeAll));
    } catch (err) {
      const msg = err?.userMessage || err?.message || "Failed to load tasks";
      setError(typeof msg === "string" ? msg : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // ── Fetch goals ────────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    try {
      setLoadingGoals(true);
      const res  = await goalAPI.getAll({ status: "active" });
      setGoals(safeData(res));
    } catch (err) {
      const msg = err?.userMessage || err?.message || "Failed to load goals";
      setError(typeof msg === "string" ? msg : "Failed to load goals");
    } finally {
      setLoadingGoals(false);
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
          : "Start your day by reviewing your top priority task."
      );
    } catch {
      setSuggestion("Start your day by reviewing your top priority task.");
    } finally {
      setLoadingSuggest(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchGoals();
    fetchSuggestion();
  }, [fetchTasks, fetchGoals, fetchSuggestion]);

  // ── Search ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q           = searchQuery.toLowerCase();
    const taskResults = allTasks
      .filter((t) => t?.title?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((t) => ({ ...t, _type: "task" }));
    const goalResults = goals
      .filter((g) => g?.title?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((g) => ({ ...g, _type: "goal" }));
    setSearchResults([...taskResults, ...goalResults]);
  }, [searchQuery, allTasks, goals]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Toggle task ────────────────────────────────────────────────────────────
  const toggleTask = async (task) => {
    if (!task?._id) return;
    const next = task.status === "done" ? "todo" : "done";
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

  // ── Quick add task ─────────────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      setAddingTask(true);
      const res = await taskAPI.create({
        title:   newTaskTitle.trim(),
        dueDate: new Date().toISOString(),
      });
      const newTask = res?.data?.data;
      if (newTask?._id) {
        setTasks((prev)    => [newTask, ...prev]);
        setAllTasks((prev) => [newTask, ...prev]);
      }
      setNewTaskTitle("");
      setShowAddTask(false);
    } catch (err) {
      const msg = err?.userMessage || err?.message || "Failed to create task";
      setError(typeof msg === "string" ? msg : "Failed to create task");
    } finally {
      setAddingTask(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const doneTasks    = tasks.filter((t) => t?.status === "done").length;
  const totalTasks   = tasks.length;
  const todayPct     = totalTasks === 0
    ? 0
    : Math.round((doneTasks / totalTasks) * 100);
  const highPriority = allTasks.filter(
    (t) => t?.priority === "high" && t?.status !== "done"
  ).length;
  const initials     = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "ME";

  const goalChartData = goals.slice(0, 5).map((g) => ({
    name:     g.title?.length > 12
      ? g.title.slice(0, 12) + "…"
      : g.title || "Goal",
    progress: g.progress ?? 0,
  }));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-full px-6 py-5 flex flex-col gap-5"
    >

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium tracking-widest
                        uppercase text-white/25 mb-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-light text-white/90 tracking-tight truncate">
            {getGreeting()},{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300
                             bg-clip-text text-transparent">
              {user?.username || "there"}
            </span>
          </h1>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative w-56">
          <div className={`
            flex items-center gap-2 px-3 py-2.5 rounded-xl border
            transition-all duration-200
            ${showSearch || searchQuery
              ? "bg-white/[0.08] border-indigo-400/40"
              : "bg-white/[0.05] border-white/[0.08]"}
          `}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4"
                stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
              <path d="M9 9L11.5 11.5"
                stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"
                strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search tasks, goals…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent text-xs text-white/70
                         placeholder:text-white/25 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="text-white/25 hover:text-white/60 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSearch && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: 4 }}
                className="absolute top-full left-0 right-0 mt-2
                           bg-[#1e1b3a] border border-white/10
                           rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-white/30 text-center">
                    No results found
                  </p>
                ) : (
                  <div className="p-1.5 flex flex-col gap-0.5">
                    {searchResults.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => {
                          navigate(item._type === "task" ? "/tasks" : "/goals");
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5
                                   rounded-xl hover:bg-white/[0.06]
                                   transition-colors text-left w-full"
                      >
                        <span className={`
                          text-[10px] px-1.5 py-0.5 rounded-full border
                          ${item._type === "task"
                            ? "text-sky-300/80 bg-sky-500/10 border-sky-400/20"
                            : "text-violet-300/80 bg-violet-500/10 border-violet-400/20"}
                        `}>
                          {item._type}
                        </span>
                        <span className="text-xs text-white/65 truncate flex-1">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <ProfileMenu user={user} initials={initials} onLogout={logout} />
      </div>

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && typeof error === "string" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            className="px-4 py-3 rounded-xl bg-red-500/10
                       border border-red-400/20 text-red-300 text-sm
                       flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-300/50 hover:text-red-300 ml-4 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STAT CARDS ────────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          {
            label:    "Today's Tasks",
            value:    totalTasks,
            sub:      `${doneTasks} completed`,
            gradient: "from-indigo-500/20 to-indigo-600/5",
            border:   "border-indigo-400/15",
            accent:   "text-indigo-300",
            bar:      todayPct,
            barColor: "bg-indigo-400",
          },
          {
            label:    "Active Goals",
            value:    goals.length,
            sub:      `${goals.filter((g) => (g.progress ?? 0) > 50).length} over 50%`,
            gradient: "from-violet-500/20 to-violet-600/5",
            border:   "border-violet-400/15",
            accent:   "text-violet-300",
            bar:      goals.length > 0
              ? Math.round(
                  goals.reduce((a, g) => a + (g.progress ?? 0), 0) / goals.length
                )
              : 0,
            barColor: "bg-violet-400",
          },
          {
            label:    "High Priority",
            value:    highPriority,
            sub:      "tasks need attention",
            gradient: "from-red-500/15 to-red-600/5",
            border:   "border-red-400/15",
            accent:   "text-red-300",
            bar:      allTasks.length > 0
              ? Math.round((highPriority / allTasks.length) * 100)
              : 0,
            barColor: "bg-red-400",
          },
          {
            label:    "Day Progress",
            value:    `${todayPct}%`,
            sub:      `${totalTasks - doneTasks} remaining`,
            gradient: "from-teal-500/20 to-teal-600/5",
            border:   "border-teal-400/15",
            accent:   "text-teal-300",
            bar:      todayPct,
            barColor: "bg-teal-400",
          },
        ].map(({ label, value, sub, gradient, border, accent, bar, barColor }) => (
          <motion.div
            key={label}
            variants={cardVariants}
            className={`rounded-2xl bg-gradient-to-br ${gradient}
                        border ${border} p-4 flex flex-col gap-3`}
          >
            <p className="text-[11px] font-medium tracking-wider
                          uppercase text-white/35">
              {label}
            </p>
            <p className={`text-3xl font-light ${accent}`}>{value}</p>
            <div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${barColor} opacity-70`}
                />
              </div>
              <p className="text-[11px] text-white/30">{sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── ROW 2: Activity chart + AI card ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity chart */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="lg:col-span-2 rounded-2xl bg-white/[0.04]
                     border border-white/[0.07] p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-medium text-white/80">
                Activity Overview
              </h2>
              <p className="text-[11px] text-white/30 mt-0.5">
                Tasks completed vs added this week
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/70" />
                <span className="text-[11px] text-white/30">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400/40" />
                <span className="text-[11px] text-white/30">Added</span>
              </div>
            </div>
          </div>

          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={activityData}
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background:   "#1e1b3a",
                    border:       "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color:        "rgba(255,255,255,0.7)",
                    fontSize:     "12px",
                  }}
                  cursor={{ stroke: "rgba(255,255,255,0.06)" }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#completedGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="added"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  fill="url(#addedGrad)"
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20
                              border-t-indigo-400 rounded-full animate-spin" />
            </div>
          )}
        </motion.div>

        {/* AI suggestion */}
        <AISuggestionCard
          suggestion={suggestion}
          loading={loadingSuggest}
          onChat={() => navigate("/chat")}
        />
      </div>

      {/* ── ROW 3: Tasks + Goal chart + Goals list ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Tasks */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07]
                        p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white/80">
                Today's Tasks
              </h2>
              <p className="text-[11px] text-white/30 mt-0.5">
                {doneTasks}/{totalTasks} done
              </p>
            </div>
            <button
              onClick={() => setShowAddTask((v) => !v)}
              className="w-7 h-7 rounded-lg bg-indigo-500/20
                         border border-indigo-400/25 text-indigo-300
                         flex items-center justify-center text-base
                         hover:bg-indigo-500/30 transition-colors"
            >
              +
            </button>
          </div>

          <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full
                         bg-gradient-to-r from-indigo-400 to-violet-400"
            />
          </div>

          <AnimatePresence>
            {showAddTask && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{    opacity: 0, height: 0    }}
                onSubmit={handleAddTask}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-2 rounded-xl
                                bg-white/5 border border-white/10">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Task title…"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white/80
                               placeholder:text-white/25 outline-none px-2"
                  />
                  <button
                    type="submit"
                    disabled={addingTask || !newTaskTitle.trim()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/30
                               text-indigo-300 text-xs disabled:opacity-40
                               hover:bg-indigo-500/40 transition-colors"
                  >
                    {addingTask ? "…" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="text-white/25 hover:text-white/50 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-56">
            {loadingTasks ? (
              <TaskSkeleton />
            ) : tasks.length === 0 ? (
              <EmptyState emoji="✓" message="No tasks today" sub="Add one above" />
            ) : (
              tasks.map((task) =>
                task?._id ? (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => toggleTask(task)}
                  />
                ) : null
              )
            )}
          </div>

          <button
            onClick={() => navigate("/tasks")}
            className="text-[11px] text-indigo-300/50
                       hover:text-indigo-300 transition-colors text-center"
          >
            View all tasks →
          </button>
        </div>

        {/* Goal progress bar chart */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-medium text-white/80">
                Goal Progress
              </h2>
              <p className="text-[11px] text-white/30 mt-0.5">
                Active goals overview
              </p>
            </div>
            <button
              onClick={() => navigate("/goals")}
              className="text-[11px] text-violet-300/50
                         hover:text-violet-300 transition-colors"
            >
              View all →
            </button>
          </div>

          {loadingGoals ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-white/20
                              border-t-violet-400 rounded-full animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <EmptyState emoji="◎" message="No goals yet"
                sub="Create one to track progress" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={goalChartData}
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                barSize={14}
              >
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background:   "#1e1b3a",
                    border:       "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color:        "rgba(255,255,255,0.7)",
                    fontSize:     "12px",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  formatter={(v) => [`${v}%`, "Progress"]}
                />
                <Bar
                  dataKey="progress"
                  fill="url(#barGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Goals list */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07]
                        p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/80">
              Active Goals
            </h2>
            <button
              onClick={() => navigate("/goals")}
              className="text-[11px] text-violet-300/50
                         hover:text-violet-300 transition-colors"
            >
              + New →
            </button>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-56">
            {loadingGoals ? (
              <GoalSkeleton />
            ) : goals.length === 0 ? (
              <EmptyState emoji="◎" message="No active goals"
                sub="Create a goal to get started" />
            ) : (
              goals.map((goal) =>
                goal?._id ? (
                  <GoalRow key={goal._id} goal={goal} />
                ) : null
              )
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
}

// ─── Profile Menu ─────────────────────────────────────────────────────────────
function ProfileMenu({ user, initials, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                   bg-white/[0.05] border border-white/[0.08]
                   hover:bg-white/[0.09] transition-colors duration-200"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br
                        from-indigo-500 to-violet-500
                        flex items-center justify-center
                        text-xs font-semibold text-white shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-medium text-white/75 leading-none">
            {user?.username || "User"}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5 truncate max-w-[90px]">
            {user?.email || ""}
          </p>
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          className="text-white/25 ml-0.5">
          <path d="M2 4L5 7L8 4" stroke="currentColor"
            strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10"
              onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1   }}
              exit={{    opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52
                         bg-[#1e1b3a] border border-white/10
                         rounded-2xl shadow-2xl z-20 overflow-hidden"
            >
              <div className="px-4 py-3.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                                  from-indigo-500 to-violet-500
                                  flex items-center justify-center
                                  text-sm font-semibold text-white shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/85
                                  truncate leading-none">
                      {user?.username}
                    </p>
                    <p className="text-[11px] text-white/35 mt-1
                                  truncate leading-none">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-1.5 border-t border-white/[0.07]">
                <button
                  onClick={() => { onLogout(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2
                             rounded-xl text-sm text-red-400/70
                             hover:bg-red-500/10 hover:text-red-400
                             transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 2H3C2.45 2 2 2.45 2 3V11C2 11.55 2.45 12 3 12H5.5"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M9.5 4.5L12 7L9.5 9.5M12 7H5.5"
                      stroke="currentColor" strokeWidth="1.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────────────────────
function AISuggestionCard({ suggestion, loading, onChat }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="relative rounded-2xl overflow-hidden
                 bg-gradient-to-br from-indigo-500/15 via-violet-500/10
                 to-transparent border border-indigo-400/20 p-5
                 flex flex-col gap-3"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px]
                      bg-gradient-to-r from-transparent
                      via-indigo-400/40 to-transparent" />
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/25
                        border border-indigo-400/20
                        flex items-center justify-center text-xs">
          ✦
        </div>
        <p className="text-[11px] font-medium tracking-wider
                      uppercase text-indigo-300/70">
          AI · Now for you
        </p>
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-white/8 rounded-full animate-pulse w-full" />
            <div className="h-3 bg-white/8 rounded-full animate-pulse w-4/5" />
            <div className="h-3 bg-white/8 rounded-full animate-pulse w-3/5" />
          </div>
        ) : (
          <p className="text-sm text-white/65 leading-relaxed">
            {typeof suggestion === "string" && suggestion
              ? suggestion
              : "Start your day by reviewing your top priority task."}
          </p>
        )}
      </div>
      <button
        onClick={onChat}
        className="flex items-center gap-2 px-3 py-2 rounded-xl
                   bg-indigo-500/15 border border-indigo-400/20
                   text-indigo-300 text-xs font-medium w-fit
                   hover:bg-indigo-500/25 transition-colors duration-200"
      >
        Chat with AI →
      </button>
    </motion.div>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle }) {
  if (!task || !task._id) return null;

  const isDone = task.status === "done";
  const priorityColor = {
    high:   "bg-red-400/70",
    medium: "bg-amber-400/70",
    low:    "bg-emerald-400/70",
  }[task.priority] ?? "bg-slate-400/60";

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                 hover:bg-white/[0.04] transition-colors cursor-pointer group"
      onClick={onToggle}
    >
      <div className={`
        w-4 h-4 rounded-full border flex items-center justify-center
        shrink-0 transition-all duration-200
        ${isDone
          ? "bg-indigo-500/25 border-indigo-400/50"
          : "border-white/20 group-hover:border-white/40"}
      `}>
        <AnimatePresence>
          {isDone && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{    scale: 0 }}
              width="8" height="8" viewBox="0 0 8 8" fill="none"
            >
              <path d="M1.5 4L3 5.5L6.5 2"
                stroke="#a5b4fc" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      <span className={`
        flex-1 text-xs leading-snug transition-all duration-150
        ${isDone ? "line-through text-white/25" : "text-white/65"}
      `}>
        {task.title}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} />
    </div>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────
function GoalRow({ goal }) {
  if (!goal || !goal._id) return null;

  const progress = goal.progress ?? 0;
  const categoryColor = {
    career:        "text-indigo-300/70  bg-indigo-500/10",
    health:        "text-emerald-300/70 bg-emerald-500/10",
    learning:      "text-sky-300/70     bg-sky-500/10",
    finance:       "text-amber-300/70   bg-amber-500/10",
    relationships: "text-pink-300/70    bg-pink-500/10",
    creativity:    "text-violet-300/70  bg-violet-500/10",
    personal:      "text-slate-300/70   bg-slate-500/10",
    other:         "text-slate-300/70   bg-slate-500/10",
  }[goal.category] ?? "text-slate-300/70 bg-slate-500/10";

  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-xl
                    bg-white/[0.03] border border-white/[0.05]
                    hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-white/75 truncate flex-1">
          {goal.title}
        </p>
        <span className={`
          text-[9px] font-medium tracking-wide uppercase
          px-1.5 py-0.5 rounded-full shrink-0 ${categoryColor}
        `}>
          {goal.category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full
                       bg-gradient-to-r from-violet-400/70 to-indigo-400/70"
          />
        </div>
        <span className="text-[10px] text-white/30 shrink-0">{progress}%</span>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i}
          className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-4 h-4 rounded-full bg-white/8
                          animate-pulse shrink-0" />
          <div className="h-2.5 bg-white/8 rounded-full animate-pulse"
            style={{ width: `${55 + i * 12}%` }} />
        </div>
      ))}
    </div>
  );
}

function GoalSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[1, 2].map((i) => (
        <div key={i}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="h-3 bg-white/8 rounded-full w-3/4
                          animate-pulse mb-2" />
          <div className="h-1 bg-white/5 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ emoji, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-1.5">
      <span className="text-xl opacity-15">{emoji}</span>
      <p className="text-xs text-white/30 font-medium">{message}</p>
      <p className="text-[10px] text-white/20">{sub}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}