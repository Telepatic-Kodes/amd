"use client";

import { Coins, CheckCircle, Target, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { translate } from "@/lib/language";

interface MetricsSummaryProps {
  metrics?: {
    tokens: { total: number; today: number };
    tasks: {
      completed: number;
      failed: number;
      running: number;
      completedToday: number;
    };
    successRate: number;
    avgDuration: number;
    totalCost: number;
  };
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function MetricsSummary({ metrics }: MetricsSummaryProps) {
  // Loading state with skeleton cards
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      icon: Coins,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      value: metrics.tokens.total,
      formatter: formatLargeNumber,
      label: translate("tokensUsed"),
      sublabel: `${formatLargeNumber(metrics.tokens.today)} hoy`,
    },
    {
      icon: CheckCircle,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/10",
      value: metrics.tasks.completed,
      formatter: (v: number) => v.toString(),
      label: translate("tasksCompleted"),
      sublabel: `${metrics.tasks.completedToday} hoy`,
    },
    {
      icon: Target,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      value: metrics.successRate,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      label: translate("successRateLabel"),
      sublabel: `${metrics.tasks.running} en progreso`,
    },
    {
      icon: DollarSign,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/10",
      value: metrics.totalCost,
      formatter: formatCost,
      label: translate("totalCost"),
      sublabel: "últimas 100 ejecuciones",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                <Icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              <SimpleCounter
                value={metric.value}
                formatter={metric.formatter}
              />
            </p>
            <p className="text-base text-gray-500">{metric.label}</p>
            {metric.sublabel && (
              <p className="text-sm text-gray-400 mt-2">{metric.sublabel}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
