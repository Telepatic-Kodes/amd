# Campaigns Page — Design Document

**Date:** 2026-02-16
**Status:** Approved

## Goal

Create a `/campaigns` dashboard page displaying campaign KPIs, a filterable card grid, and a slide-in detail panel with budget tracking and goals-vs-actual progress.

## Approach

Frontend-only — backend queries `listCampaigns` and `getCampaign` already exist. 7 campaigns seeded. Follow existing dashboard patterns (same as `/org`, `/agents`, `/tasks`).

## Data Model (Existing)

```typescript
campaigns: {
  campaignId: string;
  name: string;
  description: string;
  type: "content" | "paid" | "email" | "social" | "integrated";
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  budget?: { total: number; spent: number; currency: string };
  goals?: { impressions?; clicks?; conversions?; revenue? };
  metrics?: { impressions; clicks; conversions; revenue; ctr; cpc; roas };
  contentIds?: Id<"content">[];
  assignedAgents?: Id<"agents">[];
  startDate: number;
  endDate?: number;
}
```

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Campañas" + stats (total, active count)        │
│ KPI Row: [Budget Total] [Gastado] [ROAS Prom] [Conv]   │
│ Filters: Type tabs + Status pills                       │
├───────────────────────────────────────────┬──────────────┤
│  Campaign Cards Grid (2-3 cols)           │  Detail      │
│  - Name, type badge, status badge         │  Panel       │
│  - Budget progress bar                    │  (slide-in)  │
│  - Key metrics (impressions, CTR, ROAS)   │  320px       │
│  - Date range                             │              │
└───────────────────────────────────────────┴──────────────┘
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| CampaignsPage | `app/(dashboard)/campaigns/page.tsx` | Page with KPIs, filters, grid, panel |
| CampaignCard | `components/campaigns/CampaignCard.tsx` | Individual campaign card |
| CampaignDetailPanel | `components/campaigns/CampaignDetailPanel.tsx` | Slide-in detail panel |
| CampaignKPIRow | `components/campaigns/CampaignKPIRow.tsx` | 4 KPI metric cards |

## Campaign Card

- Name + type badge (color-coded: blue=paid, green=content, purple=social, orange=email, indigo=integrated)
- Status dot (green=active, yellow=planning, gray=paused, blue=completed, red=cancelled)
- Budget bar: horizontal progress (spent/total) with percentage
- Metrics row: 3 compact stats — impressions (K/M format), CTR%, ROAS×
- Date range: "Jan 15 - Mar 15" or "Sin fecha fin"

## Detail Panel

320px slide-in (framer-motion, same as AgentDetailPanel):

1. Header: name, type badge, status badge, description
2. Budget: spent vs total bar, remaining, daily burn rate
3. Goals vs Actual: progress bar per goal (impressions, clicks, conversions, revenue)
4. Metrics table: all 7 metrics in grid
5. Timeline: start, end, days remaining

## Sidebar

Add "Campañas" link to sidebar under Operaciones group (after "Organigrama"), using `Target` icon from lucide-react.

## Constraints

- No new npm dependencies
- No new backend queries (listCampaigns + getCampaign sufficient)
- CSS variables for theming consistency
- Responsive: panel hidden on mobile
