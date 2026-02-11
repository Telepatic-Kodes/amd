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
        status === "waiting" && "border-stone-700 bg-stone-800/50",
        status === "activating" && "border-orange-500/50 bg-orange-500/10",
        status === "online" && "border-green-500/50 bg-green-500/10"
      )}
    >
      {/* Glow effect when activating */}
      {status === "activating" && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-orange-500/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div
        className={cn(
          "p-2.5 rounded-lg transition-colors duration-500",
          status === "waiting" && "bg-stone-700",
          status === "activating" && "bg-orange-500/20",
          status === "online" && "bg-green-500/20"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-colors duration-500",
            status === "waiting" && "text-stone-500",
            status === "activating" && "text-orange-400",
            status === "online" && "text-green-400"
          )}
        />
      </div>

      <div className="text-center">
        <p
          className={cn(
            "text-sm font-medium transition-colors duration-500",
            status === "waiting" && "text-stone-400",
            status === "activating" && "text-orange-300",
            status === "online" && "text-green-300"
          )}
        >
          {label}
        </p>
        <p className="text-xs text-stone-500">
          {agentCount} agente{agentCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        {status === "waiting" && (
          <>
            <Clock className="w-3 h-3 text-stone-600" />
            <span className="text-[10px] text-stone-600">Esperando</span>
          </>
        )}
        {status === "activating" && (
          <>
            <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
            <span className="text-[10px] text-orange-400">Activando</span>
          </>
        )}
        {status === "online" && (
          <>
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-400">Online</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
