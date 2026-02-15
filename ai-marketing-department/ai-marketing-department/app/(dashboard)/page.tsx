"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import dynamic from "next/dynamic";
import { HeroMetric, HeroMetricSkeleton } from "@/components/dashboard/HeroMetric";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { DecisionsPending } from "@/components/dashboard/DecisionsPending";
import { DepartmentKanban } from "@/components/dashboard/DepartmentKanban";
import { ResultsSummary } from "@/components/dashboard/ResultsSummary";
import { SmartGreeting } from "@/components/dashboard/SmartGreeting";
import { TodayBriefing } from "@/components/dashboard/TodayBriefing";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardData } from "@/hooks/useDashboardData";
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
  const totalContent = content?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header — context-aware greeting */}
      <SmartGreeting
        userName={userName}
        contentInReview={computed.attentionData.contentInReview}
        agentErrors={computed.attentionData.agentErrors}
        publishedToday={0}
        strategyProgress={undefined}
        tasksCompleted={0}
        tasksFailed={0}
        onExecuteAgent={() => setShowExecuteModal(true)}
      />

      {/* Today Briefing — collapsible summary */}
      <TodayBriefing
        scheduledContent={0}
        contentInReview={computed.attentionData.contentInReview}
        agentErrors={computed.attentionData.agentErrors}
        topMetricChange={
          computed.trends.executions
            ? {
                label: "Ejecuciones",
                value: `${computed.trends.executions > 0 ? "+" : ""}${computed.trends.executions}%`,
                trend: computed.trends.executions >= 0 ? "up" : "down",
              }
            : undefined
        }
      />

      {/* Quick Actions — dynamic based on state */}
      <QuickActions
        contentInReview={computed.attentionData.contentInReview}
        agentErrors={computed.attentionData.agentErrors}
        failedExecutions={computed.attentionData.failedExecutions}
        recentContentCount={totalContent}
        onExecuteAgent={() => setShowExecuteModal(true)}
      />

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
                sparkData={computed.kpiSparkData}
                sparkColor="#ea580c"
                trend={computed.trends.executions}
                href="/"
              />
              <HeroMetric
                label="Tasa Exito"
                value={analytics.overview.successRate}
                isPercentage
                sparkColor="#16a34a"
                trend={computed.trends.successRate}
              />
              <HeroMetric
                label="Costo"
                value={analytics.overview.totalCost}
                isCurrency
                sparkColor="#d97706"
                trend={computed.trends.cost}
              />
              <HeroMetric
                label="Contenido"
                value={totalContent}
                sparkData={computed.contentSparkData}
                sparkColor="#7c3aed"
                formatter={(v) => `${Math.round(v)}`}
                href="/content"
              />
            </div>
          )}
        </div>
        <div>
          <DecisionsPending
            contentInReview={computed.attentionData.contentInReview}
            agentErrors={computed.attentionData.agentErrors}
            failedExecutions={computed.attentionData.failedExecutions}
          />
        </div>
      </div>

      {/* Zone 2: Department Kanban */}
      <DepartmentKanban agentsByDepartment={controlStatus?.agentsByDepartment} />

      {/* Zone 3: Results (2/3) + Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResultsSummary
            chartData={computed.chartData}
            topContent={computed.topContent}
            totalImpressions={computed.engagementStats.totalImpressions}
            totalInteractions={computed.engagementStats.totalInteractions}
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
