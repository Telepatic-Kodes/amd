"use client";

import { tooltipStyle } from './theme';

interface PayloadEntry {
  color?: string;
  name?: string;
  value?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string | number;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => v.toLocaleString(),
  labelFormatter = (l) => l,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div style={tooltipStyle.contentStyle}>
      <p style={tooltipStyle.labelStyle}>{labelFormatter(String(label))}</p>
      {payload.map((entry, index) => (
        <div
          key={`tooltip-${index}`}
          className="flex items-center gap-2"
          style={tooltipStyle.itemStyle}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="text-gray-900 font-medium">
            {valueFormatter(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Simple tooltip for sparklines
interface SparklineTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  valueFormatter?: (value: number) => string;
}

export function SparklineTooltip({
  active,
  payload,
  valueFormatter = (v) => v.toLocaleString(),
}: SparklineTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const value = payload[0].value as number;

  return (
    <div className="bg-white border border-gray-200 rounded px-2 py-1 shadow-lg">
      <span className="text-gray-900 text-xs font-medium">
        {valueFormatter(value)}
      </span>
    </div>
  );
}
