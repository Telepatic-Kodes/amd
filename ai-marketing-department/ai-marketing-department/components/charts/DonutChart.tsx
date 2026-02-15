"use client";

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors, chartConfig, seriesColors, tooltipStyle } from './theme';
import { ChartContainer } from './ChartContainer';

interface DonutDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
  centerLabel?: string;
  centerValue?: string | number;
  interactive?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  height = 250,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
  showTooltip = true,
  valueFormatter = (v) => v.toLocaleString(),
  centerLabel,
  centerValue,
  interactive = true,
  className,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer height={height} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          animationDuration={chartConfig.animationDuration}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || seriesColors[index % seriesColors.length]}
              stroke="transparent"
              onMouseEnter={() => interactive && setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'opacity 0.2s, transform 0.2s',
                opacity: activeIndex !== undefined && activeIndex !== index ? 0.5 : 1,
                filter: activeIndex === index ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' : 'none',
              }}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const item = payload[0].payload;
              const percent = ((item.value / total) * 100).toFixed(1);
              return (
                <div style={tooltipStyle.contentStyle}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color || seriesColors[data.indexOf(item) % seriesColors.length] }}
                    />
                    <span className="text-[var(--text-primary)] font-medium">{item.name}</span>
                  </div>
                  <div className="mt-1 text-[var(--text-tertiary)] text-sm">
                    {valueFormatter(item.value)} ({percent}%)
                  </div>
                </div>
              );
            }}
          />
        )}
        {showLegend && (
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{
              fontSize: '12px',
              paddingLeft: '20px',
            }}
            formatter={(value) => (
              <span className="text-[var(--text-tertiary)]">{value}</span>
            )}
          />
        )}
        {/* Center content */}
        {(centerLabel || centerValue) && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {centerValue && (
              <tspan
                x="50%"
                dy={centerLabel ? "-0.5em" : "0"}
                className="fill-stone-900 text-2xl font-bold"
              >
                {centerValue}
              </tspan>
            )}
            {centerLabel && (
              <tspan
                x="50%"
                dy={centerValue ? "1.5em" : "0"}
                className="fill-stone-500 text-xs"
              >
                {centerLabel}
              </tspan>
            )}
          </text>
        )}
      </PieChart>
    </ChartContainer>
  );
}

// Mini donut for inline use
interface MiniDonutProps {
  value: number;
  total: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MiniDonut({
  value,
  total,
  color = chartColors.primary,
  size = 40,
  strokeWidth = 4,
  className,
}: MiniDonutProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={chartColors.grid}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
    </div>
  );
}
