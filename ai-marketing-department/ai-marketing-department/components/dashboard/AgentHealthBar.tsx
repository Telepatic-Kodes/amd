"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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

interface AgentHealthBarProps {
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

export function AgentHealthBar({ agentsByDepartment }: AgentHealthBarProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  if (!agentsByDepartment) return <AgentHealthBarSkeleton />;

  const departments = Object.entries(agentsByDepartment);

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Estado de Agentes
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        {departments.map(([dept, agents]) => {
          const deptColor = chartColors.departments[dept as keyof typeof chartColors.departments] || "#71717a";
          const activeCount = agents.filter((a) => a.status === "active").length;
          const errorCount = agents.filter((a) => a.status === "error").length;
          const director = agents.find((a) => a.role === "director" || a.role === "cmo") || agents[0];

          return (
            <button
              key={dept}
              onClick={() => {
                if (director) setSelectedAgent(director);
              }}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]",
                "hover:border-[var(--border-hover)] transition-colors duration-150 text-left"
              )}
            >
              {/* Department color dot */}
              <span
                className="shrink-0 h-2 w-2 rounded-full"
                style={{ backgroundColor: deptColor }}
              />

              {/* Department name */}
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {departmentLabels[dept] || dept}
              </span>

              {/* Active count */}
              <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">
                {activeCount}/{agents.length}
              </span>

              {/* Error indicator */}
              {errorCount > 0 && (
                <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-red-500" />
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

function AgentHealthBarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-28 rounded bg-stone-100 animate-pulse" />
      <div className="flex items-center gap-2 flex-wrap">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
