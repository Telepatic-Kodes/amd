# Interactive Org Chart — Design Document

**Date:** 2026-02-15
**Status:** Approved

## Goal

Create an interactive `/org` page that visualizes the 37-agent hierarchy with animated handoff arrows and a detail panel showing per-agent metrics, executions, and handoff history.

## Approach

Enhance existing `OrgChart.tsx` + `AgentNode.tsx` components. No new dependencies — uses framer-motion + SVG.

## Architecture

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Organigrama" + stats (37 agents, 6 depts)     │
│ Filters: [Todos] [Content] [Social] ... + [Status ▾]   │
├───────────────────────────────────────────┬──────────────┤
│                                           │              │
│           Org Chart (enhanced)            │  Agent       │
│           CMO → Directors → Specialists   │  Detail      │
│           + handoff arrows SVG overlay    │  Panel       │
│                                           │  (slide-in)  │
│                                           │              │
├───────────────────────────────────────────┴──────────────┤
│ Legend: status colors + handoff arrow meaning            │
└─────────────────────────────────────────────────────────┘
```

### Handoff Visualization

- SVG curved bezier paths overlaid on org chart
- Stroke width proportional to handoff count (1-4px)
- Color matches source department
- Dash-offset animation for flow direction
- Hover on arrow: tooltip with count + last handoff time
- Hover on agent: highlight connected arrows, dim others to 10% opacity

### Agent Detail Panel

320px slide-in panel with:
1. Agent header (name, ID, status badge)
2. Description
3. Stats row (tasks completed, success rate, tokens used)
4. Last 5 executions list
5. Recent handoffs (grouped by from/to agent with count)
6. Config (model, temperature, triggers)

## Backend Queries (New)

### `getHandoffGraph()`
Returns aggregated handoff edges:
```typescript
Array<{
  fromAgentId: string;
  toAgentId: string;
  count: number;
  lastHandoffAt: number;
}>
```

### `getAgentDetail(agentId)`
Returns agent + stats + recent activity:
```typescript
{
  agent: Doc<"agents">;
  stats: { totalTasks: number; successRate: number; totalTokens: number };
  recentExecutions: Doc<"executions">[];  // last 5
  handoffsFrom: Array<{ toAgent: string; count: number }>;
  handoffsTo: Array<{ fromAgent: string; count: number }>;
}
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| OrgPage | `app/(dashboard)/org/page.tsx` | Page with header, filters, layout |
| OrgChart | `components/org/OrgChart.tsx` | Enhanced with position tracking |
| AgentNode | `components/org/AgentNode.tsx` | Already exists, minor ref addition |
| HandoffOverlay | `components/org/HandoffOverlay.tsx` | SVG arrows layer |
| AgentDetailPanel | `components/org/AgentDetailPanel.tsx` | Slide-in detail panel |

## Constraints

- No new npm dependencies
- 37 nodes max — no virtualization needed
- Positions calculated via getBoundingClientRect
- Responsive: panel hidden on mobile, full chart scrollable
