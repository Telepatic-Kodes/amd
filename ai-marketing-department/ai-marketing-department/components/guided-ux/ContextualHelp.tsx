"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X } from "lucide-react";
import { isTooltipDismissed, dismissTooltip } from "@/lib/guidance-state";

interface ContextualHelpProps {
  id: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ContextualHelp({
  id,
  content,
  placement = "bottom",
  showOnce = false,
  children,
  className,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if this tooltip was permanently dismissed
  const wasDismissed = showOnce && isTooltipDismissed(id);

  const handleToggle = useCallback(() => {
    if (wasDismissed) return;
    setIsOpen((prev) => !prev);
  }, [wasDismissed]);

  const handleDismiss = useCallback(() => {
    if (showOnce) {
      dismissTooltip(id);
    }
    setIsOpen(false);
  }, [id, showOnce]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (wasDismissed) return <>{children}</>;

  const tooltipPosition = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[placement];

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className || ""}`}>
      {children}

      <div ref={triggerRef}>
        <button
          onClick={handleToggle}
          className="p-0.5 rounded-full text-stone-600 hover:text-stone-400 hover:bg-stone-200/50 transition-colors"
          aria-label="Ayuda"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${tooltipPosition} w-64`}
          >
            <div className="rounded-lg border border-stone-300 bg-stone-100 shadow-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-stone-500 leading-relaxed">
                  {content}
                </p>
                <button
                  onClick={handleDismiss}
                  className="p-0.5 rounded text-stone-600 hover:text-stone-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {showOnce && (
                <p className="text-[10px] text-stone-600 mt-2">
                  No se mostrará de nuevo
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
