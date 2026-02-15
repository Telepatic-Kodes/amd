"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Clock, Zap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const statusBadge: Record<string, { label: string; variant: "success" | "error" | "warning" | "info" }> = {
  success: { label: "Exitosa", variant: "success" },
  failure: { label: "Fallida", variant: "error" },
};

const departmentNames: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Social",
  demandgen: "DemandGen",
  seo: "SEO",
  brand: "Marca",
  ops: "Ops",
};

export function ExecutionHistory() {
  const executions = useQuery(api.agentExecution.listRecentExecutions, {
    limit: 15,
  });

  if (!executions) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Historial de Ejecuciones</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[var(--surface-1)] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Historial de Ejecuciones</h3>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] text-center py-6">
          No hay ejecuciones recientes
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Historial de Ejecuciones
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">{executions.length} recientes</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {executions.map((exec) => {
          const badge = statusBadge[exec.status] || statusBadge.failure;
          const timeAgo = formatTimeAgo(exec.timestamp);

          return (
            <div
              key={exec._id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-3 hover:border-[var(--border)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {exec.agentName}
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    {departmentNames[exec.department] || exec.department}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    {exec.tokensUsed.toLocaleString()} tokens
                  </span>
                  <span>${exec.cost.toFixed(4)}</span>
                  <span>{(exec.duration / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}
