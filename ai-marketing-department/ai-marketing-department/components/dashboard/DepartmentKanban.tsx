"use client";

import { cn } from "@/lib/utils";
import { AgentMiniCard } from "./AgentMiniCard";

interface Agent {
  _id: string;
  agentId?: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "paused" | "error" | "maintenance";
}

interface DepartmentKanbanProps {
  agentsByDepartment?: Record<string, Agent[]>;
}

const departmentConfig: Record<string, { label: string }> = {
  leadership: { label: "Liderazgo" },
  content: { label: "Contenido" },
  social: { label: "Social Media" },
  demandgen: { label: "Demand Gen" },
  seo: { label: "SEO" },
  brand: { label: "Marca" },
  ops: { label: "Operaciones" },
};

const departmentOrder = ["leadership", "content", "social", "demandgen", "seo", "brand", "ops"];

function getHealthDot(agents: Agent[]) {
  // Red if any errors
  if (agents.some((a) => a.status === "error")) {
    return "bg-red-500";
  }
  // Green if any active
  if (agents.some((a) => a.status === "active")) {
    return "bg-green-500";
  }
  // Gray otherwise
  return "bg-gray-400";
}

export function DepartmentKanban({ agentsByDepartment }: DepartmentKanbanProps) {
  const isLoading = !agentsByDepartment;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
          Departamento de Marketing
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {departmentOrder.map((dept) => (
            <div key={dept} className="space-y-2">
              {/* Skeleton header */}
              <div className="h-6 bg-[var(--surface-2)] rounded animate-pulse" />
              {/* Skeleton agent cards */}
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-[var(--surface-2)] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
        Departamento de Marketing
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {departmentOrder.map((deptKey) => {
          const config = departmentConfig[deptKey];
          const agents = agentsByDepartment[deptKey] || [];
          const healthDot = getHealthDot(agents);

          return (
            <div key={deptKey} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("h-2 w-2 rounded-full", healthDot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {config.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {agents.length} {agents.length === 1 ? "agente" : "agentes"}
                  </p>
                </div>
              </div>

              {/* Agent cards list */}
              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <AgentMiniCard
                      key={agent._id}
                      name={agent.name}
                      role={agent.role}
                      status={agent.status}
                    />
                  ))
                ) : (
                  <div className="h-12 flex items-center justify-center rounded-lg border border-dashed border-[var(--border)] opacity-50">
                    <p className="text-[10px] text-[var(--text-tertiary)]">Sin agentes</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DepartmentKanbanSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <div className="h-5 w-48 bg-[var(--surface-2)] rounded animate-pulse mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {departmentOrder.map((dept) => (
          <div key={dept} className="space-y-2">
            {/* Skeleton header */}
            <div className="h-6 bg-[var(--surface-2)] rounded animate-pulse" />
            {/* Skeleton agent cards */}
            <div className="space-y-2 max-h-[280px] overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[var(--surface-2)] rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
