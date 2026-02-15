"use client";

import { useMemo, useCallback } from "react";

interface TaskDayStats {
  total: number;
  completed: number;
}

interface AnalyticsData {
  overview: {
    totalExecutions: number;
    successRate: number;
    totalCost: number;
  };
  recentExecutions?: { status: string; timestamp: number }[];
  tasksByDay?: Record<string, TaskDayStats>;
}

interface UseDashboardDataParams {
  agents: Record<string, unknown>[] | undefined;
  content: Record<string, unknown>[] | undefined;
  analytics: AnalyticsData | undefined;
  contentPerformance: Record<string, unknown>[] | undefined;
}

export function useDashboardData({
  agents,
  content,
  analytics,
  contentPerformance,
}: UseDashboardDataParams) {
  // Attention data
  const computeAttention = useCallback(() => {
    const agentErrors = agents
      ? agents.filter((a) => a.status === "error").length
      : 0;
    const contentInReview = content
      ? content.filter((c) => c.status === "review").length
      : 0;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const failedExecutions = analytics?.recentExecutions
      ? analytics.recentExecutions.filter(
          (e) =>
            (e.status === "failed" || e.status === "failure") &&
            e.timestamp > cutoff
        ).length
      : 0;
    return { agentErrors, contentInReview, failedExecutions };
  }, [agents, content, analytics]);
  const attentionData = computeAttention();

  const tasksByDay = analytics?.tasksByDay;

  // Weekly trends
  const trends = useMemo(() => {
    if (!tasksByDay) return { executions: 0, successRate: 0, cost: 0 };

    const entries = Object.entries(tasksByDay).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    const currentWeek = entries.slice(-7);
    const previousWeek = entries.slice(-14, -7);

    const sumTotal = (arr: typeof entries) =>
      arr.reduce((s, [, d]) => s + d.total, 0);
    const sumCompleted = (arr: typeof entries) =>
      arr.reduce((s, [, d]) => s + d.completed, 0);

    const currExec = sumTotal(currentWeek);
    const prevExec = sumTotal(previousWeek);
    const execTrend =
      prevExec > 0 ? ((currExec - prevExec) / prevExec) * 100 : 0;

    const currSuccess =
      currExec > 0 ? (sumCompleted(currentWeek) / currExec) * 100 : 0;
    const prevSuccess =
      prevExec > 0 ? (sumCompleted(previousWeek) / prevExec) * 100 : 0;
    const successTrend = prevSuccess > 0 ? currSuccess - prevSuccess : 0;

    return { executions: execTrend, successRate: successTrend, cost: 0 };
  }, [tasksByDay]);

  // KPI sparkline data (last 8 days)
  const kpiSparkData = useMemo(() => {
    if (!tasksByDay) return undefined;
    const entries = Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    return entries.map(([, stats]) => stats.total);
  }, [tasksByDay]);

  // Content sparkline data
  const computeContentSpark = useCallback(() => {
    if (!content) return undefined;
    const now = Date.now();
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now - (7 - i) * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0];
    });
    return days.map(
      (day) =>
        content.filter((c) => {
          const created = c._creationTime as number | undefined;
          if (!created) return false;
          return new Date(created).toISOString().split("T")[0] === day;
        }).length
    );
  }, [content]);
  const contentSparkData = computeContentSpark();

  // Chart data for ResultsSummary (last 7 days)
  const chartData = useMemo(() => {
    if (!tasksByDay) return [];
    const entries = Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
    return entries.map(([date, stats]) => ({
      name: new Date(date).toLocaleDateString("es-CL", { weekday: "short" }),
      tareas: stats.total,
    }));
  }, [tasksByDay]);

  // Engagement stats
  const engagementStats = useMemo(() => {
    if (!contentPerformance || !Array.isArray(contentPerformance)) {
      return { totalImpressions: 0, totalInteractions: 0 };
    }
    return contentPerformance.reduce(
      (acc: { totalImpressions: number; totalInteractions: number }, item) => ({
        totalImpressions:
          acc.totalImpressions + ((item.impressions as number) || 0),
        totalInteractions:
          acc.totalInteractions +
          ((item.interactions as number) || (item.engagement as number) || 0),
      }),
      { totalImpressions: 0, totalInteractions: 0 }
    );
  }, [contentPerformance]);

  // Top 3 content
  const topContent = useMemo(() => {
    if (!contentPerformance || !Array.isArray(contentPerformance)) return [];
    return [...contentPerformance]
      .sort(
        (a, b) =>
          ((b.impressions as number) || 0) - ((a.impressions as number) || 0)
      )
      .slice(0, 3)
      .map((item) => ({
        title: (item.title as string) || "Sin titulo",
        type: (item.type as string) || "contenido",
        impressions: (item.impressions as number) || 0,
        interactions:
          (item.interactions as number) || (item.engagement as number) || 0,
      }));
  }, [contentPerformance]);

  return {
    attentionData,
    trends,
    kpiSparkData,
    contentSparkData,
    chartData,
    engagementStats,
    topContent,
  };
}
