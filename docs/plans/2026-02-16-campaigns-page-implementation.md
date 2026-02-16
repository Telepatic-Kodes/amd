# Campaigns Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `/campaigns` dashboard page with KPIs, filterable campaign grid, and slide-in detail panel.

**Architecture:** Frontend-only. Uses existing `listCampaigns` query (filters by type/status) from `convex/functions.ts`. 4 new components + 1 page + sidebar link. Follows patterns from `/org` and `/tasks` pages.

**Tech Stack:** Next.js 16, React 19, Convex (useQuery), framer-motion, lucide-react, Tailwind 4 with CSS variables.

---

### Task 1: Sidebar — Add Campaigns Link

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/layout/Sidebar.tsx`

**Step 1: Add Target icon import**

In the lucide-react import block (line 8-30), add `Target` to the import list:

```typescript
import {
    Home,
    FileText,
    Settings,
    Brain,
    Sun,
    Moon,
    BarChart3,
    TrendingUp,
    Users,
    Shield,
    ListTodo,
    Send,
    BookOpen,
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    Pencil,
    Cog,
    X,
    ImageIcon,
    GitBranch,
    Target,
} from "lucide-react";
```

**Step 2: Add Campañas nav item**

In the "Operaciones" group (line 63-72), add after "Organigrama":

```typescript
items: [
    { name: "Agentes", href: "/agents", icon: Users },
    { name: "Organigrama", href: "/org", icon: GitBranch },
    { name: "Campañas", href: "/campaigns", icon: Target },
    { name: "Tareas", href: "/tasks", icon: ListTodo },
    { name: "Monitoreo", href: "/monitoring", icon: Shield },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
    { name: "Analíticas", href: "/analytics", icon: TrendingUp },
],
```

**Step 3: Verify**

Run: `curl -s http://localhost:3001/ | grep -c "Campañas"` — should return 1.

**Step 4: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/layout/Sidebar.tsx
git commit -m "feat(campaigns): add sidebar navigation link"
```

---

### Task 2: CampaignKPIRow Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/campaigns/CampaignKPIRow.tsx`

**Step 1: Create the component**

```tsx
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
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/campaigns/CampaignKPIRow.tsx
git commit -m "feat(campaigns): add KPI row component"
```

---

### Task 3: CampaignCard Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/campaigns/CampaignCard.tsx`

**Step 1: Create the component**

```tsx
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
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/campaigns/CampaignCard.tsx
git commit -m "feat(campaigns): add campaign card component"
```

---

### Task 4: CampaignDetailPanel Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/campaigns/CampaignDetailPanel.tsx`

**Step 1: Create the component**

This is a 320px slide-in panel using framer-motion (same pattern as `components/org/AgentDetailPanel.tsx`).

```tsx
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

  // Daily burn rate
  const daysElapsed = Math.max(1, Math.floor((Date.now() - campaign.startDate) / (24 * 60 * 60 * 1000)));
  const dailyBurn = campaign.budget ? campaign.budget.spent / daysElapsed : 0;

  // Days remaining
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
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
          >
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
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/campaigns/CampaignDetailPanel.tsx
git commit -m "feat(campaigns): add detail panel with budget, goals, and metrics"
```

---

### Task 5: Campaigns Page Assembly

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/app/(dashboard)/campaigns/page.tsx`

**Step 1: Create the page**

```tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Target } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CampaignKPIRow } from "@/components/campaigns/CampaignKPIRow";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignDetailPanel } from "@/components/campaigns/CampaignDetailPanel";

const TYPES = [
  { id: "all", label: "Todos" },
  { id: "content", label: "Content" },
  { id: "paid", label: "Paid" },
  { id: "email", label: "Email" },
  { id: "social", label: "Social" },
  { id: "integrated", label: "Integrated" },
];

const STATUSES = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Active" },
  { id: "planning", label: "Planning" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
];

export default function CampaignsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaigns = useQuery(
    api.functions.listCampaigns,
    typeFilter === "all" ? {} : { type: typeFilter }
  );

  // Client-side status filter (listCampaigns only supports one index at a time)
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return undefined;
    if (statusFilter === "all") return campaigns;
    return campaigns.filter((c: Record<string, string>) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  const selectedCampaign = useMemo(() => {
    if (!selectedId || !campaigns) return null;
    return campaigns.find((c: Record<string, unknown>) => c._id === selectedId) || null;
  }, [selectedId, campaigns]);

  const stats = useMemo(() => {
    if (!campaigns) return { total: 0, active: 0 };
    const active = campaigns.filter((c: Record<string, string>) => c.status === "active").length;
    return { total: campaigns.length, active };
  }, [campaigns]);

  const isLoading = filteredCampaigns === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <Target className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campañas</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {stats.total} campañas · {stats.active} activas
          </p>
        </div>
      </div>

      {/* KPIs */}
      <CampaignKPIRow campaigns={campaigns as Campaign[] | undefined} />

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setTypeFilter(type.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              typeFilter === type.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2">
        {STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
              statusFilter === status.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex gap-4">
        {/* Campaign Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-[var(--surface-1)] animate-pulse" />
              ))}
            </div>
          ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign: Record<string, unknown>) => (
                <CampaignCard
                  key={campaign._id as string}
                  campaign={campaign as any}
                  isSelected={selectedId === campaign._id}
                  onClick={() =>
                    setSelectedId((prev) =>
                      prev === campaign._id ? null : (campaign._id as string)
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
              <p className="text-[var(--text-secondary)]">No se encontraron campañas</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Ajusta los filtros o crea una nueva campaña</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedCampaign && (
            <CampaignDetailPanel
              campaign={selectedCampaign as any}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Local type for KPI component
interface Campaign {
  budget?: { total: number; spent: number; currency: string };
  metrics?: { impressions: number; clicks: number; conversions: number; revenue: number; ctr: number; cpc: number; roas: number };
}
```

**Step 2: Verify page loads**

Navigate to `http://localhost:3001/campaigns` in the browser.

Expected: Page renders with header "Campañas", 4 KPI cards, type/status filters, and 7 campaign cards (from seeded data).

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/\(dashboard\)/campaigns/page.tsx
git commit -m "feat(campaigns): add campaigns page with KPIs, grid, and detail panel"
```

---

### Task 6: Visual Verification & Bug Fixes

**Step 1: Navigate to `/campaigns` and verify:**
- [ ] KPIs show correct aggregated values
- [ ] 7 campaign cards render with correct type badges, status dots, budget bars
- [ ] Clicking a card opens the detail panel
- [ ] Detail panel shows budget, goals vs actual, metrics, timeline
- [ ] Type filter tabs work (e.g. click "Paid" shows only paid campaigns)
- [ ] Status filter pills work (e.g. click "Active" shows only active campaigns)
- [ ] "Campañas" link appears in sidebar under Operaciones

**Step 2: Fix any rendering issues found**

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix(campaigns): visual polish and bug fixes"
```
