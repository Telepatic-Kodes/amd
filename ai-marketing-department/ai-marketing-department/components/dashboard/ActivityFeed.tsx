"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Zap, FileText, Send, AlertTriangle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "execution" | "task";
  agentName: string;
  agentId: string;
  department: string;
  description: string;
  status: string;
  timestamp: number;
  tokensUsed?: number;
  duration?: number;
}

interface DashboardActivityFeedProps {
  activities: ActivityItem[] | undefined;
}

/**
 * Converts raw task descriptions (e.g. "scheduled_demandgen-006 - 2026-02-06T00:00:04.528Z")
 * into human-readable text.
 */
function humanizeDescription(item: ActivityItem): string {
  const desc = item.description;

  // Execution descriptions from backend
  if (desc === "Ejecución exitosa") return "Ejecucion completada exitosamente";
  if (desc === "Ejecución fallida") return "Ejecucion fallida";

  // Scheduled/cron task titles: "scheduled_demandgen-006 - 2026-02-..."
  const scheduledMatch = desc.match(/^scheduled_([a-z]+-\d+)/i);
  if (scheduledMatch) return "Tarea programada ejecutada";

  // Manual task titles: "manual_content-002 - ..."
  const manualMatch = desc.match(/^manual_([a-z]+-\d+)/i);
  if (manualMatch) return "Tarea manual ejecutada";

  // If it looks like a raw taskId pattern, simplify it
  if (desc.match(/^[a-z_]+-\d{3}\s*-\s*\d{4}-/i)) return "Tarea ejecutada";

  // Otherwise return as-is (it's already a real title like "Escribe un blog sobre X")
  return desc;
}

const statusLabel: Record<string, { text: string; color: string }> = {
  success: { text: "Exitoso", color: "text-emerald-400" },
  failure: { text: "Fallido", color: "text-red-400" },
  completed: { text: "Completado", color: "text-emerald-400" },
  failed: { text: "Fallido", color: "text-red-400" },
  running: { text: "En curso", color: "text-amber-400" },
  pending: { text: "Pendiente", color: "text-zinc-400" },
};

const departmentBadgeColors: Record<string, string> = {
  content: "bg-blue-500/10 text-blue-400",
  social: "bg-purple-500/10 text-purple-400",
  demandgen: "bg-amber-500/10 text-amber-400",
  seo: "bg-green-500/10 text-green-400",
  brand: "bg-pink-500/10 text-pink-400",
  ops: "bg-cyan-500/10 text-cyan-400",
  leadership: "bg-zinc-500/10 text-zinc-400",
};

const typeIcons: Record<string, typeof Activity> = {
  execution: Zap,
  task: FileText,
  content: Send,
  error: AlertTriangle,
};

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  if (!activities) return <ActivityFeedSkeleton />;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Actividad Reciente
      </h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-6 w-6 text-zinc-600 mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--border)]">
            {activities.map((item) => {
              const Icon = typeIcons[item.type] || Activity;
              const badgeColor = departmentBadgeColors[item.department] || departmentBadgeColors.leadership;
              const status = statusLabel[item.status];
              const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
                locale: es,
              });

              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.agentName}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {humanizeDescription(item)}
                      </span>
                      {status && (
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-tertiary)]">{timeAgo}</span>
                      {item.duration && (
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {item.duration < 1000 ? `${item.duration}ms` : `${(item.duration / 1000).toFixed(1)}s`}
                        </span>
                      )}
                      {item.tokensUsed && (
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {item.tokensUsed.toLocaleString()} tokens
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}>
                        {item.department}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-36 rounded bg-zinc-800 animate-pulse" />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
            <div className="h-4 w-4 rounded bg-zinc-800 animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
