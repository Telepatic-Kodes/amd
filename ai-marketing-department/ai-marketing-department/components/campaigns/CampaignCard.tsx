"use client";

import { cn } from "@/lib/utils";

interface CampaignCardProps {
  campaign: {
    _id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    budget?: { total: number; spent: number; currency: string };
    metrics?: { impressions: number; clicks: number; conversions: number; revenue: number; ctr: number; cpc: number; roas: number };
    startDate: number;
    endDate?: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-blue-500/10", text: "text-blue-400" },
  content: { bg: "bg-green-500/10", text: "text-green-400" },
  social: { bg: "bg-purple-500/10", text: "text-purple-400" },
  email: { bg: "bg-orange-500/10", text: "text-orange-400" },
  integrated: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  planning: "bg-yellow-500",
  paused: "bg-gray-400",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("es-CL", { month: "short", day: "numeric" }).format(new Date(ts));
}

export function CampaignCard({ campaign, isSelected, onClick }: CampaignCardProps) {
  const typeColor = TYPE_COLORS[campaign.type] ?? TYPE_COLORS.content;
  const statusColor = STATUS_COLORS[campaign.status] ?? "bg-gray-400";
  const budgetPct = campaign.budget && campaign.budget.total > 0
    ? Math.round((campaign.budget.spent / campaign.budget.total) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all hover:border-[var(--accent)]/50",
        isSelected
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--card-bg)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{campaign.name}</h3>
          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{campaign.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", typeColor.bg, typeColor.text)}>
            {campaign.type}
          </span>
          <div className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", statusColor)} />
            <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{campaign.status}</span>
          </div>
        </div>
      </div>

      {/* Budget bar */}
      {campaign.budget && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span>${campaign.budget.spent.toLocaleString()} gastado</span>
            <span>${campaign.budget.total.toLocaleString()} total</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics row */}
      {campaign.metrics && (
        <div className="flex gap-4 mb-3">
          <div>
            <span className="text-xs font-medium text-[var(--text-primary)]">{formatNumber(campaign.metrics.impressions)}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] ml-1">imp</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-primary)]">{campaign.metrics.ctr.toFixed(1)}%</span>
            <span className="text-[10px] text-[var(--text-tertiary)] ml-1">CTR</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-primary)]">{campaign.metrics.roas.toFixed(1)}x</span>
            <span className="text-[10px] text-[var(--text-tertiary)] ml-1">ROAS</span>
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="text-[10px] text-[var(--text-tertiary)]">
        {formatDate(campaign.startDate)}
        {campaign.endDate ? ` — ${formatDate(campaign.endDate)}` : " — Sin fecha fin"}
      </div>
    </button>
  );
}
