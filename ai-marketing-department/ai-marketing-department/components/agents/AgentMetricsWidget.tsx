"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CheckCircle, Coins, DollarSign, Timer } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

interface AgentMetricsWidgetProps {
  agentId: Id<"agents">;
}

export function AgentMetricsWidget({ agentId }: AgentMetricsWidgetProps) {
  const metrics = useQuery(api.functions.getAgentMetrics, { agentId });

  if (metrics === undefined) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--surface-1)] animate-pulse" />
        ))}
      </div>
    );
  }

  const cells = [
    {
      icon: CheckCircle,
      label: "Éxito",
      value: `${(metrics.successRate * 100).toFixed(0)}%`,
      color: "text-green-500",
    },
    {
      icon: Coins,
      label: "Tokens",
      value: metrics.totalTokens.toLocaleString(),
      color: "text-blue-500",
    },
    {
      icon: DollarSign,
      label: "Costo",
      value: `$${metrics.totalCost.toFixed(2)}`,
      color: "text-amber-500",
    },
    {
      icon: Timer,
      label: "Duración Prom.",
      value: `${metrics.avgDuration.toFixed(1)}s`,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]"
        >
          <cell.icon className={`h-3.5 w-3.5 ${cell.color}`} />
          <div>
            <p className="text-[10px] text-[var(--text-secondary)]">{cell.label}</p>
            <p className="text-xs font-medium text-[var(--text-primary)]">{cell.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
