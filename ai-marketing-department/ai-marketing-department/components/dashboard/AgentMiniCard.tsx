"use client";

import { cn } from "@/lib/utils";

interface AgentMiniCardProps {
  name: string;
  role: string;
  status: "active" | "paused" | "error" | "maintenance";
  currentTask?: string;
}

const statusConfig: Record<string, { color: string; pulse?: boolean }> = {
  active: { color: "bg-green-500", pulse: false },
  paused: { color: "bg-gray-400", pulse: false },
  error: { color: "bg-red-500", pulse: true },
  maintenance: { color: "bg-amber-500", pulse: false },
};

export function AgentMiniCard({ name, role, status, currentTask }: AgentMiniCardProps) {
  const config = statusConfig[status] || statusConfig.paused;
  const isActive = status === "active" && currentTask;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2",
        "transition-all duration-200 hover:border-orange-300"
      )}
    >
      {/* Status dot with pulse for error state */}
      <div className="flex items-start gap-2 mb-1">
        <div className="relative shrink-0 h-2 w-2 mt-0.5">
          <div className={cn("absolute inset-0 rounded-full", config.color)} />
          {config.pulse && (
            <div
              className={cn(
                "absolute inset-0 rounded-full opacity-60 animate-pulse",
                config.color
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Agent name */}
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{name}</p>
          {/* Agent role */}
          <p className="text-[10px] text-[var(--text-tertiary)] truncate">{role}</p>
        </div>
      </div>

      {/* Current task (only if active and exists) */}
      {isActive && currentTask && (
        <div className="mt-1.5 pl-4">
          <p className="text-[10px] text-orange-500 truncate">{currentTask}</p>
        </div>
      )}
    </div>
  );
}
