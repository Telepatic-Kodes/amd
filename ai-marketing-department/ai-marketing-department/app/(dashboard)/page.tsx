"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Database, X, Plus, Zap, LayoutTemplate, TrendingUp, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { StrategyLauncher } from "@/components/dashboard/StrategyLauncher";
import { StrategyDashboard } from "@/components/dashboard/StrategyDashboard";
import { HeroMetric, HeroMetricSkeleton } from "@/components/dashboard/HeroMetric";
import { ActivityChart, ActivityChartSkeleton } from "@/components/dashboard/ActivityChart";
import { TopAgentsTable, TopAgentsTableSkeleton } from "@/components/dashboard/TopAgentsTable";
import { AgentStatusBar } from "@/components/dashboard/AgentStatusBar";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { ContentPipeline } from "@/components/dashboard/ContentPipeline";
import { NeedsAttention, NeedsAttentionSkeleton } from "@/components/dashboard/NeedsAttention";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";

const TemplatePickerModal = dynamic(
  () => import("@/components/content/TemplatePickerModal").then((m) => m.TemplatePickerModal),
  { ssr: false }
);

const DashboardExecuteModal = dynamic(
  () => import("@/components/dashboard/DashboardExecuteModal").then((m) => m.DashboardExecuteModal),
  { ssr: false }
);

export default function DashboardPage() {
  const { success, error } = useToast();
  const [synced, setSynced] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const syncAttemptedRef = useRef(false);

  // User sync
  const syncUser = useMutation(api.users.getOrCreateUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  const migrateData = useMutation(api.migration.migrateExistingDataToOwner);

  // Analytics queries — last 30 days
  const dateRange = useMemo(() => ({
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
  }), []);

  const analytics = useQuery(api.analytics.getAnalyticsWithDateRange, dateRange);
  const agentPerformance = useQuery(api.analytics.getAgentPerformanceSummary, dateRange);

  // Existing queries
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const content = useQuery(api.functions.listContent, {});
  const agents = useQuery(api.functions.listAgents, {});
  const allTemplates = useQuery(api.contentTemplates.listTemplates, {});
  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);

  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [templateModalPreselect, setTemplateModalPreselect] = useState<string | undefined>(undefined);

  // Top 4 templates by usage
  const topTemplates = useMemo(() => {
    if (!allTemplates) return [];
    return [...allTemplates]
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
      .slice(0, 4);
  }, [allTemplates]);

  // Content counts for ContentPipeline
  const contentCounts = useMemo(() => {
    if (!content) return undefined;
    return {
      draft: content.filter((c: Record<string, unknown>) => c.status === "draft").length,
      review: content.filter((c: Record<string, unknown>) => c.status === "review").length,
      approved: content.filter((c: Record<string, unknown>) => c.status === "approved").length,
      scheduled: content.filter((c: Record<string, unknown>) => c.status === "scheduled").length,
      published: content.filter((c: Record<string, unknown>) => c.status === "published").length,
    };
  }, [content]);

  // NeedsAttention data
  const attentionData = useMemo(() => {
    const agentErrors = agents
      ? agents.filter((a: Record<string, unknown>) => a.status === "error").length
      : 0;
    const contentInReview = contentCounts?.review ?? 0;
    const failedExecutions = analytics?.recentExecutions
      ? analytics.recentExecutions.filter(
          (e: { status: string; timestamp: number }) =>
            (e.status === "failed" || e.status === "failure") &&
            e.timestamp > Date.now() - 24 * 60 * 60 * 1000
        ).length
      : 0;
    return { agentErrors, contentInReview, failedExecutions };
  }, [agents, contentCounts, analytics]);

  // Compute weekly trends from tasksByDay
  const trends = useMemo(() => {
    if (!analytics?.tasksByDay) return { executions: 0, successRate: 0, cost: 0 };

    const entries = Object.entries(analytics.tasksByDay)
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

    // Cost trend: use total cost / 2 as approximation for period comparison
    const costTrend = 0; // Cost per-day data not available in tasksByDay

    return { executions: execTrend, successRate: successTrend, cost: costTrend };
  }, [analytics?.tasksByDay]);

  // Sparkline data for content card
  const contentSparkData = useMemo(() => {
    if (!content) return undefined;
    // Group content by creation day (last 8 days)
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
          error("Error al sincronizar perfil. Intenta recargar la página.", err.message);
        });
    }
  }, [synced, syncUser, error]);

  // Migration banner check
  useEffect(() => {
    if (currentUser && currentUser.isSystemOwner && synced) {
      const migrationDone = localStorage.getItem("amd_migration_done");
      if (!migrationDone) {
        setShowMigrationBanner(true);
      }
    }
  }, [currentUser, synced]);

  // Welcome toast
  useEffect(() => {
    if (currentUser && synced) {
      const welcomed = localStorage.getItem("amd_welcomed");
      const shownWelcome = localStorage.getItem("amd_welcome_shown");
      if (welcomed && !shownWelcome) {
        localStorage.setItem("amd_welcome_shown", "true");
        const userName = currentUser.name || "usuario";
        success(`Bienvenido, ${userName}`, "Tu perfil se sincronizó correctamente");
      }
    }
  }, [currentUser, synced, success]);

  // Handle migration
  const handleMigration = async () => {
    setMigrating(true);
    try {
      const counts = await migrateData();
      localStorage.setItem("amd_migration_done", "true");
      setShowMigrationBanner(false);
      const total = counts.content + counts.tasks + counts.campaigns + counts.onboarding + counts.guidance + counts.linkedin;
      success(
        "Migracion completada",
        `${total} registros migrados`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      error("Error en la migración", message);
    } finally {
      setMigrating(false);
    }
  };

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

  // Derive sparkline data from tasksByDay
  const kpiSparkData = useMemo(() => {
    if (!analytics?.tasksByDay) return undefined;
    const entries = Object.entries(analytics.tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    return entries.map(([, stats]) => stats.total);
  }, [analytics?.tasksByDay]);

  // Top agents data
  const topAgentsData = useMemo(() => {
    if (!agentPerformance) return [];
    return agentPerformance.map((a) => ({
      name: a.name,
      department: a.department,
      totalExecutions: a.totalExecutions,
      successRate: a.successRate,
      avgDuration: a.avgDuration,
    }));
  }, [agentPerformance]);

  const isLoading = !analytics;

  // Total content for 4th KPI card
  const totalContent = content?.length ?? 0;

  return (
    <div className="space-y-6 stagger-children">
      {/* Migration Banner — compact toast-like */}
      {showMigrationBanner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-stone-600">
                {translate("auth_migracion_titulo")} —{" "}
                <button
                  onClick={handleMigration}
                  disabled={migrating}
                  className="text-amber-600 hover:underline font-medium disabled:opacity-50"
                >
                  {migrating ? "Migrando..." : translate("auth_migracion_boton")}
                </button>
              </p>
            </div>
            <button
              onClick={() => {
                setShowMigrationBanner(false);
                localStorage.setItem("amd_migration_dismissed", "true");
              }}
              className="text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-base font-medium text-stone-900">
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-stone-400 capitalize mt-0.5">
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
            href="/control-center"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva Tarea
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
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
            label="Tasa Éxito"
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

      {/* Marketing Autopilot — CMO Orchestration Engine */}
      {activeStrategy && activeStrategy.status !== "failed" ? (
        <StrategyDashboard strategyDocId={activeStrategy._id} />
      ) : (
        <StrategyLauncher />
      )}

      {/* Templates Populares */}
      {topTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-purple-500" />
              <h2 className="text-sm font-medium text-stone-700">Templates Populares</h2>
            </div>
            <button
              onClick={() => {
                setTemplateModalPreselect(undefined);
                setShowTemplateModal(true);
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topTemplates.map((tpl) => (
              <button
                key={tpl.templateId}
                onClick={() => {
                  setTemplateModalPreselect(tpl.templateId);
                  setShowTemplateModal(true);
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors shrink-0">
                  <LayoutTemplate className="w-4 h-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 truncate group-hover:text-purple-700 transition-colors">
                    {tpl.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-stone-400" />
                    <span className="text-xs text-stone-400">{tpl.usageCount ?? 0} usos</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Chart (60%) + Needs Attention (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {!analytics ? (
            <ActivityChartSkeleton />
          ) : (
            <ActivityChart tasksByDay={analytics.tasksByDay} />
          )}
        </div>
        <div className="lg:col-span-2">
          {!agents && !analytics ? (
            <NeedsAttentionSkeleton />
          ) : (
            <NeedsAttention
              agentErrors={attentionData.agentErrors}
              contentInReview={attentionData.contentInReview}
              failedExecutions={attentionData.failedExecutions}
            />
          )}
        </div>
      </div>

      {/* Detail Grid: Agents (1/3) + Pipeline (1/3) + Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          {!agentPerformance ? (
            <TopAgentsTableSkeleton />
          ) : (
            <TopAgentsTable agents={topAgentsData} />
          )}
        </div>
        <div>
          <ContentPipeline counts={contentCounts} contentItems={content} />
        </div>
        <div>
          <ActivitySummary activities={activity} />
        </div>
      </div>

      {/* Agent Status Bar */}
      <AgentStatusBar agentsByDepartment={controlStatus?.agentsByDepartment} />

      {/* Template Picker Modal */}
      {showTemplateModal && (
        <TemplatePickerModal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setTemplateModalPreselect(undefined);
          }}
          preselectedTemplateId={templateModalPreselect}
        />
      )}

      {/* Agent Execute Modal */}
      {showExecuteModal && (
        <DashboardExecuteModal onClose={() => setShowExecuteModal(false)} />
      )}
    </div>
  );
}
