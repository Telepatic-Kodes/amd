"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { MetricsSummary } from "@/components/control-center/MetricsSummary";
import { AgentStatusGrid } from "@/components/control-center/AgentStatusGrid";

export default function ControlCenterPage() {
  const status = useQuery(api.controlCenter.getControlCenterStatus);
  const metrics = useQuery(api.controlCenter.getControlCenterMetrics);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Centro de Control
        </h1>
        <p className="text-zinc-400 mt-2 text-base md:text-lg">
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

      {/* Agent Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Estado de Agentes
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {status?.totalAgents || 0} agentes organizados por departamento
          </p>
        </div>
        <AgentStatusGrid
          agentsByDepartment={status?.agentsByDepartment}
          statusCounts={status?.statusCounts}
        />
      </motion.div>
    </div>
  );
}
