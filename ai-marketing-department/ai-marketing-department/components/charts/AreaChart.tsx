"use client";

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors, chartConfig, seriesColors, tooltipStyle } from './theme';
import { ChartTooltip } from './ChartTooltip';

interface DataPoint {
  [key: string]: string | number;
}

interface AreaChartProps {
  data: DataPoint[];
  areas: {
    dataKey: string;
    name?: string;
    color?: string;
    fillOpacity?: number;
    stackId?: string;
  }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

export function AreaChartComponent({
  data,
  areas,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  stacked = false,
  valueFormatter,
  labelFormatter,
  className,
}: AreaChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={chartConfig.marginWithAxis}
        >
          <defs>
            {areas.map((area, index) => {
              const color = area.color || seriesColors[index % seriesColors.length];
              return (
                <linearGradient
                  key={`gradient-${area.dataKey}`}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey={xAxisKey}
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.text }}
            />
          )}
          {showYAxis && (
            <YAxis
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.text }}
              tickFormatter={valueFormatter}
            />
          )}
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={valueFormatter}
                labelFormatter={labelFormatter}
              />
            }
            cursor={tooltipStyle.cursor}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
              }}
              formatter={(value) => (
                <span className="text-stone-500">{value}</span>
              )}
            />
          )}
          {areas.map((area, index) => {
            const color = area.color || seriesColors[index % seriesColors.length];
            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name || area.dataKey}
                stroke={color}
                strokeWidth={chartConfig.strokeWidth}
                fill={`url(#gradient-${area.dataKey})`}
                fillOpacity={area.fillOpacity ?? 1}
                stackId={stacked ? 'stack' : area.stackId}
                animationDuration={chartConfig.animationDuration}
                animationEasing="ease-out"
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { AreaChartComponent as AreaChart };
