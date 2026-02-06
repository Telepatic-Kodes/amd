"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Zap, FileText } from "lucide-react";
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
  recentItems: ActivityItem[];
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

const statusIcons: Record<string, { icon: typeof CheckCircle; color: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-400" },
  completed: { icon: CheckCircle, color: "text-emerald-400" },
  failure: { icon: XCircle, color: "text-red-400" },
  failed: { icon: XCircle, color: "text-red-400" },
  running: { icon: Zap, color: "text-amber-400" },
  pending: { icon: Clock, color: "text-zinc-400" },
};

function humanizeDescription(desc: string): string {
  if (desc === "Ejecución exitosa") return "Ejecucion completada";
  if (desc === "Ejecución fallida") return "Ejecucion fallida";
  if (desc.match(/^scheduled_/i)) return "Tarea programada";
  if (desc.match(/^manual_/i)) return "Tarea manual";
  if (desc.match(/^[a-z_]+-\d{3}\s*-\s*\d{4}-/i)) return "Tarea ejecutada";
  return desc.length > 50 ? desc.slice(0, 47) + "..." : desc;
}

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
        recentItems: [],
      };
      map.set(item.department, summary);
    }

    summary.total++;
    summary.agents.add(item.agentName);
    if (item.timestamp > summary.latestTimestamp) {
      summary.latestTimestamp = item.timestamp;
    }

    // Keep up to 5 most recent items per department
    if (summary.recentItems.length < 5) {
      summary.recentItems.push(item);
    }

    if (item.status === "success" || item.status === "completed") {
      summary.successful++;
    } else if (item.status === "failure" || item.status === "failed") {
      summary.failed++;
    } else {
      summary.pending++;
    }
  }

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

function DepartmentCard({ summary }: { summary: DepartmentSummary }) {
  const [expanded, setExpanded] = useState(false);
  const s = summary;
  const borderColor = departmentColors[s.department] || "border-l-zinc-500";
  const allFailed = s.failed === s.total;
  const allSuccess = s.successful === s.total;
  const hasDetails = s.recentItems.length > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] border-l-2 overflow-hidden",
        borderColor
      )}
    >
      {/* Summary header — clickable */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          hasDetails && "hover:bg-white/[0.02] cursor-pointer"
        )}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {departmentLabels[s.department] || s.department}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">
              {s.agents.size} agentes
            </span>
            {hasDetails && (
              expanded
                ? <ChevronUp className="h-3 w-3 text-zinc-500" />
                : <ChevronDown className="h-3 w-3 text-zinc-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--text-secondary)]">
            {s.total} {s.total === 1 ? "tarea" : "tareas"}
          </span>
          {s.successful > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              {s.successful}
            </span>
          )}
          {s.failed > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <XCircle className="h-3 w-3" />
              {s.failed}
            </span>
          )}
          {s.pending > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Clock className="h-3 w-3" />
              {s.pending}
            </span>
          )}
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
      </button>

      {/* Expanded detail list */}
      {expanded && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {s.recentItems.map((item) => {
            const statusInfo = statusIcons[item.status] || statusIcons.pending;
            const StatusIcon = statusInfo.icon;
            const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
              addSuffix: true,
              locale: es,
            });
            const TypeIcon = item.type === "execution" ? Zap : FileText;

            return (
              <div key={item.id} className="flex items-start gap-2.5 px-4 py-2">
                <TypeIcon className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                      {item.agentName}
                    </span>
                    <StatusIcon className={cn("h-3 w-3 shrink-0", statusInfo.color)} />
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                    {humanizeDescription(item.description)} · {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
          {s.total > 5 && (
            <div className="px-4 py-1.5 text-center">
              <span className="text-[10px] text-zinc-600">
                +{s.total - 5} actividades mas
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
          {summaries.map((s) => (
            <DepartmentCard key={s.department} summary={s} />
          ))}
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
