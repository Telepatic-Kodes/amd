"use client";

import { Sparkline } from "@/components/charts/Sparkline";
import { SimpleCounter, PercentageCounter, CurrencyCounter } from "@/components/ui/AnimatedCounter";
import { CompactTrend } from "@/components/ui/TrendIndicator";

interface KpiCardProps {
  label: string;
  value: number;
  formatter?: (v: number) => string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
}

export function KpiCard({
  label,
  value,
  formatter,
  isPercentage,
  isCurrency,
  trend,
  sparkData,
  sparkColor,
}: KpiCardProps) {
  const sparkPoints = sparkData?.map((v) => ({ value: v }));

  return (
    <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5 hover:border-[var(--border-hover)] transition-colors duration-150 overflow-hidden">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-2">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {isPercentage ? (
            <PercentageCounter
              value={value}
              className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : isCurrency ? (
            <CurrencyCounter
              value={value}
              className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : (
            <SimpleCounter
              value={value}
              formatter={formatter || ((v) => Math.round(v).toLocaleString())}
              className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          )}

          {trend !== undefined && (
            <div className="mt-1">
              <CompactTrend value={trend} className="text-[11px]" />
            </div>
          )}
        </div>

        {sparkPoints && sparkPoints.length > 1 && (
          <div className="shrink-0 w-12">
            <Sparkline
              data={sparkPoints}
              color={sparkColor}
              height={24}
              showTooltip={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <div className="h-3 w-16 rounded bg-gray-100 animate-pulse mb-3" />
      <div className="h-7 w-20 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}
