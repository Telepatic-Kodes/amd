"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  YAxis,
} from 'recharts';
import { chartColors, chartConfig } from './theme';
import { SparklineTooltip } from './ChartTooltip';

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  showArea?: boolean;
  fillOpacity?: number;
}

export function Sparkline({
  data,
  color,
  height = 32,
  showTooltip = true,
  valueFormatter,
  className,
  trend,
  showArea = false,
  fillOpacity = 0.2,
}: SparklineProps) {
  // Determine color based on trend if not provided
  const lineColor = color || (
    trend === 'up' ? chartColors.success :
    trend === 'down' ? chartColors.error :
    chartColors.primary
  );

  // Calculate min/max for proper scaling
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;

  const gradientId = `sparkline-${lineColor.replace('#', '')}`;

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          {showArea && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={fillOpacity} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <YAxis
            domain={[min - padding, max + padding]}
            hide
          />
          {showTooltip && (
            <Tooltip
              content={<SparklineTooltip valueFormatter={valueFormatter} />}
              cursor={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            fill={showArea ? `url(#${gradientId})` : 'none'}
            animationDuration={chartConfig.animationDuration}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area variant for sparkline
interface SparklineAreaProps extends SparklineProps {
  fillOpacity?: number;
}

export function SparklineArea({
  data,
  color,
  height = 32,
  showTooltip = true,
  valueFormatter,
  className,
  trend,
  fillOpacity = 0.2,
}: SparklineAreaProps) {
  const lineColor = color || (
    trend === 'up' ? chartColors.success :
    trend === 'down' ? chartColors.error :
    chartColors.primary
  );

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1;

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparkArea-${lineColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={fillOpacity} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[min - padding, max + padding]} hide />
          {showTooltip && (
            <Tooltip
              content={<SparklineTooltip valueFormatter={valueFormatter} />}
              cursor={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            fill={`url(#sparkArea-${lineColor})`}
            animationDuration={chartConfig.animationDuration}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
