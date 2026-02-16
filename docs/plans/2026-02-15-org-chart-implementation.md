# Interactive Org Chart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an interactive `/org` page that visualizes the 37-agent hierarchy with animated handoff arrows and a detail panel showing per-agent metrics.

**Architecture:** Enhance existing `OrgChart.tsx` + `AgentNode.tsx` with position tracking for SVG handoff arrows. New `HandoffOverlay` renders curved bezier paths. New `AgentDetailPanel` shows stats/executions/handoffs. Two new Convex queries aggregate handoff graph and agent details.

**Tech Stack:** Next.js 16, React 19, Convex, framer-motion, Tailwind 4, Lucide icons. No new dependencies.

**Base paths:**
- Frontend: `/home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department/ai-marketing-department`
- Convex: `/home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/convex`

---

### Task 1: Backend — Handoff Graph Query

**Files:**
- Create: `convex/orgChart.ts`

**Context:** The `handoffs` table has `fromAgent: v.id("agents")`, `toAgent: v.id("agents")`, `timestamp`, `status`. Indexes: `by_from`, `by_to`. The `executions` table has `agentId: v.id("agents")`, `status`, `tokensUsed.total`, `duration`, `timestamp`. Index: `by_agent`.

**Step 1: Create `convex/orgChart.ts` with two queries**

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Returns aggregated handoff edges for the org chart visualization.
 * Groups handoffs by fromAgent→toAgent pair, counting occurrences.
 */
export const getHandoffGraph = query({
  args: {},
  handler: async (ctx) => {
    const handoffs = await ctx.db.query("handoffs").collect();
    const agents = await ctx.db.query("agents").collect();

    // Build agentId (document ID) → agentId (string like "cmo-001") map
    const idToAgentId = new Map<string, string>();
    for (const agent of agents) {
      idToAgentId.set(agent._id, agent.agentId);
    }

    // Aggregate edges
    const edgeMap = new Map<string, { fromAgentId: string; toAgentId: string; count: number; lastTimestamp: number }>();

    for (const h of handoffs) {
      const from = idToAgentId.get(h.fromAgent) ?? h.fromAgent;
      const to = idToAgentId.get(h.toAgent) ?? h.toAgent;
      const key = `${from}→${to}`;

      const existing = edgeMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.lastTimestamp = Math.max(existing.lastTimestamp, h.timestamp);
      } else {
        edgeMap.set(key, {
          fromAgentId: from,
          toAgentId: to,
          count: 1,
          lastTimestamp: h.timestamp,
        });
      }
    }

    return Array.from(edgeMap.values());
  },
});

/**
 * Returns detailed information for a single agent:
 * stats, recent executions, and handoff connections.
 */
export const getAgentDetail = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent) return null;

    // Recent executions (last 5)
    const executions = await ctx.db
      .query("executions")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .order("desc")
      .take(5);

    // All executions for stats
    const allExecs = await ctx.db
      .query("executions")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .collect();

    const totalTasks = allExecs.length;
    const successCount = allExecs.filter((e) => e.status === "success").length;
    const successRate = totalTasks > 0 ? Math.round((successCount / totalTasks) * 100) : 0;
    const totalTokens = allExecs.reduce((sum, e) => sum + (e.tokensUsed?.total ?? 0), 0);

    // Handoffs from this agent
    const handoffsFrom = await ctx.db
      .query("handoffs")
      .withIndex("by_from", (q) => q.eq("fromAgent", agentId))
      .collect();

    // Handoffs to this agent
    const handoffsTo = await ctx.db
      .query("handoffs")
      .withIndex("by_to", (q) => q.eq("toAgent", agentId))
      .collect();

    // Aggregate handoffs by partner agent
    const fromMap = new Map<string, number>();
    for (const h of handoffsFrom) {
      const target = await ctx.db.get(h.toAgent);
      const name = target?.name ?? "Unknown";
      fromMap.set(name, (fromMap.get(name) ?? 0) + 1);
    }

    const toMap = new Map<string, number>();
    for (const h of handoffsTo) {
      const source = await ctx.db.get(h.fromAgent);
      const name = source?.name ?? "Unknown";
      toMap.set(name, (toMap.get(name) ?? 0) + 1);
    }

    return {
      agent,
      stats: { totalTasks, successRate, totalTokens },
      recentExecutions: executions,
      handoffsFrom: Array.from(fromMap.entries()).map(([name, count]) => ({ name, count })),
      handoffsTo: Array.from(toMap.entries()).map(([name, count]) => ({ name, count })),
    };
  },
});
```

**Step 2: Verify Convex picks up the new file**

Run: Check the terminal running `npx convex dev` — it should show the file synced without errors.

**Step 3: Commit**

```bash
git add convex/orgChart.ts
git commit -m "feat(org): add handoff graph and agent detail queries"
```

---

### Task 2: Sidebar — Add Org Chart Link

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/layout/Sidebar.tsx`

**Step 1: Add Org Chart nav item**

Add `GitBranch` to the lucide import, then add `{ name: "Organigrama", href: "/org", icon: GitBranch }` to the "Operaciones" group, after "Agentes".

Find this block (~line 64-70):
```typescript
        items: [
            { name: "Agentes", href: "/agents", icon: Users },
            { name: "Tareas", href: "/tasks", icon: ListTodo },
```

Change to:
```typescript
        items: [
            { name: "Agentes", href: "/agents", icon: Users },
            { name: "Organigrama", href: "/org", icon: GitBranch },
            { name: "Tareas", href: "/tasks", icon: ListTodo },
```

**Step 2: Verify the sidebar shows the new link**

Open http://localhost:3001 and check the sidebar "Operaciones" group has "Organigrama" after "Agentes".

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/layout/Sidebar.tsx
git commit -m "feat(org): add Organigrama link to sidebar"
```

---

### Task 3: AgentNode — Add Position Ref

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/org/AgentNode.tsx`

**Context:** The HandoffOverlay will need to know the screen position of each agent node to draw arrows between them. We add a `ref` callback that reports the node's bounding rect to a parent-provided callback.

**Step 1: Add `nodeRef` prop to AgentNode**

Add `useRef` and `useEffect` imports. Add an optional `onPositionReport` prop:

```typescript
interface AgentNodeProps {
  agent: Agent;
  isSelected?: boolean;
  isHighlighted?: boolean;    // NEW: true when connected to hovered agent
  isDimmed?: boolean;          // NEW: true when NOT connected to hovered agent
  onClick?: () => void;
  onMouseEnter?: () => void;   // NEW
  onMouseLeave?: () => void;   // NEW
  size?: "sm" | "md" | "lg";
  onPositionReport?: (agentId: string, rect: DOMRect) => void; // NEW
}
```

Add a ref to the root `motion.div` and report position on mount/resize:

```typescript
export function AgentNode({ agent, isSelected, isHighlighted, isDimmed, onClick, onMouseEnter, onMouseLeave, size = "md", onPositionReport }: AgentNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onPositionReport || !nodeRef.current) return;
    const report = () => {
      if (nodeRef.current) {
        onPositionReport(agent.agentId, nodeRef.current.getBoundingClientRect());
      }
    };
    report();
    window.addEventListener("resize", report);
    return () => window.removeEventListener("resize", report);
  }, [agent.agentId, onPositionReport]);
```

Add `ref={nodeRef}`, `onMouseEnter`, `onMouseLeave` to the root `motion.div`. Add dimmed styling:

```typescript
isDimmed && "opacity-20 transition-opacity",
isHighlighted && "ring-2 ring-[var(--accent)] shadow-lg",
```

**Step 2: Verify no TS errors**

Check the dev server terminal for errors.

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/org/AgentNode.tsx
git commit -m "feat(org): add position reporting and highlight/dim to AgentNode"
```

---

### Task 4: HandoffOverlay Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/org/HandoffOverlay.tsx`

**Context:** This is an absolute-positioned SVG overlay that draws curved bezier arrows between agent nodes. It receives a `positions` map (agentId → DOMRect) and a `edges` array (handoff graph data).

**Step 1: Create HandoffOverlay**

```typescript
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface HandoffEdge {
  fromAgentId: string;
  toAgentId: string;
  count: number;
  lastTimestamp: number;
}

interface HandoffOverlayProps {
  edges: HandoffEdge[];
  positions: Map<string, DOMRect>;
  containerRect: DOMRect | null;
  hoveredAgentId: string | null;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function HandoffOverlay({ edges, positions, containerRect, hoveredAgentId }: HandoffOverlayProps) {
  const [tooltipEdge, setTooltipEdge] = useState<HandoffEdge | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const paths = useMemo(() => {
    if (!containerRect || positions.size === 0) return [];

    return edges
      .map((edge) => {
        const fromRect = positions.get(edge.fromAgentId);
        const toRect = positions.get(edge.toAgentId);
        if (!fromRect || !toRect) return null;

        // Calculate center points relative to container
        const x1 = fromRect.left - containerRect.left + fromRect.width / 2;
        const y1 = fromRect.top - containerRect.top + fromRect.height;
        const x2 = toRect.left - containerRect.left + toRect.width / 2;
        const y2 = toRect.top - containerRect.top;

        // Bezier control points
        const midY = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        // Stroke width: 1.5 for 1 handoff, up to 4 for many
        const strokeWidth = Math.min(1.5 + Math.log2(edge.count) * 0.8, 4);

        // Is this edge connected to hovered agent?
        const isConnected = hoveredAgentId
          ? edge.fromAgentId === hoveredAgentId || edge.toAgentId === hoveredAgentId
          : true;

        return { ...edge, d, strokeWidth, isConnected };
      })
      .filter(Boolean);
  }, [edges, positions, containerRect, hoveredAgentId]);

  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" opacity="0.6" />
        </marker>
      </defs>

      {paths.map((path) => {
        if (!path) return null;
        return (
          <motion.path
            key={`${path.fromAgentId}→${path.toAgentId}`}
            d={path.d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={path.strokeWidth}
            strokeDasharray="6 4"
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: path.isConnected ? 0.5 : 0.08,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="pointer-events-auto cursor-pointer"
            onMouseEnter={(e) => {
              setTooltipEdge(path);
              setTooltipPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setTooltipEdge(null)}
            style={{
              animation: path.isConnected ? "dash 2s linear infinite" : "none",
            }}
          />
        );
      })}

      {/* Inline CSS for dash animation */}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      {/* Tooltip as foreignObject */}
      {tooltipEdge && (
        <foreignObject
          x={tooltipPos.x - (containerRect?.left ?? 0) - 100}
          y={tooltipPos.y - (containerRect?.top ?? 0) - 50}
          width="200"
          height="40"
          className="pointer-events-none"
        >
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs shadow-lg">
            <span className="font-medium text-[var(--text-primary)]">
              {tooltipEdge.fromAgentId} → {tooltipEdge.toAgentId}
            </span>
            <span className="text-[var(--text-secondary)] ml-2">
              {tooltipEdge.count} handoff{tooltipEdge.count > 1 ? "s" : ""} · {formatTimeAgo(tooltipEdge.lastTimestamp)}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
```

**Step 2: Verify no TS errors**

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/org/HandoffOverlay.tsx
git commit -m "feat(org): add HandoffOverlay SVG component with animated arrows"
```

---

### Task 5: AgentDetailPanel Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/org/AgentDetailPanel.tsx`

**Context:** Slide-in panel from the right showing agent stats, recent executions, handoff connections, and config. Uses `api.orgChart.getAgentDetail` query.

**Step 1: Create AgentDetailPanel**

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Thermometer,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentDetailPanelProps {
  agentId: Id<"agents">;
  onClose: () => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Active" },
  paused: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Paused" },
  error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Error" },
  maintenance: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "Maintenance" },
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function AgentDetailPanel({ agentId, onClose }: AgentDetailPanelProps) {
  const data = useQuery(api.orgChart.getAgentDetail, { agentId });

  if (!data) {
    return (
      <div className="w-80 flex-shrink-0 sticky top-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[var(--surface-1)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { agent, stats, recentExecutions, handoffsFrom, handoffsTo } = data;
  const status = statusColors[agent.status] ?? statusColors.active;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-80 flex-shrink-0 sticky top-6"
    >
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate flex-1">
              {agent.name}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--surface-1)] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs text-[var(--text-secondary)]">{agent.agentId}</code>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", status.bg, status.text)}>
              {status.label}
            </span>
          </div>
          {agent.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-3">
              {agent.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
          <div className="bg-[var(--card-bg)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{stats.totalTasks}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Tasks</p>
          </div>
          <div className="bg-[var(--card-bg)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{stats.successRate}%</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Éxito</p>
          </div>
          <div className="bg-[var(--card-bg)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{formatTokens(stats.totalTokens)}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Tokens</p>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Recent Executions */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Últimas Ejecuciones
            </h4>
            {recentExecutions.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">Sin ejecuciones</p>
            ) : (
              <div className="space-y-1.5">
                {recentExecutions.map((exec) => (
                  <div key={exec._id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                    {exec.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] truncate">
                        {formatTokens(exec.tokensUsed?.total ?? 0)} tokens · {Math.round(exec.duration / 1000)}s
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
                      {formatTimeAgo(exec.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handoffs */}
          {(handoffsFrom.length > 0 || handoffsTo.length > 0) && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Handoffs
              </h4>
              <div className="space-y-1.5">
                {handoffsFrom.map((h) => (
                  <div key={`from-${h.name}`} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                    <span className="text-xs text-[var(--text-primary)] truncate flex-1">{h.name}</span>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">×{h.count}</span>
                  </div>
                ))}
                {handoffsTo.map((h) => (
                  <div key={`to-${h.name}`} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-[var(--text-primary)] truncate flex-1">{h.name}</span>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">×{h.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Configuración
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-primary)]">{agent.model ?? "claude-sonnet-4"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                <Thermometer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-primary)]">Temp: {agent.temperature ?? 0.7}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-0)]">
                <Zap className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-primary)] truncate">
                  {(agent.triggers ?? []).join(", ") || "Sin triggers"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Verify no TS errors**

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/org/AgentDetailPanel.tsx
git commit -m "feat(org): add AgentDetailPanel with stats, executions, and handoffs"
```

---

### Task 6: Enhanced OrgChart — Position Tracking & Hover State

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/org/OrgChart.tsx`

**Context:** The existing OrgChart renders CMO → Directors → Specialists with expand/collapse. We need to:
1. Pass `onPositionReport` to each AgentNode
2. Track hover state for handoff highlighting
3. Forward `hoveredAgentId` and `positions` up to the parent page

**Step 1: Update OrgChart props and state**

Add new props to `OrgChartProps`:
```typescript
interface OrgChartProps {
  agents: Agent[] | undefined;
  onAgentSelect?: (agent: Agent) => void;
  selectedAgentId?: string;
  onPositionsChange?: (positions: Map<string, DOMRect>) => void;
  hoveredAgentId: string | null;
  onAgentHover?: (agentId: string | null) => void;
}
```

Add position tracking state:
```typescript
const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map());

const handlePositionReport = useCallback((agentId: string, rect: DOMRect) => {
  setPositions(prev => {
    const next = new Map(prev);
    next.set(agentId, rect);
    return next;
  });
}, []);

// Report positions to parent whenever they change
useEffect(() => {
  if (positions.size > 0) {
    onPositionsChange?.(positions);
  }
}, [positions, onPositionsChange]);
```

Pass `onPositionReport`, `onMouseEnter`, `onMouseLeave`, `isDimmed`, `isHighlighted` to each `<AgentNode>`:

```typescript
<AgentNode
  agent={cmo}
  size="lg"
  isSelected={selectedAgentId === cmo._id}
  isHighlighted={hoveredAgentId !== null && /* this agent is connected */}
  isDimmed={hoveredAgentId !== null && hoveredAgentId !== cmo.agentId && /* not connected */}
  onClick={() => onAgentSelect?.(cmo)}
  onMouseEnter={() => onAgentHover?.(cmo.agentId)}
  onMouseLeave={() => onAgentHover?.(null)}
  onPositionReport={handlePositionReport}
/>
```

Apply the same pattern to all director and specialist AgentNode renders.

**Step 2: Verify no TS errors, existing chart still renders**

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/org/OrgChart.tsx
git commit -m "feat(org): add position tracking and hover state to OrgChart"
```

---

### Task 7: Org Page — Full Assembly

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/app/(dashboard)/org/page.tsx`

**Context:** This is the main page that assembles: header, department filters, OrgChart, HandoffOverlay, AgentDetailPanel.

**Step 1: Create the org page**

```typescript
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { AnimatePresence } from "framer-motion";
import { GitBranch, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgChart } from "@/components/org/OrgChart";
import { HandoffOverlay } from "@/components/org/HandoffOverlay";
import { AgentDetailPanel } from "@/components/org/AgentDetailPanel";

const DEPARTMENTS = [
  { value: "", label: "Todos" },
  { value: "leadership", label: "Leadership" },
  { value: "content", label: "Content" },
  { value: "social", label: "Social Media" },
  { value: "demandgen", label: "Demand Gen" },
  { value: "seo", label: "SEO" },
  { value: "brand", label: "Brand" },
  { value: "ops", label: "Marketing Ops" },
];

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error", label: "Error" },
];

export default function OrgPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // Queries
  const agents = useQuery(api.functions.listAgents, {
    ...(deptFilter ? { department: deptFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const handoffGraph = useQuery(api.orgChart.getHandoffGraph);

  // Update container rect for HandoffOverlay
  const updateContainerRect = useCallback(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  const handlePositionsChange = useCallback((newPositions: Map<string, DOMRect>) => {
    setPositions(newPositions);
    updateContainerRect();
  }, [updateContainerRect]);

  const handleAgentSelect = useCallback((agent: { _id: string }) => {
    setSelectedAgentId(agent._id as Id<"agents">);
  }, []);

  // Stats
  const agentCount = agents?.length ?? 0;
  const deptCount = agents ? new Set(agents.map((a) => a.department)).size : 0;
  const activeCount = agents?.filter((a) => a.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <GitBranch className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organigrama</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {agentCount} agentes · {deptCount} departamentos · {activeCount} activos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.value}
              onClick={() => setDeptFilter(dept.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                deptFilter === dept.value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              )}
            >
              {dept.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                statusFilter === s.value
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Chart + Overlay */}
        <div ref={containerRef} className="flex-1 min-w-0 relative">
          <OrgChart
            agents={agents as any}
            onAgentSelect={handleAgentSelect}
            selectedAgentId={selectedAgentId ?? undefined}
            onPositionsChange={handlePositionsChange}
            hoveredAgentId={hoveredAgentId}
            onAgentHover={setHoveredAgentId}
          />
          {handoffGraph && handoffGraph.length > 0 && (
            <HandoffOverlay
              edges={handoffGraph}
              positions={positions}
              containerRect={containerRect}
              hoveredAgentId={hoveredAgentId}
            />
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedAgentId && (
            <AgentDetailPanel
              key={selectedAgentId}
              agentId={selectedAgentId}
              onClose={() => setSelectedAgentId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Navigate to http://localhost:3001/org and verify:**
- Header shows with agent stats
- Department filter tabs work
- Org chart renders with all agents
- Clicking an agent opens detail panel
- Handoff arrows appear (if handoff data exists)

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/(dashboard)/org/page.tsx
git commit -m "feat(org): add interactive org chart page with filters and detail panel"
```

---

### Task 8: Seed Demo Handoffs

**Files:**
- Modify: `convex/seed.ts`

**Context:** The org chart handoff arrows need data. Add a `seedHandoffs` mutation that creates realistic handoff records between agents so the visualization has edges to show.

**Step 1: Add seedHandoffs to seed.ts**

Find the end of the file and add:

```typescript
export const seedHandoffs = mutation({
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a.agentId, a._id]));

    // Define realistic handoff patterns
    const handoffPatterns = [
      { from: "seo-001", to: "content-director", reason: "Keyword brief listo para asignación" },
      { from: "content-director", to: "content-002", reason: "Brief asignado para redacción" },
      { from: "content-002", to: "seo-001", reason: "Artículo listo para revisión SEO" },
      { from: "content-director", to: "content-005", reason: "Contenido aprobado para publicación" },
      { from: "content-005", to: "social-manager", reason: "Contenido publicado, listo para repurpose" },
      { from: "social-manager", to: "social-001", reason: "Crear post LinkedIn del artículo" },
      { from: "social-manager", to: "social-002", reason: "Crear thread Twitter del artículo" },
      { from: "demandgen-director", to: "demandgen-001", reason: "Campaña aprobada para lanzamiento" },
      { from: "demandgen-001", to: "demandgen-005", reason: "Campaña activa, monitorear performance" },
      { from: "brand-director", to: "brand-001", reason: "Crear creativos para campaña" },
      { from: "brand-001", to: "demandgen-002", reason: "Creativos listos para Meta Ads" },
      { from: "ops-director", to: "ops-002", reason: "Newsletter semanal programada" },
      { from: "cmo-001", to: "content-director", reason: "Nueva directriz de contenido Q1" },
      { from: "cmo-001", to: "demandgen-director", reason: "Aumentar budget paid media" },
      { from: "cmo-001", to: "seo-manager", reason: "Priorizar keywords de alto impacto" },
    ];

    // Create a dummy task for handoffs
    let dummyTaskId = (await ctx.db.query("tasks").first())?._id;
    if (!dummyTaskId) {
      dummyTaskId = await ctx.db.insert("tasks", {
        taskId: "seed-handoff-task",
        agentId: agents[0]?._id ?? ("" as any),
        type: "general",
        status: "completed",
        priority: "medium",
        input: { description: "Seed task for handoffs" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    let count = 0;
    for (const pattern of handoffPatterns) {
      const fromId = agentMap.get(pattern.from);
      const toId = agentMap.get(pattern.to);
      if (!fromId || !toId) continue;

      // Create 1-4 handoffs per pattern for variety
      const numHandoffs = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numHandoffs; i++) {
        await ctx.db.insert("handoffs", {
          fromAgent: fromId,
          toAgent: toId,
          taskId: dummyTaskId,
          reason: pattern.reason,
          payload: {},
          status: "completed",
          completedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // last 7 days
          timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        });
        count++;
      }
    }

    return { inserted: count };
  },
});
```

**Step 2: Run the seed**

```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd
npx convex run seed:seedHandoffs
```

Expected: `{ inserted: ~30-60 }` handoffs created.

**Step 3: Verify in browser**

Navigate to http://localhost:3001/org — handoff arrows should now appear between agents.

**Step 4: Commit**

```bash
git add convex/seed.ts
git commit -m "feat(org): add seedHandoffs for demo handoff data"
```
