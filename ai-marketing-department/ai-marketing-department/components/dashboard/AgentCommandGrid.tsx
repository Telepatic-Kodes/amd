"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AgentCard } from "./AgentCard";
import { cn } from "@/lib/utils";

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

function DepartmentCard({
  dept,
  agents,
  lastActivityByAgent,
}: {
  dept: string;
  agents: Agent[];
  lastActivityByAgent?: Record<string, AgentLastActivity>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Separate lead (director/cmo) from team
  const lead = agents.find((a) => a.role === "director" || a.role === "cmo");
  const team = agents.filter((a) => a !== lead);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const errorCount = agents.filter((a) => a.status === "error").length;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
      {/* Department header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {departmentLabels[dept] || dept}
        </h3>
        <div className="flex items-center gap-2">
          {/* Status dots summary */}
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {activeCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {errorCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)]">{agents.length}</span>
        </div>
      </div>

      {/* Lead agent */}
      {lead && (
        <div className="px-2 pt-2">
          <AgentCard
            name={lead.name}
            status={lead.status}
            lastAction={lastActivityByAgent?.[lead._id]?.description}
            lastActionTime={lastActivityByAgent?.[lead._id]?.timestamp}
            onClick={() => router.push("/agents")}
          />
        </div>
      )}

      {/* Team summary / expand */}
      {team.length > 0 && (
        <div className="px-2 pb-2">
          {expanded ? (
            <div className="space-y-1.5 mt-1.5">
              {team.map((agent) => {
                const activity = lastActivityByAgent?.[agent._id];
                return (
                  <AgentCard
                    key={agent._id}
                    name={agent.name}
                    status={agent.status}
                    lastAction={activity?.description}
                    lastActionTime={activity?.timestamp}
                    onClick={() => router.push("/agents")}
                  />
                );
              })}
            </div>
          ) : null}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "w-full flex items-center justify-center gap-1 py-1.5 mt-1.5 rounded-md text-xs",
              "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03] transition-colors"
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Ocultar equipo
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> {team.length} agentes mas
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function AgentCommandGrid({ agentsByDepartment, lastActivityByAgent }: AgentCommandGridProps) {
  if (!agentsByDepartment) return <AgentCommandGridSkeleton />;

  const departments = Object.entries(agentsByDepartment);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Agentes por Departamento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {departments.map(([dept, agents]) => (
          <DepartmentCard
            key={dept}
            dept={dept}
            agents={agents}
            lastActivityByAgent={lastActivityByAgent}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCommandGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
