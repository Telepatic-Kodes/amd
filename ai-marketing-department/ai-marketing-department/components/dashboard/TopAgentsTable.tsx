"use client";

import { cn } from "@/lib/utils";
import { chartColors } from "@/components/charts/theme";

interface AgentRow {
  name: string;
  department: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
}

interface TopAgentsTableProps {
  agents: AgentRow[];
}

const departmentLabels: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Social",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Marca",
  ops: "Ops",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  return `${(secs / 60).toFixed(1)}m`;
}

function rateColor(rate: number): string {
  if (rate >= 95) return "text-emerald-400";
  if (rate >= 80) return "text-amber-400";
  return "text-red-400";
}

export function TopAgentsTable({ agents }: TopAgentsTableProps) {
  const top5 = agents.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
          Top Agentes
        </h3>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-center py-10">
          <p className="text-sm text-[var(--text-tertiary)]">Sin ejecuciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Top Agentes
      </h3>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
        {top5.map((agent, i) => {
          const deptColor = chartColors.departments[agent.department as keyof typeof chartColors.departments] || "#71717a";
          return (
            <div
              key={agent.name}
              className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* Rank */}
              <span className="text-xs tabular-nums text-[var(--text-tertiary)] w-4 text-right shrink-0">
                {i + 1}
              </span>

              {/* Department dot */}
              <span
                className="shrink-0 h-2 w-2 rounded-full"
                style={{ backgroundColor: deptColor }}
              />

              {/* Name + dept */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{agent.name}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {departmentLabels[agent.department] || agent.department}
                </p>
              </div>

              {/* Executions */}
              <span className="text-xs tabular-nums text-[var(--text-secondary)] shrink-0">
                {agent.totalExecutions}
              </span>

              {/* Success rate */}
              <span className={cn("text-xs tabular-nums font-medium shrink-0 w-12 text-right", rateColor(agent.successRate))}>
                {agent.successRate.toFixed(0)}%
              </span>

              {/* Duration */}
              <span className="text-[10px] tabular-nums text-[var(--text-tertiary)] shrink-0 w-12 text-right hidden sm:block">
                {formatDuration(agent.avgDuration)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopAgentsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse" />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
            <div className="h-4 w-4 rounded bg-zinc-800 animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-zinc-800 animate-pulse" />
            <div className="flex-1 h-4 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-8 rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
