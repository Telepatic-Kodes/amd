"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Assume online during SSR to avoid hydration mismatch
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[var(--badge-amber-bg)] border-b border-[var(--warning)]/25 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-[var(--badge-amber-text)]">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Sin conexión a internet — Los cambios se sincronizarán al reconectar</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
