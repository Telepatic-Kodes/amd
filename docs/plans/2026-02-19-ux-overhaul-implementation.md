# UX Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Dashboard (Command Center), Content (Modal Fullscreen), and Agents (Grouped List + Drawer) to reduce friction and simplify navigation flows.

**Architecture:** Phased approach — shared UI components first, then each page independently. Each page keeps its Convex queries but restructures how data is rendered. New shared components: Drawer, ContentFullscreen, ActionFeed, AgentList.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4 (CSS variables), Framer Motion, Convex, Lucide React

**Design Doc:** `docs/plans/2026-02-19-ux-overhaul-design.md`

---

## Phase 1: Shared UI Components

### Task 1: Create Drawer Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/ui/Drawer.tsx`

**Step 1: Create the Drawer component**

This is a reusable slide-in panel from the right. Used by Agents (detail drawer) and potentially other pages.

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  className?: string;
}

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "md",
  className,
}: DrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--card-bg)] shadow-xl ${widthClasses[width]} ${className ?? ""}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Verify it renders**

Manually import in any page temporarily and check it opens/closes, animates, and handles Escape key.

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/ui/Drawer.tsx
git commit -m "feat(ui): add reusable Drawer slide-in component"
```

---

### Task 2: Create ListSkeleton and DrawerSkeleton Components

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/ui/Skeleton.tsx`

**Step 1: Add ListSkeleton and DrawerSkeleton to existing Skeleton file**

Add these after the existing `SkeletonList` export:

```tsx
export function ListSkeleton({
  groups = 3,
  itemsPerGroup = 4,
  className,
}: {
  groups?: number;
  itemsPerGroup?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: groups }).map((_, g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-1">
            {Array.from({ length: itemsPerGroup }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
              >
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DrawerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/ui/Skeleton.tsx
git commit -m "feat(ui): add ListSkeleton and DrawerSkeleton components"
```

---

### Task 3: Create useContentPageState Hook

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/hooks/useContentPageState.ts`

**Step 1: Create the consolidated state hook**

This replaces 16+ `useState` calls in the content page with a single hook.

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useCallback, useState } from "react";

type ContentTab = "list" | "pipeline";
type ViewMode = "grid" | "list";

interface ContentFilters {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
}

interface ContentPageState {
  // View
  activeTab: ContentTab;
  viewMode: ViewMode;
  filters: ContentFilters;
  showAdvancedFilters: boolean;

  // Selection
  selectedContentId: string | null;

  // Fullscreen editor
  fullscreenContent: Doc<"content"> | null;
  fullscreenTab: "editor" | "versions" | "seo" | "publish" | "repurpose";

  // Generate modal
  showGenerateModal: boolean;
  templatePreselect: string | undefined;
}

const initialState: ContentPageState = {
  activeTab: "list",
  viewMode: "grid",
  filters: { searchQuery: "", typeFilter: "", statusFilter: "" },
  showAdvancedFilters: false,
  selectedContentId: null,
  fullscreenContent: null,
  fullscreenTab: "editor",
  showGenerateModal: false,
  templatePreselect: undefined,
};

export function useContentPageState() {
  const [state, setState] = useState<ContentPageState>(initialState);

  const setActiveTab = useCallback(
    (tab: ContentTab) =>
      setState((s) => ({ ...s, activeTab: tab, selectedContentId: null })),
    [],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => setState((s) => ({ ...s, viewMode: mode })),
    [],
  );

  const setFilter = useCallback(
    (key: keyof ContentFilters, value: string) =>
      setState((s) => ({
        ...s,
        filters: { ...s.filters, [key]: value },
      })),
    [],
  );

  const toggleAdvancedFilters = useCallback(
    () =>
      setState((s) => ({
        ...s,
        showAdvancedFilters: !s.showAdvancedFilters,
      })),
    [],
  );

  const selectContent = useCallback(
    (id: string | null) =>
      setState((s) => ({ ...s, selectedContentId: id })),
    [],
  );

  const openFullscreen = useCallback(
    (content: Doc<"content">, tab?: ContentPageState["fullscreenTab"]) =>
      setState((s) => ({
        ...s,
        fullscreenContent: content,
        fullscreenTab: tab ?? "editor",
      })),
    [],
  );

  const closeFullscreen = useCallback(
    () => setState((s) => ({ ...s, fullscreenContent: null })),
    [],
  );

  const setFullscreenTab = useCallback(
    (tab: ContentPageState["fullscreenTab"]) =>
      setState((s) => ({ ...s, fullscreenTab: tab })),
    [],
  );

  const openGenerateModal = useCallback(
    (templatePreselect?: string) =>
      setState((s) => ({
        ...s,
        showGenerateModal: true,
        templatePreselect,
      })),
    [],
  );

  const closeGenerateModal = useCallback(
    () =>
      setState((s) => ({
        ...s,
        showGenerateModal: false,
        templatePreselect: undefined,
      })),
    [],
  );

  return {
    ...state,
    setActiveTab,
    setViewMode,
    setFilter,
    toggleAdvancedFilters,
    selectContent,
    openFullscreen,
    closeFullscreen,
    setFullscreenTab,
    openGenerateModal,
    closeGenerateModal,
  };
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/hooks/useContentPageState.ts
git commit -m "feat(hooks): add useContentPageState to consolidate content page state"
```

---

## Phase 2: Dashboard → Command Center

### Task 4: Create ActionFeedItem Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/ActionFeedItem.tsx`

**Step 1: Create the component**

Each item represents an actionable event with inline buttons.

```tsx
"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export interface ActionItem {
  id: string;
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  timestamp: number;
  badge?: { label: string; variant: "default" | "success" | "warning" | "error" };
  actions: {
    label: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    onClick: () => void;
    loading?: boolean;
  }[];
}

export function ActionFeedItem({ item }: { item: ActionItem }) {
  const Icon = item.icon;
  const timeAgo = formatTimeAgo(item.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-3 transition-shadow hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          item.iconColor ?? "bg-[var(--accent-muted)] text-[var(--accent)]",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {item.title}
          </p>
          {item.badge && (
            <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {item.description}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{timeAgo}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {item.actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "outline"}
            size="sm"
            onClick={action.onClick}
            className="text-xs"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/dashboard/ActionFeedItem.tsx
git commit -m "feat(dashboard): add ActionFeedItem component"
```

---

### Task 5: Create ActionFeed Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/ActionFeed.tsx`

**Step 1: Create the container component**

This builds the "Necesita tu atención" and "Actividad reciente" sections from query data.

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Inbox,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { ActionFeedItem, type ActionItem } from "./ActionFeedItem";

interface ActionFeedProps {
  contentInReview: Doc<"content">[];
  agentsWithErrors: Doc<"agents">[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    timestamp: number;
  }[];
  onApproveContent: (id: string) => void;
  onRequestChanges: (id: string) => void;
  onRetryAgent: (agentId: string) => void;
  onViewAgent: (agentId: string) => void;
  onViewContent: (id: string) => void;
}

export function ActionFeed({
  contentInReview,
  agentsWithErrors,
  recentActivity,
  onApproveContent,
  onRequestChanges,
  onRetryAgent,
  onViewAgent,
  onViewContent,
}: ActionFeedProps) {
  const attentionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    for (const content of contentInReview) {
      items.push({
        id: `content-${content._id}`,
        icon: FileText,
        iconColor: "bg-amber-500/10 text-amber-600",
        title: content.title,
        description: `Pendiente de revisión`,
        timestamp: content._creationTime,
        badge: { label: "Review", variant: "warning" },
        actions: [
          {
            label: "Aprobar",
            variant: "primary",
            onClick: () => onApproveContent(content._id),
          },
          {
            label: "Cambios",
            variant: "outline",
            onClick: () => onRequestChanges(content._id),
          },
        ],
      });
    }

    for (const agent of agentsWithErrors) {
      items.push({
        id: `agent-${agent._id}`,
        icon: AlertCircle,
        iconColor: "bg-red-500/10 text-red-600",
        title: agent.name,
        description: `Error en agente ${agent.agentId}`,
        timestamp: agent._creationTime,
        badge: { label: "Error", variant: "error" },
        actions: [
          {
            label: "Reintentar",
            variant: "primary",
            onClick: () => onRetryAgent(agent.agentId),
          },
          {
            label: "Ver logs",
            variant: "outline",
            onClick: () => onViewAgent(agent.agentId),
          },
        ],
      });
    }

    return items;
  }, [
    contentInReview,
    agentsWithErrors,
    onApproveContent,
    onRequestChanges,
    onRetryAgent,
    onViewAgent,
  ]);

  const activityItems = useMemo<ActionItem[]>(() => {
    return recentActivity.slice(0, 10).map((a) => ({
      id: a.id,
      icon: a.type === "execution" ? Zap : a.type === "content" ? FileText : CheckCircle2,
      title: a.description,
      timestamp: a.timestamp,
      actions: [],
    }));
  }, [recentActivity]);

  return (
    <div className="space-y-6">
      {/* Necesita tu atención */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Necesita tu atención
        </h2>
        {attentionItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Todo al día"
            description="No hay items pendientes de tu atención"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <ActionFeedItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Actividad reciente */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Actividad reciente
        </h2>
        {activityItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin actividad"
            description="La actividad de tus agentes aparecerá aquí"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {activityItems.map((item) => (
              <ActionFeedItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/dashboard/ActionFeed.tsx
git commit -m "feat(dashboard): add ActionFeed container component"
```

---

### Task 6: Create QuickSummary Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/dashboard/QuickSummary.tsx`

**Step 1: Create the right-column summary component**

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { Button } from "@/components/ui/Button";
import {
  CalendarDays,
  FileText,
  Play,
  TrendingUp,
  Users,
} from "lucide-react";

interface QuickSummaryProps {
  publishedToday: number;
  publishedTrend: number;
  activeAgents: number;
  totalAgents: number;
  successRate: number;
  successRateTrend: number;
  scheduledNext7Days: { title: string; date: string; type: string }[];
  onExecuteAgent: () => void;
}

export function QuickSummary({
  publishedToday,
  publishedTrend,
  activeAgents,
  totalAgents,
  successRate,
  successRateTrend,
  scheduledNext7Days,
  onExecuteAgent,
}: QuickSummaryProps) {
  return (
    <div className="space-y-4">
      {/* KPIs compactos */}
      <div className="space-y-3">
        <KpiCompact
          icon={FileText}
          label="Publicado hoy"
          value={publishedToday}
          trend={publishedTrend}
        />
        <KpiCompact
          icon={Users}
          label="Agentes activos"
          value={activeAgents}
          suffix={`/ ${totalAgents}`}
        />
        <KpiCompact
          icon={TrendingUp}
          label="Tasa de éxito"
          value={successRate}
          suffix="%"
          trend={successRateTrend}
        />
      </div>

      {/* Mini-calendario */}
      <Card>
        <CardContent className="p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
            Próximos 7 días
          </div>
          {scheduledNext7Days.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">
              Sin contenido programado
            </p>
          ) : (
            <div className="space-y-1.5">
              {scheduledNext7Days.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-[var(--text-tertiary)]">
                    {item.date}
                  </span>
                  <span className="truncate text-[var(--text-primary)]">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acción rápida */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        onClick={onExecuteAgent}
      >
        <Play className="mr-2 h-4 w-4" />
        Ejecutar agente
      </Button>
    </div>
  );
}

function KpiCompact({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)]">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {value}
            </span>
            {suffix && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {suffix}
              </span>
            )}
            {trend !== undefined && <TrendIndicator value={trend} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/dashboard/QuickSummary.tsx
git commit -m "feat(dashboard): add QuickSummary right-column component"
```

---

### Task 7: Rewrite Dashboard Page

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/page.tsx`

**Step 1: Rewrite the dashboard page**

Replace the entire page with the Command Center layout. Keep all existing Convex queries but restructure the rendering.

Key changes:
- Remove: `SmartGreeting`, `TodayBriefing`, `QuickActions`, `HeroMetric` (4x), `DepartmentKanban`, `ResultsSummary`
- Add: `ActionFeed`, `QuickSummary`
- Layout: 2-column (lg:grid-cols-3, main gets col-span-2)
- Keep: `useDashboardData` hook, `DashboardExecuteModal`, user sync logic

The page should:
1. Keep all existing `useQuery` calls and the `useDashboardData` hook
2. Keep the `syncUser` effect and `DashboardExecuteModal`
3. Replace the JSX layout with:
   - Simple 1-line greeting: "Hola, {name}" with date
   - 2-column grid: ActionFeed (left, lg:col-span-2) + QuickSummary (right)
4. Derive `contentInReview` and `agentsWithErrors` from existing query data
5. Wire action handlers (approve, reject, retry) to existing mutations

**Important patterns to follow:**
- Use `var(--surface-0)` for page background
- Use `var(--text-primary)` for text
- Import from `@/components/dashboard/ActionFeed` and `@/components/dashboard/QuickSummary`
- Keep `dynamic(() => import(...), { ssr: false })` for modal
- Keep the loading check: `if (!agents || !analytics) return <SkeletonGrid />`

**Step 2: Verify dashboard loads**

Run: `npm run dev` in the frontend directory
Navigate to `http://localhost:3000`
Expected: 2-column layout with Action Feed and Quick Summary

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/(dashboard)/page.tsx
git commit -m "feat(dashboard): rewrite as Command Center with ActionFeed + QuickSummary"
```

---

## Phase 3: Content → Modal Fullscreen

### Task 8: Create WorkflowStepper Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/content/WorkflowStepper.tsx`

**Step 1: Create the stepper**

Visual stepper showing content workflow progress: Draft → Review → Approved → Published

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { key: "draft", label: "Borrador" },
  { key: "review", label: "Revisión" },
  { key: "approved", label: "Aprobado" },
  { key: "published", label: "Publicado" },
] as const;

const statusToStep: Record<string, number> = {
  draft: 0,
  review: 1,
  revision_needed: 1,
  approved: 2,
  scheduled: 2,
  published: 3,
  archived: 3,
};

interface WorkflowStepperProps {
  currentStatus: string;
  onAdvance?: (nextStatus: string) => void;
  loading?: boolean;
}

export function WorkflowStepper({
  currentStatus,
  onAdvance,
  loading,
}: WorkflowStepperProps) {
  const currentStepIndex = statusToStep[currentStatus] ?? 0;

  const handleStepClick = (stepIndex: number) => {
    if (loading) return;
    if (stepIndex !== currentStepIndex + 1) return;

    const nextStatus = STEPS[stepIndex].key;
    onAdvance?.(nextStatus);
  };

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStepIndex;
        const isCurrent = i === currentStepIndex;
        const isNext = i === currentStepIndex + 1;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <button
              onClick={() => handleStepClick(i)}
              disabled={!isNext || loading}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                isCompleted &&
                  "bg-[var(--success)]/10 text-[var(--success)]",
                isCurrent &&
                  "bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30",
                isNext &&
                  "cursor-pointer bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
                !isCompleted &&
                  !isCurrent &&
                  !isNext &&
                  "bg-[var(--surface-1)] text-[var(--text-tertiary)]",
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {step.label}
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-4",
                  i < currentStepIndex
                    ? "bg-[var(--success)]"
                    : "bg-[var(--border)]",
                )}
              />
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
git add ai-marketing-department/ai-marketing-department/components/content/WorkflowStepper.tsx
git commit -m "feat(content): add WorkflowStepper visual component"
```

---

### Task 9: Create ContentFullscreen Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/content/ContentFullscreen.tsx`

**Step 1: Create the fullscreen modal for content editing**

This is the core component — a fullscreen modal with sidebar tabs and main editor area. It replaces EditContentModal, VersionHistory, VersionDiff, RepurposeContentModal, RollbackDialog, and CrossPlatformPublishPanel.

The component should:
1. Accept a `Doc<"content">` and render fullscreen (fixed inset-0 z-50)
2. Left sidebar (~250px) with tabs: Editor, Versiones, SEO, Publicar, Repurpose
3. Main area shows the active tab content
4. Editor tab: title input + body textarea (reuse existing RichTextEditor if available)
5. Versiones tab: show VersionHistory list + inline diff/rollback
6. SEO tab: meta title, meta description, canonical, slug inputs
7. Publicar tab: CrossPlatformPublishPanel content
8. Repurpose tab: repurpose options
9. Top bar: WorkflowStepper + save button + close button
10. Framer Motion fade+scale animation on enter/exit
11. Escape key closes the modal

**Key imports to use:**
- `@/components/content/WorkflowStepper`
- `@/components/ui/Button`
- `@/components/ui/Badge`
- `framer-motion` for AnimatePresence + motion
- `lucide-react` for icons (X, Save, FileText, History, Search, Globe, Repeat2)
- Convex mutations: `api.functions.updateContent`, `api.functions.updateContentStatus`

**Important patterns:**
- Use `var(--card-bg)` for background
- Use `var(--border)` for borders
- Active sidebar tab: `bg-[var(--accent-muted)] text-[var(--accent)]`
- Inactive tab: `text-[var(--text-secondary)] hover:bg-[var(--surface-1)]`
- Save with optimistic feedback (LoadingButton + toast)
- Body changes stored in local state, saved on explicit "Guardar" click

This is a large component (~200-300 lines). Build it with the sidebar tabs first, then implement each tab's content. The Editor tab is the most important — start with just title + body textarea. Other tabs can show placeholder content initially and be filled in subsequent tasks.

**Step 2: Verify the fullscreen modal opens correctly**

Test by temporarily wiring it into the content page. Check:
- Opens fullscreen with animation
- Sidebar tabs switch correctly
- Editor tab shows title + body
- Escape closes it
- WorkflowStepper shows correct status

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/content/ContentFullscreen.tsx
git commit -m "feat(content): add ContentFullscreen modal with sidebar tabs"
```

---

### Task 10: Rewrite Content Page

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/content/page.tsx`

**Step 1: Rewrite the content page**

Major changes:
1. Replace 21 `useState` calls with `useContentPageState` hook
2. Remove Calendar tab — keep only List and Pipeline
3. Replace all 7 modals with ContentFullscreen + GenerateContentModal
4. Click on content item → `openFullscreen(content)` instead of `setSelectedContent`
5. Keep existing Convex queries and mutations
6. Keep existing filter logic (type, status, search) but simplify UI
7. Keep existing KanbanBoard for Pipeline tab
8. Simplify the List tab: no inline detail panel, just a grid/list of cards that open fullscreen on click

**Key changes in data flow:**
- `selectedContent` state → used only for highlighting in list, not for showing detail panel
- `editingContent` → removed, replaced by `fullscreenContent`
- All version/repurpose/publish states → removed, handled inside ContentFullscreen tabs
- `showAdvancedFilters` → simplified, all filters inline

**What to keep from original:**
- `useMemo` for `filteredContent`
- CONTENT_TYPES array
- CONTENT_STATUSES array
- `typeColors` and `typeIcons` maps
- `formatDate`, `formatTypeName`, `stripMarkdown` helpers
- `StatusActions` inline component (move into ContentFullscreen)
- PipelineStats + KanbanBoard for Pipeline tab
- UploadContentForm in the header

**What to remove:**
- Calendar tab and all calendar-related code
- RepurposeContentModal usage
- EditContentModal usage
- VersionHistory modal usage
- VersionDiff modal usage
- RollbackDialog usage
- CrossPlatformPublishPanel usage
- Inline content detail panel (the 3-column layout)
- `analysisContentId` state
- `showVersionHistory` state
- `diffVersions` state
- `rollbackTarget` state

**Step 2: Verify content page works**

Test:
- List view shows content grid
- Click on item opens ContentFullscreen
- Pipeline tab shows Kanban
- Filters work
- Generate modal works
- Upload form works

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/(dashboard)/content/page.tsx
git commit -m "feat(content): rewrite with ContentFullscreen and useContentPageState"
```

---

## Phase 4: Agents → Lista Agrupada + Drawer

### Task 11: Create AgentListItem Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/agents/AgentListItem.tsx`

**Step 1: Create the component**

A compact row for a single agent with inline actions.

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Pause, Play, RefreshCw } from "lucide-react";

interface AgentListItemProps {
  agent: Doc<"agents">;
  isSelected: boolean;
  onSelect: () => void;
  onExecute: () => void;
  onTogglePause: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-[var(--success)]",
  paused: "bg-amber-500",
  error: "bg-[var(--error)]",
  maintenance: "bg-blue-500",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  error: "Error",
  maintenance: "Mant.",
};

export function AgentListItem({
  agent,
  isSelected,
  onSelect,
  onExecute,
  onTogglePause,
}: AgentListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-all",
        isSelected
          ? "border-[var(--accent)]/30 bg-[var(--accent-subtle)]"
          : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border-hover)] hover:shadow-sm",
      )}
    >
      {/* Status dot */}
      <div
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          statusColors[agent.status] ?? "bg-gray-400",
        )}
      />

      {/* Name + role */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {agent.name}
        </p>
        <p className="truncate text-xs text-[var(--text-tertiary)]">
          {agent.agentId}
        </p>
      </div>

      {/* Status badge */}
      <Badge
        variant={
          agent.status === "active"
            ? "success"
            : agent.status === "error"
              ? "error"
              : "default"
        }
      >
        {statusLabels[agent.status] ?? agent.status}
      </Badge>

      {/* Actions (visible on hover) */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onExecute();
          }}
          className="h-7 w-7 p-0"
          title="Ejecutar"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          className="h-7 w-7 p-0"
          title={agent.status === "paused" ? "Reanudar" : "Pausar"}
        >
          {agent.status === "paused" ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/agents/AgentListItem.tsx
git commit -m "feat(agents): add AgentListItem compact row component"
```

---

### Task 12: Create AgentList Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/agents/AgentList.tsx`

**Step 1: Create the grouped list**

Groups agents by department in collapsible accordion sections.

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AgentListItem } from "./AgentListItem";

interface AgentListProps {
  agents: Doc<"agents">[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onExecuteAgent: (agent: Doc<"agents">) => void;
  onTogglePauseAgent: (agent: Doc<"agents">) => void;
}

const DEPARTMENTS: { key: string; label: string }[] = [
  { key: "leadership", label: "Liderazgo" },
  { key: "content", label: "Contenido" },
  { key: "social", label: "Social Media" },
  { key: "demandgen", label: "Demand Gen" },
  { key: "seo", label: "SEO" },
  { key: "brand", label: "Marca & Creativo" },
  { key: "ops", label: "Marketing Ops" },
];

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onExecuteAgent,
  onTogglePauseAgent,
}: AgentListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const groups: Record<string, Doc<"agents">[]> = {};
    for (const dept of DEPARTMENTS) {
      groups[dept.key] = [];
    }
    for (const agent of agents) {
      const dept = agent.department ?? "ops";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(agent);
    }
    return groups;
  }, [agents]);

  const toggleCollapse = (dept: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {DEPARTMENTS.map((dept) => {
        const deptAgents = grouped[dept.key] ?? [];
        if (deptAgents.length === 0) return null;
        const isCollapsed = collapsed.has(dept.key);
        const activeCount = deptAgents.filter(
          (a) => a.status === "active",
        ).length;

        return (
          <section key={dept.key}>
            <button
              onClick={() => toggleCollapse(dept.key)}
              className="mb-2 flex w-full items-center gap-2 text-left"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--text-tertiary)] transition-transform",
                  isCollapsed && "-rotate-90",
                )}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {dept.label}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {activeCount}/{deptAgents.length} activos
              </span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {deptAgents.map((agent) => (
                      <AgentListItem
                        key={agent._id}
                        agent={agent}
                        isSelected={agent._id === selectedAgentId}
                        onSelect={() => onSelectAgent(agent._id)}
                        onExecute={() => onExecuteAgent(agent)}
                        onTogglePause={() => onTogglePauseAgent(agent)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/agents/AgentList.tsx
git commit -m "feat(agents): add AgentList grouped by department with accordion"
```

---

### Task 13: Create AgentDrawerContent Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/agents/AgentDrawerContent.tsx`

**Step 1: Create the drawer content**

Shows full agent details inside the Drawer component. Includes: config, recent executions, status info.

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { Badge, StatusBadge, RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, Settings, Zap, Clock, TrendingUp } from "lucide-react";
import { DrawerSkeleton } from "@/components/ui/Skeleton";

interface AgentDrawerContentProps {
  agent: Doc<"agents">;
  onExecute: () => void;
  onConfigure: () => void;
}

export function AgentDrawerContent({
  agent,
  onExecute,
  onConfigure,
}: AgentDrawerContentProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <StatusBadge status={agent.status} />
          <RoleBadge role={agent.role} />
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {agent.description}
        </p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          ID: {agent.agentId}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onExecute}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Ejecutar
        </Button>
        <Button variant="outline" size="sm" onClick={onConfigure}>
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Configurar
        </Button>
      </div>

      {/* Config summary */}
      <Card>
        <CardContent className="space-y-2 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Configuración
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[var(--text-tertiary)]">Modelo:</span>
              <span className="ml-1 text-[var(--text-primary)]">
                {agent.config?.model ?? "claude-sonnet-4"}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Temp:</span>
              <span className="ml-1 text-[var(--text-primary)]">
                {agent.config?.temperature ?? 0.7}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Max tokens:</span>
              <span className="ml-1 text-[var(--text-primary)]">
                {agent.config?.maxTokens ?? 4096}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Triggers:</span>
              <span className="ml-1 text-[var(--text-primary)]">
                {agent.triggers?.length ?? 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triggers */}
      {agent.triggers && agent.triggers.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Triggers
            </h4>
            <div className="flex flex-wrap gap-1">
              {agent.triggers.map((trigger) => (
                <Badge key={trigger} variant="default">
                  {trigger}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handoffs */}
      {agent.handoffs && agent.handoffs.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Handoffs
            </h4>
            <div className="space-y-1">
              {agent.handoffs.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span>→ {h.toAgentId}</span>
                  <Badge variant="default">{h.condition}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/agents/AgentDrawerContent.tsx
git commit -m "feat(agents): add AgentDrawerContent for drawer detail view"
```

---

### Task 14: Rewrite Agents Page

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/agents/page.tsx`

**Step 1: Rewrite the agents page**

Major changes:
1. Replace `AgentGrid` with `AgentList` (grouped by department)
2. Replace fixed `AgentDetailPanel` with `Drawer` + `AgentDrawerContent`
3. Remove department tabs (accordion sections handle this now)
4. Keep `ActiveChainsPanel` and `RecentExecutionsList` below the list
5. Keep `ExecuteAgentModal` for executing agents

The page should:
1. Keep `useQuery(api.functions.listAgents)` — fetch all agents (no department filter needed since we group client-side)
2. State: `selectedAgentId`, `showDrawer`, `executeAgent`
3. Header: title + status counts (total, active, error) — keep this from original
4. Main area: `AgentList` component
5. Below list: `ActiveChainsPanel` + `RecentExecutionsList` (keep from original)
6. `Drawer` opens when agent is selected, shows `AgentDrawerContent`
7. `ExecuteAgentModal` opens from drawer or inline action

**What to remove:**
- Department tab filtering (replaced by accordion)
- `AgentGrid` import and usage
- `AgentDetailPanel` import and usage
- `hidden lg:block` pattern for detail panel
- Department filter state

**Step 2: Verify agents page works**

Test:
- All 37 agents visible grouped by department
- Collapse/expand departments
- Click agent opens drawer
- Execute/Pause buttons work
- Drawer closes on Escape or X

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/(dashboard)/agents/page.tsx
git commit -m "feat(agents): rewrite with AgentList + Drawer replacing grid + panel"
```

---

## Phase 5: Polish & Verify

### Task 15: Visual Verification and Bug Fixes

**Files:**
- May modify any of the above files

**Step 1: Check all three pages**

Navigate through:
1. `/` (Dashboard) — verify Action Feed and Quick Summary render correctly
2. `/content` — verify list view, click to fullscreen, pipeline tab
3. `/agents` — verify grouped list, drawer, execute modal

**Step 2: Check responsive behavior**

Resize browser to mobile width (375px) and verify:
1. Dashboard: single column, Action Feed stacks above Quick Summary
2. Content: list view works, fullscreen modal fills screen
3. Agents: list items stack, drawer covers full width on mobile

**Step 3: Check dark mode**

Toggle to dark mode and verify:
1. All new components use CSS variables (no hardcoded colors)
2. Drawer backdrop works in dark mode
3. WorkflowStepper colors adapt

**Step 4: Fix any issues found**

**Step 5: Commit**

```bash
git add -A
git commit -m "fix(ui): polish and responsive fixes for UX overhaul"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | Tasks 1-3 | Shared UI components (Drawer, Skeletons, useContentPageState) |
| 2 | Tasks 4-7 | Dashboard Command Center (ActionFeed, QuickSummary, page rewrite) |
| 3 | Tasks 8-10 | Content Fullscreen (WorkflowStepper, ContentFullscreen, page rewrite) |
| 4 | Tasks 11-14 | Agents List + Drawer (AgentListItem, AgentList, AgentDrawerContent, page rewrite) |
| 5 | Task 15 | Visual verification and bug fixes |

**Total tasks:** 15
**Estimated new components:** 11
**Pages rewritten:** 3
