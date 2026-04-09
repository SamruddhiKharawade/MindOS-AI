// backend/src/services/ai.service.js

import OpenAI                from "openai";
import Task                  from "../models/Task.js";
import Goal                  from "../models/Goal.js";
import Note                  from "../models/Note.js";
import { saveAITasksToGoal } from "./goal.service.js";

console.log("AI ROUTE KEY:", process.env.GROQ_API_KEY );
// ─── Initialize OpenAI ────────────────────────────────────────────────────────
const GROQ_KEY  = process.env.GROQ_API_KEY ;

if (!GROQ_KEY ) {
  console.warn("⚠️  GROQ_API_KEY not set — AI features will not work");
}

const client = new OpenAI({
  apiKey: GROQ_KEY  || "placeholder",
  baseURL: "https://api.groq.com/openai/v1",
});

//const MODELS = await client.models.list();
//console.log(MODELS);

const MODEL="llama-3.3-70b-versatile";     
// ─── Helper ───────────────────────────────────────────────────────────────────
const createError = (message, statusCode = 500) => {
  const error      = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const safeArray = (arr) => (Array.isArray(arr) ? arr.filter(Boolean) : []);

// ─── BUILD USER CONTEXT ───────────────────────────────────────────────────────
const buildUserContext = async (userId) => {
  if (!userId) {
    throw createError("User ID missing in context builder", 400);
  }

  const [tasksRaw, goalsRaw, notesRaw] = await Promise.all([
    Task.find({ user: userId, status: { $ne: "done" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Goal.find({ user: userId, status: "active" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Note.find({ user: userId, isArchived: false })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const tasks = safeArray(tasksRaw);
  const goals = safeArray(goalsRaw);
  const notes = safeArray(notesRaw);

  const tasksContext =
    tasks.length > 0
      ? tasks
          .map((t) =>
            `- [${(t.priority || "LOW").toUpperCase()}] ${t.title || "Untitled"} (${t.status || "unknown"})${
              t.dueDate ? ` | Due: ${new Date(t.dueDate).toDateString()}` : ""
            }`
          )
          .join("\n")
      : "No pending tasks";

  const goalsContext =
    goals.length > 0
      ? goals
          .map((g) =>
            `- [${(g.category || "GENERAL").toUpperCase()}] ${g.title || "Untitled"}${
              g.deadline ? ` | Deadline: ${new Date(g.deadline).toDateString()}` : ""
            }`
          )
          .join("\n")
      : "No active goals";

  const notesContext =
    notes.length > 0
      ? notes
          .map((n) =>
            `- [${n.isPinned ? "PINNED" : (n.type || "NOTE").toUpperCase()}] ${n.title || "Untitled"}: ${
              (n.content || "").substring(0, 200)
            }${(n.content || "").length > 200 ? "..." : ""}`
          )
          .join("\n")
      : "No notes saved";

  return `
=== USER CONTEXT (MindOS Personal Data) ===

📋 PENDING TASKS:
${tasksContext}

🎯 ACTIVE GOALS:
${goalsContext}

📝 NOTES & MEMORY:
${notesContext}

===========================================
  `.trim();
};

// ─── BUILD SYSTEM PROMPT ──────────────────────────────────────────────────────
const buildSystemPrompt = (contextBlock, username) => {
  return `
You are MindOS AI — a calm, intelligent personal operating system and life coach.

You are speaking with ${username || "the user"}.

Your personality:
- Thoughtful, warm, and direct
- You speak like a brilliant friend, not a corporate assistant
- You are proactive — you notice patterns and suggest actions
- You are concise — no unnecessary filler or padding
- You help the user think clearly, plan effectively, and stay focused

Your capabilities:
- You have access to the user's tasks, goals, and personal notes
- You use this context to give highly personalized responses
- You connect dots across different areas of the user's life
- You suggest next actions when relevant
- You help break down complex goals into clear steps

Rules:
- Always use the user's context below when relevant
- Never make up tasks or goals that aren't in the context
- If you notice something important, mention it proactively
- Keep responses focused and actionable
- Format responses clearly using markdown when helpful

${contextBlock}
  `.trim();
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const chat = async (userMessage, history = [], userId, username) => {
  if (!userMessage || userMessage.trim() === "") {
    throw createError("Message cannot be empty", 400);
  }

  const contextBlock = await buildUserContext(userId);
  const systemPrompt = buildSystemPrompt(contextBlock, username);

  const formattedHistory = history
    .filter((msg) => msg && msg.role && msg.content)
    .map((msg) => ({
      role:  msg.role === "assistant" ? "assistant" : "user",
      content: String(msg.content),
    }));

  // Build messages array for OpenAI
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...formattedHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: messages,
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  });

  const reply = result.choices[0]?.message?.content;

  if (!reply) {
    throw createError("No response received from AI", 500);
  }

  const [tasksCount, goalsCount, notesCount] = await Promise.all([
    Task.countDocuments({ user: userId, status: { $ne: "done" } }),
    Goal.countDocuments({ user: userId, status: "active"        }),
    Note.countDocuments({ user: userId, isArchived: false       }),
  ]);

  return {
    reply,
    contextUsed: { tasksCount, goalsCount, notesCount },
  };
};

// ─── BREAK GOAL INTO TASKS ────────────────────────────────────────────────────
export const breakGoalIntoTasks = async (goalId, userId) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    throw createError("Goal not found", 404);
  }

  const prompt = `
You are a productivity expert and life coach.

The user has the following goal:
Title: "${goal.title}"
Description: "${goal.description || "No description provided"}"
Category: "${goal.category}"
${goal.deadline ? `Deadline: ${new Date(goal.deadline).toDateString()}` : ""}

Your job:
Break this goal into 5 to 8 clear, specific, actionable tasks.

Rules:
- Each task must be concrete and completable
- Tasks should be ordered logically
- Keep each task title under 100 characters
- Do NOT number the tasks
- Return ONLY the task titles, one per line
- No extra explanation, no bullet points, no markdown
  `.trim();

  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const rawResponse = result.choices?.[0]?.message?.content;

  if (!rawResponse) {
    throw createError("AI failed to generate tasks or returned an empty response", 500);
  }

  const taskTitles = rawResponse
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length <= 200);

  if (taskTitles.length === 0) {
    throw createError("AI returned no valid tasks", 500);
  }

  const updatedGoal = await saveAITasksToGoal(
    goalId,
    taskTitles,
    rawResponse,
    userId,
  );

  return updatedGoal;
};

// ─── SAVE MEMORY ─────────────────────────────────────────────────────────────
export const saveMemory = async (noteData, userId) => {
  const { title, content, type, tags, isPinned } = noteData;

  if (!content || content.trim() === "") {
    throw createError("Memory content cannot be empty", 400);
  }

  const note = await Note.create({
    title:      title      || "AI Memory",
    content:    content.trim(),
    type:       type       || "ai-memory",
    tags:       tags       || [],
    isPinned:   isPinned   || false,
    isArchived: false,
    user:       userId,
  });

  return note;
};
