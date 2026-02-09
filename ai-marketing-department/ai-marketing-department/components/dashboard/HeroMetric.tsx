"use client";

import Link from "next/link";
import { Sparkline } from "@/components/charts/Sparkline";
import { SimpleCounter, PercentageCounter, CurrencyCounter } from "@/components/ui/AnimatedCounter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMetricProps {
  label: string;
  value: number;
  formatter?: (v: number) => string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  sparkData?: number[];
  sparkColor?: string;
  trend?: number; // percentage change vs previous period
  href?: string;  // click-to-navigate
}

function TrendBadge({ trend }: { trend: number }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral
    ? "text-[var(--text-tertiary)]"
    : isPositive
      ? "text-[#2FCC71]"
      : "text-[#E5484D]";
  const bgColor = isNeutral
    ? "bg-white/[0.04]"
    : isPositive
      ? "bg-[#2FCC71]/10"
      : "bg-[#E5484D]/10";

  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium tabular-nums", color, bgColor)}>
      <Icon className="h-2.5 w-2.5" />
      {isNeutral ? "0%" : `${isPositive ? "+" : ""}${trend.toFixed(1)}%`}
    </span>
  );
}

export function HeroMetric({
  label,
  value,
  formatter,
  isPercentage,
  isCurrency,
  sparkData,
  sparkColor = "var(--accent)",
  trend,
  href,
}: HeroMetricProps) {
  const sparkPoints = sparkData?.map((v) => ({ value: v }));

  const content = (
    <div className={cn(
      "relative rounded-xl bg-[var(--surface-1)] p-5 overflow-hidden transition-all",
      href && "hover:bg-[var(--surface-1)]/80 hover:scale-[1.01] cursor-pointer"
    )}>
      {/* Label + trend */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
          {label}
        </p>
        {trend !== undefined && <TrendBadge trend={trend} />}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {isPercentage ? (
            <PercentageCounter
              value={value}
              className="text-3xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : isCurrency ? (
            <CurrencyCounter
              value={value}
              className="text-3xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          ) : (
            <SimpleCounter
              value={value}
              formatter={formatter || ((v) => Math.round(v).toLocaleString())}
              className="text-3xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight"
            />
          )}
        </div>

        {/* Edge-bleeding sparkline */}
        {sparkPoints && sparkPoints.length > 1 && (
          <div className="shrink-0 w-20 -mr-1 -mb-1">
            <Sparkline
              data={sparkPoints}
              color={sparkColor}
              height={40}
              showTooltip={false}
              showArea
              fillOpacity={0.15}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function HeroMetricSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 rounded bg-[var(--surface-3)] animate-pulse" />
        <div className="h-4 w-12 rounded bg-[var(--surface-3)] animate-pulse" />
      </div>
      <div className="h-8 w-24 rounded bg-[var(--surface-3)] animate-pulse" />
    </div>
  );
}
