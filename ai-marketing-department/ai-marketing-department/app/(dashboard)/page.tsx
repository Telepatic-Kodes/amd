"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Database, X, Plus, Coins, FileCheck, Timer } from "lucide-react";
import Link from "next/link";
import { HeroMetric, HeroMetricSkeleton, SecondaryMetric, SecondaryMetricSkeleton } from "@/components/dashboard/HeroMetric";
import { ActivityChart, ActivityChartSkeleton } from "@/components/dashboard/ActivityChart";
import { TopAgentsTable, TopAgentsTableSkeleton } from "@/components/dashboard/TopAgentsTable";
import { AgentStatusBar } from "@/components/dashboard/AgentStatusBar";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { ContentPipeline } from "@/components/dashboard/ContentPipeline";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";

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
  const pipelineMetrics = useQuery(api.analytics.getContentPipelineMetrics, dateRange);
  const agentPerformance = useQuery(api.analytics.getAgentPerformanceSummary, dateRange);

  // Existing queries — kept for components that need them
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const content = useQuery(api.functions.listContent, {});

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
        success(`Bienvenido, ${userName}`, "Tu perfil se sincronizo correctamente");
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
      error("Error en la migracion", message);
    } finally {
      setMigrating(false);
    }
  };

  // Live clock — updates every minute
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

  // Derive sparkline data from tasksByDay for hero metrics
  const kpiSparkData = useMemo(() => {
    if (!analytics?.tasksByDay) return undefined;
    const entries = Object.entries(analytics.tasksByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    return entries.map(([, stats]) => stats.total);
  }, [analytics?.tasksByDay]);

  // Top agents data for table
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

  // Format helpers
  const formatTokens = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return Math.round(v).toLocaleString();
  };

  const formatDuration = (v: number) => {
    const secs = v / 1000;
    if (secs < 60) return `${secs.toFixed(1)}s`;
    return `${(secs / 60).toFixed(1)}m`;
  };

  return (
    <div className="space-y-8 stagger-children">
      {/* Migration Banner */}
      {showMigrationBanner && (
        <div className="rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Database className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  {translate("auth_migracion_titulo")}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  {translate("auth_migracion_descripcion")}
                </p>
                <button
                  onClick={handleMigration}
                  disabled={migrating}
                  className="px-3 py-1.5 text-sm bg-[var(--warning)] hover:brightness-110 disabled:opacity-50 text-black font-medium rounded-md transition-all"
                >
                  {migrating ? "Migrando..." : translate("auth_migracion_boton")}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setShowMigrationBanner(false);
                localStorage.setItem("amd_migration_dismissed", "true");
              }}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Section A: Minimal Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-base font-medium text-[var(--text-primary)]">
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] capitalize mt-0.5">
            {dateStr} &middot; {timeStr}
          </p>
        </div>
        <Link
          href="/control-center"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Tarea
        </Link>
      </div>

      {/* Section B: 3 Hero Metrics */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HeroMetricSkeleton />
            <HeroMetricSkeleton />
            <HeroMetricSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HeroMetric
              label="Ejecuciones"
              value={analytics.overview.totalExecutions}
              sparkData={kpiSparkData}
              sparkColor="#5B6AE8"
            />
            <HeroMetric
              label="Tasa Exito"
              value={analytics.overview.successRate}
              isPercentage
              sparkColor="#2FCC71"
            />
            <HeroMetric
              label="Costo"
              value={analytics.overview.totalCost}
              isCurrency
              sparkColor="#F5A623"
            />
          </div>
        )}

        {/* Secondary metrics strip */}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          {isLoading ? (
            <>
              <SecondaryMetricSkeleton />
              <SecondaryMetricSkeleton />
              <SecondaryMetricSkeleton />
            </>
          ) : (
            <>
              <SecondaryMetric
                icon={<Coins className="h-3.5 w-3.5" />}
                label="tokens"
                value={analytics.overview.totalTokens}
                formatter={formatTokens}
              />
              <SecondaryMetric
                icon={<FileCheck className="h-3.5 w-3.5" />}
                label="publicados"
                value={analytics.overview.contentCreated}
              />
              <SecondaryMetric
                icon={<Timer className="h-3.5 w-3.5" />}
                label="duracion"
                value={analytics.overview.avgDuration}
                formatter={formatDuration}
              />
            </>
          )}
        </div>
      </div>

      {/* Section C: Full-Width Activity Chart */}
      <div>
        {!analytics ? (
          <ActivityChartSkeleton />
        ) : (
          <ActivityChart tasksByDay={analytics.tasksByDay} />
        )}
      </div>

      {/* Section D: 60/40 Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 60%: Top Agents */}
        <div className="lg:col-span-3">
          {!agentPerformance ? (
            <TopAgentsTableSkeleton />
          ) : (
            <TopAgentsTable agents={topAgentsData} />
          )}
        </div>

        {/* Right 40%: Pipeline + Activity */}
        <div className="lg:col-span-2 space-y-6">
          <ContentPipeline counts={contentCounts} contentItems={content} />
          <ActivitySummary activities={activity} />
        </div>
      </div>

      {/* Section E: Agent Status Bar */}
      <div>
        <AgentStatusBar agentsByDepartment={controlStatus?.agentsByDepartment} />
      </div>
    </div>
  );
}
