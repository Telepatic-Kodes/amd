"use client";

import { motion } from "framer-motion";
import { Crown, Briefcase, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  description?: string;
  department: string;
  role: string;
  status: string;
}

interface AgentNodeProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const departmentColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  leadership: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  content: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  social: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
  },
  demandgen: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  seo: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  brand: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  ops: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-yellow-500",
  error: "bg-red-500",
  maintenance: "bg-orange-500",
};

const RoleIcon = ({ role, className }: { role: string; className?: string }) => {
  switch (role) {
    case "cmo":
      return <Crown className={className} />;
    case "director":
      return <Briefcase className={className} />;
    default:
      return <User className={className} />;
  }
};

export function AgentNode({ agent, isSelected, onClick, size = "md" }: AgentNodeProps) {
  const colors = departmentColors[agent.department] || departmentColors.content;
  const statusColor = statusColors[agent.status] || statusColors.active;

  const sizeClasses = {
    sm: "px-3 py-2 min-w-[120px]",
    md: "px-4 py-3 min-w-[160px]",
    lg: "px-6 py-4 min-w-[200px]",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl border backdrop-blur-xl transition-all",
        sizeClasses[size],
        colors.bg,
        colors.border,
        isSelected && `ring-2 ring-offset-2 ring-offset-[var(--surface-0)] ${colors.border.replace("border-", "ring-")} shadow-lg ${colors.glow}`,
        "hover:shadow-lg",
        `hover:${colors.glow}`
      )}
    >
      {/* Status indicator */}
      <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white", statusColor)} />

      {/* Content */}
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
          <RoleIcon role={agent.role} className={iconSizes[size]} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-stone-900 truncate", textSizes[size])}>
            {agent.name}
          </p>
          <p className={cn("text-stone-500 truncate", size === "sm" ? "text-[10px]" : "text-xs")}>
            {agent.agentId}
          </p>
        </div>
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-opacity",
          colors.glow.replace("shadow-", "bg-").replace("/20", "/5")
        )}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  );
}

export function AgentNodeSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-3 py-2 min-w-[120px] h-[52px]",
    md: "px-4 py-3 min-w-[160px] h-[64px]",
    lg: "px-6 py-4 min-w-[200px] h-[76px]",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-stone-100/50 animate-pulse",
        sizeClasses[size]
      )}
    />
  );
}
