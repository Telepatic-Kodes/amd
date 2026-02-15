"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT_MS = 28 * 60 * 1000; // 28 minutes
const WARNING_DURATION_MS = 2 * 60 * 1000; // 2 minutes countdown

export function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Start idle timer without resetting state (safe to call from effect body)
  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(120);

      const start = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, Math.ceil((WARNING_DURATION_MS - elapsed) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          router.push("/sign-in");
        }
      }, 1000);
    }, IDLE_TIMEOUT_MS);
  }, [router]);

  // Full reset: clear warning state + restart timer (event handlers only)
  const resetIdleTimer = useCallback(() => {
    setShowWarning(false);
    setSecondsLeft(120);
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    const handleActivity = () => {
      if (!showWarning) {
        resetIdleTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));
    startIdleTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [startIdleTimer, resetIdleTimer, showWarning]);

  const handleContinue = () => {
    resetIdleTimer();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm mx-4 bg-[var(--card-bg)] rounded-2xl shadow-2xl p-6 text-center space-y-4"
          >
            <Clock className="mx-auto h-10 w-10 text-[var(--warning)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Sesión por expirar
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Tu sesión se cerrará por inactividad en{" "}
              <span className="font-mono font-bold text-[var(--warning)]">
                {formatTime(secondsLeft)}
              </span>
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleContinue}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-on-accent)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
              >
                Seguir trabajando
              </button>
              <button
                onClick={() => router.push("/sign-in")}
                className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
