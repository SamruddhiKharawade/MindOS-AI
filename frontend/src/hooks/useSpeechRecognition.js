// frontend/src/hooks/useSpeechRecognition.js

import { useState, useRef, useCallback, useEffect } from "react";

export const isSpeechSupported = () =>
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition({ onResult, language = "en-US" } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error,       setError]       = useState("");

  const recognitionRef = useRef(null);
  const onResultRef    = useRef(onResult);

  // Keep callback ref up to date — fixes stale closure bug
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (isListening) return;

    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SR) {
      setError("Speech recognition not supported.");
      return;
    }

    const recognition        = new SR();
    recognition.lang         = language;
    recognition.continuous   = false;
    recognition.interimResults = true;
    recognitionRef.current   = recognition;

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started");
      setIsListening(true);
      setError("");
      setInterimText("");
    };

    recognition.onresult = (event) => {
      console.log("🎤 Got result event", event);

      let interim = "";
      let final   = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text   = result[0].transcript;
        console.log(`Result ${i}: "${text}" final=${result.isFinal}`);

        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (interim) setInterimText(interim);

      if (final) {
        console.log("✅ Final transcript:", final);
        setInterimText("");
        // Use ref so we always call latest version of callback
        onResultRef.current?.(final.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("🎤 Speech error:", event.error, event);
      setIsListening(false);
      setInterimText("");

      const msgs = {
        "no-speech":   "No speech detected. Try again.",
        "not-allowed": "Microphone blocked. Allow it in browser settings.",
        "network":     "Network error. Try again.",
        "aborted":     "",
      };

      const msg = msgs[event.error] ?? `Error: ${event.error}`;
      if (msg) {
        setError(msg);
        setTimeout(() => setError(""), 4000);
      }
    };

    recognition.onend = () => {
      console.log("🎤 Speech recognition ended");
      setIsListening(false);
      setInterimText("");
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("🎤 Start error:", err);
      setError("Could not start microphone.");
      setIsListening(false);
    }
  }, [isListening, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    isListening,
    isSupported:  isSpeechSupported(),
    interimText,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}