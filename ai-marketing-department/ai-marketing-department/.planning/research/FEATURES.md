# Feature Research: Premium SaaS Dashboard UX/UI

**Domain:** SaaS Dashboard Redesign (Marketing Automation Platform)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

Premium SaaS dashboards (Linear, Notion, Vercel, Raycast) share a common DNA: **keyboard-first navigation, progressive information disclosure, intelligent loading states, and obsessive attention to micro-interactions**. The 2026 landscape emphasizes AI-driven personalization, role-based interfaces, and "premium feels" through motion design rather than visual complexity.

For AMD's context (37 AI agents, 10+ pages, agency multi-brand workflow), the differentiation opportunity lies in **contextual intelligence** and **zero-friction agent orchestration**, not in matching Linear's minimalism feature-for-feature.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Command Palette (Cmd+K)** | Standard in Linear, Notion, Vercel — users expect instant navigation and action access | MEDIUM | Global keyboard listener, fuzzy search, action registry | Must support navigation, search, and quick actions. NOT just search. |
| **Keyboard Shortcuts (? for help)** | Power users keep hands on keyboard for 15-20% longer sessions | MEDIUM | Shortcut registry, conflict detection, help modal | Start with 5-10 core shortcuts, expand iteratively. |
| **Collapsible Sidebar** | Mobile responsiveness + user preference for focused work | LOW | CSS transitions, localStorage for preference | Icon-only mode + full mode. Standard pattern. |
| **Dark Mode / Light Mode Toggle** | 82.7% of users use dark mode; expectation for both | LOW | CSS variables (already implemented), theme switcher in settings | AMD already has this via CSS vars. |
| **Skeleton Loading States** | Reduces perceived latency by 40% vs spinners | LOW | Component-level loading skeletons | Show structure while data loads. Use for tables, cards, charts. |
| **Toast Notifications** | Success/error feedback for actions without breaking flow | LOW | Toast service, auto-dismiss, stacking | For confirmations & non-critical errors. NOT for critical errors. |
| **Empty States** | Onboarding moment — guide users when no data exists | LOW | Conditional rendering, illustration + CTA | Each page needs context-specific empty state (e.g., "No agents", "No content"). |
| **Breadcrumb Navigation** | Users need to know "where am I" in deep hierarchies | LOW | Route parsing, clickable history | Essential for multi-brand workflow (Brand → Department → Agent → Task). |
| **Responsive Design (≥3 breakpoints)** | Mobile/tablet/desktop expectations | MEDIUM | Tailwind breakpoints, sidebar pattern changes | 640px (mobile), 1024px (sidebar intro), 1440px (desktop). |
| **Inline Editing** | Reduce friction — edit in place, not modals for everything | MEDIUM | Contenteditable, blur handlers, optimistic updates | For agent names, content titles, settings. NOT for complex forms. |
| **Hover States with Contextual Actions** | Discoverability — show secondary actions on hover | LOW | CSS hover, conditional rendering | "Edit", "Delete", "Duplicate" appear on row hover. |
| **Visual Hierarchy (5-second rule)** | Users should identify primary action/data in <5 seconds | MEDIUM | Typography scale, color intensity, layout weight | Top-left = most important. Size + contrast = priority. |
| **Search with Filters** | Users expect instant search + refinement | MEDIUM | Search index, filter state, debounced input | Global search (Cmd+K) + page-specific filters (Content: type, status, date). |
| **Tab Navigation** | Standard pattern for grouping related content without page changes | LOW | Tab state, keyboard nav (arrow keys) | AMD already uses tabs on Strategy page — extend to other pages. |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued. These should align with AMD's "AI orchestration for agencies" positioning.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **AI-Driven Page Layouts** | Salesforce Einstein adapts dashboard based on role/usage — AMD could adapt layout per brand size/complexity | HIGH | Usage tracking, ML model, layout engine | Deferred to v2+. But: consider role-based PRESETS as MVP (small brand vs enterprise). |
| **Contextual Command Palette** | Search results adapt based on current page context (e.g., on /content, prioritize content actions) | MEDIUM | Command Palette, context awareness | Linear does this — "Create issue" appears on project page vs "Create project" on home. |
| **Live Activity Indicators** | Show which agents are running, who's online, real-time task progress | MEDIUM | WebSocket connection, presence system | AMD has Convex real-time — leverage this for "Agent X is analyzing..." |
| **Keyboard-First Workflows** | Complete workflows without mouse (e.g., Cmd+N → type → Enter → task created) | HIGH | Keyboard nav, focus management, form validation | Linear's killer feature. Start with 3 core workflows: Create Task, Switch Brand, Navigate Pages. |
| **Progressive Loading** | Load skeleton → basic data → rich data in stages (reduces perceived wait) | MEDIUM | Data fetching strategy, batched API calls | Especially important for Analytics page with heavy data. |
| **Micro-Interactions** | Subtle animations on actions (buttons morph, items slide, progress pulses) | MEDIUM | Framer Motion (already in stack), design tokens | "Premium feel" — 15-20% longer sessions. Don't overdo. |
| **Undo/Redo Stack** | Safety net for destructive actions (delete agent, archive content) | HIGH | Action history, state management, command pattern | Notion has this. Complex but high trust signal. Deferred. |
| **Bulk Actions with Contextual Toolbar** | Select multiple items → toolbar appears with actions (publish, archive, delete) | MEDIUM | Multi-select state, checkbox UI, action batching | Essential for Content page with 50+ items. |
| **Smart Defaults Based on Context** | When creating content, pre-fill brand, department, agent based on navigation path | LOW | Context state, form defaults | Small detail, huge friction reduction. |
| **Adaptive Information Density** | Toggle between "compact" and "comfortable" view density | LOW | View preference state, CSS classes | Linear has this. Simple but appreciated by power users. |
| **Keyboard Shortcut Customization** | Let users rebind shortcuts to their preferences | HIGH | Shortcut registry, conflict detection, persistence | Raycast does this. Deferred — start with sane defaults. |
| **Contextual Help Tooltips** | Rich tooltips with examples, not just "what is this" | MEDIUM | Tooltip component, content library | On hover, show example + keyboard shortcut. Better than ? icon. |
| **Recent Items / Jump List** | Quick access to last 5 brands, agents, content items | LOW | localStorage, recency tracking | Add to Command Palette results. |
| **Status Badges with Animation** | Visual feedback for agent status (idle/running/error) with pulse | LOW | CSS animation, status mapping | Already have statuses — make them visually distinct. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build. Prevent scope creep.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Real-Time Collaboration (Google Docs style)** | "Everyone should see changes live" | Complex infrastructure, conflict resolution, presence system. Not needed for agency workflow where one person manages per brand. | Use optimistic updates + toast on conflict. Leverage Convex real-time for task updates only. |
| **Drag-and-Drop Dashboard Widgets** | "Users want to customize layout" | Maintenance nightmare, breaks responsive design, users overwhelm themselves with choices. | Provide 2-3 curated layouts (default, compact, analytics-focused). Role-based presets. |
| **Every Action Has Animation** | "Makes it feel premium" | Performance degrades, motion sickness for some users, distracts from content. | Animate ONLY: state changes (loading→done), destructive actions (delete), navigation transitions. |
| **Infinite Scroll Everywhere** | "Less clicks = better UX" | Breaks back button, no footer access, hard to reach specific item, memory leaks on long sessions. | Use pagination with keyboard nav (→ next page). Infinite scroll ONLY for feeds (if added). |
| **Modal for Everything** | "Separates flow from main page" | Context loss, escape key confusion, mobile UX nightmare, forces linear flow. | Use modals ONLY for: destructive actions (confirm delete), complex forms (create campaign). Prefer inline editing. |
| **Auto-Save Without Indicator** | "Users shouldn't think about saving" | Users lose trust ("did it save?"), no undo opportunity, conflicts on slow networks. | Auto-save WITH visual indicator (e.g., "Saving..." → "Saved 2s ago"). Notion pattern. |
| **Gamification (Points/Badges)** | "Increases engagement" | Feels childish in B2B context, distracts from real work, metrics become targets (Goodhart's Law). | Focus on outcome metrics (tasks completed, content published). No points. |
| **Custom Themes Beyond Dark/Light** | "Let users pick any color" | Accessibility nightmare, breaks visual hierarchy, design system becomes meaningless. | Offer Dark, Light, and ONE optional high-contrast mode for accessibility. |
| **AI Chat for Everything** | "Everyone wants chat interfaces" | Slow for power users, unpredictable, harder to automate, not keyboard-first. | Use AI for: content generation, insights, summarization. NOT for navigation or settings. |
| **Video Tutorials Everywhere** | "New users need help" | Users ignore videos, hard to maintain, slows page load. | Use: contextual tooltips, empty state CTAs, optional onboarding checklist. Link to video library in help. |

---

## Feature Dependencies

Critical for roadmap phase ordering.

```
Command Palette
    └──requires──> Keyboard Event System
                       └──requires──> Global Hotkey Manager
    └──requires──> Search Index
                       └──requires──> Fuse.js or similar
    └──enhances──> Keyboard Shortcuts (shares shortcut registry)

Skeleton Loading
    └──requires──> Component-Level Loading States
    └──works-with──> Progressive Loading (batched data)

Sidebar Collapsible
    └──requires──> Responsive Breakpoints
    └──requires──> LocalStorage for Preference

Inline Editing
    └──requires──> Optimistic Updates
    └──requires──> Error Rollback Strategy
    └──conflicts──> Modal-First Architecture (choose one paradigm)

Bulk Actions
    └──requires──> Multi-Select State
    └──requires──> Checkbox UI Component
    └──enhances──> Keyboard Shortcuts (Cmd+A select all)

Live Activity Indicators
    └──requires──> WebSocket Connection (Convex real-time)
    └──requires──> Presence System
    └──enhances──> Toast Notifications (on agent completion)

Micro-Interactions
    └──requires──> Framer Motion (already in stack)
    └──requires──> Design Token System (timing, easing)
    └──conflicts──> Animation Everywhere (choose restraint)

Contextual Command Palette
    └──requires──> Command Palette (base)
    └──requires──> Page Context Provider
```

---

## MVP Definition for AMD Redesign

### Launch With (Phase 1 — Table Stakes Foundation)

**Goal:** Match industry baseline so users don't feel AMD is "behind."

- [ ] **Command Palette (Cmd+K)** — Navigation + search + actions
- [ ] **Keyboard Shortcuts (5 core)** — Cmd+K (palette), / (filter), N (new), ? (help), Esc (close)
- [ ] **Collapsible Sidebar** — Icon-only + full mode, persisted preference
- [ ] **Skeleton Loading States** — All data tables, cards, charts
- [ ] **Toast Notifications** — Success/error feedback (already partially implemented)
- [ ] **Empty States** — All pages with clear CTAs
- [ ] **Breadcrumb Navigation** — Brand → Page → Subpage path
- [ ] **Responsive Sidebar** — Hamburger on mobile (<1024px), fixed on desktop
- [ ] **Inline Editing** — Agent names, content titles (simple text fields)
- [ ] **Visual Hierarchy Audit** — Ensure 5-second rule on Dashboard, Agents, Content

**Why This Order:**
- Command Palette is the "halo feature" — do it first, well.
- Skeleton states remove perceived slowness immediately.
- Sidebar responsive = mobile usable = table stakes.

---

### Add After Foundation (Phase 2 — Differentiators)

**Goal:** Make AMD feel "premium" and "smart."

- [ ] **Contextual Command Palette** — Results adapt to current page
- [ ] **Live Activity Indicators** — Agent status pills with pulse animation
- [ ] **Progressive Loading** — Analytics page loads in stages
- [ ] **Micro-Interactions** — Button morphs, slide transitions, progress pulses (5-10 strategic spots)
- [ ] **Bulk Actions** — Content page multi-select + toolbar
- [ ] **Smart Defaults** — Pre-fill forms based on context
- [ ] **Recent Items in Palette** — Last 5 brands, agents, content
- [ ] **Hover States with Actions** — Edit/delete on table rows

**Why This Order:**
- Build on Command Palette with context awareness.
- Live indicators leverage Convex real-time (already there).
- Bulk actions solve real pain (managing 50+ content items).

---

### Future Consideration (Phase 3+ — Advanced)

**Goal:** Competitive moats, not table stakes.

- [ ] **AI-Driven Page Layouts** — Role-based presets (small brand vs enterprise)
- [ ] **Keyboard-First Workflows** — 3 complete flows without mouse
- [ ] **Undo/Redo Stack** — Safety net for destructive actions
- [ ] **Adaptive Information Density** — Compact vs comfortable toggle
- [ ] **Contextual Help Tooltips** — Rich examples on hover
- [ ] **Custom Keyboard Shortcuts** — User rebinding

**Why Defer:**
- AI layouts require usage data (collect first).
- Undo/redo is complex, do after MVP proves value.
- Custom shortcuts have diminishing returns until power user base exists.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| Command Palette | HIGH | MEDIUM | P1 | 1 |
| Keyboard Shortcuts (core) | HIGH | MEDIUM | P1 | 1 |
| Collapsible Sidebar | HIGH | LOW | P1 | 1 |
| Skeleton Loading | HIGH | LOW | P1 | 1 |
| Empty States | HIGH | LOW | P1 | 1 |
| Breadcrumb Navigation | HIGH | LOW | P1 | 1 |
| Toast Notifications | HIGH | LOW | P1 | 1 |
| Responsive Sidebar | HIGH | MEDIUM | P1 | 1 |
| Inline Editing | MEDIUM | MEDIUM | P1 | 1 |
| Visual Hierarchy | HIGH | MEDIUM | P1 | 1 |
| Contextual Palette | MEDIUM | MEDIUM | P2 | 2 |
| Live Activity Indicators | MEDIUM | MEDIUM | P2 | 2 |
| Micro-Interactions | MEDIUM | MEDIUM | P2 | 2 |
| Bulk Actions | MEDIUM | MEDIUM | P2 | 2 |
| Progressive Loading | MEDIUM | MEDIUM | P2 | 2 |
| Smart Defaults | LOW | LOW | P2 | 2 |
| Hover Contextual Actions | MEDIUM | LOW | P2 | 2 |
| AI-Driven Layouts | LOW | HIGH | P3 | 3+ |
| Undo/Redo | MEDIUM | HIGH | P3 | 3+ |
| Adaptive Density | LOW | LOW | P3 | 3+ |
| Custom Shortcuts | LOW | HIGH | P3 | 3+ |

**Priority key:**
- **P1**: Must have for redesign to feel "complete"
- **P2**: Differentiators that justify "premium SaaS"
- **P3**: Nice to have, adds polish but not core value

---

## Competitor Feature Analysis

Analysis of how Linear, Notion, Vercel, and Raycast implement key patterns.

| Feature | Linear | Notion | Vercel | Raycast | AMD Approach |
|---------|--------|--------|--------|---------|--------------|
| **Command Palette** | Cmd+K — navigation, search, actions. Context-aware (current project). | Cmd+P — page nav. / for blocks. Separate shortcuts. | Cmd+K — deployment search, quick actions. | Entire app IS a command palette. | Cmd+K — unified navigation + search + actions. Context from current page. |
| **Sidebar** | Collapsible, icon-only mode, team/project hierarchy. | Always-on left sidebar with workspace tree. No collapse. | Minimal left nav, always visible. | No sidebar — all command-driven. | Collapsible (icon + full), persisted. Grouped by department. |
| **Loading States** | Skeleton screens for lists, pulse animation. | Skeleton blocks while page loads. | Skeleton + progress bars for deployments. | Instant — local cache + bg sync. | Skeleton for tables/cards. Progressive for analytics. |
| **Keyboard Shortcuts** | Extensive — nearly every action has shortcut. ? for help. | Basic shortcuts, heavy on / and @. | Limited — mostly Cmd+K. | All shortcuts, customizable. | Start with 5-10 core, expand based on usage. |
| **Empty States** | Illustrations + CTA + keyboard hint (e.g., "Press N to create"). | Simple text + button. | Illustrations + "Deploy Now" CTA. | N/A (extensions always available). | Illustration + CTA + keyboard hint. Context-specific. |
| **Dark Mode** | Custom theme generator + system preference. | Light/dark toggle in settings. | Dark mode default, light mode option. | Themes + custom colors. | Light/dark toggle (already implemented). |
| **Micro-Interactions** | Subtle morphs on buttons, smooth transitions. | Minimal animations. | Very subtle (deployment progress). | Fast, no-frills. | Strategic spots: status changes, destructive actions, navigation. |
| **Inline Editing** | Click to edit issue titles, descriptions. | Everything is inline-editable. | Limited — mostly modals. | N/A (command-driven). | Text fields (names, titles). Modals for complex forms. |
| **Search** | Instant fuzzy search across projects. | Full-text across workspace. | Deployment logs search. | Entire app = search. | Fuzzy search across brands, agents, content, tasks. |

---

## Complexity Assessment

### LOW Complexity (1-2 days per feature)
- Empty states
- Toast notifications
- Breadcrumb navigation
- Collapsible sidebar (CSS + localStorage)
- Dark mode toggle (already done)
- Skeleton loading states (component-level)
- Smart defaults (context state)
- Adaptive density toggle

### MEDIUM Complexity (3-5 days per feature)
- Command Palette (search + actions registry)
- Keyboard shortcuts system (global listener + registry)
- Responsive sidebar (breakpoint logic)
- Inline editing (optimistic updates + validation)
- Visual hierarchy audit (requires design review + refactor)
- Contextual command palette (context provider)
- Live activity indicators (WebSocket + UI)
- Micro-interactions (design + Framer Motion)
- Bulk actions (multi-select + toolbar)
- Progressive loading (data strategy)
- Contextual help tooltips (content + component)

### HIGH Complexity (1-2 weeks per feature)
- AI-driven page layouts (usage tracking + ML)
- Keyboard-first workflows (focus management + validation)
- Undo/redo stack (command pattern + state)
- Custom keyboard shortcuts (conflict detection + persistence)

---

## Technical Implementation Notes

### Command Palette

**Libraries:**
- [cmdk](https://github.com/pacocoursey/cmdk) — "The command menu for the web" (Linear, Vercel use this)
- [kbar](https://github.com/timc1/kbar) — Alternative with plugin system

**Architecture:**
```typescript
// Global action registry
const actions = [
  { id: 'nav:home', label: 'Go to Dashboard', shortcut: 'g d', perform: () => router.push('/') },
  { id: 'create:agent', label: 'Create Agent', shortcut: 'n', perform: () => openModal('create-agent') },
  // ...contextual actions injected per page
];

// Context provider injects page-specific actions
<CommandPaletteProvider actions={baseActions.concat(pageActions)}>
  <CommandPalette />
</CommandPaletteProvider>
```

### Keyboard Shortcuts

**Pattern:**
- Global listener captures all keyboard events
- Check if input is focused (ignore shortcuts)
- Match against registry
- Execute action or preventDefault

**Registry Format:**
```typescript
type Shortcut = {
  key: string; // 'k', 'n', '/'
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt')[];
  description: string;
  action: () => void;
  context?: string; // 'global' | 'content' | 'agents'
};
```

### Skeleton Loading

**Pattern:**
```tsx
{isLoading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
) : (
  <ActualContent />
)}
```

**Libraries:**
- Built-in Tailwind `animate-pulse`
- [react-loading-skeleton](https://github.com/dvtng/react-loading-skeleton) for complex shapes

### Micro-Interactions

**Timing Tokens:**
```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
```

**Use Cases:**
- Button hover: `transition-fast` + scale(1.02)
- Status change: `transition-base` + color fade
- Navigation: `transition-slow` + slide
- Destructive action: `transition-base` + shake

---

## Sources

### Premium SaaS UX Patterns
- [Linear Dashboard UX Design](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Design Trend Analysis](https://blog.logrocket.com/ux-design/linear-design/)
- [Notion Keyboard Shortcuts](https://www.notion.com/help/keyboard-shortcuts)
- [Notion Command Palette](https://noteforms.com/notion-glossary/command-palette)
- [Vercel Dashboard UX Analysis](https://medium.com/design-bootcamp/vercels-new-dashboard-ux-what-it-teaches-us-about-developer-centric-design-93117215fe31)
- [Vercel Design Guidelines](https://vercel.com/design/guidelines)

### Command Palette Design
- [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Command Palette Best Practices](https://mobbin.com/glossary/command-palette)
- [Designing Command Palettes](https://solomon.io/designing-command-palettes/)
- [Command Palette Patterns](https://averyv.me/blog/command-palette/)
- [Command K Bars](https://maggieappleton.com/command-bar)

### Micro-Interactions & Motion
- [UI/UX Evolution 2026: Micro-Interactions](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)
- [Micro-interactions & Motion Graphics](https://marsmatics.com/micro-interactions-motion-graphics-as-ux-game-changers/)
- [Motion Design Trends 2026](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect)
- [Motion UI Trends 2026](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)

### Loading States & Performance
- [Skeleton Loading Design](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [6 Loading State Patterns](https://medium.com/uxdworld/6-loading-state-patterns-that-feel-premium-716aa0fe63e8)
- [Progressive Loading Patterns](https://carbondesignsystem.com/patterns/loading-pattern/)
- [Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)

### Dashboard Design Principles
- [Dashboard Design Best Practices](https://improvado.io/blog/dashboard-design-guide)
- [Effective Dashboard Design](https://www.datacamp.com/tutorial/dashboard-design-tutorial)
- [Information Hierarchy in Dashboards](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Visual Hierarchy Guide](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)

### Navigation & Sidebar Patterns
- [Navigation UX for SaaS](https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation)
- [Responsive Sidebar Design](https://medium.com/@syedabdulmanan191/a-ui-ux-developers-guide-to-creating-a-perfect-sidebar-layout-ac140c1e3f88)
- [Sidebar Menu Examples](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)
- [Mobile Navigation Patterns 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026)

### SaaS Design Trends 2026
- [10 AI-Driven UX Patterns](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026)
- [Top SaaS Design Trends 2026](https://www.designstudiouiux.com/blog/top-saas-design-trends/)
- [B2B SaaS UX Design Patterns](https://www.onething.design/post/b2b-saas-ux-design)
- [Essential SaaS Design Principles](https://www.index.dev/blog/saas-design-principles-ui-ux)

### Dark Mode & Theming
- [Dark Mode vs Light Mode](https://www.vivantio.com/blog/dark-mode-vs-light-mode-for-saas/)
- [Adding Dark Mode to SaaS](https://metorik.com/behind/adding-dark-mode-to-a-large-saas-app)
- [Dark Mode Design Guide 2026](https://www.digitalsilk.com/digital-trends/dark-mode-design-guide/)

### Empty States
- [90+ Empty State Examples](https://www.saasframe.io/categories/empty-state)
- [Empty State Design Patterns](https://www.saasframe.io/patterns/empty-state)

### Contextual Actions & Inline Editing
- [Dashboard Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Data Table Design Best Practices](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Bulk Action UX Guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [Contextual Design Principles](https://medium.com/ux-io/contextual-design-how-to-place-the-right-info-where-it-matters-most-44c5a3106478)

### Toast Notifications
- [Toast Notifications Best Practices](https://blog.logrocket.com/ux-design/toast-notifications/)
- [Error Handling UX](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback)
- [Notification UI Design](https://www.setproduct.com/blog/notifications-ui-design)

### Real-Time Updates
- [WebSocket Complete Guide 2026](https://devtoolbox.dedyn.io/blog/websocket-complete-guide)
- [Real-Time Dashboard with WebSockets](https://levelup.gitconnected.com/how-i-built-a-real-time-dashboard-mvp-in-2-days-with-websockets-react-c083c7b7d935)
- [Real-Time Data Visualization](https://www.syncfusion.com/blogs/post/view-real-time-data-using-websocket)

---

*Feature research for: AI Marketing Department (AMD) Dashboard Redesign*
*Researched: 2026-02-15*
*Context: 37 AI agents, 10+ pages, agency multi-brand workflow, Next.js 16 + Tailwind 4 + Convex backend*
