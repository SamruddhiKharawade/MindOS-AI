// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Check if already logged in on app load ─────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (username, email, password) => {
    const res = await api.post("/auth/register", {
      username, email, password,
    });
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — cleaner to use in components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};