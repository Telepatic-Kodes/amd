"use client";

import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

interface MetricPillProps {
  label: string;
  value: string | number;
  subtitle?: string;
  indicator?: "green" | "amber" | "red" | "neutral";
  sparkData?: number[];
  sparkColor?: string;
  className?: string;
}

const indicatorColors = {
  green: "bg-[var(--success)]",
  amber: "bg-[var(--warning)]",
  red: "bg-[var(--error)]",
  neutral: "bg-[var(--text-tertiary)]",
};

const defaultSparkColors: Record<string, string> = {
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  neutral: "#71717a",
};

export function MetricPill({ label, value, subtitle, indicator, sparkData, sparkColor, className }: MetricPillProps) {
  const resolvedSparkColor = sparkColor || (indicator ? defaultSparkColors[indicator] : "#10b981");

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3",
        className
      )}
    >
      {indicator && (
        <div className="relative h-2 w-2 shrink-0">
          <div className={cn("absolute inset-0 rounded-full", indicatorColors[indicator])} />
          {indicator === "green" && (
            <div className={cn("absolute inset-0 rounded-full animate-status-ping", indicatorColors[indicator])} />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-[var(--text-primary)]">{value}</span>
          {subtitle && (
            <span className="text-xs text-[var(--text-tertiary)]">{subtitle}</span>
          )}
        </div>
      </div>
      {sparkData && sparkData.length >= 2 && (
        <Sparkline data={sparkData} color={resolvedSparkColor} />
      )}
    </div>
  );
}
