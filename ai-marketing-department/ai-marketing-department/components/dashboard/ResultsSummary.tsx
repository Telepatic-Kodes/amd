"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { Eye, Heart, TrendingUp, BarChart3 } from "lucide-react";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";


const LineChart = dynamic(
  () => import("@/components/charts/LineChart").then((mod) => mod.LineChartComponent),
  { ssr: false }
);

interface ContentItem {
  title: string;
  type: string;
  impressions: number;
  interactions: number;
}

interface ResultsSummaryProps {
  chartData: { name: string; tareas: number }[];
  topContent: ContentItem[];
  totalImpressions: number;
  totalInteractions: number;
}

// Format large numbers as K format (e.g., 1500 -> 1.5K)
function formatToK(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export const ResultsSummary = memo(function ResultsSummary({
  chartData,
  topContent,
  totalImpressions,
  totalInteractions,
}: ResultsSummaryProps) {
  const hasChartData = chartData && chartData.length > 0;

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--surface-2)] p-6 space-y-5">
      {/* Header with title and icon */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Resultados (7 días)
        </h2>
      </div>

      {/* Mini KPIs row - grid 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Impressions */}
        <div className="bg-[var(--surface-2)] rounded-lg px-4 py-3 flex items-center gap-3">
          <Eye className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
          <div className="flex-1 min-w-0">
            <SimpleCounter
              value={totalImpressions}
              formatter={(v) => formatToK(v)}
              className="block text-sm font-semibold text-[var(--text-primary)]"
              duration={1000}
            />
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mt-0.5">
              Impresiones
            </p>
          </div>
        </div>

        {/* Right: Interactions */}
        <div className="bg-[var(--surface-2)] rounded-lg px-4 py-3 flex items-center gap-3">
          <Heart className="h-4 w-4 text-[#EF4444] shrink-0" />
          <div className="flex-1 min-w-0">
            <SimpleCounter
              value={totalInteractions}
              className="block text-sm font-semibold text-[var(--text-primary)]"
              duration={1000}
            />
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mt-0.5">
              Interacciones
            </p>
          </div>
        </div>
      </div>

      {/* Mini chart - h-32 */}
      <div className="rounded-lg bg-[var(--surface-2)] overflow-hidden">
        {hasChartData ? (
          <LineChart
            data={chartData}
            dataKey="tareas"
            name="Tareas"
            height={128}
            showGrid={false}
            showTooltip={true}
            showLegend={false}
            showXAxis={true}
            showYAxis={true}
          />
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
            <BarChart3 className="h-5 w-5 mb-2" />
            <p className="text-xs">Sin datos</p>
          </div>
        )}
      </div>

      {/* Top 3 content section */}
      <div className="space-y-3">
        <h3 className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
          Top Contenido
        </h3>

        {topContent.length > 0 ? (
          <div className="space-y-2">
            {topContent.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--card-bg)]/[0.05] transition-colors"
              >
                {/* Left: title + type badge */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] truncate font-medium">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] capitalize">
                    {item.type}
                  </p>
                </div>

                {/* Right: impressions count in orange */}
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-[#F59E0B]">
                    {formatToK(item.impressions)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4 rounded-lg bg-[var(--surface-2)] text-center">
            <p className="text-xs text-[var(--text-tertiary)]">Sin contenido</p>
          </div>
        )}
      </div>
    </div>
  );
});

export function ResultsSummarySkeleton() {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--surface-2)] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-[var(--surface-3)] animate-pulse" />
        <div className="h-4 w-32 rounded bg-[var(--surface-3)] animate-pulse" />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface-2)] rounded-lg px-4 py-3 h-16 animate-pulse" />
        <div className="bg-[var(--surface-2)] rounded-lg px-4 py-3 h-16 animate-pulse" />
      </div>

      {/* Chart area */}
      <div className="rounded-lg bg-[var(--surface-2)] h-32 animate-pulse" />

      {/* Top content list */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-[var(--surface-3)] animate-pulse" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] h-12 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
