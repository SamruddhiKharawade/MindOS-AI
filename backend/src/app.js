import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import goalRoutes from "./routes/goal.routes.js";
import aiRoutes   from "./routes/ai.routes.js";
import noteRoutes from "./routes/note.routes.js";

const app = express();


// ─── Global Middleware ─────────────────────────────────────────────────────────

// Allow frontend (React on port 5173) to talk to backend (port 5000)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Parse incoming JSON request bodies
app.use(express.json());
app.use(cookieParser());



// ─── Health Check Route ────────────────────────────────────────────────────────
// Useful to quickly verify the server is alive
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MindOS API is running ",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Any route that calls next(error) lands here
// This prevents the app from crashing on unhandled errors
app.use((err, req, res, next) => {
  console.log("🔥 FULL ERROR OBJECT:", err); // useful debug
  console.error("🔥 Error message:", err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;