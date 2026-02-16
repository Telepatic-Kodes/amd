"use client";

import { motion } from "framer-motion";
import { X, Calendar, DollarSign, Target, TrendingUp, BarChart3, MousePointerClick, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  budget?: { total: number; spent: number; currency: string };
  goals?: { impressions?: number; clicks?: number; conversions?: number; revenue?: number };
  metrics?: { impressions: number; clicks: number; conversions: number; revenue: number; ctr: number; cpc: number; roas: number };
  startDate: number;
  endDate?: number;
}

interface CampaignDetailPanelProps {
  campaign: Campaign;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-blue-500/10", text: "text-blue-400" },
  content: { bg: "bg-green-500/10", text: "text-green-400" },
  social: { bg: "bg-purple-500/10", text: "text-purple-400" },
  email: { bg: "bg-orange-500/10", text: "text-orange-400" },
  integrated: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-500" },
  planning: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  paused: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
};

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("es-CL", { year: "numeric", month: "short", day: "numeric" }).format(new Date(ts));
}

function GoalProgress({ label, actual, goal, icon: Icon }: { label: string; actual: number; goal: number; icon: React.ElementType }) {
  const pct = goal > 0 ? Math.min(Math.round((actual / goal) * 100), 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </div>
        <span className="text-[var(--text-primary)] font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-[var(--accent)]" : "bg-orange-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>{formatNumber(actual)}</span>
        <span>{formatNumber(goal)}</span>
      </div>
    </div>
  );
}

export function CampaignDetailPanel({ campaign, onClose }: CampaignDetailPanelProps) {
  const typeColor = TYPE_COLORS[campaign.type] ?? TYPE_COLORS.content;
  const statusColor = STATUS_COLORS[campaign.status] ?? STATUS_COLORS.planning;

  const budgetPct = campaign.budget && campaign.budget.total > 0
    ? Math.round((campaign.budget.spent / campaign.budget.total) * 100)
    : 0;
  const budgetRemaining = campaign.budget ? campaign.budget.total - campaign.budget.spent : 0;

  const daysElapsed = Math.max(1, Math.floor((Date.now() - campaign.startDate) / (24 * 60 * 60 * 1000)));
  const dailyBurn = campaign.budget ? campaign.budget.spent / daysElapsed : 0;

  const daysRemaining = campaign.endDate
    ? Math.max(0, Math.ceil((campaign.endDate - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-80 flex-shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-y-auto max-h-[calc(100vh-200px)]"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-[var(--text-primary)] text-lg leading-tight">{campaign.name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors">
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">{campaign.description}</p>
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", typeColor.bg, typeColor.text)}>
            {campaign.type}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1", statusColor.bg, statusColor.text)}>
            <div className={cn("w-1.5 h-1.5 rounded-full", statusColor.dot)} />
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Budget Section */}
      {campaign.budget && (
        <div className="p-4 border-b border-[var(--border)]">
          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">Budget</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Gastado</span>
              <span className="text-[var(--text-primary)] font-medium">{formatCurrency(campaign.budget.spent)}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-orange-500" : "bg-[var(--accent)]"
                )}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>{budgetPct}% usado</span>
              <span>{formatCurrency(campaign.budget.total)} total</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg bg-[var(--surface-1)] p-2">
                <p className="text-[10px] text-[var(--text-tertiary)]">Restante</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(budgetRemaining)}</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-1)] p-2">
                <p className="text-[10px] text-[var(--text-tertiary)]">Gasto diario</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(Math.round(dailyBurn))}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals vs Actual */}
      {campaign.goals && campaign.metrics && (
        <div className="p-4 border-b border-[var(--border)]">
          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">Goals vs Actual</h4>
          <div className="space-y-3">
            {campaign.goals.impressions != null && (
              <GoalProgress label="Impressions" actual={campaign.metrics.impressions} goal={campaign.goals.impressions} icon={Eye} />
            )}
            {campaign.goals.clicks != null && (
              <GoalProgress label="Clicks" actual={campaign.metrics.clicks} goal={campaign.goals.clicks} icon={MousePointerClick} />
            )}
            {campaign.goals.conversions != null && (
              <GoalProgress label="Conversions" actual={campaign.metrics.conversions} goal={campaign.goals.conversions} icon={Target} />
            )}
            {campaign.goals.revenue != null && (
              <GoalProgress label="Revenue" actual={campaign.metrics.revenue} goal={campaign.goals.revenue} icon={DollarSign} />
            )}
          </div>
        </div>
      )}

      {/* Metrics Table */}
      {campaign.metrics && (
        <div className="p-4 border-b border-[var(--border)]">
          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">Metrics</h4>
          <div className="space-y-2">
            {[
              { label: "Impressions", value: formatNumber(campaign.metrics.impressions), icon: Eye },
              { label: "Clicks", value: formatNumber(campaign.metrics.clicks), icon: MousePointerClick },
              { label: "Conversions", value: formatNumber(campaign.metrics.conversions), icon: Target },
              { label: "Revenue", value: formatCurrency(campaign.metrics.revenue), icon: DollarSign },
              { label: "CTR", value: `${campaign.metrics.ctr.toFixed(2)}%`, icon: BarChart3 },
              { label: "CPC", value: formatCurrency(campaign.metrics.cpc), icon: DollarSign },
              { label: "ROAS", value: `${campaign.metrics.roas.toFixed(1)}×`, icon: TrendingUp },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <row.icon className="w-3 h-3" />
                  <span>{row.label}</span>
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">Timeline</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Calendar className="w-3 h-3" />
              <span>Inicio</span>
            </div>
            <span className="text-[var(--text-primary)]">{formatDate(campaign.startDate)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Calendar className="w-3 h-3" />
              <span>Fin</span>
            </div>
            <span className="text-[var(--text-primary)]">
              {campaign.endDate ? formatDate(campaign.endDate) : "Sin definir"}
            </span>
          </div>
          {daysRemaining !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Días restantes</span>
              <span className={cn(
                "font-medium",
                daysRemaining <= 7 ? "text-red-400" : daysRemaining <= 30 ? "text-orange-400" : "text-[var(--text-primary)]"
              )}>
                {daysRemaining}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
