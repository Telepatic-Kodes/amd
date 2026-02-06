"use client";

import { useRouter } from "next/navigation";
import { AgentCard } from "./AgentCard";

interface Agent {
  _id: string;
  name: string;
  department: string;
  status: "active" | "paused" | "error" | "maintenance";
  role?: string;
}

interface AgentLastActivity {
  description: string;
  timestamp: number;
}

interface AgentCommandGridProps {
  agentsByDepartment?: Record<string, Agent[]>;
  lastActivityByAgent?: Record<string, AgentLastActivity>;
}

const departmentLabels: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Generacion de Demanda",
  seo: "SEO",
  brand: "Marca & Creativo",
  ops: "Operaciones",
};

export function AgentCommandGrid({ agentsByDepartment, lastActivityByAgent }: AgentCommandGridProps) {
  const router = useRouter();

  if (!agentsByDepartment) return <AgentCommandGridSkeleton />;

  const departments = Object.entries(agentsByDepartment);

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Agentes por Departamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map(([dept, agents]) => (
          <div key={dept} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {departmentLabels[dept] || dept}
              </h3>
              <span className="text-xs text-[var(--text-tertiary)]">{agents.length}</span>
            </div>
            <div className="space-y-1.5">
              {agents.slice(0, 4).map((agent) => {
                const activity = lastActivityByAgent?.[agent._id];
                return (
                  <AgentCard
                    key={agent._id}
                    name={agent.name}
                    status={agent.status}
                    lastAction={activity?.description}
                    lastActionTime={activity?.timestamp}
                    onClick={() => router.push(`/agents`)}
                  />
                );
              })}
              {agents.length > 4 && (
                <p className="text-xs text-[var(--text-tertiary)] pl-4">
                  +{agents.length - 4} mas
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentCommandGridSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse" />
            <div className="space-y-1.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-14 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
