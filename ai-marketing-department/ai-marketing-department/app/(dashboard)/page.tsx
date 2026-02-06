"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { Database, X } from "lucide-react";
import { StatusStrip, StatusStripSkeleton } from "@/components/dashboard/StatusStrip";
import { AgentCommandGrid } from "@/components/dashboard/AgentCommandGrid";
import { DashboardActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ContentPipeline } from "@/components/dashboard/ContentPipeline";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";

// Staggered fade-in for each section
const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
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

  // Data queries
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const metrics = useQuery(api.controlCenter.getControlCenterMetrics);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const agents = useQuery(api.functions.listAgents, {});
  const content = useQuery(api.functions.listContent, {});

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

  // Derived stats for status strip
  const activeAgents = agents?.filter((a: Record<string, unknown>) => a.status === "active").length ?? 0;
  const totalAgents = agents?.length ?? 0;
  const errorAgents = agents?.filter((a: Record<string, unknown>) => a.status === "error").length ?? 0;

  const contentCounts = {
    draft: content?.filter((c: Record<string, unknown>) => c.status === "draft").length ?? 0,
    review: content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0,
    approved: content?.filter((c: Record<string, unknown>) => c.status === "approved").length ?? 0,
    scheduled: content?.filter((c: Record<string, unknown>) => c.status === "scheduled").length ?? 0,
    published: content?.filter((c: Record<string, unknown>) => c.status === "published").length ?? 0,
  };

  const contentInFlight = contentCounts.draft + contentCounts.review + contentCounts.approved + contentCounts.scheduled;

  // Build agent-by-department map from the agents list directly
  const agentsByDepartment = agents
    ? agents.reduce((acc: Record<string, Array<Record<string, unknown>>>, agent: Record<string, unknown>) => {
        const dept = (agent.department as string) || "unknown";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(agent);
        return acc;
      }, {} as Record<string, Array<Record<string, unknown>>>)
    : undefined;

  // Build last-activity-per-agent map from activity feed
  const lastActivityByAgent = useMemo(() => {
    if (!activity) return undefined;
    const map: Record<string, { description: string; timestamp: number }> = {};
    for (const item of activity) {
      const key = item.agentId;
      // Keep only the most recent activity per agent (list is sorted desc)
      if (!map[key]) {
        map[key] = { description: item.description, timestamp: item.timestamp };
      }
    }
    return map;
  }, [activity]);

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

  const isLoading = !agents || !content;

  return (
    <div className="space-y-6">
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

      {/* Section A: Top Bar */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] capitalize">
            {dateStr} &middot; {timeStr}
          </p>
        </div>
        <QuickActions />
      </motion.div>

      {/* Section B: Status Strip */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        {isLoading ? (
          <StatusStripSkeleton />
        ) : (
          <StatusStrip
            activeAgents={activeAgents}
            totalAgents={totalAgents}
            agentsHealthy={errorAgents === 0}
            tasksCompletedToday={metrics?.tasks?.completedToday ?? 0}
            totalTasksToday={(metrics?.tasks?.completedToday ?? 0) + (metrics?.tasks?.running ?? 0)}
            contentInFlight={contentInFlight}
            successRate={metrics?.successRate ?? 100}
          />
        )}
      </motion.div>

      {/* Section C: Agent Command Grid */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <AgentCommandGrid agentsByDepartment={agentsByDepartment} lastActivityByAgent={lastActivityByAgent} />
      </motion.div>

      {/* Section D: Two-Column Bottom */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Activity Feed (60%) */}
          <div className="lg:col-span-3">
            <DashboardActivityFeed activities={activity} />
          </div>
          {/* Right: Content Pipeline (40%) */}
          <div className="lg:col-span-2">
            <ContentPipeline counts={contentCounts} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
