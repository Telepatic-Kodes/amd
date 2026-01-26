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
            <div
              key={i}
              className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const { overview, tasksByDay, topAgents, recentExecutions } = analytics;

  // Sort tasksByDay by date
  const sortedDays = Object.entries(tasksByDay).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Calculate max for chart scaling
  const maxTasks = Math.max(...sortedDays.map(([, data]) => data.total), 1);

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

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Zap className="h-5 w-5" />
              </div>
              <Badge variant="info">{overview.totalExecutions} total</Badge>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-white">
                {formatNumber(overview.totalExecutions)}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Executions</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <Badge variant="success">{overview.successRate.toFixed(1)}%</Badge>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-white">
                {overview.successRate.toFixed(1)}%
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Success Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Activity className="h-5 w-5" />
              </div>
              <Badge variant="default">{formatNumber(overview.totalTokens)}</Badge>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-white">
                {formatNumber(overview.totalTokens)}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Tokens Used</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <Badge variant="warning">{formatCurrency(overview.totalCost)}</Badge>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-white">
                {formatCurrency(overview.totalCost)}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Total Cost</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks by Day Chart */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Tasks by Day (Last 7 Days)
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex items-end gap-2 h-48">
              {sortedDays.map(([date, data]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1" style={{ height: "160px" }}>
                    {/* Completed */}
                    <div
                      className="w-full bg-green-500/80 rounded-t transition-all"
                      style={{
                        height: `${(data.completed / maxTasks) * 100}%`,
                        minHeight: data.completed > 0 ? "4px" : "0",
                      }}
                    />
                    {/* Failed */}
                    <div
                      className="w-full bg-red-500/80 transition-all"
                      style={{
                        height: `${(data.failed / maxTasks) * 100}%`,
                        minHeight: data.failed > 0 ? "4px" : "0",
                      }}
                    />
                    {/* Other (pending, running, etc.) */}
                    <div
                      className="w-full bg-zinc-600/80 rounded-b transition-all"
                      style={{
                        height: `${((data.total - data.completed - data.failed) / maxTasks) * 100}%`,
                        minHeight:
                          data.total - data.completed - data.failed > 0 ? "4px" : "0",
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(date)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500/80 rounded" />
                <span className="text-zinc-400">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500/80 rounded" />
                <span className="text-zinc-400">Failed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-zinc-600/80 rounded" />
                <span className="text-zinc-400">Other</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Agents by Executions
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {topAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-zinc-600 mb-4" />
                <p className="text-zinc-400">No agent activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topAgents.slice(0, 5).map((agent, index) => (
                  <div
                    key={agent.agentId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatNumber(agent.tokens)} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {agent.count} runs
                      </p>
                      <p className="text-xs text-zinc-500">
                        {agent.successRate.toFixed(0)}% success
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
            <Clock className="h-5 w-5 text-blue-500" />
            Recent Executions
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {recentExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No executions recorded yet</p>
            </div>
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
                      className="border-b border-zinc-800/50 last:border-0"
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

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
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

        <Card>
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

        <Card>
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
