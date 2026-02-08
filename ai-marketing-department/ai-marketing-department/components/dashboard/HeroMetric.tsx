"use client";

import { Sparkline } from "@/components/charts/Sparkline";
import { SimpleCounter, PercentageCounter, CurrencyCounter } from "@/components/ui/AnimatedCounter";

interface HeroMetricProps {
  label: string;
  value: number;
  formatter?: (v: number) => string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  sparkData?: number[];
  sparkColor?: string;
}

export function HeroMetric({
  label,
  value,
  formatter,
  isPercentage,
  isCurrency,
  sparkData,
  sparkColor = "var(--accent)",
}: HeroMetricProps) {
  const sparkPoints = sparkData?.map((v) => ({ value: v }));

  return (
    <div className="relative rounded-xl bg-[var(--surface-1)] p-6 overflow-hidden">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-3">
        {label}
      </p>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {isPercentage ? (
            <PercentageCounter
              value={value}
              className="text-4xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : isCurrency ? (
            <CurrencyCounter
              value={value}
              className="text-4xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : (
            <SimpleCounter
              value={value}
              formatter={formatter || ((v) => Math.round(v).toLocaleString())}
              className="text-4xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          )}
        </div>

        {/* Edge-bleeding sparkline */}
        {sparkPoints && sparkPoints.length > 1 && (
          <div className="shrink-0 w-24 -mr-2 -mb-2">
            <Sparkline
              data={sparkPoints}
              color={sparkColor}
              height={48}
              showTooltip={false}
              showArea
              fillOpacity={0.15}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroMetricSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-6">
      <div className="h-3 w-20 rounded bg-[var(--surface-3)] animate-pulse mb-4" />
      <div className="h-10 w-28 rounded bg-[var(--surface-3)] animate-pulse" />
    </div>
  );
}

// Compact inline metric for the secondary strip
interface SecondaryMetricProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  formatter?: (v: number) => string;
}

export function SecondaryMetric({ icon, label, value, formatter }: SecondaryMetricProps) {
  const formatted = formatter ? formatter(value) : Math.round(value).toLocaleString();

  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
          {formatted}
        </span>
        <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      </div>
    </div>
  );
}

export function SecondaryMetricSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="h-4 w-4 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="h-4 w-16 rounded bg-[var(--surface-3)] animate-pulse" />
    </div>
  );
}
