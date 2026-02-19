"use client";

import { Play, Settings } from "lucide-react";
import type { Doc } from "@convex/_generated/dataModel";
import { Badge, StatusBadge, RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface Handoff {
  toAgentId: string;
  condition: string;
}

interface AgentDrawerContentProps {
  agent: Doc<"agents">;
  onExecute: () => void;
  onConfigure: () => void;
}

export function AgentDrawerContent({
  agent,
  onExecute,
  onConfigure,
}: AgentDrawerContentProps) {
  const handoffs = (agent.metadata as { handoffs?: Handoff[] } | undefined)
    ?.handoffs;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <StatusBadge status={agent.status} />
          <RoleBadge role={agent.role} />
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {agent.description}
        </p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          ID: {agent.agentId}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={onExecute}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Ejecutar
        </Button>
        <Button size="sm" variant="outline" onClick={onConfigure}>
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Configurar
        </Button>
      </div>

      {/* Config summary */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Configuración
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Modelo</p>
              <p className="text-xs text-[var(--text-primary)]">
                {agent.config?.model ?? "claude-sonnet-4"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Temperatura</p>
              <p className="text-xs text-[var(--text-primary)]">
                {agent.config?.temperature ?? 0.7}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Max Tokens</p>
              <p className="text-xs text-[var(--text-primary)]">
                {(agent.config?.maxTokens ?? 4096).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Triggers</p>
              <p className="text-xs text-[var(--text-primary)]">
                {agent.triggers?.length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triggers */}
      {agent.triggers && agent.triggers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Triggers
            </h4>
            <div className="mt-3 flex flex-wrap gap-1">
              {agent.triggers.map((trigger) => (
                <Badge key={trigger} variant="default">
                  {trigger}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handoffs */}
      {handoffs && handoffs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Handoffs
            </h4>
            <div className="mt-3 space-y-2">
              {handoffs.map((h) => (
                <div
                  key={h.toAgentId}
                  className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span>&rarr; {h.toAgentId}</span>
                  <Badge variant="default">{h.condition}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
