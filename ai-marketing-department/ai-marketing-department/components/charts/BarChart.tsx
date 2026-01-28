"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { chartColors, chartConfig, seriesColors, tooltipStyle } from './theme';
import { ChartTooltip } from './ChartTooltip';

interface DataPoint {
  [key: string]: string | number;
}

interface BarChartProps {
  data: DataPoint[];
  bars: {
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
    radius?: number;
  }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  stacked?: boolean;
  layout?: 'horizontal' | 'vertical';
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  barSize?: number;
  className?: string;
}

export function BarChartComponent({
  data,
  bars,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  stacked = false,
  layout = 'horizontal',
  valueFormatter,
  labelFormatter,
  barSize,
  className,
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={chartConfig.marginWithAxis}
          barSize={barSize}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              horizontal={!isVertical}
              vertical={isVertical}
            />
          )}
          {isVertical ? (
            <>
              <XAxis
                type="number"
                stroke={chartColors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.text }}
                tickFormatter={valueFormatter}
                hide={!showXAxis}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke={chartColors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.text }}
                width={100}
                hide={!showYAxis}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke={chartColors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.text }}
                hide={!showXAxis}
              />
              <YAxis
                stroke={chartColors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.text }}
                tickFormatter={valueFormatter}
                hide={!showYAxis}
              />
            </>
          )}
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={valueFormatter}
                labelFormatter={labelFormatter}
              />
            }
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          {showLegend && bars.length > 1 && (
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
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.color || seriesColors[index % seriesColors.length]}
              stackId={stacked ? 'stack' : bar.stackId}
              radius={bar.radius ?? [4, 4, 0, 0]}
              animationDuration={chartConfig.animationDuration}
              animationEasing="ease-out"
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple progress bar variant
interface ProgressBarChartProps {
  data: {
    name: string;
    value: number;
    total?: number;
    color?: string;
  }[];
  height?: number;
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function ProgressBarChart({
  data,
  height = 200,
  showLabels = true,
  valueFormatter = (v) => v.toLocaleString(),
  className,
}: ProgressBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.total || d.value));

  return (
    <div className={className}>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = ((item.value / (item.total || maxValue)) * 100);
          const color = item.color || seriesColors[index % seriesColors.length];

          return (
            <div key={item.name} className="space-y-1.5">
              {showLabels && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{item.name}</span>
                  <span className="text-zinc-300 font-medium">
                    {valueFormatter(item.value)}
                    {item.total && (
                      <span className="text-zinc-500 ml-1">
                        / {valueFormatter(item.total)}
                      </span>
                    )}
                  </span>
                </div>
              )}
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { BarChartComponent as BarChart };
