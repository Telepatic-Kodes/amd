"use client";

import { AgentCard } from "./AgentCard";

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  description: string;
  department: string;
  status: string;
  triggers: string[];
}

interface AgentGridProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

export function AgentGrid({ agents, selectedAgentId, onSelectAgent }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <p className="text-sm">No hay agentes en este departamento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent._id}
          agent={agent}
          isSelected={selectedAgentId === agent._id}
          onClick={() => onSelectAgent(agent._id)}
        />
      ))}
    </div>
  );
}
