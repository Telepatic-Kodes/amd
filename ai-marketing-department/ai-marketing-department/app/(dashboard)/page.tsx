"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { Database, X } from "lucide-react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import { ChartsRow, ChartsRowSkeleton } from "@/components/dashboard/ChartsRow";
import { TopAgentsTable, TopAgentsTableSkeleton } from "@/components/dashboard/TopAgentsTable";
import { AgentHealthBar } from "@/components/dashboard/AgentHealthBar";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { ContentPipeline } from "@/components/dashboard/ContentPipeline";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

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

  // Derive sparkline data from tasksByDay for KPI cards
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

  // Format token count for display
  const formatTokens = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return Math.round(v).toLocaleString();
  };

  // Format duration in seconds
  const formatDuration = (v: number) => {
    const secs = v / 1000;
    if (secs < 60) return `${secs.toFixed(1)}s`;
    return `${(secs / 60).toFixed(1)}m`;
  };

  return (
    <div className="space-y-8">
      {/* Migration Banner */}
      {showMigrationBanner && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
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
                  className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-medium rounded-md transition-colors"
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
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Section A: Header */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h1 className="text-base font-medium text-[var(--text-primary)]">
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] capitalize">
            {dateStr} &middot; {timeStr}
          </p>
        </div>
        <QuickActions />
      </motion.div>

      {/* Section B: KPI Strip */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              label="Ejecuciones"
              value={analytics.overview.totalExecutions}
              sparkData={kpiSparkData}
              sparkColor="#6366f1"
            />
            <KpiCard
              label="Tasa Exito"
              value={analytics.overview.successRate}
              isPercentage
              sparkColor="#22c55e"
            />
            <KpiCard
              label="Tokens"
              value={analytics.overview.totalTokens}
              formatter={formatTokens}
              sparkColor="#06b6d4"
            />
            <KpiCard
              label="Costo"
              value={analytics.overview.totalCost}
              isCurrency
              sparkColor="#f59e0b"
            />
            <KpiCard
              label="Publicado"
              value={analytics.overview.contentCreated}
              sparkColor="#3b82f6"
            />
            <KpiCard
              label="Duracion"
              value={analytics.overview.avgDuration}
              formatter={formatDuration}
              sparkColor="#8b5cf6"
            />
          </div>
        )}
      </motion.div>

      {/* Section C: Charts Row */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        {!analytics || !pipelineMetrics ? (
          <ChartsRowSkeleton />
        ) : (
          <ChartsRow
            tasksByDay={analytics.tasksByDay}
            statusDistribution={pipelineMetrics.statusDistribution}
            totalContent={pipelineMetrics.totalContent}
          />
        )}
      </motion.div>

      {/* Section D: Detail Grid */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left: Top Agents Table */}
          <div className="lg:col-span-4">
            {!agentPerformance ? (
              <TopAgentsTableSkeleton />
            ) : (
              <TopAgentsTable agents={topAgentsData} />
            )}
          </div>

          {/* Mid: Content Pipeline */}
          <div className="lg:col-span-3">
            <ContentPipeline counts={contentCounts} contentItems={content} />
          </div>

          {/* Right: Activity Summary */}
          <div className="lg:col-span-3">
            <ActivitySummary activities={activity} />
          </div>
        </div>
      </motion.div>

      {/* Section E: Agent Health Bar */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
        <AgentHealthBar agentsByDepartment={controlStatus?.agentsByDepartment} />
      </motion.div>
    </div>
  );
}
