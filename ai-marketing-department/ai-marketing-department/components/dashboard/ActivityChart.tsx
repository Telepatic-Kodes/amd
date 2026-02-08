"use client";

import { useMemo } from "react";
import { AreaChartComponent } from "@/components/charts/AreaChart";

interface ActivityChartProps {
  tasksByDay?: Record<string, { completed: number; failed: number; total: number }>;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function ActivityChart({ tasksByDay }: ActivityChartProps) {
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

  if (areaData.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--surface-1)] p-6">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-3">
          Actividad
        </h3>
        <div className="flex items-center justify-center h-[240px] text-sm text-[var(--text-tertiary)]">
          Sin datos de actividad
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-6">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-4">
        Actividad
      </h3>
      <AreaChartComponent
        data={areaData}
        areas={[
          { dataKey: "completed", name: "Completadas", color: "#5B6AE8", fillOpacity: 1 },
          { dataKey: "failed", name: "Fallidas", color: "#E5484D", fillOpacity: 0.4 },
        ]}
        xAxisKey="date"
        height={280}
        showGrid={false}
        showLegend={false}
        showXAxis={true}
        showYAxis={false}
      />
    </div>
  );
}

export function ActivityChartSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-6">
      <div className="h-3 w-24 rounded bg-[var(--surface-3)] animate-pulse mb-4" />
      <div className="h-[280px] rounded bg-[var(--surface-2)] animate-pulse" />
    </div>
  );
}
