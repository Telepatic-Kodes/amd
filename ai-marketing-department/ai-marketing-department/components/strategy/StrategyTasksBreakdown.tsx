"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ChevronDown, ChevronRight, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface StrategyTasksBreakdownProps {
  strategyDocId: Id<"marketingStrategies">;
}

type TaskStatus = "pending" | "running" | "completed" | "failed";

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: "text-[var(--text-tertiary)]", bgColor: "bg-[var(--surface-0)]", label: "Pendientes" },
  running: { icon: Loader2, color: "text-[var(--accent)]", bgColor: "bg-[var(--accent-subtle)]", label: "Ejecutando" },
  completed: { icon: CheckCircle2, color: "text-[var(--success)]", bgColor: "bg-[var(--badge-green-bg)]", label: "Completadas" },
  failed: { icon: XCircle, color: "text-red-600", bgColor: "bg-[var(--badge-red-bg)]", label: "Fallidas" },
};

const GROUP_ORDER: TaskStatus[] = ["running", "pending", "completed", "failed"];

export function StrategyTasksBreakdown({ strategyDocId }: StrategyTasksBreakdownProps) {
  const tasks = useQuery(api.cmoEngine.getStrategyTasksDetailed, { strategyDocId });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isLoading = tasks === undefined;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4 space-y-3">
        <div className="h-4 w-40 rounded bg-[var(--surface-1)] animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 rounded bg-[var(--surface-1)]/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) return null;

  const grouped: Record<TaskStatus, typeof tasks> = {
    pending: [],
    running: [],
    completed: [],
    failed: [],
  };

  for (const task of tasks) {
    const status = task.status as TaskStatus;
    if (grouped[status]) {
      grouped[status].push(task);
    }
  }

  function toggleGroup(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  function formatTime(ts?: number) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
      <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3">Desglose de Tareas</h3>
      <div className="space-y-2">
        {GROUP_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isCollapsed = collapsed[status];

          return (
            <div key={status}>
              <button
                onClick={() => toggleGroup(status)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--surface-1)] transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                )}
                <Icon className={cn("h-3.5 w-3.5", config.color, status === "running" && "animate-spin")} />
                <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                <Badge variant="outline" className="text-[9px] ml-auto">
                  {group.length}
                </Badge>
              </button>

              {!isCollapsed && (
                <div className="ml-5 mt-1 space-y-1">
                  {group.map((task) => (
                    <div
                      key={task.taskId}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] bg-[var(--surface-1)]/30"
                    >
                      <span className="text-[var(--text-primary)] font-medium truncate flex-1">{task.type}</span>
                      {task.agentName && (
                        <span className="text-[var(--text-tertiary)] truncate max-w-[100px]">{task.agentName}</span>
                      )}
                      <span className="text-[var(--text-tertiary)] shrink-0">
                        {task.completedAt ? formatTime(task.completedAt) : formatTime(task.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
