"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  completed: "bg-green-500",
  running: "bg-[var(--accent)] animate-pulse",
  pending: "bg-[var(--text-tertiary)]",
  failed: "bg-red-500",
};

function formatTimestamp(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function RecentExecutionsList() {
  const executions = useQuery(api.agentExecution.listRecentExecutions, { limit: 10 });

  if (executions === undefined) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Ejecuciones Recientes</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--surface-1)] animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Ejecuciones Recientes</h3>
          <p className="text-xs text-[var(--text-secondary)]">Sin ejecuciones recientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Ejecuciones Recientes</h3>
        <div className="space-y-1">
          {executions.map((exec: Record<string, unknown>, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
            >
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_DOT[exec.status as string] || "bg-[var(--text-tertiary)]")} />
              <span className="text-xs font-medium text-[var(--text-primary)] truncate min-w-0 flex-1">
                {exec.agentName as string}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
                {exec.taskType as string}
              </span>
              {exec.duration != null && (
                <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
                  {(exec.duration as number).toFixed(1)}s
                </span>
              )}
              <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
                {formatTimestamp(exec._creationTime as number)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
