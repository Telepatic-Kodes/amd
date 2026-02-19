"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Pause, Play, RefreshCw } from "lucide-react";

interface AgentListItemProps {
  agent: Doc<"agents">;
  isSelected: boolean;
  onSelect: () => void;
  onExecute: () => void;
  onTogglePause: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-[var(--success)]",
  paused: "bg-amber-500",
  error: "bg-[var(--error)]",
  maintenance: "bg-blue-500",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  error: "Error",
  maintenance: "Mant.",
};

const statusBadgeVariants: Record<string, "success" | "warning" | "error" | "info"> = {
  active: "success",
  paused: "warning",
  error: "error",
  maintenance: "info",
};

export function AgentListItem({
  agent,
  isSelected,
  onSelect,
  onExecute,
  onTogglePause,
}: AgentListItemProps) {
  const status = agent.status ?? "active";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition-all",
        isSelected
          ? "border-[var(--accent)]/30 bg-[var(--accent-subtle)]"
          : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border-hover)] hover:shadow-sm"
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          statusColors[status] ?? "bg-gray-400"
        )}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{agent.name}</p>
        <p className="truncate text-xs text-[var(--text-tertiary)]">
          {agent.agentId}
        </p>
      </div>

      {/* Status badge */}
      <Badge variant={statusBadgeVariants[status] ?? "default"} className="shrink-0">
        {statusLabels[status] ?? status}
      </Badge>

      {/* Action buttons - visible on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 min-h-0"
          onClick={(e) => {
            e.stopPropagation();
            onExecute();
          }}
          aria-label="Ejecutar agente"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 min-h-0"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          aria-label={status === "paused" ? "Reanudar agente" : "Pausar agente"}
        >
          {status === "paused" ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
