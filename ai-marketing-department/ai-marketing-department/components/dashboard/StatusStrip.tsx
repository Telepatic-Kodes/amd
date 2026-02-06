"use client";

import { MetricPill } from "./MetricPill";

interface StatusStripProps {
  activeAgents: number;
  totalAgents: number;
  agentsHealthy: boolean;
  tasksCompletedToday: number;
  totalTasksToday: number;
  contentInFlight: number;
  successRate: number;
}

export function StatusStrip({
  activeAgents,
  totalAgents,
  agentsHealthy,
  tasksCompletedToday,
  totalTasksToday,
  contentInFlight,
  successRate,
}: StatusStripProps) {
  const healthIndicator: "green" | "amber" | "red" =
    successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricPill
        label="Agentes Activos"
        value={`${activeAgents}/${totalAgents}`}
        indicator={agentsHealthy ? "green" : "amber"}
      />
      <MetricPill
        label="Tareas Hoy"
        value={`${tasksCompletedToday}/${totalTasksToday}`}
        subtitle="completadas"
      />
      <MetricPill
        label="Pipeline"
        value={contentInFlight}
        subtitle="en proceso"
        indicator="neutral"
      />
      <MetricPill
        label="Salud del Sistema"
        value={`${successRate.toFixed(0)}%`}
        indicator={healthIndicator}
      />
    </div>
  );
}

export function StatusStripSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] animate-pulse"
        />
      ))}
    </div>
  );
}
