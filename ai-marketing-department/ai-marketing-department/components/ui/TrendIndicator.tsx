"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  showIcon?: boolean;
  showBackground?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  positiveLabel?: string;
  negativeLabel?: string;
  neutralLabel?: string;
}

export function TrendIndicator({
  value,
  suffix = '%',
  showIcon = true,
  showBackground = true,
  size = 'md',
  className,
  positiveLabel,
  negativeLabel,
  neutralLabel,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const sizes = {
    sm: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      padding: 'px-1.5 py-0.5',
      gap: 'gap-0.5',
    },
    md: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      padding: 'px-2 py-1',
      gap: 'gap-1',
    },
    lg: {
      text: 'text-base',
      icon: 'h-5 w-5',
      padding: 'px-3 py-1.5',
      gap: 'gap-1.5',
    },
  };

  const s = sizes[size];

  const colors = {
    positive: showBackground
      ? 'bg-green-500/10 text-green-400'
      : 'text-green-400',
    negative: showBackground
      ? 'bg-red-500/10 text-red-400'
      : 'text-red-400',
    neutral: showBackground
      ? 'bg-stone-500/10 text-stone-400'
      : 'text-stone-400',
  };

  const color = isPositive
    ? colors.positive
    : isNegative
    ? colors.negative
    : colors.neutral;

  const Icon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  const displayValue = Math.abs(value);
  const prefix = isPositive ? '+' : isNegative ? '-' : '';

  const label = isPositive
    ? positiveLabel
    : isNegative
    ? negativeLabel
    : neutralLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        showBackground && "rounded-full",
        showBackground && s.padding,
        s.text,
        s.gap,
        color,
        className
      )}
    >
      {showIcon && <Icon className={s.icon} />}
      <span>
        {prefix}
        {displayValue}
        {suffix}
      </span>
      {label && <span className="ml-0.5">{label}</span>}
    </span>
  );
}

// Compact variant for inline use
interface CompactTrendProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function CompactTrend({ value, suffix = '%', className }: CompactTrendProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const color = isPositive
    ? 'text-green-400'
    : isNegative
    ? 'text-red-400'
    : 'text-stone-400';

  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→';

  return (
    <span className={cn("font-medium", color, className)}>
      {arrow} {Math.abs(value)}{suffix}
    </span>
  );
}

// Trend badge with label
interface TrendBadgeProps {
  value: number;
  label: string;
  suffix?: string;
  className?: string;
}

export function TrendBadge({ value, label, suffix = '%', className }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const bgColor = isPositive
    ? 'bg-green-500/10 border-green-500/20'
    : isNegative
    ? 'bg-red-500/10 border-red-500/20'
    : 'bg-stone-500/10 border-stone-500/20';

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2",
        bgColor,
        className
      )}
    >
      <TrendIndicator
        value={value}
        suffix={suffix}
        showBackground={false}
        size="sm"
      />
      <span className="text-xs text-stone-400">{label}</span>
    </div>
  );
}
