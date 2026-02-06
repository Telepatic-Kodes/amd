"use client";

import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "execution" | "task";
  agentName: string;
  agentId: string;
  department: string;
  description: string;
  status: string;
  timestamp: number;
}

interface ActivitySummaryProps {
  activities: ActivityItem[] | undefined;
}

interface DepartmentSummary {
  department: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  agents: Set<string>;
  latestTimestamp: number;
}

const departmentLabels: Record<string, string> = {
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Marca",
  ops: "Operaciones",
  leadership: "Liderazgo",
};

const departmentColors: Record<string, string> = {
  content: "border-l-blue-500",
  social: "border-l-purple-500",
  demandgen: "border-l-amber-500",
  seo: "border-l-green-500",
  brand: "border-l-pink-500",
  ops: "border-l-cyan-500",
  leadership: "border-l-zinc-500",
};

function buildSummaries(activities: ActivityItem[]): DepartmentSummary[] {
  const map = new Map<string, DepartmentSummary>();

  for (const item of activities) {
    let summary = map.get(item.department);
    if (!summary) {
      summary = {
        department: item.department,
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        agents: new Set(),
        latestTimestamp: 0,
      };
      map.set(item.department, summary);
    }

    summary.total++;
    summary.agents.add(item.agentName);
    if (item.timestamp > summary.latestTimestamp) {
      summary.latestTimestamp = item.timestamp;
    }

    if (item.status === "success" || item.status === "completed") {
      summary.successful++;
    } else if (item.status === "failure" || item.status === "failed") {
      summary.failed++;
    } else {
      summary.pending++;
    }
  }

  // Sort by total activity (most active first)
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function timeRangeLabel(activities: ActivityItem[]): string {
  if (activities.length === 0) return "";
  const now = Date.now();
  const oldest = Math.min(...activities.map((a) => a.timestamp));
  const hoursAgo = Math.round((now - oldest) / (1000 * 60 * 60));
  if (hoursAgo <= 1) return "Ultima hora";
  if (hoursAgo <= 24) return `Ultimas ${hoursAgo}h`;
  return `Ultimas 24h+`;
}

export function ActivitySummary({ activities }: ActivitySummaryProps) {
  if (!activities) return <ActivitySummarySkeleton />;

  const summaries = buildSummaries(activities);
  const rangeLabel = timeRangeLabel(activities);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Resumen de Actividad
        </h2>
        {rangeLabel && (
          <span className="text-[10px] text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded">
            {rangeLabel}
          </span>
        )}
      </div>

      {summaries.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex flex-col items-center justify-center py-10">
          <Activity className="h-6 w-6 text-zinc-600 mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {summaries.map((s) => {
            const borderColor = departmentColors[s.department] || "border-l-zinc-500";
            const allFailed = s.failed === s.total;
            const allSuccess = s.successful === s.total;

            return (
              <div
                key={s.department}
                className={cn(
                  "rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] border-l-2 px-4 py-3",
                  borderColor
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {departmentLabels[s.department] || s.department}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {s.agents.size} agentes
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Total */}
                  <span className="text-xs text-[var(--text-secondary)]">
                    {s.total} {s.total === 1 ? "tarea" : "tareas"}
                  </span>

                  {/* Success */}
                  {s.successful > 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      {s.successful}
                    </span>
                  )}

                  {/* Failed */}
                  {s.failed > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <XCircle className="h-3 w-3" />
                      {s.failed}
                    </span>
                  )}

                  {/* Pending */}
                  {s.pending > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Clock className="h-3 w-3" />
                      {s.pending}
                    </span>
                  )}

                  {/* Health indicator */}
                  {allFailed && (
                    <span className="ml-auto text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                      Revisar
                    </span>
                  )}
                  {allSuccess && s.total > 0 && (
                    <span className="ml-auto text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Saludable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivitySummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-44 rounded bg-zinc-800 animate-pulse" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
