"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Zap, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HeroMetric, HeroMetricSkeleton } from "@/components/dashboard/HeroMetric";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { DecisionsPending } from "@/components/dashboard/DecisionsPending";
import { DepartmentKanban } from "@/components/dashboard/DepartmentKanban";
import { ResultsSummary } from "@/components/dashboard/ResultsSummary";
import { useToast } from "@/components/ui/Toast";

const DashboardExecuteModal = dynamic(
  () => import("@/components/dashboard/DashboardExecuteModal").then((m) => m.DashboardExecuteModal),
  { ssr: false }
);

export default function DashboardPage() {
  const { success, error } = useToast();
  const [synced, setSynced] = useState(false);
  const syncAttemptedRef = useRef(false);

  // User sync
  const syncUser = useMutation(api.users.getOrCreateUser);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Analytics queries - last 30 days
  const [dateRange] = useState(() => ({
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
  }));

  const analytics = useQuery(api.analytics.getAnalyticsWithDateRange, dateRange);

  // Brand profile for content filtering
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);

  // Existing queries
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const content = useQuery(api.functions.listContent, brandProfile === undefined ? "skip" : { brandProfileId: brandProfile?._id });
  const agents = useQuery(api.functions.listAgents, {});
  const contentPerformance = useQuery(api.analytics.getContentPerformance, dateRange);

  // Modal state
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // NeedsAttention / Decisions data
  const computeAttention = useCallback(() => {
    const agentErrors = agents
      ? agents.filter((a: Record<string, unknown>) => a.status === "error").length
      : 0;
    const contentInReview = content
      ? content.filter((c: Record<string, unknown>) => c.status === "review").length
      : 0;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const failedExecutions = analytics?.recentExecutions
      ? analytics.recentExecutions.filter(
          (e: { status: string; timestamp: number }) =>
            (e.status === "failed" || e.status === "failure") &&
            e.timestamp > cutoff
        ).length
      : 0;
    return { agentErrors, contentInReview, failedExecutions };
  }, [agents, content, analytics]);
  const attentionData = computeAttention();

  // Extract tasksByDay for stable dependency
  const tasksByDay = analytics?.tasksByDay;

  // Compute weekly trends from tasksByDay
  const trends = useMemo(() => {
    if (!tasksByDay) return { executions: 0, successRate: 0, cost: 0 };

    const entries = Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b));

    const currentWeek = entries.slice(-7);
    const previousWeek = entries.slice(-14, -7);

    const sumTotal = (arr: typeof entries) => arr.reduce((s, [, d]) => s + d.total, 0);
    const sumCompleted = (arr: typeof entries) => arr.reduce((s, [, d]) => s + d.completed, 0);

    const currExec = sumTotal(currentWeek);
    const prevExec = sumTotal(previousWeek);
    const execTrend = prevExec > 0 ? ((currExec - prevExec) / prevExec) * 100 : 0;

    const currSuccess = currExec > 0 ? (sumCompleted(currentWeek) / currExec) * 100 : 0;
    const prevSuccess = prevExec > 0 ? (sumCompleted(previousWeek) / prevExec) * 100 : 0;
    const successTrend = prevSuccess > 0 ? currSuccess - prevSuccess : 0;

    const costTrend = 0; // Cost per-day data not available in tasksByDay

    return { executions: execTrend, successRate: successTrend, cost: costTrend };
  }, [tasksByDay]);

  // Sparkline data for KPI cards (last 8 days)
  const kpiSparkData = useMemo(() => {
    if (!tasksByDay) return undefined;
    const entries = Object.entries(tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    return entries.map(([, stats]) => stats.total);
  }, [tasksByDay]);

  // Sparkline data for content card
  const computeContentSpark = useCallback(() => {
    if (!content) return undefined;
    const now = Date.now();
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now - (7 - i) * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0];
    });
    return days.map((day) =>
      content.filter((c: Record<string, unknown>) => {
        const created = c._creationTime as number | undefined;
        if (!created) return false;
        return new Date(created).toISOString().split("T")[0] === day;
      }).length
    );
  }, [content]);
  const contentSparkData = computeContentSpark();

  // Chart data for ResultsSummary (last 7 days from tasksByDay)
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

  // Engagement stats from contentPerformance
  const engagementStats = useMemo(() => {
    if (!contentPerformance || !Array.isArray(contentPerformance)) {
      return { totalImpressions: 0, totalInteractions: 0 };
    }
    return contentPerformance.reduce(
      (acc: { totalImpressions: number; totalInteractions: number }, item: Record<string, unknown>) => ({
        totalImpressions: acc.totalImpressions + ((item.impressions as number) || 0),
        totalInteractions: acc.totalInteractions + ((item.interactions as number) || (item.engagement as number) || 0),
      }),
      { totalImpressions: 0, totalInteractions: 0 }
    );
  }, [contentPerformance]);

  // Top 3 content from contentPerformance
  const topContent = useMemo(() => {
    if (!contentPerformance || !Array.isArray(contentPerformance)) return [];
    return [...contentPerformance]
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.impressions as number) || 0) - ((a.impressions as number) || 0)
      )
      .slice(0, 3)
      .map((item: Record<string, unknown>) => ({
        title: (item.title as string) || "Sin titulo",
        type: (item.type as string) || "contenido",
        impressions: (item.impressions as number) || 0,
        interactions: (item.interactions as number) || (item.engagement as number) || 0,
      }));
  }, [contentPerformance]);

  // User sync effect
  useEffect(() => {
    if (!synced && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      syncUser()
        .then(() => {
          setSynced(true);
          const welcomed = localStorage.getItem("amd_welcomed");
          if (!welcomed) {
            localStorage.setItem("amd_welcomed", "true");
          }
        })
        .catch((err) => {
          error("Error al sincronizar perfil. Intenta recargar la pagina.", err.message);
        });
    }
  }, [synced, syncUser, error]);

  // Welcome toast
  useEffect(() => {
    if (currentUser && synced) {
      const welcomed = localStorage.getItem("amd_welcomed");
      const shownWelcome = localStorage.getItem("amd_welcome_shown");
      if (welcomed && !shownWelcome) {
        localStorage.setItem("amd_welcome_shown", "true");
        const uName = currentUser.name || "usuario";
        success(`Bienvenido, ${uName}`, "Tu perfil se sincronizo correctamente");
      }
    }
  }, [currentUser, synced, success]);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Greeting
  const userName = currentUser?.name || "usuario";
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = currentTime.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = currentTime.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const isLoading = !analytics;
  const totalContent = content?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
            {greeting}, {userName}
          </h1>
          <p className="text-xs capitalize mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {dateStr} &middot; {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExecuteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Ejecutar Agente
          </button>
          <Link
            href="/content"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva Tarea
          </Link>
        </div>
      </div>

      {/* Zone 1: KPIs (3/4) + Decisions (1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HeroMetricSkeleton />
              <HeroMetricSkeleton />
              <HeroMetricSkeleton />
              <HeroMetricSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HeroMetric
                label="Ejecuciones"
                value={analytics.overview.totalExecutions}
                sparkData={kpiSparkData}
                sparkColor="#ea580c"
                trend={trends.executions}
                href="/results"
              />
              <HeroMetric
                label="Tasa Exito"
                value={analytics.overview.successRate}
                isPercentage
                sparkColor="#16a34a"
                trend={trends.successRate}
              />
              <HeroMetric
                label="Costo"
                value={analytics.overview.totalCost}
                isCurrency
                sparkColor="#d97706"
                trend={trends.cost}
              />
              <HeroMetric
                label="Contenido"
                value={totalContent}
                sparkData={contentSparkData}
                sparkColor="#7c3aed"
                formatter={(v) => `${Math.round(v)}`}
                href="/content"
              />
            </div>
          )}
        </div>
        <div>
          <DecisionsPending
            contentInReview={attentionData.contentInReview}
            agentErrors={attentionData.agentErrors}
            failedExecutions={attentionData.failedExecutions}
          />
        </div>
      </div>

      {/* Zone 2: Department Kanban */}
      <DepartmentKanban agentsByDepartment={controlStatus?.agentsByDepartment} />

      {/* Zone 3: Results (2/3) + Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResultsSummary
            chartData={chartData}
            topContent={topContent}
            totalImpressions={engagementStats.totalImpressions}
            totalInteractions={engagementStats.totalInteractions}
          />
        </div>
        <div>
          <ActivitySummary activities={activity} />
        </div>
      </div>

      {/* Agent Execute Modal */}
      {showExecuteModal && (
        <DashboardExecuteModal onClose={() => setShowExecuteModal(false)} />
      )}
    </div>
  );
}
