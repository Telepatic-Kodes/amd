"use client";

import { useState } from "react";
import { X, Bot, Cpu, Thermometer, Hash, Zap, Play, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { translateStatus, getStatusVariant } from "@/lib/language";
import { ExecuteAgentModal } from "@/components/agents/ExecuteAgentModal";
import { AgentMetricsWidget } from "@/components/agents/AgentMetricsWidget";
import { AgentConfigEditor } from "@/components/agents/AgentConfigEditor";
import { AgentConfigModal } from "@/components/agents/AgentConfigModal";
import type { Id } from "@convex/_generated/dataModel";

const DEPARTMENT_LABELS: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Marca & Creativo",
  ops: "Operaciones",
};

interface AgentDetailPanelProps {
  agent: {
    _id: string;
    agentId: string;
    name: string;
    description: string;
    department: string;
    role: string;
    status: string;
    config: {
      systemPrompt: string;
      model: string;
      temperature: number;
      maxTokens: number;
      tools?: string[];
    };
    triggers: string[];
  };
  onClose: () => void;
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
    <ExecuteAgentModal
      agent={agent}
      isOpen={showExecuteModal}
      onClose={() => setShowExecuteModal(false)}
    />
    {showConfigModal && (
      <AgentConfigModal
        agent={agent as any}
        onClose={() => setShowConfigModal(false)}
      />
    )}
    <Card className="sticky top-8">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">{agent.name}</h3>
            <p className="text-xs font-mono text-[var(--text-secondary)]">{agent.agentId}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              <Settings className="h-3 w-3" />
              Configurar
            </button>
            <button
              onClick={() => setShowExecuteModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Play className="h-3 w-3" />
              Ejecutar Agente
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
            >
              <X className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Status + Department */}
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(agent.status)}>
            {translateStatus(agent.status)}
          </Badge>
          <Badge variant="default">
            {DEPARTMENT_LABELS[agent.department] || agent.department}
          </Badge>
          <Badge variant="info">{agent.role}</Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {agent.description}
        </p>

        {/* Config */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Configuración
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
              <Cpu className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)]">Modelo</p>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {agent.config.model.replace("claude-", "").replace("-20250514", "")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
              <Thermometer className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)]">Temperatura</p>
                <p className="text-xs font-medium text-[var(--text-primary)]">{agent.config.temperature}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
              <Hash className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)]">Max Tokens</p>
                <p className="text-xs font-medium text-[var(--text-primary)]">{agent.config.maxTokens.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
              <Bot className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)]">Rol</p>
                <p className="text-xs font-medium text-[var(--text-primary)] capitalize">{agent.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Triggers */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Triggers
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {agent.triggers.map((trigger) => (
              <span
                key={trigger}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[var(--surface-1)] text-[var(--text-primary)]"
              >
                <Zap className="h-3 w-3 text-amber-500" />
                {trigger}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Métricas
          </h4>
          <AgentMetricsWidget agentId={agent._id as Id<"agents">} />
        </div>

        {/* System Prompt Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            System Prompt
          </h4>
          <div className="p-3 rounded-lg bg-[var(--surface-1)] max-h-40 overflow-y-auto">
            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
              {agent.config.systemPrompt.slice(0, 500)}
              {agent.config.systemPrompt.length > 500 && "..."}
            </p>
          </div>
        </div>
        {/* Config Editor */}
        <AgentConfigEditor agent={agent} />
      </CardContent>
    </Card>
    </>
  );
}
