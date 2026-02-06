"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AgentCardProps {
  name: string;
  status: "active" | "paused" | "error" | "maintenance";
  lastAction?: string;
  lastActionTime?: number;
  onClick?: () => void;
}

const statusConfig: Record<string, { color: string; label: string; pulse?: boolean }> = {
  active: { color: "bg-emerald-500", label: "Activo", pulse: true },
  paused: { color: "bg-amber-500", label: "Pausado" },
  error: { color: "bg-red-500", label: "Error", pulse: true },
  maintenance: { color: "bg-orange-400", label: "Mantenimiento" },
};

function humanizeAction(desc: string): string {
  if (desc === "Ejecución exitosa") return "Ejecucion exitosa";
  if (desc === "Ejecución fallida") return "Ejecucion fallida";
  if (desc.match(/^scheduled_/i)) return "Tarea programada";
  if (desc.match(/^manual_/i)) return "Tarea manual";
  if (desc.match(/^[a-z_]+-\d{3}\s*-\s*\d{4}-/i)) return "Tarea ejecutada";
  // Truncate long descriptions
  return desc.length > 40 ? desc.slice(0, 37) + "..." : desc;
}

export function AgentCard({ name, status, lastAction, lastActionTime, onClick }: AgentCardProps) {
  const config = statusConfig[status] || statusConfig.paused;

  const timeAgo = lastActionTime
    ? formatDistanceToNow(new Date(lastActionTime), { addSuffix: true, locale: es })
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3",
        "transition-colors hover:border-[var(--border-hover)]",
        "focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative shrink-0">
          <div className={cn("h-2 w-2 rounded-full", config.color)} />
          {config.pulse && (
            <div className={cn("absolute inset-0 h-2 w-2 rounded-full animate-status-pulse", config.color)} />
          )}
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{name}</span>
      </div>
      {(lastAction || timeAgo) && (
        <p className="text-xs text-[var(--text-tertiary)] truncate pl-4 mt-0.5">
          {lastAction && humanizeAction(lastAction)}
          {lastAction && timeAgo && " · "}
          {timeAgo}
        </p>
      )}
    </button>
  );
}
