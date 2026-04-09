// frontend/src/pages/Chat.jsx
import VoiceButton from "../components/VoiceButton";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiAPI } from "../services/api";

// ─── Variants ─────────────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const bubbleVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

// ─── Unique ID generator ──────────────────────────────────────────────────────
// Never use array index as key — use this instead
let _msgCounter = 0;
const genId = () => `msg_${++_msgCounter}_${Date.now()}`;

// ─── Welcome message ──────────────────────────────────────────────────────────
const makeWelcome = () => ({
  id: genId(),
  role: "assistant",
  content:
    "Hello! I'm MindOS AI — your personal operating system. I can see your tasks, goals, and notes, so I can give you advice that's actually relevant to your life. What's on your mind?",
  timestamp: new Date(),
});

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "What should I focus on today?",
  "Break down my top goal into tasks",
  "How am I progressing this week?",
  "What's blocking me right now?",
];

// ─── Chat Page ────────────────────────────────────────────────────────────────
export default function Chat() {
  const [messages, setMessages] = useState(() => [makeWelcome()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Focus input on mount ───────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Fetch context ──────────────────────────────────────────────────────────
  const fetchContext = useCallback(async () => {
    try {
      const res = await aiAPI.getContext();
      if (res?.data?.data) {
        setContext(res.data.data);
      }
    } catch {
      // Non-critical — context panel just won't show data
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setError("");
    setInput("");

    // Build user message — always has a valid id
    const userMessage = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Build history for backend — skip welcome message
    const history = messages
      .filter((m) => m.role !== "error")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await aiAPI.chat(trimmed, history);
      const reply = res?.data?.data?.reply;

      if (!reply || typeof reply !== "string") {
        throw new Error("Invalid response from AI");
      }

      const aiMessage = {
        id: genId(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        contextUsed: res?.data?.data?.contextUsed || null,
      };

      setMessages((prev) => [...prev, aiMessage]);
      fetchContext();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.userMessage ||
        err?.message ||
        "Something went wrong. Please try again.";

      // Add error bubble — always with a valid id
      const errorMessage = {
        id: genId(),
        role: "error",
        content:
          typeof errMsg === "string"
            ? errMsg
            : "Something went wrong. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError(typeof errMsg === "string" ? errMsg : "Something went wrong.");
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear chat ─────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([makeWelcome()]);
    setError("");
    inputRef.current?.focus();
  };

  // ── Set input from quick prompt ────────────────────────────────────────────
  const useQuickPrompt = (prompt) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="flex h-full"
    >
      {/* ── Main Chat Column ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div
          className="flex items-center justify-between
                        px-6 py-4 border-b border-white/5 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl
                            bg-gradient-to-br from-indigo-500/40 to-violet-500/40
                            border border-indigo-400/20
                            flex items-center justify-center text-base"
            >
              ✦
            </div>
            <div>
              <p className="text-sm font-medium text-white/85">MindOS AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] text-white/35">
                  Context-aware · Gemini powered
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContext((v) => !v)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border
                transition-colors duration-200
                ${
                  showContext
                    ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                }
              `}
            >
              {showContext ? "Hide context" : "AI context"}
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded-full text-xs font-medium
                         bg-white/5 border border-white/10 text-white/40
                         hover:text-white/60 transition-colors duration-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Quick prompts — only when chat is fresh */}
          <AnimatePresence>
            {messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-wrap gap-2 mb-2"
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => useQuickPrompt(prompt)}
                    className="px-3 py-2 rounded-xl
                               bg-white/[0.04] border border-white/[0.08]
                               text-xs text-white/50
                               hover:bg-white/[0.08] hover:text-white/70
                               transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message bubbles — always keyed by msg.id which is always defined */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              // Safety guard — never render a message without an id
              if (!msg || !msg.id) return null;
              return <MessageBubble key={msg.id} message={msg} />;
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && typeof error === "string" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-6 mb-2 px-4 py-2 rounded-xl
                         bg-red-500/10 border border-red-400/20
                         text-red-300 text-xs flex items-center justify-between"
            >
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-300/40 hover:text-red-300
                           transition-colors ml-3 text-xs"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-6 pb-6 pt-3 border-t border-white/5 shrink-0">
          <form
            onSubmit={sendMessage}
            className="flex items-end gap-3
             bg-white/[0.05] border border-white/10
             rounded-2xl px-4 py-3
             focus-within:border-indigo-400/40
             focus-within:bg-white/[0.07]
             transition-all duration-200"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… or tap the mic to speak"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white/80
               placeholder:text-white/25 outline-none resize-none
               leading-relaxed max-h-32 overflow-y-auto"
              style={{ minHeight: "24px" }}
            />
           <VoiceButton
  size="md"
  onTranscript={(text) => {
    setInput((prev) => (prev + " " + text).trim());
    setTimeout(() => inputRef.current?.focus(), 150);
  }}
/>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl shrink-0
               bg-gradient-to-br from-indigo-500 to-violet-500
               flex items-center justify-center
               disabled:opacity-30 disabled:cursor-not-allowed
               hover:opacity-90 active:scale-95
               transition-all duration-200"
            >
              {isTyping ? (
                <div
                  className="w-4 h-4 border-2 border-white/40
                      border-t-white rounded-full animate-spin"
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13 8L3 3L5.5 8L3 13L13 8Z"
                    fill="white"
                    opacity="0.9"
                  />
                </svg>
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-white/15 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── Context Sidebar ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showContext && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-l border-white/5 overflow-hidden shrink-0"
          >
            <ContextPanel context={context} />
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  // Hard guard — never crash if message is malformed
  if (!message || !message.id || !message.content) return null;

  const isUser = message.role === "user";
  const isError = message.role === "error";

  if (isError) {
    return (
      <motion.div
        variants={bubbleVariants}
        initial="initial"
        animate="animate"
        className="flex justify-center"
      >
        <p
          className="text-xs text-red-300/70 px-4 py-2
                      bg-red-500/10 rounded-full border border-red-400/15
                      max-w-md text-center"
        >
          {message.content}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar — only for AI */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg shrink-0 mt-0.5
                        bg-gradient-to-br from-indigo-500/30 to-violet-500/30
                        border border-indigo-400/20
                        flex items-center justify-center
                        text-xs text-indigo-300"
        >
          ✦
        </div>
      )}

      {/* Bubble content */}
      <div
        className={`
        max-w-[78%] flex flex-col gap-1
        ${isUser ? "items-end" : "items-start"}
      `}
      >
        <div
          className={`
          px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${
            isUser
              ? "bg-indigo-500/20 border border-indigo-400/25 text-white/85 rounded-tr-sm"
              : "bg-white/[0.06] border border-white/[0.08] text-white/80 rounded-tl-sm"
          }
        `}
        >
          {/* Render preserving line breaks */}
          {String(message.content)
            .split("\n")
            .map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-white/20 px-1">
          {formatTime(message.timestamp)}
        </p>

        {/* Context indicator on AI messages */}
        {!isUser && message.contextUsed && (
          <p className="text-[10px] text-indigo-300/30 px-1">
            ✦ read {message.contextUsed.tasksCount ?? 0} tasks ·{" "}
            {message.contextUsed.goalsCount ?? 0} goals ·{" "}
            {message.contextUsed.notesCount ?? 0} notes
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-lg shrink-0
                      bg-gradient-to-br from-indigo-500/30 to-violet-500/30
                      border border-indigo-400/20
                      flex items-center justify-center text-xs text-indigo-300"
      >
        ✦
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3
                      bg-white/[0.06] border border-white/[0.08]
                      rounded-2xl rounded-tl-sm"
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
            className="w-1.5 h-1.5 rounded-full bg-indigo-300/60"
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Context Panel ────────────────────────────────────────────────────────────
function ContextPanel({ context }) {
  if (!context) {
    return (
      <div className="p-5 flex items-center justify-center h-full">
        <div
          className="w-5 h-5 border-2 border-white/20
                        border-t-indigo-400 rounded-full animate-spin"
        />
      </div>
    );
  }

  const {
    summary = {},
    pendingTasks = [],
    activeGoals = [],
    pinnedNotes = [],
  } = context;

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-5 w-[280px]">
      {/* Header */}
      <div>
        <p
          className="text-[11px] font-medium tracking-wider
                      uppercase text-white/30 mb-3"
        >
          AI Context
        </p>

        {/* Summary pills */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Tasks", value: summary.pendingTasksCount ?? 0 },
            { label: "Goals", value: summary.activeGoalsCount ?? 0 },
            { label: "Pinned", value: summary.pinnedNotesCount ?? 0 },
            { label: "Notes", value: summary.recentNotesCount ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-white/[0.04] border border-white/[0.07]
                         p-3 text-center"
            >
              <p className="text-lg font-light text-white/80">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <ContextSection title="Pending tasks">
          {pendingTasks
            .slice(0, 5)
            .filter(Boolean)
            .map((task) =>
              task?._id ? (
                <ContextItem
                  key={task._id}
                  primary={task.title}
                  badge={task.priority}
                  badgeColor={
                    task.priority === "high"
                      ? "text-red-300/70 bg-red-500/10"
                      : task.priority === "medium"
                        ? "text-orange-300/70 bg-orange-500/10"
                        : "text-emerald-300/70 bg-emerald-500/10"
                  }
                />
              ) : null,
            )}
        </ContextSection>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <ContextSection title="Active goals">
          {activeGoals
            .slice(0, 3)
            .filter(Boolean)
            .map((goal) =>
              goal?._id ? (
                <ContextItem
                  key={goal._id}
                  primary={goal.title}
                  badge={goal.category}
                  badgeColor="text-indigo-300/70 bg-indigo-500/10"
                />
              ) : null,
            )}
        </ContextSection>
      )}

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <ContextSection title="Pinned memory">
          {pinnedNotes
            .filter(Boolean)
            .map((note) =>
              note?._id ? (
                <ContextItem
                  key={note._id}
                  primary={note.title}
                  sub={
                    typeof note.content === "string"
                      ? note.content.substring(0, 60) + "…"
                      : ""
                  }
                />
              ) : null,
            )}
        </ContextSection>
      )}
    </div>
  );
}

// ─── Context Section ──────────────────────────────────────────────────────────
function ContextSection({ title, children }) {
  return (
    <div>
      <p
        className="text-[10px] font-medium tracking-wider
                    uppercase text-white/20 mb-2"
      >
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

// ─── Context Item ─────────────────────────────────────────────────────────────
function ContextItem({ primary, sub, badge, badgeColor }) {
  return (
    <div
      className="flex items-start justify-between gap-2
                    px-3 py-2 rounded-lg bg-white/[0.03]
                    border border-white/[0.05]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-white/60 leading-snug truncate">
          {primary}
        </p>
        {sub && (
          <p className="text-[10px] text-white/25 mt-0.5 leading-snug">{sub}</p>
        )}
      </div>
      {badge && (
        <span
          className={`
          text-[9px] font-medium tracking-wide uppercase
          px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor}
        `}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}
