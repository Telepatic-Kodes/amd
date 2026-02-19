"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { ActionFeed } from "@/components/dashboard/ActionFeed";
import { QuickSummary } from "@/components/dashboard/QuickSummary";
import { SkeletonList } from "@/components/ui/Skeleton";
import { SkeletonStat } from "@/components/ui/Skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useToast } from "@/components/ui/Toast";

const DashboardExecuteModal = dynamic(
  () => import("@/components/dashboard/DashboardExecuteModal").then((m) => m.DashboardExecuteModal),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [synced, setSynced] = useState(false);
  const syncAttemptedRef = useRef(false);

  // User sync
  const syncUser = useMutation(api.users.getOrCreateUser);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Brand profile for content filtering
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);

  // Stable date range for analytics queries
  const [dateRange] = useState(() => ({
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
  }));

  // Data queries
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const content = useQuery(api.functions.listContent, brandProfile === undefined ? "skip" : { brandProfileId: brandProfile?._id });
  const agents = useQuery(api.functions.listAgents, {});
  const analytics = useQuery(api.analytics.getAnalyticsWithDateRange, dateRange);
  const contentPerformance = useQuery(api.analytics.getContentPerformance, dateRange);

  // Mutations
  const updateContentStatus = useMutation(api.functions.updateContentStatus);

  // Computed dashboard data
  const computed = useDashboardData({ agents, content, analytics, contentPerformance });

  // Modal state
  const [showExecuteModal, setShowExecuteModal] = useState(false);

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

  const userName = currentUser?.name || "usuario";
  const isLoading = !analytics;

  // Derive data for ActionFeed
  const contentInReview = content?.filter(
    (c: { status: string }) => c.status === "review"
  ) ?? [];

  const agentsWithErrors = agents?.filter(
    (a: { status: string }) => a.status === "error"
  ) ?? [];

  const recentActivity = (activity ?? []).map((item: { id: string; type: string; description: string; timestamp: number }) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    timestamp: item.timestamp,
  }));

  // Derive data for QuickSummary
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const publishedToday = content?.filter(
    (c: { status: string; publishedAt?: number }) => c.status === "published" && c.publishedAt && c.publishedAt >= todayMs
  ).length ?? 0;

  const publishedTrend = computed.trends.executions ?? 0;

  const activeAgents = agents?.filter(
    (a: { status: string }) => a.status === "active"
  ).length ?? 0;

  const totalAgents = agents?.length ?? 0;

  const successRate = Math.round(analytics?.overview?.successRate ?? 0);
  const successRateTrend = computed.trends.successRate ?? 0;

  const scheduledNext7Days = (content ?? [])
    .filter((c: { status: string }) => c.status === "scheduled")
    .map((c: { title: string; type: string; _creationTime: number }) => ({
      title: c.title,
      date: new Date(c._creationTime).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      }),
      type: c.type,
    }));

  // Handlers for ActionFeed
  const handleApproveContent = (id: string) => {
    updateContentStatus({ id: id as Id<"content">, status: "approved" })
      .then(() => success("Contenido aprobado"))
      .catch((err: Error) => error("Error", err.message));
  };

  const handleRequestChanges = (id: string) => {
    updateContentStatus({ id: id as Id<"content">, status: "revision_needed" })
      .then(() => success("Cambios solicitados"))
      .catch((err: Error) => error("Error", err.message));
  };

  const handleRetryAgent = (_agentId: string) => {
    success("Reintento programado");
  };

  const handleViewAgent = (_agentId: string) => {
    router.push("/agents");
  };

  const handleViewContent = (_id: string) => {
    router.push("/content");
  };

  // Suppress unused variable warnings for queries kept for future use
  void controlStatus;

  return (
    <div className="space-y-6">
      {/* Simple greeting line */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Hola, {userName}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* 2-column layout: ActionFeed (left 2/3) + QuickSummary (right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <SkeletonList items={5} />
          ) : (
            <ActionFeed
              contentInReview={contentInReview}
              agentsWithErrors={agentsWithErrors}
              recentActivity={recentActivity}
              onApproveContent={handleApproveContent}
              onRequestChanges={handleRequestChanges}
              onRetryAgent={handleRetryAgent}
              onViewAgent={handleViewAgent}
              onViewContent={handleViewContent}
            />
          )}
        </div>
        <div>
          {isLoading ? (
            <SkeletonStat />
          ) : (
            <QuickSummary
              publishedToday={publishedToday}
              publishedTrend={publishedTrend}
              activeAgents={activeAgents}
              totalAgents={totalAgents}
              successRate={successRate}
              successRateTrend={successRateTrend}
              scheduledNext7Days={scheduledNext7Days}
              onExecuteAgent={() => setShowExecuteModal(true)}
            />
          )}
        </div>
      </div>

      {/* Agent Execute Modal */}
      {showExecuteModal && (
        <DashboardExecuteModal onClose={() => setShowExecuteModal(false)} />
      )}
    </div>
  );
}
