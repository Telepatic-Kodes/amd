# Phase 12: Guided UX Layer - Research Document

**Phase Goal:** Users receive contextual guidance and recommendations throughout the system for faster onboarding and efficiency.

**Date:** 2026-02-05
**Stack:** Next.js 16 + React 19.2 + Tailwind 4 + Convex + Framer Motion

---

## Table of Contents

1. [Existing Code Audit](#1-existing-code-audit)
2. [Onboarding Library Comparison](#2-onboarding-library-comparison)
3. [Tooltip System Recommendation](#3-tooltip-system-recommendation)
4. ["Next Action" Engine Design](#4-next-action-engine-design)
5. [Progressive Disclosure Strategy](#5-progressive-disclosure-strategy)
6. [Adaptive UI Implementation](#6-adaptive-ui-implementation)
7. [Mobile Considerations](#7-mobile-considerations)
8. [State Management for Guide Progress](#8-state-management-for-guide-progress)
9. [Recommended Approach](#9-recommended-approach)
10. [NPM Packages](#10-npm-packages)

---

## 1. Existing Code Audit

### 1.1 Express Onboarding (Phase 2) - 3-Step Flow

**Location:** `app/onboarding/page.tsx` + `components/onboarding/`

**What exists:**
- 3-step wizard: Welcome (company info) -> Goals (marketing objectives) -> Feeds (content sources)
- `Stepper.tsx` - Visual step indicator with numbered circles and connecting lines
- `StepWelcome.tsx` - Company name, industry dropdown (11 industries), description textarea
- `StepGoals.tsx` - 6 marketing goal cards (lead gen, brand, content, social, SEO, paid) with toggle selection
- `StepChannels.tsx` - 6 channel toggles (LinkedIn, Twitter, Blog, Email, Google Ads, Meta Ads) -- **currently unused** (steps were reduced from 5 to 3)
- `StepAgents.tsx` - Department selection (7 departments) -- **currently unused** (auto-selects all)
- `StepFeeds.tsx` - Industry-specific feed template cards + manual URL input
- `StepLaunch.tsx` - Summary review with launch button (rendered as overlay on final step)

**State flow:**
- Uses `useState` for all form data (companyName, industry, goals, channels, feeds, departments)
- Animated step transitions via Framer Motion `AnimatePresence`
- Progress bar (segmented bar, not percentage)
- Submits to `api.onboarding.complete` Convex mutation
- Redirects to `/` on completion

**Convex schema:**
```typescript
onboarding: defineTable({
  companyName: v.string(),
  industry: v.string(),
  description: v.string(),
  goals: v.array(v.string()),
  channels: v.array(v.string()),
  feeds: v.array(v.string()),
  departments: v.array(v.string()),
  completedAt: v.number(),
})
```

**Reusability assessment:**
- Stepper component pattern is solid but labels are hardcoded (English: "Welcome", "Goals", etc.)
- StepGoals and StepFeeds are well-built with toggle selection patterns
- StepChannels and StepAgents are unused but functional
- **Key gap:** No completion tracking per-user (single record, no user association)
- **Key gap:** No "resume from where you left off" capability
- **Key gap:** Mixed language (Spanish and English labels)

### 1.2 Product Tour (Phase 6) - 7-Step Interactive Tour

**Location:** `components/ui/ProductTour.tsx` + `lib/tour-utils.ts` + `components/layout/LayoutShell.tsx`

**What exists:**
- Custom-built tour system (no external library)
- 7 tour steps targeting `[data-tour="..."]` CSS selectors
- Spotlight effect using `box-shadow: 0 0 0 9999px` technique
- Tooltip positioning with `calculateTooltipPosition()` utility
- Framer Motion animations for backdrop, spotlight, and tooltip
- Spanish labels ("Paso 1 de 7", "Siguiente", "Anterior", "Saltar tour", "Finalizar")
- 44x44px minimum touch targets for mobile
- localStorage persistence (`amd-product-tour` key)

**State management (`lib/tour-utils.ts`):**
```typescript
interface TourState {
  completed: boolean;
  skipped: boolean;
  lastShown?: string; // ISO timestamp
}
```
- `getTourState()` / `setTourCompleted()` / `setTourSkipped()` / `resetTour()`
- `shouldShowTour()` - returns true if not completed and not skipped
- `findTourElement(selector)` - querySelector wrapper
- `calculateTooltipPosition(element, placement)` - calculates absolute positioning

**Integration:**
- Rendered in `LayoutShell.tsx` with conditional check
- Not shown during `/onboarding` path
- No re-trigger mechanism in the UI yet (documented as "future enhancement")

**Reusability assessment:**
- **Spotlight system is excellent** - can be reused for contextual tooltips (GX-03)
- **Tooltip positioning logic** - solid foundation for any positioned popover
- **localStorage pattern** - extend for multi-guide tracking
- **Key gap:** Tour is hardcoded to 7 specific steps; not configurable
- **Key gap:** No way to trigger individual step highlights (only sequential tour)
- **Key gap:** Position calculation doesn't handle viewport overflow/clipping
- **Key gap:** No scroll-into-view when target is off-screen

### 1.3 Currently Installed Libraries

From `package.json`:
- `framer-motion` ^12.29.2 - Already used for animations (tour, onboarding, modals)
- `lucide-react` ^0.563.0 - Icon library
- `clsx` ^2.1.1 + `tailwind-merge` ^3.4.0 - Utility classes
- `convex` ^1.31.6 - Backend/DB
- `date-fns` ^4.1.0 - Date utilities
- `recharts` ^3.7.0 - Charts
- **No tooltip library installed** (custom tooltips only)
- **No tour library installed** (custom ProductTour)

---

## 2. Onboarding Library Comparison

### 2.1 Comparison Matrix

| Feature | Custom (Current) | driver.js | NextStepJS | react-joyride | shepherd.js | OnboardJS |
|---------|-----------------|-----------|------------|---------------|-------------|-----------|
| **Bundle size (gzipped)** | 0 KB (built-in) | ~5 KB | ~3 KB + motion | ~12 KB | ~15 KB | ~8 KB |
| **React 19 compat** | Yes | Yes (vanilla) | Yes (native) | **NO** (broken) | Partial (use vanilla) | Yes |
| **Next.js 16 App Router** | Yes | Manual setup | **Native adapter** | Issues with SSR | Manual setup | Yes |
| **Spotlight/highlight** | Yes (custom) | Yes (built-in) | Yes (built-in) | Yes | Yes | No (headless) |
| **Tooltip positioning** | Custom calc | Auto-positioning | Auto-positioning | Floater lib | Popper.js | None (headless) |
| **Multi-page tours** | No | No | **Yes (native)** | No | No | Yes (state machine) |
| **Step conditions** | No | No | No | No | No | **Yes (conditional)** |
| **Mobile support** | Basic (44px targets) | Good | Good | Good | Good | N/A (headless) |
| **Customization** | Full control | CSS theming | **Custom card components** | Beacon/Tooltip components | Step templates | **Full control** |
| **Animation** | Framer Motion | CSS transitions | Motion (Framer) | CSS | CSS | N/A |
| **Scroll into view** | No | Yes | Yes | Yes | Yes | N/A |
| **Keyboard nav** | No | Yes | Yes | Yes | Yes | N/A |
| **TypeScript** | Yes | Yes | Yes | Yes | Partial | Yes |
| **Analytics hooks** | No | Callbacks | **onStepChange callback** | Callbacks | Callbacks | **Built-in analytics** |
| **Active maintenance** | N/A | Yes (3mo ago) | **Yes (4 days ago)** | **Stale (9+ months)** | Moderate | Yes |
| **Weekly npm downloads** | N/A | ~340K | ~5K | ~200K | ~50K | ~1K |

### 2.2 Detailed Analysis

#### react-joyride - ELIMINATED
- **React 19 incompatible** - Uses deprecated `ReactDOM.unmountComponentAtNode` and `unstable_renderSubtreeIntoContainer`
- Issue #1122 on GitHub confirms this
- Unstable "next" version exists but unreliable
- 9+ months without updates
- **Verdict: Do not use**

#### shepherd.js - NOT RECOMMENDED
- React wrapper (`react-shepherd`) incompatible with React 19
- Can use vanilla `shepherd.js` directly, but loses React integration benefits
- Heavier bundle (~15 KB gzipped)
- Would require manual DOM manipulation in React
- **Verdict: Possible but awkward in React 19 ecosystem**

#### driver.js - VIABLE OPTION
- ~5 KB gzipped, framework-agnostic
- Works with React 19 since it manipulates DOM directly
- Good spotlight/highlight effects
- Well-documented API
- No native React hooks integration (manual lifecycle management needed)
- **Verdict: Good lightweight choice if vanilla JS approach is acceptable**

#### NextStepJS - STRONG CANDIDATE
- Purpose-built for Next.js App Router
- Uses `motion` (Framer Motion) for animations (already in our deps)
- Custom card components for full control over tooltip UI
- Multi-page tour support (can span across routes)
- Framework-agnostic adapter system (v2.0+)
- Very actively maintained (latest: 4 days ago)
- Small bundle, only dependency is `motion`
- **Verdict: Best fit for our Next.js 16 + React 19 stack**

#### OnboardJS - COMPLEMENTARY OPTION
- Headless approach - provides state machine, not UI
- Built-in analytics (PostHog, Supabase integration)
- Conditional step logic
- Advanced step types (CHECKLIST, MULTIPLE_CHOICE)
- Good for onboarding flow orchestration
- No visual components (must build UI yourself)
- **Verdict: Good for flow logic + analytics, not for visual tours**

### 2.3 Recommendation: Hybrid Custom + NextStepJS

**Primary approach:** Evolve the existing custom system for contextual tooltips (GX-03) and simple highlights, while adding NextStepJS for the enhanced onboarding wizard (GX-01) and complex multi-page tours.

**Rationale:**
1. We already have a working custom tour system with spotlight - upgrading it is lower risk than replacing
2. NextStepJS gives us multi-page tours and auto-positioning that our custom system lacks
3. Both use Framer Motion - consistent animation language
4. No new heavy dependencies (NextStepJS's only dep is `motion`, already installed)
5. Custom system gives full control for Spanish UI and adaptive behavior (GX-04)

---

## 3. Tooltip System Recommendation

### 3.1 Options Evaluated

| Option | Pros | Cons |
|--------|------|------|
| **Radix UI Tooltip** | Accessible, React 19 compatible, composable | Adds Radix dependency, basic positioning |
| **Floating UI** | Powerful positioning, middleware system | Lower-level, more code to write |
| **Custom (extend tour-utils)** | No new deps, full control, matches existing | More development effort |
| **NextStepJS custom cards** | Integrated with tour system | Only works within tour context |

### 3.2 Recommendation: Custom Contextual Tooltip Component

Build a lightweight `<ContextualHelp>` component that:
- Reuses `calculateTooltipPosition()` from existing `tour-utils.ts`
- Shows inline `(?)` or `info` icon that opens a positioned tooltip
- Supports dismissal tracking (per-tooltip key in localStorage or Convex)
- Works independently from the tour system

**Why not Radix/Floating UI:**
- Adding Radix just for tooltips when we have no other Radix dependencies is overhead
- Floating UI is powerful but overkill for simple contextual help
- Our custom positioning logic is already written and tested
- We need dismissal persistence that no tooltip library provides

**Suggested API:**
```typescript
<ContextualHelp
  id="agents-overview"          // unique key for persistence
  content="Los agentes son bots..."
  placement="bottom"
  showOnce={true}               // auto-dismiss after first view
>
  <span>Agentes Activos</span>
</ContextualHelp>
```

### 3.3 Tooltip Placement Strategy

For the AMD dashboard, contextual tooltips should appear at these locations:

| Location | Tooltip Content | Trigger |
|----------|----------------|---------|
| Dashboard metrics cards | "Estos datos se actualizan en tiempo real" | First visit |
| Content status badges | "Los estados indican el flujo de publicacion" | Hover on (?) |
| Agent status indicators | "Verde = activo, gris = pausado, rojo = error" | Hover on (?) |
| Feed health section | "La salud indica si tus fuentes de contenido estan activas" | First visit |
| Campaign performance | "KPIs clave: CTR, CPC, ROAS" | Hover on (?) |
| Settings API keys | "Necesitas una API key de Anthropic para usar los agentes" | Always visible |

---

## 4. "Next Action" Engine Design

### 4.1 Pattern Analysis from SaaS Leaders

**Notion pattern:** Empty states with contextual CTAs ("Create your first page", "Import from...")
**Linear pattern:** Inbox-style task list with priority signals
**Asana pattern:** "My Tasks" with smart grouping (today, upcoming, later)
**Slack pattern:** "Getting Started" checklist that persists in sidebar

### 4.2 "Next Action" Rules Engine

For AMD, recommendations should be driven by a **state-based rules engine** that evaluates the current system state and returns the highest-priority next action.

**Decision tree:**

```
IF onboarding not completed
  -> "Completa tu configuracion inicial" (link to /onboarding)

ELSE IF no content created
  -> "Crea tu primer contenido" (link to /content with CTA)

ELSE IF content in draft > 3
  -> "Tienes {n} borradores pendientes de revision" (link to /content?status=draft)

ELSE IF no campaigns active
  -> "Crea tu primera campana de marketing" (link to /campaigns)

ELSE IF feeds unhealthy > 0
  -> "Verifica {n} feeds con problemas" (link to /feeds/health)

ELSE IF agents in error > 0
  -> "{n} agentes necesitan atencion" (link to /agents?status=error)

ELSE IF content in review > 0
  -> "Aprueba {n} contenidos en revision" (link to /content?status=review)

ELSE IF last content created > 7 days ago
  -> "Han pasado {n} dias sin nuevo contenido" (link to /content)

ELSE
  -> "Todo al dia! Revisa tus analytics" (link to /analytics)
```

### 4.3 Implementation Architecture

```
lib/next-action.ts
  ├── interface NextAction { id, title, description, href, icon, priority }
  ├── function getNextAction(state: DashboardState): NextAction
  └── RULES: NextActionRule[] (ordered by priority)

components/dashboard/NextActionCard.tsx
  ├── Fetches dashboard stats from Convex queries
  ├── Computes next action via getNextAction()
  ├── Renders prominent card with action CTA
  └── Tracks dismissals (optional "dismiss for today")
```

**Data sources needed (all exist in Convex):**
- `api.functions.listContent` - content counts by status
- `api.functions.listCampaigns` - active campaign count
- `api.functions.listAgents` - agent error states
- `api.feeds.listFeeds` - feed health status
- `api.onboarding` - onboarding completion status

### 4.4 UI Pattern

The "Next Action" card should:
- Appear at the top of the dashboard, above metrics
- Use a distinct visual treatment (gradient border, icon, clear CTA button)
- Be dismissible (X button, persists dismissal in localStorage for 24h)
- Show only the single highest-priority action (no list)
- Include a subtle "Why am I seeing this?" tooltip
- Animate in with Framer Motion slide-down

**Example rendering:**
```
+----------------------------------------------------------+
|  [Rocket icon]                                     [X]   |
|  Siguiente paso recomendado                              |
|  "Crea tu primer contenido de marketing"                 |
|  Tus 37 agentes estan listos. Empieza creando un post.   |
|                                                          |
|  [Crear Contenido ->]                                    |
+----------------------------------------------------------+
```

---

## 5. Progressive Disclosure Strategy

### 5.1 Three-Tier Feature Revelation

**Tier 1 - Immediate (Day 1):**
- Dashboard overview (metrics, next action)
- Content creation (basic: title, body, publish)
- View agents list
- Feed health overview

**Tier 2 - Discovered (Day 2-7):**
- Content workflow (draft -> review -> publish)
- Campaign creation and management
- Analytics deep-dive
- Agent configuration

**Tier 3 - Advanced (Week 2+):**
- Control center operations
- Org chart / department management
- Custom feed configuration
- API settings / integrations

### 5.2 Implementation Pattern

Instead of hiding features entirely (which confuses users), use:

1. **Emphasis reduction:** Show all navigation items but visually de-emphasize Tier 2/3
2. **Contextual callouts:** When user first visits a Tier 2/3 page, show a brief explanation
3. **Setup checklist:** Track which features have been used, nudge toward unused ones
4. **"Learn more" links:** Inline expandable explanations for complex features

### 5.3 Feature Discovery Tracking

Track per-feature "first interaction" in Convex or localStorage:

```typescript
interface FeatureDiscovery {
  featureId: string;      // e.g., "content-create", "campaign-view"
  firstSeen: number;      // timestamp
  interactionCount: number;
  lastInteraction: number;
}
```

---

## 6. Adaptive UI Implementation

### 6.1 GX-04: Adaptive Wizard ("Quick Mode" after 3 Completions)

**Core concept:** After a user has completed the onboarding wizard 3 times (e.g., for different projects or after resetting), offer a "quick mode" that skips explanatory text and reduces steps.

**Detection mechanism:**
```typescript
interface OnboardingHistory {
  completionCount: number;     // incremented each time onboarding completes
  lastCompletedAt: number;     // timestamp
  averageDuration: number;     // ms, tracks how fast user completes
  quickModeEnabled: boolean;   // user preference
}
```

**Quick mode changes:**
- Skip StepWelcome explanatory text, show only form fields
- Auto-fill industry from last completion
- Combine Goals + Feeds into a single step (2 steps total instead of 3)
- Show "Express Setup" badge
- Reduce animation durations (150ms instead of 300ms)

**Implementation approach:**
1. Store `onboardingHistory` in localStorage (simple) or Convex `userPreferences` table (persistent)
2. After 3rd completion, show banner: "Hemos notado que ya conoces el proceso. Quieres activar el modo express?"
3. User can toggle quick mode on/off in settings
4. Quick mode is per-user, not per-session

### 6.2 Broader Adaptive Patterns

**Usage-based UI adaptation:**
- Track page visit frequency per section
- After 10+ visits to Content page, hide the "how content works" tooltip permanently
- After user has published 5+ pieces, remove "next step: publish content" from recommendations
- Surface analytics prominently after user has enough data (>7 days of content)

**Expertise detection signals:**
| Signal | Weight | Meaning |
|--------|--------|---------|
| Onboarding speed < 2 min | High | Power user, skip tutorials |
| > 50 content items created | High | Active creator, show advanced features |
| Uses keyboard shortcuts | Medium | Technical user |
| Visits settings > 3 times | Medium | Configuration-savvy |
| Never uses help tooltips | Low | Either expert or ignoring help |
| Session duration > 30 min | Low | Engaged user |

---

## 7. Mobile Considerations

### 7.1 Touch-Friendly Tooltips

- Minimum 44x44px touch targets (already enforced in ProductTour)
- Tooltips should appear as bottom sheets on mobile (< 640px) instead of positioned popovers
- Swipe-to-dismiss on tooltip cards
- No hover-triggered tooltips on mobile (use tap-to-open)

### 7.2 Responsive Wizard

- Steps should be full-width on mobile
- Navigation buttons should be sticky at bottom (current implementation does this)
- Progress bar should remain visible (current segmented bar works well)
- Keyboard should not overlap form fields (scroll into view on focus)

### 7.3 Bottom Sheet Pattern for Mobile Help

On mobile viewports, contextual help should use a bottom sheet pattern:
```
+----------------------------+
|   Dashboard content        |
|   (dimmed backdrop)        |
|                            |
+============================+
| [---]  (drag handle)      |
|                            |
| Metricas Clave             |
| Aqui ves las 3 metricas   |
| principales...             |
|                            |
| [Entendido]               |
+----------------------------+
```

This is more natural on mobile than floating tooltips and avoids positioning issues.

### 7.4 Tour on Mobile

- Reduce tour to 5 steps on mobile (skip sidebar-specific steps since mobile uses bottom nav)
- Use full-width tooltip cards instead of positioned ones
- Spotlight should cover more area (less precise targeting on small screens)
- Add swipe gestures for next/previous

---

## 8. State Management for Guide Progress

### 8.1 Storage Strategy

Given the current AMD architecture (Convex backend, no user auth system visible in schema), we need a dual-layer approach:

**Layer 1: localStorage (client-side, immediate)**
- Tour completion states (already implemented)
- Tooltip dismissals
- Quick mode preference
- Feature discovery timestamps
- "Don't show again" preferences

**Layer 2: Convex table (server-side, persistent)**
- Onboarding completion count
- Setup progress percentage
- Feature usage metrics (for "next action" engine)
- User expertise score

### 8.2 Proposed Convex Schema Extension

```typescript
// New table in schema.ts
userGuidance: defineTable({
  // Onboarding tracking
  onboardingCompletions: v.number(),
  quickModeEnabled: v.boolean(),

  // Setup progress (0-100)
  setupProgress: v.number(),
  setupSteps: v.object({
    companyConfigured: v.boolean(),
    goalsSet: v.boolean(),
    feedsConfigured: v.boolean(),
    firstContentCreated: v.boolean(),
    firstCampaignCreated: v.boolean(),
    analyticsViewed: v.boolean(),
    settingsReviewed: v.boolean(),
  }),

  // Feature discovery
  featuresDiscovered: v.array(v.object({
    featureId: v.string(),
    firstSeen: v.number(),
    interactionCount: v.number(),
  })),

  // Tour states (mirrors localStorage but persistent)
  tourCompleted: v.boolean(),
  tourSkippedAt: v.optional(v.number()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
}),
```

### 8.3 GX-05: Setup Progress Bar

**Calculation:**
```
Progress = (completedSteps / totalSteps) * 100

Steps:
1. Company configured (onboarding complete) - 15%
2. Goals set - 15%
3. Feeds configured (at least 1 feed) - 15%
4. First content created - 15%
5. First campaign created - 15%
6. Analytics viewed - 10%
7. Settings reviewed - 15%
```

**UI placement:** Sidebar bottom or dashboard header, collapsible after 100%

**Visual:**
```
+----------------------------------+
| Progreso de Configuracion   85%  |
| [========================---]    |
| Siguiente: Crea tu primera      |
|            campana               |
+----------------------------------+
```

### 8.4 localStorage Key Strategy

Consolidate all guidance state under a single key prefix:

```
amd-guidance-tour          -> TourState (existing, migrate)
amd-guidance-tooltips      -> { [tooltipId]: { dismissed: boolean, seenAt: string } }
amd-guidance-onboarding    -> OnboardingHistory
amd-guidance-features      -> { [featureId]: FeatureDiscovery }
amd-guidance-preferences   -> { quickMode: boolean, reducedMotion: boolean }
```

---

## 9. Recommended Approach

### 9.1 Implementation Plan Summary

| Requirement | Approach | New Deps | Effort |
|-------------|----------|----------|--------|
| **GX-01: Onboarding wizard** | Evolve existing 3-step flow, add skip/resume, improve UX | None | Medium |
| **GX-02: Next action** | Custom rules engine + `NextActionCard` component | None | Medium |
| **GX-03: Contextual tooltips** | Custom `<ContextualHelp>` component extending tour-utils | None | Low-Medium |
| **GX-04: Adaptive wizard** | localStorage counter + quick mode toggle | None | Low |
| **GX-05: Setup progress** | Convex `userGuidance` table + `SetupProgress` component | None | Medium |

### 9.2 Recommended Architecture

```
lib/
  tour-utils.ts           (EXTEND - add multi-guide state management)
  next-action.ts          (NEW - rules engine for recommendations)
  guidance-state.ts       (NEW - consolidated guidance state manager)

components/
  guided-ux/
    ContextualHelp.tsx     (NEW - inline contextual tooltip)
    NextActionCard.tsx     (NEW - dashboard recommendation card)
    SetupProgress.tsx      (NEW - progress bar with steps)
    QuickModeToggle.tsx    (NEW - adaptive wizard toggle)
  onboarding/
    (existing files)       (MODIFY - add quick mode support)
  ui/
    ProductTour.tsx        (MODIFY - make configurable, add scroll-into-view)
    BottomSheet.tsx        (NEW - mobile tooltip container)

convex/
  schema.ts               (MODIFY - add userGuidance table)
  guidance.ts             (NEW - queries/mutations for guidance state)
```

### 9.3 Decision: Custom Over Library

**Final recommendation: Build custom, do not add tour/onboarding libraries.**

**Rationale:**
1. **Existing foundation is strong** - ProductTour + tour-utils cover 70% of what we need
2. **Zero new dependencies** - No bundle size increase, no React 19 compatibility risks
3. **Full control** - Spanish UI, custom animations, AMD-specific behavior
4. **NextStepJS was considered** but adds a dependency for functionality we can build on top of our existing code in roughly the same effort
5. **OnboardJS analytics** are appealing but premature - we can add PostHog/Mixpanel integration later
6. **Framer Motion already installed** provides all animation capabilities needed

**Trade-offs accepted:**
- Must implement scroll-into-view ourselves (use `Element.scrollIntoView()`)
- Must implement keyboard navigation for accessibility
- Must handle viewport overflow in tooltip positioning
- No built-in multi-page tour (but we don't need it - tour is dashboard-scoped)

### 9.4 Implementation Order

1. **Wave 1:** `guidance-state.ts` + Convex schema (foundation)
2. **Wave 2:** `NextActionCard.tsx` + rules engine (highest user value)
3. **Wave 3:** `SetupProgress.tsx` (visible progress tracking)
4. **Wave 4:** `ContextualHelp.tsx` + tooltip placements (contextual guidance)
5. **Wave 5:** Adaptive wizard / quick mode (refinement)

---

## 10. NPM Packages

### 10.1 Packages to Install

**None required.** All functionality can be built with existing dependencies:
- `framer-motion` - Animations (already installed)
- `lucide-react` - Icons (already installed)
- `convex` - State persistence (already installed)
- `clsx` + `tailwind-merge` - Styling (already installed)

### 10.2 Packages Evaluated but Not Recommended

| Package | Version | Why Not |
|---------|---------|---------|
| `react-joyride` | 2.9.x | React 19 incompatible |
| `driver.js` | 1.4.0 | Viable but vanilla JS; custom solution is more integrated |
| `nextstepjs` | 2.2.0 | Good but unnecessary given existing custom tour |
| `shepherd.js` | 14.x | React wrapper broken with React 19 |
| `onboardjs` | 1.x | Headless only; more useful for analytics later |
| `@floating-ui/react` | 0.27.x | Overkill for our tooltip needs |
| `@radix-ui/react-tooltip` | 1.2.x | Would add Radix dependency for one component |

### 10.3 Packages to Consider for Later Phases

- `posthog-js` - Analytics tracking for onboarding funnel (when analytics phase begins)
- `@floating-ui/react` - If tooltip positioning needs become more complex
- `onboardjs` - If we need structured flow analytics with conditional branching

---

## Appendix A: Key References

- [react-joyride React 19 Issue #1122](https://github.com/gilbarbara/react-joyride/issues/1122)
- [NextStepJS - Lightweight Next.js Onboarding](https://nextstepjs.com/)
- [driver.js Official Docs](https://driverjs.com/)
- [OnboardJS Documentation](https://docs.onboardjs.com/)
- [Floating UI React Docs](https://floating-ui.com/docs/react)
- [Radix UI Tooltip Primitives](https://www.radix-ui.com/primitives/docs/components/tooltip)
- [SaaS Onboarding Best Practices 2025](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples)
- [Progressive Disclosure Examples (Userpilot)](https://userpilot.com/blog/progressive-disclosure-examples/)
- [5 Best React Onboarding Libraries 2026 (OnboardJS)](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared)
- [5 Best React Product Tour Libraries 2026 (Whatfix)](https://whatfix.com/blog/react-onboarding-tour/)

## Appendix B: Existing File Inventory

| File | Lines | Reusable? | Notes |
|------|-------|-----------|-------|
| `components/ui/ProductTour.tsx` | 240 | **Yes** - Extend for configurable tours | Spotlight, tooltip positioning, Framer Motion |
| `lib/tour-utils.ts` | 229 | **Yes** - Extend for multi-guide state | localStorage patterns, position calculation |
| `components/onboarding/Stepper.tsx` | 53 | **Yes** - Parameterize step labels | Clean step indicator component |
| `components/onboarding/StepWelcome.tsx` | 83 | **Yes** - Add quick mode variant | Company info form |
| `components/onboarding/StepGoals.tsx` | 59 | **Yes** - Reuse toggle pattern | Goal selection cards |
| `components/onboarding/StepChannels.tsx` | 69 | **Unused** - Consider re-enabling | Channel toggle list |
| `components/onboarding/StepAgents.tsx` | 68 | **Unused** - Consider for advanced mode | Department selection |
| `components/onboarding/StepFeeds.tsx` | 160 | **Yes** - Reuse template pattern | Feed template cards |
| `components/onboarding/StepLaunch.tsx` | 71 | **Yes** - Summary review pattern | Config summary display |
| `app/onboarding/page.tsx` | 256 | **Modify** - Add quick mode, resume | Wizard orchestration |
| `components/layout/LayoutShell.tsx` | 44 | **Modify** - Add guidance layer | Tour integration point |
| `convex/schema.ts` | 15 | **Modify** - Add userGuidance table | Convex schema |
