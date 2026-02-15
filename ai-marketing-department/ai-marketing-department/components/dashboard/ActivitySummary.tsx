"use client";

import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
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

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  success: { icon: CheckCircle, color: "text-[var(--success)]" },
  completed: { icon: CheckCircle, color: "text-[var(--success)]" },
  failure: { icon: XCircle, color: "text-[var(--error)]" },
  failed: { icon: XCircle, color: "text-[var(--error)]" },
  running: { icon: Zap, color: "text-[var(--warning)]" },
  pending: { icon: Clock, color: "text-[var(--text-tertiary)]" },
};

function humanizeDescription(desc: string): string {
  if (desc === "Ejecución exitosa") return "Ejecución completada";
  if (desc === "Ejecución fallida") return "Ejecución fallida";
  if (desc.match(/^scheduled_/i)) return "Tarea programada";
  if (desc.match(/^manual_/i)) return "Tarea manual";
  if (desc.match(/^[a-z_]+-\d{3}\s*-\s*\d{4}-/i)) return "Tarea ejecutada";
  return desc.length > 40 ? desc.slice(0, 37) + "..." : desc;
}

export const ActivitySummary = memo(function ActivitySummary({ activities }: ActivitySummaryProps) {
  if (!activities) return <ActivitySummarySkeleton />;

  // Sort by timestamp descending, take 8 most recent
  const recent = [...activities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Actividad Reciente
      </h3>

      {recent.length === 0 ? (
        <div className="rounded-xl bg-[var(--surface-1)] flex flex-col items-center justify-center py-10">
          <Activity className="h-5 w-5 text-[var(--text-tertiary)] mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface-1)] overflow-hidden">
          {recent.map((item, i) => {
            const config = statusConfig[item.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
              addSuffix: true,
              locale: es,
            });

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-2)]",
                  i < recent.length - 1 && "border-b border-[var(--surface-2)]"
                )}
              >
                {/* Status dot */}
                <StatusIcon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", config.color)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {item.agentName}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                    {humanizeDescription(item.description)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

function ActivitySummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-32 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="rounded-xl bg-[var(--surface-1)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn(
            "flex items-start gap-3 px-5 py-3",
            i < 4 && "border-b border-[var(--surface-2)]"
          )}>
            <div className="h-3.5 w-3.5 rounded-full bg-[var(--surface-3)] animate-pulse mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-[var(--surface-3)] animate-pulse" />
              <div className="h-2.5 w-24 rounded bg-[var(--surface-3)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
