"use client";

import { Zap, CheckCircle, Clock, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface AnalyticsKPIRowProps {
  stats: {
    agentId: string;
    total: number;
    successful: number;
    failed: number;
    totalTokens: number;
    totalDuration: number;
    totalCost: number;
    successRate: number;
    avgDuration: number;
    avgTokens: number;
  }[];
}

export function AnalyticsKPIRow({ stats }: AnalyticsKPIRowProps) {
  const totalExecutions = stats.reduce((sum, s) => sum + s.total, 0);
  const totalSuccessful = stats.reduce((sum, s) => sum + s.successful, 0);
  const overallSuccessRate = totalExecutions > 0 ? Math.round((totalSuccessful / totalExecutions) * 100) : 0;
  const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
  const avgDuration = totalExecutions > 0 ? Math.round(totalDuration / totalExecutions / 1000) : 0;
  const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0);
  const totalCost = stats.reduce((sum, s) => sum + s.totalCost, 0);

  const kpis = [
    {
      label: "Total ejecuciones",
      value: totalExecutions.toLocaleString(),
      icon: Zap,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Tasa de éxito",
      value: `${overallSuccessRate}%`,
      icon: CheckCircle,
      color: "text-[var(--success)]",
      bg: "bg-[var(--badge-green-bg)] dark:bg-green-900/30",
    },
    {
      label: "Duración promedio",
      value: `${avgDuration}s`,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Tokens totales",
      value: totalTokens > 1_000_000 ? `${(totalTokens / 1_000_000).toFixed(1)}M` : `${Math.round(totalTokens / 1000)}K`,
      icon: Coins,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{kpi.label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
