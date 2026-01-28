"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  BarChart3,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  Bot,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart, ProgressBarChart } from "@/components/charts/BarChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { chartColors, seriesColors } from "@/components/charts/theme";
import { SimpleCounter, CurrencyCounter, PercentageCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { SkeletonStat, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyExecutions, EmptyAgents } from "@/components/ui/EmptyState";

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AnalyticsPage() {
  const analytics = useQuery(api.functions.getAnalyticsOverview);

  if (!analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-zinc-400 mt-2">
            Performance metrics and insights.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const { overview, tasksByDay, topAgents, recentExecutions } = analytics;

  // Prepare bar chart data from tasksByDay
  const barChartData = Object.entries(tasksByDay)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, data]) => ({
      date: formatDate(date),
      completed: data.completed,
      failed: data.failed,
      other: data.total - data.completed - data.failed,
    }));

  // Prepare area chart data (mock trends over time)
  const trendData = barChartData.map((d, i) => ({
    date: d.date,
    executions: Math.floor(Math.random() * 50) + 20 + i * 5,
    tokens: Math.floor(Math.random() * 5000) + 1000,
    cost: Math.random() * 0.5 + 0.1,
  }));

  // Prepare horizontal bar chart data for top agents
  const topAgentsData = topAgents.slice(0, 5).map((agent, i) => ({
    name: agent.name.length > 20 ? agent.name.substring(0, 20) + '...' : agent.name,
    executions: agent.count,
    successRate: agent.successRate,
    color: seriesColors[i % seriesColors.length],
  }));

  // Mock cost distribution by department
  const costDistribution = [
    { name: 'Content', value: 35, color: chartColors.departments.content },
    { name: 'Social', value: 25, color: chartColors.departments.social },
    { name: 'DemandGen', value: 20, color: chartColors.departments.demandgen },
    { name: 'SEO', value: 12, color: chartColors.departments.seo },
    { name: 'Ops', value: 8, color: chartColors.departments.ops },
  ];

  // Mock sparkline data for stats
  const generateSparkline = (base: number) =>
    Array.from({ length: 7 }, () => ({
      value: Math.max(0, base * (0.7 + Math.random() * 0.6)),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-zinc-400 mt-2">
          Performance metrics and insights for your AI marketing team.
        </p>
      </div>

      {/* Overview Stats with Sparklines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Zap}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
          title="Executions"
          value={overview.totalExecutions}
          badge={`${overview.totalExecutions} total`}
          sparklineData={generateSparkline(overview.totalExecutions / 7)}
          trend={12}
        />
        <MetricCard
          icon={CheckCircle2}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          title="Success Rate"
          value={overview.successRate}
          isPercentage
          badge={`${overview.successRate.toFixed(1)}%`}
          badgeVariant="success"
          sparklineData={generateSparkline(overview.successRate)}
          trend={3}
        />
        <MetricCard
          icon={Activity}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          title="Tokens Used"
          value={overview.totalTokens}
          formatter={formatNumber}
          badge={formatNumber(overview.totalTokens)}
          sparklineData={generateSparkline(overview.totalTokens / 7)}
          trend={-5}
        />
        <MetricCard
          icon={DollarSign}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
          title="Total Cost"
          value={overview.totalCost}
          isCurrency
          badge={formatCurrency(overview.totalCost)}
          badgeVariant="warning"
          sparklineData={generateSparkline(overview.totalCost / 7)}
          trend={8}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stacked Bar Chart - Tasks by Day */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Tasks by Day (Last 7 Days)
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {barChartData.length > 0 ? (
              <>
                <BarChart
                  data={barChartData}
                  bars={[
                    { dataKey: 'completed', name: 'Completed', color: chartColors.success },
                    { dataKey: 'failed', name: 'Failed', color: chartColors.error },
                    { dataKey: 'other', name: 'Other', color: '#52525b' },
                  ]}
                  xAxisKey="date"
                  height={240}
                  stacked
                  showLegend
                  showGrid
                />
              </>
            ) : (
              <EmptyExecutions />
            )}
          </CardContent>
        </Card>

        {/* Area Chart - Trends */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Performance Trends
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {trendData.length > 0 ? (
              <AreaChart
                data={trendData}
                areas={[
                  { dataKey: 'executions', name: 'Executions', color: chartColors.primary },
                  { dataKey: 'tokens', name: 'Tokens (÷100)', color: chartColors.tertiary },
                ]}
                xAxisKey="date"
                height={240}
                showLegend
                showGrid
                valueFormatter={(v) => formatNumber(v)}
              />
            ) : (
              <EmptyExecutions />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Top Agents & Cost Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Agents - Horizontal Bar */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <Bot className="h-5 w-5 text-cyan-500" />
              Top Agents by Executions
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {topAgentsData.length > 0 ? (
              <div className="space-y-4">
                {topAgentsData.map((agent, index) => (
                  <div key={agent.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                          {index + 1}
                        </span>
                        <span className="text-zinc-300 truncate max-w-[150px]">
                          {agent.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{agent.executions}</span>
                        <Badge
                          variant={agent.successRate >= 80 ? 'success' : agent.successRate >= 50 ? 'warning' : 'error'}
                          className="min-w-[60px] justify-center"
                        >
                          {agent.successRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(agent.executions / Math.max(...topAgentsData.map(a => a.executions))) * 100}%`,
                          backgroundColor: agent.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAgents />
            )}
          </CardContent>
        </Card>

        {/* Cost Distribution Donut */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Cost Distribution
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <DonutChart
              data={costDistribution}
              height={240}
              innerRadius={50}
              outerRadius={80}
              showLegend
              centerValue={`$${overview.totalCost.toFixed(2)}`}
              centerLabel="Total"
              valueFormatter={(v) => `${v}%`}
              interactive
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions Table */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
            <Clock className="h-5 w-5 text-blue-500" />
            Recent Executions
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {recentExecutions.length === 0 ? (
            <EmptyExecutions />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Tokens</th>
                    <th className="pb-3 font-medium">Cost</th>
                    <th className="pb-3 font-medium">LLM Calls</th>
                    <th className="pb-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3">
                        <Badge
                          variant={exec.status === "success" ? "success" : "error"}
                        >
                          {exec.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-zinc-300 font-mono">
                        {formatDuration(exec.duration)}
                      </td>
                      <td className="py-3 text-sm text-zinc-300 font-mono">
                        {formatNumber(exec.tokensUsed.total)}
                      </td>
                      <td className="py-3 text-sm text-zinc-300 font-mono">
                        {formatCurrency(exec.cost)}
                      </td>
                      <td className="py-3 text-sm text-zinc-300 font-mono">
                        {exec.llmCalls}
                      </td>
                      <td className="py-3 text-sm text-zinc-500">
                        {new Date(exec.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Avg Duration</p>
                <p className="text-lg font-semibold text-white">
                  {formatDuration(overview.avgDuration)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-pink-500/10 p-2 text-pink-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Avg Cost/Execution</p>
                <p className="text-lg font-semibold text-white">
                  {overview.totalExecutions > 0
                    ? formatCurrency(overview.totalCost / overview.totalExecutions)
                    : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Avg Tokens/Execution</p>
                <p className="text-lg font-semibold text-white">
                  {overview.totalExecutions > 0
                    ? formatNumber(overview.totalTokens / overview.totalExecutions)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  badge,
  badgeVariant = 'info',
  isPercentage = false,
  isCurrency = false,
  formatter,
  sparklineData,
  trend,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number;
  badge: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isPercentage?: boolean;
  isCurrency?: boolean;
  formatter?: (v: number) => string;
  sparklineData?: { value: number }[];
  trend?: number;
}) {
  return (
    <Card hover>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("rounded-lg p-2", iconBg, iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <TrendIndicator value={trend} size="sm" />
          )}
        </div>
        <div className="mt-4">
          <h2 className="text-3xl font-bold text-white">
            {isCurrency ? (
              <CurrencyCounter value={value} />
            ) : isPercentage ? (
              <PercentageCounter value={value} decimals={1} />
            ) : formatter ? (
              <SimpleCounter value={value} formatter={formatter} />
            ) : (
              <SimpleCounter value={value} />
            )}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{title}</p>
        </div>
        {sparklineData && (
          <div className="mt-3 pt-3 border-t border-zinc-800/50">
            <Sparkline
              data={sparklineData}
              height={28}
              trend={trend && trend > 0 ? 'up' : trend && trend < 0 ? 'down' : 'neutral'}
              showTooltip
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
