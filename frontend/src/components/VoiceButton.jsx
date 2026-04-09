// frontend/src/components/VoiceButton.jsx

import { useRef, useCallback }      from "react";
import { motion, AnimatePresence }  from "framer-motion";
import {
  useSpeechRecognition,
  isSpeechSupported,
} from "../hooks/useSpeechRecognition";

export default function VoiceButton({
  onTranscript,
  size      = "md",
  className = "",
}) {
  // Keep latest onTranscript in a ref — prevents stale closure
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const handleResult = useCallback((text) => {
    console.log("VoiceButton got text:", text);
    onTranscriptRef.current?.(text);
  }, []);

  const {
    isListening,
    isSupported,
    interimText,
    error,
    toggleListening,
  } = useSpeechRecognition({
    onResult: handleResult,
  });

  if (!isSupported) return null;

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  }[size] ?? "w-9 h-9";

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size] ?? 14;

  return (
    <div className="relative flex flex-col items-center">

      {/* Mic button */}
      <motion.button
        type="button"
        onClick={toggleListening}
        whileTap={{ scale: 0.92 }}
        title={isListening ? "Stop listening" : "Speak to type"}
        className={`
          ${sizeClasses} ${className}
          rounded-xl flex items-center justify-center shrink-0
          transition-all duration-200 relative overflow-hidden
          ${isListening
            ? "bg-red-500/20 border border-red-400/40 text-red-300"
            : "bg-white/[0.06] border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10"}
        `}
      >
        {/* Pulse ring */}
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-xl bg-red-400/20 pointer-events-none"
          />
        )}

        <MicIcon size={iconSize} active={isListening} />
      </motion.button>

      {/* Live feedback bubble */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                       bg-[#1e1b3a] border border-white/10 rounded-2xl
                       px-3 py-2.5 z-50 shadow-2xl
                       min-w-[140px] max-w-[260px] text-center"
            style={{ whiteSpace: "nowrap" }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <SoundBars />
              <span className="text-[11px] text-red-300/80 font-medium">
                Listening…
              </span>
            </div>
            {interimText && (
              <p className="text-[11px] text-white/40 italic truncate
                            max-w-[220px] text-center">
                {interimText}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0       }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                       bg-red-500/15 border border-red-400/25 rounded-xl
                       px-3 py-2 z-50 text-center"
            style={{ minWidth: "160px" }}
          >
            <p className="text-[11px] text-red-300/80">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MicIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect
        x="5.5" y="1" width="5" height="8" rx="2.5"
        stroke="currentColor" strokeWidth="1.2"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.2 : 0}
      />
      <path
        d="M3 7.5C3 10.537 5.239 13 8 13C10.761 13 13 10.537 13 7.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
      />
      <line x1="8" y1="13" x2="8" y2="15"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5.5" y1="15" x2="10.5" y2="15"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function SoundBars() {
  return (
    <div className="flex items-center gap-[2px]">
      {[6, 10, 14, 10, 6].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [h * 0.4, h, h * 0.4] }}
          transition={{
            duration:   0.6,
            repeat:     Infinity,
            delay:      i * 0.1,
            ease:       "easeInOut",
          }}
          style={{ width: "2px", borderRadius: "1px" }}
          className="bg-red-400/70"
        />
      ))}
    </div>
  );
}