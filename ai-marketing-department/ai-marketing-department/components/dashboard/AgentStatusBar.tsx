"use client";

import { useState } from "react";
import { chartColors } from "@/components/charts/theme";
import { AgentSlideOver } from "./AgentSlideOver";

interface Agent {
  _id: string;
  agentId?: string;
  name: string;
  department: string;
  status: "active" | "paused" | "error" | "maintenance";
  role?: string;
  description?: string;
  systemPrompt?: string;
  config?: Record<string, unknown>;
}

interface AgentStatusBarProps {
  agentsByDepartment?: Record<string, Agent[]>;
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

export function AgentStatusBar({ agentsByDepartment }: AgentStatusBarProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  if (!agentsByDepartment) return <AgentStatusBarSkeleton />;

  const departments = Object.entries(agentsByDepartment);
  const totalAgents = departments.reduce((sum, [, agents]) => sum + agents.length, 0);

  if (totalAgents === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Estado de Agentes
      </h3>

      {/* Segmented bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-[var(--surface-2)]">
        {departments.map(([dept, agents]) => {
          const deptColor = chartColors.departments[dept as keyof typeof chartColors.departments] || "#5c5c5e";
          const pct = (agents.length / totalAgents) * 100;
          const hasError = agents.some((a) => a.status === "error");

          return (
            <button
              key={dept}
              className="relative h-full transition-opacity hover:opacity-80 cursor-pointer"
              style={{ width: `${pct}%`, backgroundColor: deptColor }}
              onClick={() => {
                const director = agents.find((a) => a.role === "director" || a.role === "cmo") || agents[0];
                if (director) setSelectedAgent(director);
              }}
              title={`${departmentLabels[dept] || dept}: ${agents.length} agentes`}
            >
              {hasError && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {departments.map(([dept, agents]) => {
          const deptColor = chartColors.departments[dept as keyof typeof chartColors.departments] || "#5c5c5e";
          const activeCount = agents.filter((a) => a.status === "active").length;
          const errorCount = agents.filter((a) => a.status === "error").length;

          return (
            <button
              key={dept}
              onClick={() => {
                const director = agents.find((a) => a.role === "director" || a.role === "cmo") || agents[0];
                if (director) setSelectedAgent(director);
              }}
              className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <span
                className="shrink-0 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: deptColor }}
              />
              <span>{departmentLabels[dept] || dept}</span>
              <span className="tabular-nums text-[var(--text-tertiary)]">
                {activeCount}/{agents.length}
              </span>
              {errorCount > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--error)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Agent Slide-over */}
      {selectedAgent && (
        <AgentSlideOver
          agent={{
            ...selectedAgent,
            agentId: selectedAgent.agentId || selectedAgent._id,
          }}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

function AgentStatusBarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-28 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="h-2 rounded-full bg-[var(--surface-2)] animate-pulse" />
      <div className="flex items-center gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-16 rounded bg-[var(--surface-3)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
