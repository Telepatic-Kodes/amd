"use client";

import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
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

interface LineChartProps {
  data: DataPoint[];
  lines: {
    dataKey: string;
    name?: string;
    color?: string;
    strokeDasharray?: string;
  }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

export function LineChartComponent({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  valueFormatter,
  labelFormatter,
  className,
}: LineChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={chartConfig.marginWithAxis}
        >
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
                <span className="text-zinc-400">{value}</span>
              )}
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || seriesColors[index % seriesColors.length]}
              strokeWidth={chartConfig.strokeWidth}
              strokeDasharray={line.strokeDasharray}
              dot={false}
              activeDot={{
                r: chartConfig.activeDotRadius,
                strokeWidth: 2,
                stroke: chartColors.background,
              }}
              animationDuration={chartConfig.animationDuration}
              animationEasing="ease-out"
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { LineChartComponent as LineChart };
