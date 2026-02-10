"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Zap, FileText, Send, AlertTriangle, Layers } from "lucide-react";

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

interface GroupedActivity {
  key: string;
  items: ActivityItem[];
  agentNames: string[];
  department: string;
  description: string;
  status: string;
  type: "execution" | "task";
  latestTimestamp: number;
  count: number;
}

interface DashboardActivityFeedProps {
  activities: ActivityItem[] | undefined;
}

/**
 * Converts raw task descriptions into human-readable text.
 */
function humanizeDescription(item: ActivityItem): string {
  const desc = item.description;
  if (desc === "Ejecución exitosa") return "Ejecucion completada";
  if (desc === "Ejecución fallida") return "Ejecucion fallida";
  if (desc.match(/^scheduled_/i)) return "Tarea programada";
  if (desc.match(/^manual_/i)) return "Tarea manual";
  if (desc.match(/^[a-z_]+-\d{3}\s*-\s*\d{4}-/i)) return "Tarea ejecutada";
  return desc;
}

/**
 * Groups activities by department + humanized description + status within 1-hour windows.
 * Collapses "Budget Pacing Analyst × 8" instead of listing each one individually.
 */
function groupActivities(activities: ActivityItem[]): GroupedActivity[] {
  const ONE_HOUR = 60 * 60 * 1000;
  const groups: GroupedActivity[] = [];
  const groupMap = new Map<string, GroupedActivity>();

  for (const item of activities) {
    const desc = humanizeDescription(item);
    // Group key: department + description + status + hour bucket
    const hourBucket = Math.floor(item.timestamp / ONE_HOUR);
    const key = `${item.department}:${desc}:${item.status}:${hourBucket}`;

    const existing = groupMap.get(key);
    if (existing) {
      existing.items.push(item);
      existing.count++;
      if (!existing.agentNames.includes(item.agentName)) {
        existing.agentNames.push(item.agentName);
      }
      if (item.timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = item.timestamp;
      }
    } else {
      const group: GroupedActivity = {
        key,
        items: [item],
        agentNames: [item.agentName],
        department: item.department,
        description: desc,
        status: item.status,
        type: item.type,
        latestTimestamp: item.timestamp,
        count: 1,
      };
      groupMap.set(key, group);
      groups.push(group);
    }
  }

  // Sort by most recent first
  groups.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  return groups;
}

const statusLabel: Record<string, { text: string; color: string }> = {
  success: { text: "Exitoso", color: "text-emerald-400" },
  failure: { text: "Fallido", color: "text-red-400" },
  completed: { text: "Completado", color: "text-emerald-400" },
  failed: { text: "Fallido", color: "text-red-400" },
  running: { text: "En curso", color: "text-amber-400" },
  pending: { text: "Pendiente", color: "text-stone-500" },
};

const departmentLabels: Record<string, string> = {
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Marca",
  ops: "Operaciones",
  leadership: "Liderazgo",
};

const departmentBadgeColors: Record<string, string> = {
  content: "bg-orange-500/10 text-orange-400",
  social: "bg-purple-500/10 text-purple-400",
  demandgen: "bg-amber-500/10 text-amber-400",
  seo: "bg-green-500/10 text-green-400",
  brand: "bg-pink-500/10 text-pink-400",
  ops: "bg-cyan-500/10 text-cyan-400",
  leadership: "bg-stone-500/10 text-stone-500",
};

const typeIcons: Record<string, typeof Activity> = {
  execution: Zap,
  task: FileText,
  content: Send,
  error: AlertTriangle,
};

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  if (!activities) return <ActivityFeedSkeleton />;

  const groups = groupActivities(activities);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Actividad Reciente
      </h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-6 w-6 text-stone-400 mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--border)]">
            {groups.map((group) => {
              const Icon = group.count > 1 ? Layers : (typeIcons[group.type] || Activity);
              const badgeColor = departmentBadgeColors[group.department] || departmentBadgeColors.leadership;
              const status = statusLabel[group.status];
              const timeAgo = formatDistanceToNow(new Date(group.latestTimestamp), {
                addSuffix: true,
                locale: es,
              });

              // Show up to 3 agent names, then "+N mas"
              const displayNames = group.agentNames.slice(0, 3);
              const extraCount = group.agentNames.length - 3;
              const namesText = extraCount > 0
                ? `${displayNames.join(", ")} +${extraCount}`
                : displayNames.join(", ");

              return (
                <div key={group.key} className="flex items-start gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {departmentLabels[group.department] || group.department}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {group.description}
                      </span>
                      {group.count > 1 && (
                        <span className="text-xs font-medium text-[var(--text-tertiary)] bg-white/5 px-1.5 py-0.5 rounded">
                          ×{group.count}
                        </span>
                      )}
                      {status && (
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-tertiary)]">{timeAgo}</span>
                      <span className="text-xs text-[var(--text-tertiary)] truncate max-w-[300px]">
                        {namesText}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeColor}`}>
                        {group.department}
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
      <div className="h-4 w-36 rounded bg-stone-100 animate-pulse" />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
            <div className="h-4 w-4 rounded bg-stone-100 animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-stone-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
