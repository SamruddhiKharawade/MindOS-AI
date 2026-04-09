// frontend/src/App.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence }         from "framer-motion";
import { useLocation }             from "react-router-dom";
import { useAuth }                 from "./context/AuthContext";

import Layout   from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Chat      from "./pages/Chat";
import Tasks     from "./pages/Tasks";
import Goals     from "./pages/Goals";
import Notes     from "./pages/Notes";
import Planner   from "./pages/Planner";
import Login     from "./pages/Login";
import Register  from "./pages/Register";

// ─── Protected Route ──────────────────────────────────────────────────────────
// If not logged in → redirect to /login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  return children;
}

// ─── Guest Route ──────────────────────────────────────────────────────────────
// If already logged in → redirect to /dashboard
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/dashboard" replace />;

  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute><Register /></GuestRoute>
        } />

        {/* ── Protected routes ──────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={
          <ProtectedRoute><Layout /></ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat"      element={<Chat />}      />
          <Route path="/tasks"     element={<Tasks />}     />
          <Route path="/goals"     element={<Goals />}     />
          <Route path="/notes"     element={<Notes />}     />
          <Route path="/planner"   element={<Planner />}   />
        </Route>

        {/* ── 404 ───────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AnimatePresence>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-[#0f0e1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br
                        from-indigo-500 to-violet-500
                        flex items-center justify-center text-xl">
          🧠
        </div>
        <div className="w-5 h-5 border-2 border-white/20
                        border-t-indigo-400 rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    gap-4 bg-[#0f0e1a]">
      <h1 className="text-8xl font-light text-indigo-500/30">404</h1>
      <p className="text-white/40 text-sm">
        This page doesn't exist in your universe
      </p>
      <a href="/dashboard"
        className="mt-2 px-5 py-2 rounded-full bg-indigo-500/15
                   border border-indigo-400/25 text-indigo-300 text-sm
                   hover:bg-indigo-500/25 transition-colors duration-200">
        Back to Dashboard
      </a>
    </div>
  );
}