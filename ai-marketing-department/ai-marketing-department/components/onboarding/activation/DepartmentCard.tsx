"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Palette,
  PenTool,
  Search,
  Share2,
  Target,
  Settings,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  crown: Crown,
  palette: Palette,
  "pen-tool": PenTool,
  search: Search,
  "share-2": Share2,
  target: Target,
  settings: Settings,
};

export type DepartmentStatus = "waiting" | "activating" | "online";

interface DepartmentCardProps {
  label: string;
  icon: string;
  agentCount: number;
  status: DepartmentStatus;
  delay: number;
}

export function DepartmentCard({
  label,
  icon,
  agentCount,
  status,
  delay,
}: DepartmentCardProps) {
  const Icon = ICONS[icon] || Settings;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-500",
        status === "waiting" && "border-[var(--border)] bg-[var(--surface-2)]/50",
        status === "activating" && "border-[var(--accent)]/50 bg-[var(--accent)]/10",
        status === "online" && "border-green-500/50 bg-green-500/10"
      )}
    >
      {/* Glow effect when activating */}
      {status === "activating" && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-[var(--accent)]/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div
        className={cn(
          "p-2.5 rounded-lg transition-colors duration-500",
          status === "waiting" && "bg-[var(--surface-2)]",
          status === "activating" && "bg-[var(--accent)]/20",
          status === "online" && "bg-green-500/20"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-colors duration-500",
            status === "waiting" && "text-[var(--text-tertiary)]",
            status === "activating" && "text-[var(--accent)]",
            status === "online" && "text-[var(--success)]"
          )}
        />
      </div>

      <div className="text-center">
        <p
          className={cn(
            "text-sm font-medium transition-colors duration-500",
            status === "waiting" && "text-[var(--text-tertiary)]",
            status === "activating" && "text-orange-300",
            status === "online" && "text-[var(--success)]"
          )}
        >
          {label}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {agentCount} agente{agentCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        {status === "waiting" && (
          <>
            <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
            <span className="text-[10px] text-[var(--text-secondary)]">Esperando</span>
          </>
        )}
        {status === "activating" && (
          <>
            <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
            <span className="text-[10px] text-[var(--accent)]">Activando</span>
          </>
        )}
        {status === "online" && (
          <>
            <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
            <span className="text-[10px] text-[var(--success)]">Online</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
