"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ReportHistory } from "@/components/reports/ReportHistory";
import { ReportPreview } from "@/components/reports/ReportPreview";
import {
  BarChart3,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  Bot,
  Activity,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import dynamic from "next/dynamic";
import { Sparkline } from "@/components/charts/Sparkline";

const BarChart = dynamic(
  () => import("@/components/charts/BarChart").then((m) => m.BarChart),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("@/components/charts/AreaChart").then((m) => m.AreaChart),
  { ssr: false }
);
const DonutChart = dynamic(
  () => import("@/components/charts/DonutChart").then((m) => m.DonutChart),
  { ssr: false }
);
import { chartColors, seriesColors } from "@/components/charts/theme";
import { SimpleCounter, CurrencyCounter, PercentageCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { SkeletonStat, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyExecutions, EmptyAgents } from "@/components/ui/EmptyState";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { ContentPerformanceTable } from "@/components/analytics/ContentPerformanceTable";
import { ContentInsightsPanel } from "@/components/analytics/ContentInsightsPanel";
import { CsvExportButton } from "@/components/analytics/CsvExportButton";

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
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
  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  });
}

export default function AnalyticsPage() {
  // State for date range
  const [dateRange, setDateRange] = useState<{
    startDate: number;
    endDate: number;
    label: string;
  }>(() => {
    // Default: last 30 days
    const endDate = Date.now();
    const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
    return { startDate, endDate, label: "30 dias" };
  });

  // State for report preview
  const [selectedReportId, setSelectedReportId] = useState<Id<"reports"> | null>(null);

  // Queries with date range
  const analytics = useQuery(api.analytics.getAnalyticsWithDateRange, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const contentPerformance = useQuery(api.analytics.getContentPerformance, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    sortBy: "engagement",
  });

  const completeStep = useMutation(api.guidance.completeSetupStep);

  // Query agent performance for cost distribution (must be before early return)
  const agentPerformance = useQuery(api.analytics.getAgentPerformanceSummary, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Auto-mark "analyticsViewed" setup step
  useEffect(() => {
    completeStep({ step: "analyticsViewed" }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            Analiticas
          </h1>
          <p className="text-stone-400 mt-2">
            Metricas de rendimiento e inteligencia de tu equipo de marketing IA.
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

  const { overview, tasksByDay, executionsByDay, topAgents, recentExecutions } = analytics;

  // Prepare bar chart data from tasksByDay
  const barChartData = Object.entries(tasksByDay)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, data]) => ({
      date: formatDate(date),
      completed: data.completed,
      failed: data.failed,
      other: data.total - data.completed - data.failed,
    }));

  // Prepare area chart data (tokens and executions over time)
  const trendData = barChartData.map((d) => ({
    date: d.date,
    tasks: d.completed + d.failed + d.other,
  }));

  // Prepare horizontal bar chart data for top agents
  const topAgentsData = topAgents.slice(0, 5).map((agent, i) => ({
    name: agent.name.length > 20 ? agent.name.substring(0, 20) + '...' : agent.name,
    executions: agent.count,
    successRate: agent.successCount > 0 ? (agent.successCount / agent.count) * 100 : 0,
    color: seriesColors[i % seriesColors.length],
  }));

  // Build cost distribution by department from real agent performance data
  const costDistribution = (() => {
    if (!agentPerformance || agentPerformance.length === 0) return [];
    const deptCosts: Record<string, number> = {};
    for (const agent of agentPerformance) {
      const dept = agent.department;
      deptCosts[dept] = (deptCosts[dept] || 0) + agent.totalCost;
    }
    const deptColorMap: Record<string, string> = chartColors.departments;
    const deptLabelMap: Record<string, string> = {
      leadership: 'Leadership',
      content: 'Content',
      social: 'Social',
      demandgen: 'DemandGen',
      seo: 'SEO',
      brand: 'Brand',
      ops: 'Ops',
    };
    const totalCostAll = Object.values(deptCosts).reduce((s, v) => s + v, 0);
    if (totalCostAll === 0) return [];
    return Object.entries(deptCosts)
      .map(([dept, cost]) => ({
        name: deptLabelMap[dept] || dept,
        value: Math.round((cost / totalCostAll) * 100),
        color: deptColorMap[dept] || '#78716c',
      }))
      .sort((a, b) => b.value - a.value);
  })();

  // Build sparkline data from real executionsByDay (last 7 days)
  const last7Days = (() => {
    const now = dateRange.endDate;
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  })();

  const sparklineExecutions = last7Days.map((day) => ({
    value: executionsByDay[day]?.count ?? 0,
  }));
  const sparklineSuccessRate = last7Days.map((day) => {
    const d = executionsByDay[day];
    return { value: d && d.count > 0 ? (d.successCount / d.count) * 100 : 0 };
  });
  const sparklineTokens = last7Days.map((day) => ({
    value: executionsByDay[day]?.tokens ?? 0,
  }));
  const sparklineCost = last7Days.map((day) => ({
    value: executionsByDay[day]?.cost ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900">
          Analiticas
        </h1>
        <p className="text-stone-400 mt-2">
          Metricas de rendimiento e inteligencia de tu equipo de marketing IA.
        </p>
      </div>

      {/* Controls Row: Date Range + CSV Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <CsvExportButton startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Zap}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
          title="Ejecuciones"
          value={overview.totalExecutions}
          badge={`${overview.totalExecutions} total`}
          sparklineData={sparklineExecutions}
        />
        <MetricCard
          icon={CheckCircle2}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          title="Tasa de Éxito"
          value={overview.successRate}
          isPercentage
          badge={`${overview.successRate.toFixed(1)}%`}
          badgeVariant="success"
          sparklineData={sparklineSuccessRate}
        />
        <MetricCard
          icon={Activity}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          title="Tokens Usados"
          value={overview.totalTokens}
          formatter={formatNumber}
          badge={formatNumber(overview.totalTokens)}
          sparklineData={sparklineTokens}
        />
        <MetricCard
          icon={DollarSign}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
          title="Costo Total"
          value={overview.totalCost}
          isCurrency
          badge={formatCurrency(overview.totalCost)}
          badgeVariant="warning"
          sparklineData={sparklineCost}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stacked Bar Chart - Tasks by Day */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Tareas por Dia
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {barChartData.length > 0 ? (
              <>
                <BarChart
                  data={barChartData}
                  bars={[
                    { dataKey: 'completed', name: 'Completadas', color: chartColors.success },
                    { dataKey: 'failed', name: 'Fallidas', color: chartColors.error },
                    { dataKey: 'other', name: 'Otras', color: '#52525b' },
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
            <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Tendencias de Rendimiento
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {trendData.length > 0 ? (
              <AreaChart
                data={trendData}
                areas={[
                  { dataKey: 'tasks', name: 'Tareas', color: chartColors.primary },
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

      {/* Content Performance Section */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Rendimiento de Contenido
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <ContentPerformanceTable
            data={contentPerformance || []}
            isLoading={!contentPerformance}
          />
        </CardContent>
      </Card>

      {/* Content Insights Section (AL-04) */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            Insights de Contenido
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <ContentInsightsPanel
            data={contentPerformance || []}
            isLoading={!contentPerformance}
          />
        </CardContent>
      </Card>

      {/* Second Row - Top Agents & Cost Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Agents - Horizontal Bar */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
              <Bot className="h-5 w-5 text-cyan-500" />
              Top Agentes por Ejecuciones
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {topAgentsData.length > 0 ? (
              <div className="space-y-4">
                {topAgentsData.map((agent, index) => (
                  <div key={agent.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 text-xs font-medium text-stone-400">
                          {index + 1}
                        </span>
                        <span className="text-stone-600 truncate max-w-[150px]">
                          {agent.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-900 font-medium">{agent.executions}</span>
                        <Badge
                          variant={agent.successRate >= 80 ? 'success' : agent.successRate >= 50 ? 'warning' : 'error'}
                          className="min-w-[60px] justify-center"
                        >
                          {agent.successRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
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
            <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Distribucion de Costos
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {costDistribution.length > 0 ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-stone-500 text-sm">
                <DollarSign className="h-8 w-8 mb-2 text-stone-600" />
                <p>Sin datos de costos en este período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions Table */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
            <Clock className="h-5 w-5 text-orange-500" />
            Ejecuciones Recientes
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {recentExecutions.length === 0 ? (
            <EmptyExecutions />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-stone-500 border-b border-stone-200">
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Duracion</th>
                    <th className="pb-3 font-medium">Tokens</th>
                    <th className="pb-3 font-medium">Costo</th>
                    <th className="pb-3 font-medium">Agente</th>
                    <th className="pb-3 font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec, i) => (
                    <tr
                      key={i}
                      className="border-b border-stone-200/50 last:border-0 hover:bg-stone-100/30 transition-colors"
                    >
                      <td className="py-3">
                        <Badge
                          variant={exec.status === "success" ? "success" : "error"}
                        >
                          {exec.status === "success" ? "Éxito" : "Error"}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-stone-600 font-mono">
                        {formatDuration(exec.duration)}
                      </td>
                      <td className="py-3 text-sm text-stone-600 font-mono">
                        {formatNumber(exec.tokens)}
                      </td>
                      <td className="py-3 text-sm text-stone-600 font-mono">
                        {formatCurrency(exec.cost)}
                      </td>
                      <td className="py-3 text-sm text-stone-400 truncate max-w-[150px]">
                        {exec.agentName}
                      </td>
                      <td className="py-3 text-sm text-stone-500">
                        {new Date(exec.timestamp).toLocaleString("es-ES", {
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
                <p className="text-xs text-stone-500">Duracion Promedio</p>
                <p className="text-lg font-semibold text-stone-900">
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
                <p className="text-xs text-stone-500">Costo Promedio/Ejecucion</p>
                <p className="text-lg font-semibold text-stone-900">
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
                <p className="text-xs text-stone-500">Tokens Promedio/Ejecucion</p>
                <p className="text-lg font-semibold text-stone-900">
                  {overview.totalExecutions > 0
                    ? formatNumber(overview.totalTokens / overview.totalExecutions)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report History Section */}
      <div className="mt-8">
        <ReportHistory onViewReport={(id) => setSelectedReportId(id)} />
      </div>

      {/* Report Preview Modal */}
      {selectedReportId && (
        <ReportPreview
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  isPercentage = false,
  isCurrency = false,
  formatter,
  sparklineData,
  trend,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number;
  badge?: string;
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
          <h2 className="text-3xl font-bold text-stone-900">
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
          <p className="text-sm text-stone-400 mt-1">{title}</p>
        </div>
        {sparklineData && (
          <div className="mt-3 pt-3 border-t border-stone-200/50">
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
