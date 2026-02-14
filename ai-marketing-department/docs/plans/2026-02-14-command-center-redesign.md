# Command Center Redesign — Design Document

**Date:** 2026-02-14
**Author:** AIAIAI Consulting
**Status:** Approved

## Goal

Redesign AMD's frontend from 8+ pages to 4 focused pages. Make results, decisions, and marketing department status immediately visible. Support multi-client (agency) model via existing BrandSwitcher.

## Context

AMD currently has 8 sidebar items (Home, Marca, Estrategia, Control Center, Contenido, Pipeline, Resultados, Settings) plus hidden pages (Agents, Org, Analytics, Feeds, Campaigns). Clients need to navigate between multiple views to understand what's happening. The redesign consolidates everything into 4 clear pages.

## Architecture: 4-Page "Command Center"

### Navigation (Sidebar)

| Item | Icon | Route | Description |
|------|------|-------|-------------|
| Inicio | `Home` | `/` | Executive dashboard (KPIs + Kanban + Results + Decisions) |
| Contenido | `FileText` | `/content` | Unified pipeline + editor + calendar |
| Estrategia | `Brain` | `/strategy` | CMO Autopilot + brand profile + manual |
| Configuración | `Settings` | `/settings` | API keys, model, appearance |

Removed as separate items: Control Center (absorbed into Home Kanban), Results (absorbed into Home), Brand (moved to Strategy), Pipeline (unified with Content).

BrandSwitcher stays in sidebar header for switching between clients.

### Page 1: Home (`/`) — Executive Dashboard

Three vertical zones:

**Zone 1: Header + KPIs + Decisions**
- Header with greeting, date, action buttons (Run Agent, New Task)
- 4 KPI cards: Executions, Success Rate, Cost, Content (existing HeroMetric components)
- "Decisions Pending" card: compact actionable list
  - Content awaiting approval (count, clickable)
  - Agents with errors (count, clickable)
  - Failed executions last 24h (count, clickable)

**Zone 2: Marketing Department Kanban**
- 6 columns, one per department: Leadership, Content, Social Media, Demand Gen, SEO, Brand & Creative, Marketing Ops
- Each column shows agents as mini-cards with:
  - Agent name (truncated)
  - Status dot (green=active, amber=running, red=error, gray=paused)
  - Current task name if executing
- Column header: department name + agent count + health indicator
- Columns scroll vertically if needed

**Zone 3: Results + Activity**
- Left (2/3): 7-day trend chart + top 3 content by engagement
- Right (1/3): Recent activity feed (last 10 system actions)

### Page 2: Content (`/content`) — Unified

Tabs within single page:
- **Pipeline** — Kanban view (draft → review → approved → published)
- **List** — Table view (current content page)
- **Calendar** — Scheduled content calendar

Existing TemplatePickerModal and UploadContentForm stay.

### Page 3: Strategy (`/strategy`) — Merged with Brand

Tabs:
- **Autopilot** — CMO Engine, active strategy, execution monitor
- **Brand** — Brand profile, wizard, manual link
- **Insights** — Content pillars, funnel coverage, TAYA

### Page 4: Settings (`/settings`)

No changes needed. Stays as-is.

### Removed/Absorbed Pages

| Old Page | Where It Goes |
|----------|--------------|
| `/control-center` | Home Kanban (Zone 2) |
| `/results` | Home Results (Zone 3) |
| `/brand` | Strategy > Brand tab |
| `/content/pipeline` | Content > Pipeline tab |
| `/analytics` | Home KPIs (Zone 1) |
| `/agents` | Home Kanban (Zone 2) |
| `/org` | Removed (Kanban replaces org chart) |
| `/campaigns` | Removed (absorbed into Strategy insights) |
| `/feeds` | Removed |
| `/generated` | Removed |

## Components

### New Components
- `DepartmentKanban` — The 6-column agent status board
- `AgentMiniCard` — Compact agent card for Kanban
- `DecisionsPending` — Actionable list of items needing human attention
- `ResultsSummary` — Compact results with mini-chart + top content
- `ContentTabs` — Tab wrapper for content page (Pipeline/List/Calendar)
- `StrategyTabs` — Tab wrapper for strategy page (Autopilot/Brand/Insights)

### Reused Components
- `HeroMetric` — KPI cards (as-is)
- `ActivitySummary` — Activity feed (as-is)
- `ActivityChart` — Trend chart (as-is)
- `ContentPipeline` — Pipeline view (moved to tab)
- `MiniCalendar` — Calendar view (moved to tab)
- `StrategyDashboard` / `StrategyLauncher` — CMO engine (moved to tab)
- `BrandSwitcher` — Client switching (stays in sidebar)

## Data Flow

No backend changes needed. All Convex queries already exist:
- `listAgents` → Kanban data
- `getControlCenterStatus` → Agent department grouping
- `listContent` → Content pipeline + list
- `getAnalyticsWithDateRange` → KPIs + charts
- `getContentPerformance` → Top content
- `getBrandProfile` → Brand tab
- `getActiveStrategy` → Strategy tab

## Migration Strategy

1. Build new components alongside existing ones
2. Update sidebar navigation
3. Rebuild Home page with 3 zones
4. Add tabs to Content page
5. Add tabs to Strategy page (merge Brand)
6. Remove old page files
7. Clean up unused components
