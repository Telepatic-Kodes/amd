# Project Research Summary

**Project:** AMD UX Redesign
**Domain:** SaaS Dashboard Redesign (AI Marketing Automation Platform)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

AMD is a 204-component, 10+ page SaaS dashboard for orchestrating 37 AI marketing agents across 6 departments. The redesign targets a Linear/Notion-caliber keyboard-first experience built on the existing Next.js 16 + React 19 + Tailwind 4 + Convex stack. Research across stack, features, architecture, and pitfalls converges on a single recommendation: **migrate to semantic design tokens first, then layer on interaction features (command palette, keyboard shortcuts, micro-animations) page-by-page in coordinated rollouts, never in isolation.**

The stack is mature and well-chosen. No framework migration is needed. The primary additions are interaction libraries (cmdk, react-hotkeys-hook, Framer Motion, Zustand, nuqs) totaling roughly 66kb. shadcn/ui remains the component foundation. The architecture should adopt feature-based component organization (replacing the current flat structure), nested Next.js layouts for state preservation, and a three-tier CSS variable system (primitive, semantic, component tokens) that supports multi-brand theming.

The highest-risk pitfalls are: (1) breaking existing keyboard navigation during component refactoring, (2) design token inconsistency across 204 components during migration ("Frankenstein System"), and (3) over-simplifying the UI in pursuit of minimalism, which hides features power users depend on. All three are preventable with upfront audits and strict phase gating -- token compliance must reach 95%+ before visual redesign begins, and keyboard testing must be acceptance criteria for every component.

## Key Findings

### Recommended Stack

The existing core stack (Next.js 16, React 19, Tailwind 4, Convex, shadcn/ui) is correct and needs no replacement. The redesign adds interaction and state management libraries on top.

**Core additions:**
- **Framer Motion 12.x + AutoAnimate**: Animation layer. Framer for hero interactions, AutoAnimate (2.5kb) for zero-config DOM transitions. Combined, they deliver the "premium feel" without per-component configuration overhead.
- **cmdk 1.x + react-hotkeys-hook 4.x**: Command palette and keyboard shortcuts. cmdk is the industry standard (used by Vercel, Linear). react-hotkeys-hook provides scoped global shortcuts with conflict prevention.
- **Zustand 5.x**: 3kb client state store for UI preferences, shortcut state, and command palette state. Replaces ad-hoc useState/Context for cross-cutting concerns.
- **nuqs**: Type-safe URL state for filters, tabs, search. Persists UI state in the URL, making views shareable.
- **Sonner**: Toast notifications. Lightweight, integrates with shadcn/ui.

**Do not adopt:** Redux, Radix Themes, Ant Design, Material UI, Moment.js, @apply in Tailwind v4.

**Total bundle impact:** ~66kb (production, tree-shaken). Acceptable for the feature density delivered.

### Expected Features

**Must have (table stakes -- users expect these):**
- Command Palette (Cmd+K) with navigation, search, and actions
- 5-10 core keyboard shortcuts (Cmd+K, /, N, ?, Esc)
- Collapsible sidebar with icon-only mode
- Skeleton loading states for all data views
- Toast notifications for action feedback
- Empty states with contextual CTAs on every page
- Breadcrumb navigation (Brand > Page > Subpage)
- Responsive design across mobile/tablet/desktop
- Inline editing for text fields (agent names, content titles)
- Visual hierarchy audit (5-second rule on key pages)

**Should have (differentiators):**
- Contextual command palette (results adapt to current page)
- Live activity indicators for running agents (leverage Convex real-time)
- Micro-interactions at 5-10 strategic points (status changes, navigation, destructive actions)
- Bulk actions on Content page (multi-select + toolbar)
- Smart defaults (pre-fill forms from navigation context)
- Recent items in command palette
- Hover states with contextual actions on table rows
- Progressive loading for analytics/data-heavy pages

**Defer (v2+):**
- AI-driven page layouts (need usage data first)
- Full keyboard-first workflows (complete flows without mouse)
- Undo/redo stack (complex, do after MVP proves value)
- Custom keyboard shortcut rebinding
- Adaptive information density toggle

**Anti-features (explicitly do not build):**
- Real-time collaborative editing (Google Docs style)
- Drag-and-drop dashboard widget customization
- Animation on every element
- Infinite scroll everywhere
- Gamification (points/badges)
- Custom color themes beyond dark/light

### Architecture Approach

The architecture follows a layered model: persistent app shell (sidebar, header, copilot panel) in Next.js layouts, feature-based component modules (strategy/, content/, brand/ etc.), shared UI primitives in ui/, and a three-tier design token system in CSS variables.

**Major components:**
1. **App Shell (Root Layout)** -- Wraps all dashboard pages. Renders sidebar, brand context, copilot panel once. Children (page content) re-render on navigation; shell does not.
2. **Hierarchical Sidebar** -- Reorganize 11 flat nav items into 4 groups (Overview, Content, Operations, Settings). Max 2 levels deep. Persist expansion state in localStorage.
3. **Command Palette** -- Global overlay triggered by Cmd+K. Uses cmdk library. Action registry supports navigation, search, and contextual actions per page.
4. **Feature Modules** -- Components grouped by domain (strategy/, content/, brand/, agents/, etc.). Each module contains 5-15 related components. Cross-feature shared components live in dashboard/.
5. **Design Token System** -- Three tiers: primitive (raw colors, spacing), semantic (surface-0, text-primary, accent), component (sidebar-bg, card-border). Dark mode and brand overrides swap semantic tier only.

**Key patterns to follow:**
- Nested layouts for state preservation across navigation
- Feature-based component organization (not flat)
- Data-driven navigation config (single source of truth for sidebar, mobile nav, command palette)
- Mobile-first responsive breakpoints (stacked > sidebar at 768px > copilot panel at 1024px)
- Context for truly global state only (theme, auth, brand); props for everything else

### Critical Pitfalls

1. **Component inconsistency drift ("Frankenstein System")** -- With 204 components, partial token migration creates visual chaos. **Prevention:** Convert ALL hardcoded values to design tokens BEFORE any visual changes. Establish automated linting. Migrate page-by-page, each reaching 100% token compliance before moving on.

2. **Keyboard navigation regression** -- Custom components break Tab order, focus management, and existing Cmd+K shortcuts. **Prevention:** Keyboard-only testing as acceptance criteria for every component. Semantic HTML first. Automated accessibility tests in CI. Inventory all existing shortcuts before touching them.

3. **Breaking user workflows via navigation reorganization** -- Moving items users find by muscle memory causes disorientation. **Prevention:** Analytics audit of current navigation patterns. Test new groupings with users. Keep max 2 navigation levels. Provide "moved from here" hints for 30 days post-launch.

4. **Performance regression from animation overload** -- 204 components times "small animations" equals stuttering on real hardware. **Prevention:** Performance budget (FPS, CPU). CSS transforms (GPU) over JS animation where possible. Honor prefers-reduced-motion. Test on 3-year-old laptops, not dev machines.

5. **Over-simplification hiding critical features** -- Minimalist aesthetic removes quick access to features power users rely on. **Prevention:** Check usage analytics before hiding anything. Optimize for the 100th session, not the 1st. Hidden features must be 1 click away, not 4. Keyboard shortcuts provide instant access even when UI is minimal.

## Implications for Roadmap

Based on combined research, the redesign should follow 5 phases with strict gating between them.

### Phase 0: Token Migration and Audit
**Rationale:** Every other research document agrees: token consistency must come BEFORE visual changes. This is the highest-risk pitfall (Frankenstein System) and the hardest to fix retroactively. Without this, all subsequent phases create technical debt.
**Delivers:** Complete design token system (three-tier CSS variables), all 204 components using semantic tokens instead of hardcoded values, automated token linting, component inventory with usage locations.
**Addresses:** Multi-brand theming foundation, dark mode consistency, token compliance baseline.
**Avoids:** Pitfall 2 (component inconsistency), Pitfall 7 (multi-brand theming breaks).

### Phase 1: Layout Shell and Navigation
**Rationale:** Architecture research shows the persistent layout shell is the foundation all feature work depends on. Navigation reorganization must happen early (validated by analytics) so users adapt before feature-level changes add more cognitive load.
**Delivers:** Nested Next.js layout with persistent sidebar, hierarchical navigation (4 groups), collapsible sidebar with icon-only mode, mobile bottom nav, breadcrumb navigation, responsive breakpoints.
**Addresses:** Table stakes features (collapsible sidebar, breadcrumbs, responsive design).
**Avoids:** Pitfall 1 (breaking navigation workflows), Pitfall 6 (responsive breakage).
**Uses:** shadcn/ui, Tailwind 4 breakpoints, localStorage for preferences.

### Phase 2: Command Palette and Keyboard System
**Rationale:** Command palette is the "halo feature" -- the single interaction that most signals premium quality. It depends on Phase 1 (layout shell must exist for navigation targets). Keyboard shortcuts share the same event system and should ship together.
**Delivers:** Cmd+K command palette (cmdk), 5-10 core keyboard shortcuts (react-hotkeys-hook), keyboard shortcuts help modal (?), global search across brands/agents/content/tasks.
**Addresses:** Table stakes (command palette, keyboard shortcuts, search). Enables future contextual palette (Phase 4).
**Avoids:** Pitfall 3 (keyboard navigation regression -- by building the keyboard system correctly from the start).
**Uses:** cmdk, react-hotkeys-hook, Zustand (for shortcut/palette state), nuqs (for search state in URL).

### Phase 3: Component Migration and Visual Polish
**Rationale:** With tokens (Phase 0), layout (Phase 1), and interaction foundation (Phase 2) in place, feature modules can be migrated page-by-page. This is the longest phase. Each page must reach 100% consistency before the next begins.
**Delivers:** All 10+ pages migrated to new design system. Skeleton loading states, empty states, toast notifications, inline editing, visual hierarchy improvements. Feature-based component reorganization.
**Addresses:** Remaining table stakes (skeletons, empty states, toasts, inline editing, visual hierarchy). Differentiators (hover actions, smart defaults).
**Avoids:** Pitfall 4 (over-simplification -- usage analytics guide what stays visible), Pitfall 9 (inconsistent migration -- ship complete workflows, not individual pages).
**Uses:** Framer Motion, AutoAnimate, Sonner, react-hook-form + Zod.

### Phase 4: Differentiators and Premium Features
**Rationale:** With the foundation solid and all pages migrated, layer on the features that make AMD feel "premium" and "smart." These features build on top of Phase 2 (contextual palette extends command palette) and Phase 3 (micro-interactions enhance migrated components).
**Delivers:** Contextual command palette, live activity indicators (Convex real-time), strategic micro-interactions (5-10 spots), bulk actions on Content page, progressive loading for analytics, recent items in palette.
**Addresses:** All differentiator features from FEATURES.md.
**Avoids:** Pitfall 5 (animation overload -- performance budget enforced, test on low-end hardware).
**Uses:** Framer Motion (hero animations), Convex real-time subscriptions, TanStack Table (if needed for bulk actions).

### Phase Ordering Rationale

- **Phase 0 before everything:** Research unanimously identifies token inconsistency as the highest-cost pitfall. Fixing it later requires touching all 204 components again.
- **Phase 1 before Phase 2:** Command palette needs navigation targets to exist. Sidebar must be refactored before keyboard shortcuts can navigate it.
- **Phase 2 before Phase 3:** The keyboard system establishes interaction patterns that component migration must respect. Building components first and adding keyboard later leads to regressions.
- **Phase 3 before Phase 4:** Differentiators extend base components. Micro-interactions need migrated components to animate. Contextual palette needs pages to provide context.
- **Coordinated rollouts within Phase 3:** Migrate by user workflow (all content-related pages together), not by individual page. Avoids "old UI / new UI" confusion.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 0 (Token Migration):** Needs audit of all 204 components to identify hardcoded values. Automated linting tool selection (stylelint? custom ESLint rules?).
- **Phase 2 (Command Palette):** cmdk integration with Convex search needs prototyping. Fuzzy search performance with large action registries needs validation.
- **Phase 4 (Live Activity Indicators):** Convex real-time subscription patterns for agent status need investigation. WebSocket performance with 37 agents updating simultaneously.

Phases with standard patterns (skip additional research):
- **Phase 1 (Layout Shell):** Well-documented Next.js App Router layout patterns. shadcn/ui sidebar components exist.
- **Phase 3 (Component Migration):** Standard component refactoring. Skeleton/empty state patterns are commodity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified against npm (Feb 2026). Context7 + official docs. Battle-tested by Linear, Vercel, Notion. |
| Features | HIGH | 60+ sources including NNGroup, Linear design docs, Vercel guidelines. Feature priorities validated against competitor analysis. |
| Architecture | HIGH | Next.js App Router layouts well-documented. Feature-based organization is established pattern for 200+ component codebases. Three-tier token system validated by design system literature. |
| Pitfalls | HIGH | 2025-2026 sources with real-world case studies. Domain-specific (SaaS dashboard redesign). Recovery strategies included. |

**Overall confidence:** HIGH

### Gaps to Address

- **Usage analytics:** Research recommends analytics-driven navigation decisions, but no current usage data was available. Before Phase 1, instrument current navigation or gather qualitative user feedback.
- **Multi-brand theme inventory:** Research identifies multi-brand theming as critical. Need exact count of active brand themes and their current token coverage before Phase 0.
- **Convex search capabilities:** Command palette needs fuzzy search across entities. Convex full-text search capabilities need validation for performance at AMD's data scale.
- **Component inventory completeness:** Research references 204 components across 29 folders. This number needs verification and each component needs usage location mapping before Phase 0.
- **Performance baseline:** No current Core Web Vitals or bundle size baseline exists. Establish before Phase 0 to measure improvement/regression.

## Sources

### Primary (HIGH confidence)
- Context7: framer-motion, cmdk, radix-ui primitives, react-hotkeys-hook, TanStack hotkeys -- interaction patterns and API docs
- Official: Next.js App Router docs, Tailwind CSS v4 docs, shadcn/ui docs, Radix UI Primitives docs
- Official: npm registry for all library version verification (Feb 2026)

### Secondary (MEDIUM-HIGH confidence)
- Linear, Notion, Vercel, Raycast design analysis -- competitor UX patterns
- Nielsen Norman Group -- navigation, vertical nav, skeleton screens
- Smashing Magazine, LogRocket, UX Collective -- SaaS dashboard design patterns
- PatternFly, Material Design -- navigation guidelines
- WebAIM, WCAG 2.1 -- accessibility and keyboard navigation standards
- Design system literature (Feature-Sliced Design, Penpot, Harry's multi-brand system) -- token architecture

### Tertiary (MEDIUM confidence)
- Medium, Dev.to, community blog posts -- implementation examples and comparisons
- State management comparisons (Better Stack, Nucamp) -- Zustand vs alternatives

---
*Research completed: 2026-02-15*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap: yes*
