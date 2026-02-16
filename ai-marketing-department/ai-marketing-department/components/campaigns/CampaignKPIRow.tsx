"use client";

import { DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";

interface Campaign {
  budget?: { total: number; spent: number; currency: string };
  metrics?: { impressions: number; clicks: number; conversions: number; revenue: number; ctr: number; cpc: number; roas: number };
}

interface CampaignKPIRowProps {
  campaigns: Campaign[] | undefined;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function CampaignKPIRow({ campaigns }: CampaignKPIRowProps) {
  const isLoading = campaigns === undefined;

  const totalBudget = campaigns?.reduce((sum, c) => sum + (c.budget?.total ?? 0), 0) ?? 0;
  const totalSpent = campaigns?.reduce((sum, c) => sum + (c.budget?.spent ?? 0), 0) ?? 0;
  const totalConversions = campaigns?.reduce((sum, c) => sum + (c.metrics?.conversions ?? 0), 0) ?? 0;
  const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.metrics?.revenue ?? 0), 0) ?? 0;
  const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

  const kpis = [
    {
      label: "Budget Total",
      value: formatCurrency(totalBudget),
      icon: DollarSign,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Gastado",
      value: formatCurrency(totalSpent),
      sub: totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : undefined,
      icon: BarChart3,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "ROAS Promedio",
      value: `${avgRoas.toFixed(1)}×`,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Conversiones",
      value: formatNumber(totalConversions),
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">{kpi.label}</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[var(--text-primary)]">{kpi.value}</span>
                {kpi.sub && (
                  <span className="text-xs text-[var(--text-tertiary)]">{kpi.sub}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
