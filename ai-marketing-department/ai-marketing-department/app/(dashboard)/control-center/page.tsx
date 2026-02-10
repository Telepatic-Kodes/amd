"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { MetricsSummary } from "@/components/control-center/MetricsSummary";
import { AgentStatusGrid } from "@/components/control-center/AgentStatusGrid";
import { ActivityFeed } from "@/components/control-center/ActivityFeed";
import { useToast } from "@/components/ui/Toast";

export default function ControlCenterPage() {
  const status = useQuery(api.controlCenter.getControlCenterStatus);
  const metrics = useQuery(api.controlCenter.getControlCenterMetrics);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});

  // Toast notifications for critical events
  const { error: showError, warning: showWarning } = useToast();
  const prevStatusRef = useRef(status?.statusCounts);

  useEffect(() => {
    if (!status?.statusCounts || !prevStatusRef.current) {
      prevStatusRef.current = status?.statusCounts;
      return;
    }

    const prev = prevStatusRef.current;
    const curr = status.statusCounts;

    // Alert if new errors appeared
    if (curr.error > prev.error) {
      const newErrors = curr.error - prev.error;
      showError(
        `${newErrors} agente${newErrors > 1 ? "s" : ""} con error`,
        "Revisa el Centro de Control para más detalles"
      );
    }

    // Alert if agents went to maintenance
    if (curr.maintenance > prev.maintenance) {
      showWarning(
        "Agente en mantenimiento",
        "Un agente ha entrado en modo mantenimiento"
      );
    }

    prevStatusRef.current = curr;
  }, [status?.statusCounts, showError, showWarning]);

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900">
          Centro de Control
        </h1>
        <p className="text-stone-500 mt-2 text-base md:text-lg">
          Monitorea todos tus agentes de marketing en tiempo real.
        </p>
      </motion.div>

      {/* Metrics Summary - 4 cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MetricsSummary metrics={metrics} />
      </motion.div>

      {/* Agent Status Grid + Activity Feed - 2-column layout on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-900">
            Estado de Agentes
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {status?.totalAgents || 0} agentes organizados por departamento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Agent Status Grid - takes 2 cols on desktop */}
          <div className="lg:col-span-2">
            <AgentStatusGrid
              agentsByDepartment={status?.agentsByDepartment}
              statusCounts={status?.statusCounts}
            />
          </div>

          {/* Activity Feed - takes 1 col on desktop */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activity} isLoading={activity === undefined} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
