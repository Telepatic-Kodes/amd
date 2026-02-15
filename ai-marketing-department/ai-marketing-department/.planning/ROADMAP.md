# Roadmap: AMD UX Redesign

## Overview

Transform the AMD dashboard from a cluttered, flat-navigation SaaS app into a Linear/Notion-caliber keyboard-first experience. The redesign progresses through 5 phases: first establishing a consistent design token foundation across all 204 components, then building the persistent layout shell and hierarchical navigation, adding a command palette and keyboard system, migrating all pages to the new design system, and finally layering on premium differentiators like live agent indicators and micro-interactions.

## Phases

- [ ] **Phase 0: Token Migration & Audit** - Migrate all components from hardcoded colors to semantic CSS variables
- [ ] **Phase 1: Layout Shell & Navigation** - Persistent app shell, hierarchical sidebar, responsive breakpoints
- [ ] **Phase 2: Command Palette & Keyboard System** - Cmd+K palette, keyboard shortcuts, global search
- [ ] **Phase 3: Page Redesign & Component Migration** - All pages redesigned with consistent patterns, loading states, empty states
- [ ] **Phase 4: Premium Differentiators** - Micro-interactions, live indicators, bulk actions, progressive loading

## Phase Details

### Phase 0: Token Migration & Audit
**Goal**: Every component in the codebase uses semantic CSS variables instead of hardcoded Tailwind colors. Dark mode and multi-brand theming work consistently everywhere.
**Depends on**: Nothing (first phase)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05
**Success Criteria** (what must be TRUE):
  1. Zero hardcoded color values (bg-white, text-stone-*, border-gray-*) in any dashboard component
  2. Dark mode toggle produces consistent appearance across all pages with no color artifacts
  3. Three-tier token system documented: primitive → semantic → component
  4. Transition timing tokens (--transition-fast/base/slow) defined and used consistently
  5. Brand theme override changes semantic tokens only, all components respond automatically
**Plans:** 7 plans in 3 waves

Plans:
- [ ] 00-01-PLAN.md — Establish three-tier token architecture in globals.css + transition/easing tokens + multi-brand scaffold
- [ ] 00-02-PLAN.md — Migrate brand components (20 files, ~475 instances) and settings (3 files, ~167 instances)
- [ ] 00-03-PLAN.md — Migrate content components (24 files, ~465 instances) and content-pipeline (8 files, ~82 instances)
- [ ] 00-04-PLAN.md — Migrate dashboard components (24 files, ~157 instances) and agents (5 files, ~54 instances)
- [ ] 00-05-PLAN.md — Migrate UI primitives (14 files), charts (7 files), layout (7 files), analytics (4 files)
- [ ] 00-06-PLAN.md — Migrate all remaining components (onboarding, email, reports, social, team, feeds, monitoring, landing, etc.)
- [ ] 00-07-PLAN.md — Remove redundant dark mode overrides from globals.css + final comprehensive audit

### Phase 1: Layout Shell & Navigation
**Goal**: Persistent app shell with hierarchical sidebar navigation, responsive breakpoints, and smooth page transitions. Users always know where they are and can navigate efficiently.
**Depends on**: Phase 0
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, SHELL-01, SHELL-02, SHELL-03, SHELL-04
**Success Criteria** (what must be TRUE):
  1. Sidebar shows 4 logical groups (Overview, Content, Operations, Settings) instead of flat list
  2. Sidebar collapses to icon-only mode and remembers preference across sessions
  3. Breadcrumbs show current path on every page
  4. Mobile users see hamburger menu that opens sidebar overlay
  5. Page navigation does not re-render sidebar or header (state preserved)
**Plans**: TBD

Plans:
- [ ] 01-01: Implement persistent layout shell with nested Next.js layouts
- [ ] 01-02: Redesign sidebar with hierarchical navigation and collapse
- [ ] 01-03: Add breadcrumbs, mobile responsive nav, brand switcher

### Phase 2: Command Palette & Keyboard System
**Goal**: Cmd+K command palette with navigation, search, and actions. Core keyboard shortcuts for power users. The "halo feature" that signals premium quality.
**Depends on**: Phase 1
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06, KBD-01, KBD-02, KBD-03, KBD-04
**Success Criteria** (what must be TRUE):
  1. Cmd+K opens command palette from any page
  2. User can navigate to any page, search brands/agents/content, and trigger actions from palette
  3. Pressing ? shows keyboard shortcuts help modal
  4. Shortcuts do not fire when typing in form inputs
  5. Command palette results adapt to current page context
**Plans**: TBD

Plans:
- [ ] 02-01: Implement command palette with cmdk library and action registry
- [ ] 02-02: Add keyboard shortcuts system with react-hotkeys-hook
- [ ] 02-03: Integrate contextual search and page-aware palette results

### Phase 3: Page Redesign & Component Migration
**Goal**: All dashboard pages redesigned with consistent component patterns, skeleton loading, empty states, toast notifications, and improved visual hierarchy. Every page tells a clear story.
**Depends on**: Phase 2
**Requirements**: PAGE-01 through PAGE-10, UX-01, UX-02, UX-03, UX-04, UX-07
**Success Criteria** (what must be TRUE):
  1. All pages show skeleton loading states while data loads (no spinners)
  2. All pages show context-specific empty states with CTAs when no data exists
  3. Toast notifications confirm all user actions (create, edit, delete, publish)
  4. Dashboard home page primary metrics visible within 5 seconds of page load
  5. Content page supports multi-select with bulk action toolbar
  6. Inline editing works for agent names and content titles
  7. Hover states reveal contextual actions (edit, delete) on all card/row components
**Plans**: TBD

Plans:
- [ ] 03-01: Dashboard home page redesign
- [ ] 03-02: Agents page redesign with department grouping
- [ ] 03-03: Content page redesign with bulk actions and workflow clarity
- [ ] 03-04: Analytics page redesign with data hierarchy
- [ ] 03-05: Settings and Brand pages redesign
- [ ] 03-06: Global components (toasts, empty states, skeleton patterns)

### Phase 4: Premium Differentiators
**Goal**: Layer premium interactions that make AMD feel "smart" — live agent status, micro-interactions, progressive loading, and contextual intelligence.
**Depends on**: Phase 3
**Requirements**: UX-05, UX-06, UX-08, UX-09
**Success Criteria** (what must be TRUE):
  1. Agent status indicators show live running/idle/error state with pulse animation
  2. 5-10 strategic micro-interactions enhance state changes and navigation
  3. Analytics page loads progressively (skeleton → basic metrics → full charts)
  4. Command palette shows user's recent 5 brands, agents, and content items
  5. All animations respect prefers-reduced-motion
**Plans**: TBD

Plans:
- [ ] 04-01: Live activity indicators with Convex real-time
- [ ] 04-02: Micro-interactions and animation system
- [ ] 04-03: Progressive loading and recent items integration

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Token Migration & Audit | 0/7 | Not started | - |
| 1. Layout Shell & Navigation | 0/3 | Not started | - |
| 2. Command Palette & Keyboard | 0/3 | Not started | - |
| 3. Page Redesign & Migration | 0/6 | Not started | - |
| 4. Premium Differentiators | 0/3 | Not started | - |

---
*Roadmap created: 2026-02-15*
*Last updated: 2026-02-15 after initial creation*
