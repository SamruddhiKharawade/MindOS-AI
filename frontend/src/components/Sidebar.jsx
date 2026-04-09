// frontend/src/components/Sidebar.jsx

import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { healthAPI } from "../services/api";

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    path:        "/dashboard",
    label:       "Home",
    icon:        HomeIcon,
    description: "Overview & AI insights",
  },
  {
    path:        "/chat",
    label:       "AI Chat",
    icon:        ChatIcon,
    description: "Talk to MindOS AI",
  },
  {
    path:        "/tasks",
    label:       "Tasks",
    icon:        TaskIcon,
    description: "Manage your tasks",
  },
  {
    path:        "/goals",
    label:       "Goals",
    icon:        GoalIcon,
    description: "Track your goals",

  },
  {
    path:        "/planner",
    label:       "Planner",
    icon:        PlannerIcon,
    description: "Daily focus view",
    
  },
  {
    path:        "/notes",
    label:       "Memory",
    icon:        NoteIcon,
    description: "Notes & AI memory"
    
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const location               = useLocation();
  const navigate               = useNavigate();
  const [isOnline, setIsOnline] = useState(null);
  const [time, setTime]         = useState(getTimeString());

  // Live clock — updates every minute
  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeString()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Backend health check — every 30 seconds
  useEffect(() => {
    const check = async () => {
      try {
        await healthAPI.check();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.aside
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col w-64 min-w-[260px] h-screen
                 bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]
                 border-r border-white/5 px-3 py-5 gap-2 overflow-hidden z-10"
    >

      {/* Decorative glows */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full
                      bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full
                      bg-violet-500/10 blur-3xl pointer-events-none" />

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-2 pb-4 border-b border-white/5 mb-1">

        {/* Logo row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500
                          to-violet-500 flex items-center justify-center
                          text-base shrink-0">
            
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-100 tracking-tight">
              MindOS
            </p>
            <p className="text-[11px] text-white/35 font-normal">
              Personal AI
            </p>
          </div>
          <StatusDot isOnline={isOnline} />
        </div>

        {/* Greeting */}
        <div className="mt-5 pl-1">
          <p className="text-[11px] font-medium tracking-widest
                        uppercase text-white/30">
            {time}
          </p>
          <p className="text-2xl font-light text-slate-100
                        tracking-tight leading-tight mt-0.5">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => !item.disabled && navigate(item.path)}
          />
        ))}
      </nav>

      {/* ── AI Context Card ───────────────────────────────────────────────── */}
      <div className="border-t border-white/5 pt-3">
        <button
          onClick={() => navigate("/chat")}
          className="w-full text-left rounded-2xl bg-indigo-500/10
                     border border-indigo-400/20 px-3 py-3
                     hover:bg-indigo-500/15 transition-colors duration-200"
        >
          <p className="text-[11px] font-medium tracking-wider
                        uppercase text-indigo-300/80 mb-1">
            ✦ AI is aware of
          </p>
          <p className="text-[12px] text-white/50 leading-relaxed">
            Your tasks, goals & notes
          </p>
          <p className="text-[11px] text-indigo-300/50 mt-1.5">
            Chat to ask anything →
          </p>
        </button>
      </div>

    </motion.aside>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={!item.disabled ? { x: 3 } : {}}
      whileTap={!item.disabled  ? { scale: 0.97 } : {}}
      className={`
        relative flex items-center gap-3 w-full text-left
        px-3 py-2.5 rounded-xl border-none transition-colors duration-200
        ${isActive       ? "bg-indigo-500/18"  : "bg-transparent hover:bg-white/5"}
        ${item.disabled  ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}
      `}
    >

      {/* Active indicator bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeBar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-[20%] h-[60%] w-[3px]
                       rounded-r-full bg-indigo-400"
          />
        )}
      </AnimatePresence>

      {/* Icon box */}
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        transition-colors duration-200
        ${isActive ? "bg-indigo-500/25" : "bg-white/5"}
      `}>
        <Icon
          size={16}
          color={isActive ? "#a5b4fc" : "rgba(248,250,252,0.4)"}
        />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p className={`
          text-sm leading-none transition-colors duration-200
          ${isActive ? "font-medium text-indigo-100" : "font-normal text-white/55"}
        `}>
          {item.label}
        </p>

        <AnimatePresence>
          {isActive && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[11px] text-indigo-300/60 mt-0.5 overflow-hidden"
            >
              {item.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Coming soon badge */}
      {item.disabled && (
        <span className="text-[10px] font-medium text-white/25
                         bg-white/5 rounded px-1.5 py-0.5
                         tracking-wide uppercase shrink-0">
          Soon
        </span>
      )}
    </motion.button>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
function StatusDot({ isOnline }) {
  const colorClass =
    isOnline === null ? "bg-slate-400" :
    isOnline          ? "bg-emerald-400" :
                        "bg-red-400";

  return (
    <div className="relative w-2 h-2">
      {isOnline && (
        <motion.div
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className={`absolute inset-0 rounded-full ${colorClass}`}
        />
      )}
      <div className={`w-2 h-2 rounded-full relative ${colorClass}`} />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2L14 6.5V13.5C14 13.78 13.78 14 13.5 14H10V10H6V14H2.5C2.22 14 2 13.78 2 13.5V6.5Z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13.5 2H2.5C2.22 2 2 2.22 2 2.5V10.5C2 10.78 2.22 11 2.5 11H5V14L8.5 11H13.5C13.78 11 14 10.78 14 10.5V2.5C14 2.22 13.78 2 13.5 2Z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function TaskIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2"
        stroke={color} strokeWidth="1.2" />
      <path d="M5 8L7 10L11 6"
        stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoalIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1" fill={color} />
    </svg>
  );
}

function PlannerIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="2"
        stroke={color} strokeWidth="1.2" />
      <path d="M5 2V4M11 2V4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 7H14"       stroke={color} strokeWidth="1.2" />
      <rect x="5" y="10" width="2" height="2" rx="0.5" fill={color} />
      <rect x="9" y="10" width="2" height="2" rx="0.5" fill={color} />
    </svg>
  );
}

function NoteIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 2.5C3 2.22 3.22 2 3.5 2H10.5L13 4.5V13.5C13 13.78 12.78 14 12.5 14H3.5C3.22 14 3 13.78 3 13.5V2.5Z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10 2V5H13"   stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 8H10M6 10.5H9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTimeString() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
