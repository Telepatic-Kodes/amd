# Command Center Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign AMD's frontend from 8+ pages to 4 focused pages with an executive dashboard showing KPIs, a department Kanban, decisions pending, and results — all visible at a glance.

**Architecture:** Consolidate existing pages into 4 routes (Home, Content, Strategy, Settings). Build new `DepartmentKanban` and `DecisionsPending` components for the Home page. Add tab wrappers to Content (Pipeline/List/Calendar) and Strategy (Autopilot/Brand/Insights) pages. No backend changes needed — all Convex queries already exist.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Convex, Framer Motion, Lucide Icons

---

### Task 1: Update Sidebar Navigation (4 items)

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/layout/Sidebar.tsx:29-38`
- Modify: `ai-marketing-department/ai-marketing-department/components/layout/MobileNav.tsx` (same nav items)

**Step 1: Update `mainNavigation` array in Sidebar.tsx**

Replace lines 29-38 with:

```tsx
const mainNavigation = [
    { name: "Inicio", href: "/", icon: Home, label: "Dashboard ejecutivo", badgeKey: null },
    { name: "Contenido", href: "/content", icon: FileText, label: "Pipeline, lista y calendario", badgeKey: "content" as const },
    { name: "Estrategia", href: "/strategy", icon: Brain, label: "Autopilot, marca e insights", badgeKey: "strategy" as const },
    { name: "Configuración", href: "/settings", icon: Settings, label: "API keys y apariencia", badgeKey: null },
];
```

**Step 2: Verify sidebar renders 4 items**

Run: `npm run dev` (already running on port 3001)
Navigate to `http://localhost:3001` and verify sidebar shows exactly 4 items.

**Step 3: Update MobileNav.tsx with same 4 items**

Find the navigation array in `MobileNav.tsx` and update it to match the same 4 items.

**Step 4: Commit**

```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department
git add ai-marketing-department/components/layout/Sidebar.tsx ai-marketing-department/components/layout/MobileNav.tsx
git commit -m "feat: reduce sidebar to 4 items (Home, Content, Strategy, Settings)"
```

---

### Task 2: Create `AgentMiniCard` Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/AgentMiniCard.tsx`

**Step 1: Create the AgentMiniCard component**

```tsx
"use client";

interface AgentMiniCardProps {
  name: string;
  role: string;
  status: "active" | "paused" | "error" | "maintenance";
  currentTask?: string;
}

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  paused: "bg-stone-400",
  error: "bg-red-400",
  maintenance: "bg-amber-400",
};

const statusPulse: Record<string, boolean> = {
  active: false,
  paused: false,
  error: true,
  maintenance: false,
};

export function AgentMiniCard({ name, role, status, currentTask }: AgentMiniCardProps) {
  const dotColor = statusDot[status] ?? "bg-stone-300";
  const pulse = statusPulse[status] ?? false;

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] hover:border-orange-300 transition-colors group">
      <div className="relative mt-1 shrink-0">
        <span className={`block h-2 w-2 rounded-full ${dotColor} ${pulse ? "animate-pulse" : ""}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{name}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] truncate">{role}</p>
        {currentTask && status === "active" && (
          <p className="text-[10px] text-orange-500 truncate mt-0.5">{currentTask}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify component renders**

Import it temporarily in the Home page to check it renders correctly, then remove.

**Step 3: Commit**

```bash
git add ai-marketing-department/components/dashboard/AgentMiniCard.tsx
git commit -m "feat: add AgentMiniCard component for department Kanban"
```

---

### Task 3: Create `DepartmentKanban` Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/DepartmentKanban.tsx`

**Step 1: Create the DepartmentKanban component**

This component takes `agentsByDepartment` from the existing `getControlCenterStatus` query and renders a 6-column grid (7 departments including Marketing Ops). Each column shows agents as `AgentMiniCard` components.

```tsx
"use client";

import { AgentMiniCard } from "./AgentMiniCard";

interface Agent {
  _id: string;
  agentId?: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "paused" | "error" | "maintenance";
}

interface DepartmentKanbanProps {
  agentsByDepartment?: Record<string, Agent[]>;
}

const departmentConfig: Record<string, { label: string; emoji: string }> = {
  leadership: { label: "Liderazgo", emoji: "👔" },
  content: { label: "Contenido", emoji: "✍️" },
  social: { label: "Social Media", emoji: "📱" },
  demandgen: { label: "Demand Gen", emoji: "📈" },
  seo: { label: "SEO", emoji: "🔍" },
  brand: { label: "Marca", emoji: "🎨" },
  ops: { label: "Operaciones", emoji: "⚙️" },
};

function DepartmentColumn({ name, agents }: { name: string; agents: Agent[] }) {
  const config = departmentConfig[name] ?? { label: name, emoji: "📋" };
  const errorCount = agents.filter((a) => a.status === "error").length;
  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="flex flex-col min-w-[160px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{config.emoji}</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{agents.length}</span>
          {errorCount > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
          {errorCount === 0 && activeCount > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          )}
        </div>
      </div>
      {/* Agent cards */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-0.5">
        {agents.map((agent) => (
          <AgentMiniCard
            key={agent._id}
            name={agent.name}
            role={agent.role}
            status={agent.status}
          />
        ))}
      </div>
    </div>
  );
}

export function DepartmentKanban({ agentsByDepartment }: DepartmentKanbanProps) {
  if (!agentsByDepartment) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
        <div className="h-6 w-48 rounded bg-stone-200 animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const orderedDepts = ["leadership", "content", "social", "demandgen", "seo", "brand", "ops"];
  const departments = orderedDepts.filter((d) => agentsByDepartment[d]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">Departamento de Marketing</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {departments.map((dept) => (
          <DepartmentColumn key={dept} name={dept} agents={agentsByDepartment[dept]} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/components/dashboard/DepartmentKanban.tsx
git commit -m "feat: add DepartmentKanban component with 7-column agent grid"
```

---

### Task 4: Create `DecisionsPending` Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/DecisionsPending.tsx`

**Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import { AlertCircle, FileCheck, Bot, XCircle } from "lucide-react";

interface DecisionsPendingProps {
  contentInReview: number;
  agentErrors: number;
  failedExecutions: number;
}

export function DecisionsPending({ contentInReview, agentErrors, failedExecutions }: DecisionsPendingProps) {
  const total = contentInReview + agentErrors + failedExecutions;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
          <FileCheck className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Todo en orden</p>
          <p className="text-xs text-green-600 dark:text-green-500">No hay decisiones pendientes</p>
        </div>
      </div>
    );
  }

  const items = [
    {
      count: contentInReview,
      label: "contenido por aprobar",
      icon: FileCheck,
      href: "/content",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      count: agentErrors,
      label: "agentes con error",
      icon: Bot,
      href: "/",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      count: failedExecutions,
      label: "ejecuciones fallidas (24h)",
      icon: XCircle,
      href: "/",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ].filter((i) => i.count > 0);

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-[var(--card-bg)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Decisiones Pendientes
          <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            {total}
          </span>
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-1)] transition-colors group"
            >
              <div className={`p-1.5 rounded-md ${item.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                <strong className={item.color}>{item.count}</strong> {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/components/dashboard/DecisionsPending.tsx
git commit -m "feat: add DecisionsPending component with actionable links"
```

---

### Task 5: Create `ResultsSummary` Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/ResultsSummary.tsx`

**Step 1: Create the component**

This is a compact version of the Results page — shows a mini trend chart and top 3 content.

```tsx
"use client";

import { Eye, Heart, TrendingUp, BarChart3 } from "lucide-react";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import dynamic from "next/dynamic";

const LineChart = dynamic(
  () => import("@/components/charts/LineChart").then((m) => m.LineChart),
  { ssr: false }
);

interface ContentItem {
  title: string;
  type: string;
  impressions: number;
  interactions: number;
}

interface ResultsSummaryProps {
  chartData: { name: string; tareas: number }[];
  topContent: ContentItem[];
  totalImpressions: number;
  totalInteractions: number;
}

export function ResultsSummary({ chartData, topContent, totalImpressions, totalInteractions }: ResultsSummaryProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-4">
      <h2 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-orange-500" />
        Resultados (7 días)
      </h2>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-orange-500" />
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {totalImpressions >= 1000 ? (
                <><SimpleCounter value={Math.round(totalImpressions / 1000)} /><span className="text-sm text-[var(--text-tertiary)]">K</span></>
              ) : (
                <SimpleCounter value={totalImpressions} />
              )}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Impresiones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              <SimpleCounter value={totalInteractions} />
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Interacciones</p>
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {chartData.length > 0 ? (
        <div className="h-32">
          <LineChart data={chartData} dataKey="tareas" name="Tareas" showGrid={false} showTooltip={true} />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-[var(--text-tertiary)]">
          <div className="text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-1" />
            <p className="text-[10px]">Sin datos</p>
          </div>
        </div>
      )}

      {/* Top 3 content */}
      {topContent.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Top Contenido</p>
          {topContent.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-xs">
              <span className="text-[var(--text-secondary)] truncate flex-1 mr-2">{item.title}</span>
              <span className="text-orange-500 font-medium shrink-0">{item.impressions.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/components/dashboard/ResultsSummary.tsx
git commit -m "feat: add ResultsSummary compact component for home page"
```

---

### Task 6: Rebuild Home Page (`/`)

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/page.tsx` (full rewrite)

**Step 1: Rewrite the Home page with 3 zones**

The new page uses:
- Zone 1: Header (existing) + KPIs (existing `HeroMetric`) + `DecisionsPending` (new)
- Zone 2: `DepartmentKanban` (new)
- Zone 3: `ResultsSummary` (new) + `ActivitySummary` (existing)

All Convex queries already exist in the current page — we're reorganizing the layout, removing unused sections (templates, strategy inline, content pipeline inline, calendar inline, agent status bar).

```tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, Zap, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HeroMetric, HeroMetricSkeleton } from "@/components/dashboard/HeroMetric";
import { DecisionsPending } from "@/components/dashboard/DecisionsPending";
import { DepartmentKanban } from "@/components/dashboard/DepartmentKanban";
import { ResultsSummary } from "@/components/dashboard/ResultsSummary";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";

const DashboardExecuteModal = dynamic(
  () => import("@/components/dashboard/DashboardExecuteModal").then((m) => m.DashboardExecuteModal),
  { ssr: false }
);

export default function DashboardPage() {
  const { success, error } = useToast();
  const [synced, setSynced] = useState(false);
  const syncAttemptedRef = useRef(false);

  const syncUser = useMutation(api.users.getOrCreateUser);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Analytics — last 30 days
  const dateRange = useMemo(() => ({
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
  }), []);

  const analytics = useQuery(api.analytics.getAnalyticsWithDateRange, dateRange);
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const content = useQuery(api.functions.listContent, brandProfile === undefined ? "skip" : { brandProfileId: brandProfile?._id });
  const agents = useQuery(api.functions.listAgents, {});
  const controlStatus = useQuery(api.controlCenter.getControlCenterStatus);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const contentPerformance = useQuery(api.analytics.getContentPerformance, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    sortBy: "engagement",
  });

  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // User sync effect
  useEffect(() => {
    if (!synced && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      syncUser()
        .then(() => setSynced(true))
        .catch((err) => error("Error al sincronizar perfil.", err.message));
    }
  }, [synced, syncUser, error]);

  // Trends
  const trends = useMemo(() => {
    if (!analytics?.tasksByDay) return { executions: 0, successRate: 0, cost: 0 };
    const entries = Object.entries(analytics.tasksByDay).sort(([a], [b]) => a.localeCompare(b));
    const currentWeek = entries.slice(-7);
    const previousWeek = entries.slice(-14, -7);
    const sumTotal = (arr: typeof entries) => arr.reduce((s, [, d]) => s + d.total, 0);
    const sumCompleted = (arr: typeof entries) => arr.reduce((s, [, d]) => s + d.completed, 0);
    const currExec = sumTotal(currentWeek);
    const prevExec = sumTotal(previousWeek);
    const execTrend = prevExec > 0 ? ((currExec - prevExec) / prevExec) * 100 : 0;
    const currSuccess = currExec > 0 ? (sumCompleted(currentWeek) / currExec) * 100 : 0;
    const prevSuccess = prevExec > 0 ? (sumCompleted(previousWeek) / prevExec) * 100 : 0;
    const successTrend = prevSuccess > 0 ? currSuccess - prevSuccess : 0;
    return { executions: execTrend, successRate: successTrend, cost: 0 };
  }, [analytics?.tasksByDay]);

  // Sparkline
  const kpiSparkData = useMemo(() => {
    if (!analytics?.tasksByDay) return undefined;
    return Object.entries(analytics.tasksByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([, s]) => s.total);
  }, [analytics?.tasksByDay]);

  const contentSparkData = useMemo(() => {
    if (!content) return undefined;
    const now = Date.now();
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now - (7 - i) * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0];
    });
    return days.map((day) =>
      content.filter((c: Record<string, unknown>) => {
        const created = c._creationTime as number | undefined;
        return created ? new Date(created).toISOString().split("T")[0] === day : false;
      }).length
    );
  }, [content]);

  // Decisions data
  const attentionData = useMemo(() => {
    const agentErrors = agents?.filter((a: Record<string, unknown>) => a.status === "error").length ?? 0;
    const contentInReview = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;
    const failedExecutions = analytics?.recentExecutions
      ? analytics.recentExecutions.filter(
          (e: { status: string; timestamp: number }) =>
            (e.status === "failed" || e.status === "failure") &&
            e.timestamp > Date.now() - 24 * 60 * 60 * 1000
        ).length
      : 0;
    return { agentErrors, contentInReview, failedExecutions };
  }, [agents, content, analytics]);

  // Results data for Zone 3
  const chartData = useMemo(() => {
    if (!analytics?.tasksByDay) return [];
    return Object.entries(analytics.tasksByDay)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7)
      .map(([date, data]) => {
        const d = new Date(date);
        const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
        return { name: dayName.charAt(0).toUpperCase() + dayName.slice(1), tareas: data.total };
      });
  }, [analytics?.tasksByDay]);

  const engagementStats = useMemo(() => {
    if (!contentPerformance) return { totalImpressions: 0, totalInteractions: 0 };
    let totalImpressions = 0;
    let totalInteractions = 0;
    for (const item of contentPerformance) {
      if (item.engagement) {
        totalImpressions += item.engagement.impressions;
        totalInteractions += item.engagement.likes + item.engagement.comments;
      }
    }
    return { totalImpressions, totalInteractions };
  }, [contentPerformance]);

  const topContent = useMemo(() => {
    if (!contentPerformance) return [];
    return contentPerformance.slice(0, 3).map((item) => ({
      title: item.title,
      type: item.type,
      impressions: item.engagement?.impressions ?? 0,
      interactions: item.engagement ? item.engagement.likes + item.engagement.comments : 0,
    }));
  }, [contentPerformance]);

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const userName = currentUser?.name || "usuario";
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = currentTime.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = currentTime.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const isLoading = !analytics;
  const totalContent = content?.length ?? 0;

  return (
    <div className="space-y-6 stagger-children">
      {/* ZONE 1: Header + KPIs + Decisions */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-base font-medium text-[var(--text-primary)]">{greeting}, {userName}</h1>
          <p className="text-xs text-[var(--text-tertiary)] capitalize mt-0.5">{dateStr} &middot; {timeStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExecuteModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors">
            <Zap className="h-3.5 w-3.5" />
            Ejecutar Agente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* KPIs: 3 cards */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HeroMetricSkeleton /><HeroMetricSkeleton /><HeroMetricSkeleton /><HeroMetricSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HeroMetric label="Ejecuciones" value={analytics.overview.totalExecutions} sparkData={kpiSparkData} sparkColor="#ea580c" trend={trends.executions} />
              <HeroMetric label="Tasa Éxito" value={analytics.overview.successRate} isPercentage sparkColor="#16a34a" trend={trends.successRate} />
              <HeroMetric label="Costo" value={analytics.overview.totalCost} isCurrency sparkColor="#d97706" trend={trends.cost} />
              <HeroMetric label="Contenido" value={totalContent} sparkData={contentSparkData} sparkColor="#7c3aed" formatter={(v) => `${Math.round(v)}`} href="/content" />
            </div>
          )}
        </div>
        {/* Decisions */}
        <div>
          <DecisionsPending
            contentInReview={attentionData.contentInReview}
            agentErrors={attentionData.agentErrors}
            failedExecutions={attentionData.failedExecutions}
          />
        </div>
      </div>

      {/* ZONE 2: Department Kanban */}
      <DepartmentKanban agentsByDepartment={controlStatus?.agentsByDepartment} />

      {/* ZONE 3: Results + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResultsSummary
            chartData={chartData}
            topContent={topContent}
            totalImpressions={engagementStats.totalImpressions}
            totalInteractions={engagementStats.totalInteractions}
          />
        </div>
        <div>
          <ActivitySummary activities={activity} />
        </div>
      </div>

      {/* Execute Modal */}
      {showExecuteModal && <DashboardExecuteModal onClose={() => setShowExecuteModal(false)} />}
    </div>
  );
}
```

**Step 2: Verify Home page renders all 3 zones**

Navigate to `http://localhost:3001` and verify:
- KPIs + Decisions visible at top
- Kanban board with 7 department columns visible
- Results summary + activity feed at bottom

**Step 3: Commit**

```bash
git add ai-marketing-department/app/\(dashboard\)/page.tsx
git commit -m "feat: rebuild Home page with 3-zone Command Center layout"
```

---

### Task 7: Add Tabs to Content Page (Pipeline/List/Calendar)

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/content/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/content/pipeline/page.tsx` (absorbed)

**Step 1: Add tab state and Pipeline/Calendar imports to content page**

At the top of the content page, add a tab selector. The existing content page already has the List view. Add imports for `KanbanBoard`, `CalendarGrid`, and `CalendarDayDetail` from `components/content-pipeline/`.

Add a `type ContentTab = "list" | "pipeline" | "calendar"` state. Render tabs at the top of the page. When tab is "pipeline", render the KanbanBoard + PipelineStats. When "calendar", render CalendarGrid + CalendarDayDetail. When "list", render the existing content list.

The key queries needed for pipeline tab (`contentByStatus`, `statusCounts`, `scheduledContent`) must be added. Reference `app/(dashboard)/content/pipeline/page.tsx` for the exact query setup and handler logic.

**Step 2: Remove the separate pipeline page**

Delete `ai-marketing-department/ai-marketing-department/app/(dashboard)/content/pipeline/page.tsx` since it's now a tab in the content page.

**Step 3: Verify all 3 tabs work**

Navigate to `http://localhost:3001/content`:
- "Lista" tab shows content cards (existing behavior)
- "Pipeline" tab shows Kanban board
- "Calendario" tab shows calendar grid

**Step 4: Commit**

```bash
git add ai-marketing-department/app/\(dashboard\)/content/page.tsx
git rm ai-marketing-department/app/\(dashboard\)/content/pipeline/page.tsx
git commit -m "feat: unify content page with Pipeline/List/Calendar tabs"
```

---

### Task 8: Add Tabs to Strategy Page (Autopilot/Brand/Insights)

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/strategy/page.tsx`
- Keep: `ai-marketing-department/ai-marketing-department/app/(dashboard)/brand/page.tsx` (referenced as component)
- Keep: `ai-marketing-department/ai-marketing-department/app/(dashboard)/brand/manual/page.tsx` (separate route stays)

**Step 1: Add tab state to strategy page**

Add `type StrategyTab = "autopilot" | "brand" | "insights"` state. The existing strategy page content becomes the "autopilot" tab.

For the "brand" tab, import the key components from the brand page: `BrandProfileSummary`, `BrandSuggestionsPanel`, `BrandMaturityBar`, `BrandAuditPanel`, etc. Don't duplicate the full wizard — instead show the summary view with an "Edit Profile" button that navigates to `/brand` (keep brand page as the editor).

For the "insights" tab, move `ContentPillarsPanel`, `PillarPerformance`, `FunnelCoverage`, `TAYACoverage`, and `StrategyInsightsPanel` into this tab.

**Step 2: Verify all 3 tabs**

Navigate to `http://localhost:3001/strategy`:
- "Autopilot" tab shows CMO engine (existing)
- "Marca" tab shows brand summary + link to manual
- "Insights" tab shows pillars/funnel/TAYA

**Step 3: Commit**

```bash
git add ai-marketing-department/app/\(dashboard\)/strategy/page.tsx
git commit -m "feat: add Autopilot/Brand/Insights tabs to Strategy page"
```

---

### Task 9: Clean Up Removed Pages

**Files:**
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/results/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/analytics/page.tsx` (if exists)
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/agents/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/org/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/campaigns/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/feeds/` (directory)
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/generated/page.tsx`
- Remove: `ai-marketing-department/ai-marketing-department/app/(dashboard)/control-center/page.tsx`

**Step 1: Delete removed page files**

```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department
git rm ai-marketing-department/app/\(dashboard\)/results/page.tsx
git rm ai-marketing-department/app/\(dashboard\)/agents/page.tsx
git rm ai-marketing-department/app/\(dashboard\)/org/page.tsx
git rm ai-marketing-department/app/\(dashboard\)/campaigns/page.tsx
git rm -r ai-marketing-department/app/\(dashboard\)/feeds/
git rm ai-marketing-department/app/\(dashboard\)/generated/page.tsx
git rm ai-marketing-department/app/\(dashboard\)/control-center/page.tsx
```

Note: Keep `/brand/page.tsx` as the brand editor (full wizard). Keep `/brand/manual/page.tsx` for the brand manual view.

**Step 2: Verify no broken links**

Check that the sidebar links work. Clicking "Inicio" goes to `/`, "Contenido" to `/content`, "Estrategia" to `/strategy`, "Configuración" to `/settings`.

**Step 3: Verify app builds without errors**

Run: `npx next build` (or check dev server has no compilation errors)

**Step 4: Commit**

```bash
git commit -m "chore: remove absorbed pages (results, agents, org, campaigns, feeds, generated, control-center)"
```

---

### Task 10: Visual Polish and Responsive Check

**Files:**
- Modify: Various components as needed for responsive layout

**Step 1: Check mobile layout**

Open the app on a mobile viewport (375px). Verify:
- KPIs stack into 2 columns
- Kanban scrolls horizontally on mobile
- Decisions card stacks below KPIs
- Results and Activity stack vertically

**Step 2: Check dark mode**

Toggle dark mode. Verify all new components use CSS variables (`var(--card-bg)`, `var(--text-primary)`, etc.) and render correctly in dark theme.

**Step 3: Fix any visual issues found**

Adjust Tailwind classes as needed for responsive breakpoints and dark mode compatibility.

**Step 4: Final commit**

```bash
git add -A
git commit -m "style: responsive and dark mode polish for Command Center redesign"
```

---

## Summary

| Task | Component | Estimated Scope |
|------|-----------|----------------|
| 1 | Sidebar navigation | Small (10 lines) |
| 2 | AgentMiniCard | Small (new file, ~40 lines) |
| 3 | DepartmentKanban | Medium (new file, ~100 lines) |
| 4 | DecisionsPending | Small (new file, ~70 lines) |
| 5 | ResultsSummary | Medium (new file, ~80 lines) |
| 6 | Home page rebuild | Large (full rewrite, ~200 lines) |
| 7 | Content tabs | Medium (modify existing, add pipeline/calendar) |
| 8 | Strategy tabs | Medium (modify existing, add brand/insights) |
| 9 | Remove old pages | Small (delete files) |
| 10 | Visual polish | Small (CSS tweaks) |
