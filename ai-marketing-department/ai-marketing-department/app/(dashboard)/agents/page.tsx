"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AgentList } from "@/components/agents/AgentList";
import { AgentDrawerContent } from "@/components/agents/AgentDrawerContent";
import { ActiveChainsPanel } from "@/components/agents/ActiveChainsPanel";
import { RecentExecutionsList } from "@/components/agents/RecentExecutionsList";
import { ExecuteAgentModal } from "@/components/agents/ExecuteAgentModal";
import { Drawer } from "@/components/ui/Drawer";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [executeAgent, setExecuteAgent] = useState<Doc<"agents"> | null>(null);

  const rawAgents = useQuery(api.functions.listAgents, {});
  const agents = rawAgents as Doc<"agents">[] | undefined;
  const updateAgentStatus = useMutation(api.functions.updateAgentStatus);
  const { success, error } = useToast();

  const isLoading = agents === undefined;

  const selectedAgent = useMemo(
    () => agents?.find((a) => a._id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  const statusCounts = useMemo(() => {
    if (!agents) return { active: 0, paused: 0, error: 0, total: 0 };
    return {
      active: agents.filter((a) => a.status === "active").length,
      paused: agents.filter((a) => a.status === "paused").length,
      error: agents.filter((a) => a.status === "error").length,
      total: agents.length,
    };
  }, [agents]);

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setDrawerOpen(true);
  };

  const handleExecuteAgent = (agent: Doc<"agents">) => {
    setExecuteAgent(agent);
  };

  const handleTogglePauseAgent = (agent: Doc<"agents">) => {
    const newStatus = agent.status === "paused" ? "active" : "paused";
    updateAgentStatus({ id: agent._id, status: newStatus })
      .then(() =>
        success(
          agent.status === "paused"
            ? "Agente reactivado"
            : "Agente pausado",
        ),
      )
      .catch((err: Error) => error("Error", err.message));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Agentes
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {isLoading ? (
              "Cargando..."
            ) : (
              <>
                {statusCounts.total} agentes &middot; {statusCounts.active}{" "}
                activos
                {statusCounts.error > 0 &&
                  ` \u00B7 ${statusCounts.error} con errores`}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Agent List */}
      {isLoading ? (
        <ListSkeleton groups={7} itemsPerGroup={3} />
      ) : (
        <AgentList
          agents={agents as never[]}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onExecuteAgent={handleExecuteAgent as never}
          onTogglePauseAgent={handleTogglePauseAgent as never}
        />
      )}

      {/* Active Chains */}
      <ActiveChainsPanel />

      {/* Recent Executions */}
      <RecentExecutionsList />

      {/* Agent Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedAgent?.name ?? "Agente"}
        width="md"
      >
        {selectedAgent && (
          <AgentDrawerContent
            agent={selectedAgent as never}
            onExecute={() => handleExecuteAgent(selectedAgent)}
            onConfigure={() => {
              /* future */
            }}
          />
        )}
      </Drawer>

      {/* Execute Modal */}
      {executeAgent && (
        <ExecuteAgentModal
          agent={executeAgent}
          isOpen={!!executeAgent}
          onClose={() => setExecuteAgent(null)}
        />
      )}
    </div>
  );
}
