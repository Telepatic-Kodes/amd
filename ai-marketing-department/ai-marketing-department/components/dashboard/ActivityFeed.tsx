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
                        {item.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-tertiary)]">{timeAgo}</span>
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
