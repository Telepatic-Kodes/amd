"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, FileText, Inbox, Zap } from "lucide-react";
import type { Doc } from "@convex/_generated/dataModel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionFeedItem, ActionItem } from "./ActionFeedItem";

interface ActionFeedProps {
  contentInReview: Doc<"content">[];
  agentsWithErrors: Doc<"agents">[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    timestamp: number;
  }[];
  onApproveContent: (id: string) => void;
  onRequestChanges: (id: string) => void;
  onRetryAgent: (agentId: string) => void;
  onViewAgent: (agentId: string) => void;
  onViewContent: (id: string) => void;
}

export function ActionFeed({
  contentInReview,
  agentsWithErrors,
  recentActivity,
  onApproveContent,
  onRequestChanges,
  onRetryAgent,
  onViewAgent,
  onViewContent,
}: ActionFeedProps) {
  const attentionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    for (const content of contentInReview) {
      items.push({
        icon: FileText,
        iconColor: "bg-amber-500/10 text-amber-600",
        title: content.title,
        description: "Pendiente de revisión",
        badge: { label: "Review", variant: "warning" },
        actions: [
          {
            label: "Aprobar",
            variant: "primary",
            onClick: () => onApproveContent(content._id),
          },
          {
            label: "Cambios",
            variant: "outline",
            onClick: () => onRequestChanges(content._id),
          },
        ],
      });
    }

    for (const agent of agentsWithErrors) {
      items.push({
        icon: AlertCircle,
        iconColor: "bg-red-500/10 text-red-600",
        title: agent.name,
        description: `Error en agente ${agent.agentId}`,
        badge: { label: "Error", variant: "error" },
        actions: [
          {
            label: "Reintentar",
            variant: "primary",
            onClick: () => onRetryAgent(agent.agentId),
          },
          {
            label: "Ver logs",
            variant: "outline",
            onClick: () => onViewAgent(agent.agentId),
          },
        ],
      });
    }

    return items;
  }, [contentInReview, agentsWithErrors, onApproveContent, onRequestChanges, onRetryAgent, onViewAgent]);

  const activityItems = useMemo<ActionItem[]>(() => {
    return recentActivity.slice(0, 10).map((activity) => {
      let icon = CheckCircle2;
      if (activity.type === "execution") icon = Zap;
      else if (activity.type === "content") icon = FileText;

      return {
        icon,
        iconColor: "bg-muted text-muted-foreground",
        title: activity.description,
        timestamp: activity.timestamp,
        actions: [],
      };
    });
  }, [recentActivity]);

  return (
    <div className="space-y-6">
      {/* Section 1: Necesita tu atencion */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
          Necesita tu atención
        </h2>
        {attentionItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Todo al día"
            description="No hay items pendientes de tu atención"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item, index) => (
              <ActionFeedItem key={`attention-${index}`} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Actividad reciente */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
          Actividad reciente
        </h2>
        {activityItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin actividad"
            description="La actividad de tus agentes aparecerá aquí"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {activityItems.map((item, index) => (
              <ActionFeedItem key={`activity-${index}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
