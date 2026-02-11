"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, Zap, Search, ChevronRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickExecuteModal } from "./QuickExecuteModal";

const DEPARTMENT_LABELS: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social_media: "Redes Sociales",
  demand_gen: "Demand Gen",
  seo: "SEO",
  brand_creative: "Marca & Creativo",
  marketing_ops: "Marketing Ops",
};

interface AgentRecord {
  agentId: string;
  name: string;
  department: string;
  role: string;
  status: string;
}

export function DashboardExecuteModal({ onClose }: { onClose: () => void }) {
  const agents = useQuery(api.functions.listAgents, {});
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);

  // Group agents by department
  const grouped = useMemo(() => {
    if (!agents) return {};
    const filtered = search
      ? agents.filter(
          (a: AgentRecord) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.agentId.toLowerCase().includes(search.toLowerCase()) ||
            a.role.toLowerCase().includes(search.toLowerCase())
        )
      : agents;

    return filtered.reduce(
      (acc: Record<string, AgentRecord[]>, agent: AgentRecord) => {
        const dept = agent.department || "other";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(agent);
        return acc;
      },
      {} as Record<string, AgentRecord[]>
    );
  }, [agents, search]);

  // If agent selected, show the execution modal
  if (selectedAgent) {
    return (
      <QuickExecuteModal
        agentId={selectedAgent.agentId}
        agentName={selectedAgent.name}
        onClose={onClose}
      />
    );
  }

  // Agent picker step
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Ejecutar Agente
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agente por nombre o rol..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!agents ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-stone-400">
                No se encontraron agentes
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([dept, deptAgents]) => (
              <div key={dept} className="mb-2">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  {DEPARTMENT_LABELS[dept] || dept}
                </p>
                {(deptAgents as AgentRecord[]).map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() => setSelectedAgent(agent)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left group"
                  >
                    <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-900/30 shrink-0">
                      <Bot className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-stone-400 truncate">
                        {agent.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          agent.status === "active"
                            ? "bg-emerald-400"
                            : agent.status === "error"
                              ? "bg-red-400"
                              : "bg-stone-300"
                        )}
                      />
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-[var(--border)] shrink-0">
          <p className="text-[10px] text-stone-400 text-center">
            Selecciona un agente para configurar y ejecutar una tarea
          </p>
        </div>
      </div>
    </div>
  );
}
