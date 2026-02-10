"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const AreaChartComponent = dynamic(
  () => import("@/components/charts/AreaChart").then((m) => m.AreaChartComponent),
  { ssr: false }
);
import { cn } from "@/lib/utils";

interface ActivityChartProps {
  tasksByDay?: Record<string, { completed: number; failed: number; total: number }>;
}

type Period = "7d" | "14d" | "30d";

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function ActivityChart({ tasksByDay }: ActivityChartProps) {
  const [period, setPeriod] = useState<Period>("14d");

  const areaData = useMemo(() => {
    if (!tasksByDay) return [];
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    const entries = Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.slice(-days).map(([date, stats]) => ({
      date: formatDateLabel(date),
      completed: stats.completed,
      failed: stats.failed,
    }));
  }, [tasksByDay, period]);

  if (!tasksByDay || Object.keys(tasksByDay).length === 0) {
    return (
      <div className="rounded-xl bg-[var(--surface-1)] p-5">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-3">
          Actividad
        </h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-[var(--text-tertiary)]">
          Sin datos de actividad
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
          Actividad
        </h3>
        {/* Period picker */}
        <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
          {(["7d", "14d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
                period === p
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <AreaChartComponent
        data={areaData}
        areas={[
          { dataKey: "completed", name: "Completadas", color: "#5B6AE8", fillOpacity: 1 },
          { dataKey: "failed", name: "Fallidas", color: "#E5484D", fillOpacity: 0.4 },
        ]}
        xAxisKey="date"
        height={200}
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
    <div className="rounded-xl bg-[var(--surface-1)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 rounded bg-[var(--surface-3)] animate-pulse" />
        <div className="h-5 w-24 rounded-lg bg-[var(--surface-3)] animate-pulse" />
      </div>
      <div className="h-[200px] rounded bg-[var(--surface-2)] animate-pulse" />
    </div>
  );
}
