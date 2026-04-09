// frontend/src/pages/Login.jsx

import { useState }            from "react";
import { motion }              from "framer-motion";
import { Link, useNavigate }   from "react-router-dom";
import { useAuth }             from "../context/AuthContext";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center
                    bg-[#0f0e1a] px-4">

      {/* ── Outer card ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl min-h-[540px] flex rounded-3xl
                   overflow-hidden shadow-2xl shadow-black/40
                   border border-white/[0.08]"
      >

        {/* ── LEFT PANEL — gradient art ──────────────────────────────────── */}
        <div className="hidden md:flex w-[42%] relative flex-col
                        justify-between p-10 overflow-hidden
                        bg-gradient-to-br from-indigo-600 via-violet-600
                        to-purple-700">

          {/* Animated blobs */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-56 h-56 rounded-full
                       bg-blue-400/30 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-10 w-64 h-64 rounded-full
                       bg-pink-400/20 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2
                       -translate-y-1/2 w-72 h-72 rounded-full
                       bg-violet-300/10 blur-2xl pointer-events-none"
          />

          {/* Top logo mark */}
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20
                            backdrop-blur-sm border border-white/30
                            flex items-center justify-center text-lg">
              
            </div>
          </div>

          {/* Bottom text */}
          <div className="relative z-10">
            <p className="text-white/60 text-sm mb-2 font-light">
              Welcome back to
            </p>
            <h2 className="text-white text-3xl font-light leading-tight
                           tracking-tight">
              Your personal hub<br />
              for clarity and<br />
              <span className="font-normal">productivity</span>
            </h2>
          </div>
        </div>

        {/* ── RIGHT PANEL — form ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12
                        bg-[#13112b]">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-8"
          >
            {/* Star mark */}
            <div className="text-indigo-400 text-2xl mb-4">✦</div>
            <h1 className="text-3xl font-light text-white/90 tracking-tight mb-1">
              Sign in
            </h1>
            <p className="text-sm text-white/35">
              Access your tasks, notes, and goals — all in one place.
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0  }}
              className="mb-5 px-4 py-3 rounded-xl bg-red-500/10
                         border border-red-400/20 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.4, delay: 0.25 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >

            {/* Email */}
            <div>
              <label className="text-[11px] font-medium tracking-widest
                                uppercase text-white/35 mb-2 block">
                Your email
              </label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10
                           rounded-xl px-4 py-3.5 text-sm text-white/80
                           placeholder:text-white/20 outline-none
                           focus:border-indigo-400/60 focus:bg-white/[0.09]
                           transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-medium tracking-widest
                                uppercase text-white/35 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/10
                             rounded-xl px-4 py-3.5 text-sm text-white/80
                             placeholder:text-white/20 outline-none
                             focus:border-indigo-400/60 focus:bg-white/[0.09]
                             transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-white/25 hover:text-white/60
                             transition-colors duration-200 text-xs"
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 mt-2 rounded-xl
                         bg-gradient-to-r from-indigo-500 to-violet-500
                         text-white text-sm font-medium tracking-wide
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-90 transition-all duration-200
                         shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30
                                  border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Get Started →"
              )}
            </motion.button>

          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 my-6"
          >
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] text-white/25 tracking-widest uppercase">
              or continue with
            </span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </motion.div>

          {/* Social placeholders */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex gap-3"
          >
            {["G", "⌘", "f"].map((icon) => (
              <button
                key={icon}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-white/[0.05]
                           border border-white/[0.08] text-white/40
                           text-sm font-medium hover:bg-white/[0.09]
                           hover:text-white/60 transition-all duration-200"
              >
                {icon}
              </button>
            ))}
          </motion.div>

          {/* Register link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-white/30 mt-8"
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300
                         transition-colors duration-200 font-medium"
            >
              Sign up
            </Link>
          </motion.p>
        </div>

      </motion.div>
    </div>
  );
}