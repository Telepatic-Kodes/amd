"use client";

import { cn } from "@/lib/utils";

interface MetricPillProps {
  label: string;
  value: string | number;
  subtitle?: string;
  indicator?: "green" | "amber" | "red" | "neutral";
  className?: string;
}

const indicatorColors = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  neutral: "bg-zinc-500",
};

export function MetricPill({ label, value, subtitle, indicator, className }: MetricPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3",
        className
      )}
    >
      {indicator && (
        <div className={cn("h-2 w-2 shrink-0 rounded-full", indicatorColors[indicator])} />
      )}
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-[var(--text-primary)]">{value}</span>
          {subtitle && (
            <span className="text-xs text-[var(--text-tertiary)]">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
