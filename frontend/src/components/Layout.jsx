// frontend/src/components/Layout.jsx

import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";

// ─── Route → Background Gradient Map ─────────────────────────────────────────
// Each page gets its own Tide-inspired atmospheric gradient
// Mirrors the CSS variables defined in index.css
const ROUTE_GRADIENTS = {
  "/dashboard": "from-[#0f0e1a] via-[#1a1040] to-[#0f0e1a]",
  "/chat":      "from-[#0a1628] via-[#0f2137] to-[#0a1628]",
  "/tasks":     "from-[#051525] via-[#0a2540] to-[#051525]",
  "/goals":     "from-[#150a28] via-[#1e0f3d] to-[#150a28]",
  "/planner":   "from-[#0a1a1a] via-[#0f2828] to-[#0a1a1a]",
  "/notes":     "from-[#1a100a] via-[#2a180f] to-[#1a100a]",
};

// Fallback if route doesn't match
const DEFAULT_GRADIENT = "from-[#0f0e1a] via-[#1a1040] to-[#0f0e1a]";

// ─── Page Transition Variants ─────────────────────────────────────────────────
// Framer Motion animation config for entering/exiting pages
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
};

const pageTransition = {
  duration: 0.3,
  ease: "easeInOut",
};

// ─── Layout Component ─────────────────────────────────────────────────────────
export default function Layout() {
  const location = useLocation();

  // Pick the background gradient based on the current route
  const gradient = ROUTE_GRADIENTS[location.pathname] ?? DEFAULT_GRADIENT;

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Left: Sidebar (fixed, never scrolls) ─────────────────────────── */}
      <Sidebar />

      {/* ── Right: Content Area ───────────────────────────────────────────── */}
      {/* Background shifts per page — Tide-style atmospheric feel */}
      <main
        className={`
          relative flex-1 h-screen overflow-hidden
          bg-gradient-to-b ${gradient}
          transition-all duration-700 ease-in-out
        `}
      >

        {/* Subtle top-right ambient glow — decorative, not functional */}
        <div className="absolute top-0 right-0 w-96 h-96
                        bg-indigo-500/5 rounded-full blur-3xl
                        pointer-events-none" />

        {/* Subtle bottom-left ambient glow */}
        <div className="absolute bottom-0 left-0 w-80 h-80
                        bg-violet-500/5 rounded-full blur-3xl
                        pointer-events-none" />

        {/* ── Animated Page Content ─────────────────────────────────────── */}
        {/* AnimatePresence detects when the page component changes        */}
        {/* and plays exit animation before mounting the next page         */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="h-full overflow-y-auto"
          >
            {/* Outlet renders the matched child route's page component */}
            <Outlet />
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}