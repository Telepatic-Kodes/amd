"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { chartColors } from "@/components/charts/theme";
import { ChevronRight } from "lucide-react";

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

function rateColor(rate: number): string {
  if (rate >= 95) return "bg-[var(--success)]";
  if (rate >= 80) return "bg-[var(--warning)]";
  return "bg-[var(--error)]";
}

function rateTextColor(rate: number): string {
  if (rate >= 95) return "text-[#2FCC71]";
  if (rate >= 80) return "text-[#F5A623]";
  return "text-[#E5484D]";
}

function formatDuration(ms: number): string {
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  return `${(secs / 60).toFixed(1)}m`;
}

export function TopAgentsTable({ agents }: TopAgentsTableProps) {
  const top5 = agents.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
          Top Agentes
        </h3>
        <div className="rounded-xl bg-[var(--surface-1)] flex items-center justify-center py-10">
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
      <div className="rounded-xl bg-[var(--surface-1)] overflow-hidden">
        {top5.map((agent, i) => {
          const deptColor = chartColors.departments[agent.department as keyof typeof chartColors.departments] || "#5c5c5e";
          return (
            <div
              key={agent.name}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03] group",
                i < top5.length - 1 && "border-b border-white/[0.04]"
              )}
            >
              {/* Rank */}
              <span className="text-xs tabular-nums text-[var(--text-tertiary)] w-4 text-right shrink-0">
                {i + 1}
              </span>

              {/* Department badge */}
              <span
                className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide text-white/90"
                style={{ backgroundColor: deptColor }}
              >
                {(departmentLabels[agent.department] || agent.department).slice(0, 3)}
              </span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{agent.name}</p>
              </div>

              {/* Duration (visible on hover) */}
              <span className="text-[10px] tabular-nums text-[var(--text-tertiary)] shrink-0 hidden group-hover:block">
                {formatDuration(agent.avgDuration)}
              </span>

              {/* Executions */}
              <span className="text-xs tabular-nums text-[var(--text-secondary)] shrink-0">
                {agent.totalExecutions}
              </span>

              {/* Mini progress bar + rate */}
              <div className="shrink-0 w-20 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-[var(--surface-3)]">
                  <div
                    className={cn("h-full rounded-full transition-all", rateColor(agent.successRate))}
                    style={{ width: `${Math.min(agent.successRate, 100)}%` }}
                  />
                </div>
                <span className={cn("text-[10px] tabular-nums font-medium w-8 text-right", rateTextColor(agent.successRate))}>
                  {agent.successRate.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}

        {/* "See all" link */}
        {agents.length > 5 && (
          <Link
            href="/results"
            className="flex items-center justify-center gap-1 px-5 py-2.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02] transition-colors border-t border-white/[0.04]"
          >
            Ver los {agents.length} agentes
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function TopAgentsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-20 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="rounded-xl bg-[var(--surface-1)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn(
            "flex items-center gap-3 px-5 py-3.5",
            i < 4 && "border-b border-white/[0.04]"
          )}>
            <div className="h-4 w-4 rounded bg-[var(--surface-3)] animate-pulse" />
            <div className="h-4 w-8 rounded bg-[var(--surface-3)] animate-pulse" />
            <div className="flex-1 h-4 rounded bg-[var(--surface-3)] animate-pulse" />
            <div className="h-4 w-8 rounded bg-[var(--surface-3)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
