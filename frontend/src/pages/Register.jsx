// frontend/src/pages/Register.jsx

import { useState }            from "react";
import { motion }              from "framer-motion";
import { Link, useNavigate }   from "react-router-dom";
import { useAuth }             from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({
    username: "", email: "", password: "", confirm: "",
  });
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await register(form.username, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength =
    form.password.length === 0 ? 0 :
    form.password.length < 6   ? 1 :
    form.password.length < 10  ? 2 : 3;

  const strengthConfig = {
    0: { label: "",        color: "",                    width: "w-0"     },
    1: { label: "Weak",    color: "bg-red-400/70",       width: "w-1/3"   },
    2: { label: "Fair",    color: "bg-amber-400/70",     width: "w-2/3"   },
    3: { label: "Strong",  color: "bg-emerald-400/70",   width: "w-full"  },
  }[strength];

  return (
    <div className="min-h-screen w-full flex items-center justify-center
                    bg-[#0f0e1a] px-4 py-8">

      {/* ── Outer card ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl flex rounded-3xl overflow-hidden
                   shadow-2xl shadow-black/40 border border-white/[0.08]"
      >

        {/* ── LEFT PANEL — gradient art ──────────────────────────────────── */}
        <div className="hidden md:flex w-[42%] relative flex-col
                        justify-between p-10 overflow-hidden
                        bg-gradient-to-br from-violet-600 via-indigo-600
                        to-blue-700 min-h-[620px]">

          {/* Animated blobs */}
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 left-10 w-60 h-60 rounded-full
                       bg-cyan-400/25 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-16 right-10 w-72 h-72 rounded-full
                       bg-pink-400/20 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full
                       bg-white/10 blur-2xl pointer-events-none"
          />

          {/* Top logo mark */}
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20
                            backdrop-blur-sm border border-white/30
                            flex items-center justify-center text-lg">
              
            </div>
          </div>

          {/* Feature list */}
          <div className="relative z-10">
            <p className="text-white/60 text-sm mb-3 font-light">
              You can easily
            </p>
            <h2 className="text-white text-3xl font-light leading-tight
                           tracking-tight mb-6">
              Get access to your<br />
              personal hub for<br />
              <span className="font-normal">clarity and productivity</span>
            </h2>

            <div className="flex flex-col gap-2.5">
              {[
                "AI that knows your context",
                "Tasks linked to your goals",
                "Notes that feed AI memory",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <p className="text-white/60 text-sm">{text}</p>
                </div>
              ))}
            </div>
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
            className="mb-7"
          >
            <div className="text-indigo-400 text-2xl mb-4">✦</div>
            <h1 className="text-3xl font-light text-white/90 tracking-tight mb-1">
              Create an account
            </h1>
            <p className="text-sm text-white/35">
              Access your tasks, notes, and goals — keep everything in one place.
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0  }}
              className="mb-4 px-4 py-3 rounded-xl bg-red-500/10
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
            className="flex flex-col gap-3.5"
          >

            {/* Username */}
            <div>
              <label className="text-[11px] font-medium tracking-widest
                                uppercase text-white/35 mb-2 block">
                Username
              </label>
              <input
                type="text"
                autoFocus
                placeholder="yourname"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10
                           rounded-xl px-4 py-3.5 text-sm text-white/80
                           placeholder:text-white/20 outline-none
                           focus:border-indigo-400/60 focus:bg-white/[0.09]
                           transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-medium tracking-widest
                                uppercase text-white/35 mb-2 block">
                Your email
              </label>
              <input
                type="email"
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
                             placeholder:text-white/20 outline-none pr-12
                             focus:border-indigo-400/60 focus:bg-white/[0.09]
                             transition-all duration-200"
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

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: strengthConfig.width }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${strengthConfig.color}`}
                    />
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    {strengthConfig.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[11px] font-medium tracking-widest
                                uppercase text-white/35 mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConf ? "text" : "password"}
                  placeholder="••••••••••"
                  value={form.confirm}
                  onChange={(e) => handleChange("confirm", e.target.value)}
                  className={`
                    w-full bg-white/[0.06] border rounded-xl px-4 py-3.5
                    text-sm text-white/80 placeholder:text-white/20
                    outline-none pr-12 transition-all duration-200
                    ${form.confirm && form.confirm !== form.password
                      ? "border-red-400/40"
                      : form.confirm && form.confirm === form.password
                      ? "border-emerald-400/40"
                      : "border-white/10 focus:border-indigo-400/60"}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConf((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-white/25 hover:text-white/60
                             transition-colors duration-200 text-xs"
                >
                  {showConf ? "HIDE" : "SHOW"}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-[11px] text-red-300/70 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 mt-1 rounded-xl
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
                  Creating account…
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
            className="flex items-center gap-3 my-5"
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

          {/* Login link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-white/30 mt-6"
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300
                         transition-colors duration-200 font-medium"
            >
              Sign in
            </Link>
          </motion.p>
        </div>

      </motion.div>
    </div>
  );
}
