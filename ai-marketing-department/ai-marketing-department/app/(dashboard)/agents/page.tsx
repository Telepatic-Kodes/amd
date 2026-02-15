"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentDetailPanel } from "@/components/agents/AgentDetailPanel";
import { ActiveChainsPanel } from "@/components/agents/ActiveChainsPanel";
import { RecentExecutionsList } from "@/components/agents/RecentExecutionsList";

const DEPARTMENTS = [
  { id: "all", label: "Todos" },
  { id: "leadership", label: "Liderazgo" },
  { id: "content", label: "Contenido" },
  { id: "social", label: "Social" },
  { id: "demandgen", label: "Demand Gen" },
  { id: "seo", label: "SEO" },
  { id: "brand", label: "Marca" },
  { id: "ops", label: "Operaciones" },
];

export default function AgentsPage() {
  const [department, setDepartment] = useState("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agents = useQuery(api.functions.listAgents,
    department === "all" ? {} : { department }
  );

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId || !agents) return null;
    return agents.find((a: Record<string, unknown>) => a._id === selectedAgentId) || null;
  }, [selectedAgentId, agents]);

  const isLoading = agents === undefined;

  // Count by status
  const statusCounts = useMemo(() => {
    if (!agents) return { active: 0, paused: 0, error: 0, total: 0 };
    return {
      active: agents.filter((a: Record<string, unknown>) => a.status === "active").length,
      paused: agents.filter((a: Record<string, unknown>) => a.status === "paused").length,
      error: agents.filter((a: Record<string, unknown>) => a.status === "error").length,
      total: agents.length,
    };
  }, [agents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]">
            <Users className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agentes</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {statusCounts.total} agentes IA · {statusCounts.active} activos
              {statusCounts.error > 0 && ` · ${statusCounts.error} con errores`}
            </p>
          </div>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => {
              setDepartment(dept.id);
              setSelectedAgentId(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              department === dept.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            )}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Agent Grid */}
        <div className={cn("flex-1 min-w-0", selectedAgent && "lg:max-w-[60%]")}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse" />
              ))}
            </div>
          ) : (
            <AgentGrid
              agents={agents as any[]}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedAgent && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <AgentDetailPanel
              agent={selectedAgent as any}
              onClose={() => setSelectedAgentId(null)}
            />
          </div>
        )}
      </div>

      {/* Active Chains */}
      <ActiveChainsPanel />

      {/* Recent Executions */}
      <RecentExecutionsList />
    </div>
  );
}
