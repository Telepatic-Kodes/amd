"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const AreaChartComponent = dynamic(
  () => import("@/components/charts/AreaChart").then((m) => m.AreaChartComponent),
  { ssr: false }
);
const DonutChart = dynamic(
  () => import("@/components/charts/DonutChart").then((m) => m.DonutChart),
  { ssr: false }
);

interface ChartsRowProps {
  tasksByDay?: Record<string, { completed: number; failed: number; total: number }>;
  statusDistribution?: Record<string, number>;
  totalContent?: number;
}

const statusColors: Record<string, string> = {
  draft: "#71717a",
  review: "#f59e0b",
  revision_needed: "#f97316",
  approved: "#ea580c",
  scheduled: "#8b5cf6",
  published: "#22c55e",
  archived: "#52525b",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  review: "En Revision",
  revision_needed: "Revision",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
  archived: "Archivado",
};

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function ChartsRow({ tasksByDay, statusDistribution, totalContent }: ChartsRowProps) {
  // Transform tasksByDay Record into sorted array for AreaChart
  const areaData = useMemo(() => {
    if (!tasksByDay) return [];
    return Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date: formatDateLabel(date),
        completed: stats.completed,
        failed: stats.failed,
      }));
  }, [tasksByDay]);

  // Transform statusDistribution into DonutChart data
  const donutData = useMemo(() => {
    if (!statusDistribution) return [];
    return Object.entries(statusDistribution)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || "#71717a",
      }));
  }, [statusDistribution]);

  const hasAreaData = areaData.length > 0;
  const hasDonutData = donutData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left: Task Activity Area Chart */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-3">
          Actividad de Tareas
        </h3>
        {hasAreaData ? (
          <AreaChartComponent
            data={areaData}
            areas={[
              { dataKey: "completed", name: "Completadas", color: "#22c55e" },
              { dataKey: "failed", name: "Fallidas", color: "#ef4444" },
            ]}
            xAxisKey="date"
            height={220}
            showGrid={false}
            showLegend={false}
            showXAxis={true}
            showYAxis={true}
          />
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-[var(--text-tertiary)]">
            Sin datos de actividad
          </div>
        )}
      </div>

      {/* Right: Content Distribution Donut */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-3">
          Distribucion de Contenido
        </h3>
        {hasDonutData ? (
          <DonutChart
            data={donutData}
            height={220}
            innerRadius={55}
            outerRadius={80}
            showLegend={true}
            interactive={true}
            centerValue={totalContent ?? 0}
            centerLabel="Total"
          />
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-[var(--text-tertiary)]">
            Sin contenido
          </div>
        )}
      </div>
    </div>
  );
}

export function ChartsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <div className="h-3 w-32 rounded bg-[var(--surface-1)] animate-pulse mb-4" />
          <div className="h-[220px] rounded bg-[var(--surface-1)]/30 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
