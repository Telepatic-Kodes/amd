# Architecture Research: SaaS Dashboard Frontend Redesign

**Domain:** Enterprise SaaS Dashboard (AI Marketing Department)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

Premium SaaS dashboards in 2026 follow a layered architecture with three core principles: **component modularity**, **persistent layout state**, and **semantic design tokens**. The industry has converged on a sidebar + main + panel pattern with hierarchical navigation (2-3 levels max), feature-based component organization, and CSS variables for theming. Next.js App Router's nested layouts provide the ideal foundation for this architecture, enabling state preservation and partial rendering.

For AMD's 204-component dashboard, the recommended architecture is:
1. **Layout Layer**: Persistent shell (sidebar, header, copilot panel) using Next.js layouts
2. **Feature Modules**: Route-grouped components organized by domain (brand/, strategy/, content/)
3. **Shared UI**: Design system primitives in ui/ folder
4. **Design Tokens**: Three-tier CSS variable system (primitive → semantic → component)

## Standard Architecture for Premium SaaS Dashboards

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       App Shell (Root Layout)                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Theme Provider • Auth Context • Brand Context                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌───────────────────────────────┐  ┌─────────────┐  │
│  │          │  │                               │  │             │  │
│  │          │  │        Main Content           │  │   Copilot   │  │
│  │ Sidebar  │  │     (Page Components)         │  │   Panel     │  │
│  │          │  │                               │  │  (Optional) │  │
│  │  Nav +   │  │  ┌─────────────────────────┐  │  │             │  │
│  │  Brand   │  │  │   Page Header           │  │  │  Context-   │  │
│  │ Context  │  │  ├─────────────────────────┤  │  │  Sensitive  │  │
│  │          │  │  │   Feature Sections      │  │  │    AI       │  │
│  │ (Fixed)  │  │  │   - Stats Grid          │  │  │  Assistant  │  │
│  │          │  │  │   - Data Tables         │  │  │             │  │
│  │ 224px    │  │  │   - Action Panels       │  │  │   320px     │  │
│  │          │  │  └─────────────────────────┘  │  │             │  │
│  │          │  │                               │  │             │  │
│  └──────────┘  └───────────────────────────────┘  └─────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Command Palette • Keyboard Shortcuts • Session Timeout • Toasts   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation | State Management |
|-----------|----------------|------------------------|------------------|
| **App Shell** | Root layout, providers, global styles | Next.js root layout.tsx with ClerkProvider, ConvexProvider, ThemeProvider | Context API for theme, auth, brand |
| **Sidebar** | Primary navigation, brand switcher, user menu | Fixed position, 224px wide, hierarchical nav (max 3 levels) | URL state (usePathname), badge counts from queries |
| **Main Content** | Page-specific UI, feature sections | Dynamic width (calc(100vw - 224px - 320px)), max-w-7xl container | Per-page state, URL params, Convex queries |
| **Copilot Panel** | Context-aware AI assistance | Fixed right side, 320px, slide-in/out animation | Local state (open/closed), conversation history |
| **Command Palette** | Global search and navigation | Modal overlay, Cmd+K trigger, fuzzy search | Local state, virtualized list for performance |
| **Mobile Nav** | Bottom tab bar for mobile breakpoints | Fixed bottom, < 768px only, 5-6 key routes | Same as Sidebar, responsive visibility |

## Recommended Project Structure

```
app/
├── (dashboard)/                  # Route group for authenticated app
│   ├── layout.tsx                # Dashboard shell (wraps all pages)
│   ├── page.tsx                  # Home/Dashboard
│   ├── strategy/
│   │   ├── page.tsx              # Strategy autopilot page
│   │   └── [strategyId]/
│   │       └── page.tsx          # Strategy detail view
│   ├── content/
│   │   ├── page.tsx              # Content pipeline
│   │   └── [contentId]/
│   │       └── page.tsx          # Content detail/edit
│   ├── brand/
│   │   ├── page.tsx              # Brand profile manager
│   │   └── manual/
│   │       └── page.tsx          # Brand manual viewer
│   ├── agents/
│   │   ├── page.tsx              # Agent list
│   │   └── [agentId]/
│   │       └── page.tsx          # Agent detail
│   ├── reports/page.tsx
│   ├── analytics/page.tsx
│   ├── monitoring/page.tsx
│   ├── tasks/page.tsx
│   ├── publishing/page.tsx
│   ├── knowledge-base/page.tsx
│   └── settings/page.tsx
│
├── (public)/                     # Route group for public pages
│   ├── layout.tsx                # Public layout (no sidebar)
│   ├── login/page.tsx
│   └── onboarding/page.tsx
│
├── layout.tsx                    # Root layout (html, body, fonts)
├── globals.css                   # Design tokens + Tailwind directives
└── error.tsx                     # Global error boundary

components/
├── layout/                       # Shell components (persistent)
│   ├── Sidebar.tsx               # Main navigation
│   ├── MobileNav.tsx             # Bottom tab bar
│   ├── BrandSwitcher.tsx         # Brand context selector
│   ├── BrandContextBar.tsx       # Active brand info banner
│   ├── UserMenu.tsx              # User dropdown
│   └── LayoutShell.tsx           # Dashboard wrapper
│
├── dashboard/                    # Cross-feature shared components
│   ├── CommandPalette.tsx        # Cmd+K search
│   ├── NotificationCenter.tsx    # Alerts bell
│   ├── StatsCard.tsx             # Metric display
│   └── EmptyState.tsx            # Zero-state illustrations
│
├── strategy/                     # Strategy feature module
│   ├── StrategyGoalInput.tsx
│   ├── StrategyExecutionMonitor.tsx
│   ├── PhaseProgress.tsx
│   └── (11 total components)
│
├── content/                      # Content feature module
│   ├── ContentCard.tsx
│   ├── ContentFilters.tsx
│   ├── ContentCalendar.tsx
│   ├── UploadContentForm.tsx
│   ├── EditContentModal.tsx
│   └── StatusActions.tsx
│
├── brand/                        # Brand feature module
│   ├── BrandProfileSummary.tsx
│   ├── BrandAuditPanel.tsx
│   ├── BrandVersionHistory.tsx
│   └── (7 total components)
│
├── charts/                       # Data visualization primitives
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   ├── DonutChart.tsx
│   ├── AreaChart.tsx
│   ├── Sparkline.tsx
│   └── ChartContainer.tsx        # Wrapper with responsive logic
│
├── ui/                           # Design system primitives
│   ├── button/
│   │   └── Button.tsx            # Base button (shadcn style)
│   ├── accordion/
│   │   └── Accordion.tsx         # Collapsible sections
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── ...                       # ~20 total UI primitives
│
├── agents/                       # Agent feature module
├── analytics/                    # Analytics feature module
├── reports/                      # Reports feature module
├── publishing/                   # Publishing feature module
├── copilot/                      # AI assistant feature
└── ...                           # Other feature modules

lib/
├── utils.ts                      # cn() helper, string formatters
├── hooks/
│   ├── useTheme.ts               # Dark/light mode toggle
│   ├── useKeyboardShortcuts.ts   # Global shortcuts (Cmd+K, ?)
│   ├── useBrandContext.ts        # Active brand provider
│   └── useAuthSync.ts            # Multi-tab auth sync
└── tour-utils.ts                 # Product tour state management
```

### Structure Rationale

**Route Groups (`(dashboard)` and `(public)`):**
- Organize routes without affecting URL structure
- Apply different layouts (sidebar vs. full-screen)
- Enable parallel layout trees for auth states

**Feature-Based Component Organization:**
- Each feature module (strategy/, content/, brand/) contains 5-15 related components
- Prevents 200+ components in a flat /components folder
- Makes imports predictable: `@/components/strategy/StrategyGoalInput`
- Simplifies team ownership (feature teams own their folders)

**Shared UI Layer:**
- /ui contains only design system primitives (buttons, cards, modals)
- No business logic, just presentational components
- Follows shadcn/ui pattern: copy source code into project
- Components accept `className` for Tailwind overrides

**Layout Separation:**
- /layout components are persistent across navigation (Next.js caches them)
- Feature components re-render on route changes
- Dashboard components are cross-feature shared utilities

## Architectural Patterns

### Pattern 1: Nested Layouts for State Preservation

**What:** Next.js App Router layouts preserve state and don't re-render on navigation. Use nested layouts to maintain sidebar, brand context, and copilot panel state across page transitions.

**When to use:** For any UI that should persist across multiple pages (navigation, context bars, assistant panels).

**Trade-offs:**
- ✅ Eliminates layout flicker and re-mount costs
- ✅ Preserves client state (scroll position, form inputs)
- ❌ Shared state requires Context API or prop drilling
- ❌ Layout errors can't be caught by page-level error boundaries

**Example:**
```typescript
// app/(dashboard)/layout.tsx
import { LayoutShell } from "@/components/layout/LayoutShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout wraps all /dashboard/* pages
  // Sidebar, brand context, copilot panel render once
  return <LayoutShell>{children}</LayoutShell>;
}

// components/layout/LayoutShell.tsx
"use client";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  // Providers and persistent UI
  return (
    <BrandProvider>
      <div className="flex min-h-screen">
        <Sidebar />  {/* Renders once, preserved across navigation */}
        <main className="flex-1 ml-56">
          {children}  {/* Only this re-renders on route change */}
        </main>
        <CopilotSidebar />  {/* Preserved across navigation */}
      </div>
      <CommandPalette />  {/* Global, keyboard-triggered */}
    </BrandProvider>
  );
}
```

**Benefits for AMD:**
- Current 204 components organized into 29 feature folders
- Sidebar (11 nav items) renders once, not 11 times per navigation
- Brand context persists when switching between Strategy → Content → Reports

---

### Pattern 2: Feature-Based Component Organization

**What:** Organize components by feature/domain, not by type. Group related components that work together into feature folders.

**When to use:** For codebases with 50+ components where multiple features exist (AMD has 204 components across 10+ features).

**Trade-offs:**
- ✅ Clear component ownership and discovery
- ✅ Reduces merge conflicts (teams own feature folders)
- ✅ Makes refactoring easier (move entire feature folder)
- ❌ Requires clear feature boundaries upfront
- ❌ Some components are genuinely cross-feature (put in /dashboard)

**Example:**
```typescript
// ❌ Old flat structure (hard to navigate with 200+ components)
components/
  StrategyGoalInput.tsx
  StrategyExecutionMonitor.tsx
  ContentCard.tsx
  ContentFilters.tsx
  BrandProfileSummary.tsx
  ... (199 more files)

// ✅ New feature-based structure
components/
  strategy/
    StrategyGoalInput.tsx
    StrategyExecutionMonitor.tsx
    PhaseProgress.tsx
    (11 strategy components)

  content/
    ContentCard.tsx
    ContentFilters.tsx
    UploadContentForm.tsx
    (15 content components)

  brand/
    BrandProfileSummary.tsx
    BrandAuditPanel.tsx
    (7 brand components)

  dashboard/
    StatsCard.tsx         # Used by multiple features
    EmptyState.tsx        # Generic reusable component
```

**AMD Implementation:**
- Already has good folder structure (brand/, strategy/, content/, charts/, ui/)
- Opportunity: Move shared components like StatsCard into /dashboard
- Keep /ui for design system primitives only (buttons, cards, modals)

---

### Pattern 3: Hierarchical Sidebar Navigation

**What:** Organize navigation items into logical groups with 1-3 levels of hierarchy. Use expandable sections for related items.

**When to use:** For dashboards with 8+ top-level routes that can be grouped by domain (AMD has 11 routes).

**Trade-offs:**
- ✅ Reduces cognitive load (fewer top-level items)
- ✅ Scales better as features grow
- ✅ Supports progressive disclosure
- ❌ Adds one extra click for nested items
- ❌ Requires clear information architecture

**Example:**
```typescript
// ❌ Current flat sidebar (11 items, no grouping)
const mainNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Contenido", href: "/content", icon: FileText },
  { name: "Estrategia", href: "/strategy", icon: Brain },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Analíticas", href: "/analytics", icon: TrendingUp },
  { name: "Agentes", href: "/agents", icon: Users },
  { name: "Monitoreo", href: "/monitoring", icon: Shield },
  { name: "Tareas", href: "/tasks", icon: ListTodo },
  { name: "Publicaciones", href: "/publishing", icon: Send },
  { name: "Base de Conocimiento", href: "/knowledge-base", icon: BookOpen },
  { name: "Configuración", href: "/settings", icon: Settings },
];

// ✅ Proposed hierarchical sidebar (4 top-level groups)
const navigationGroups = [
  {
    label: "Dashboard",
    items: [
      { name: "Home", href: "/", icon: Home },
      { name: "Reportes", href: "/reports", icon: BarChart3 },
      { name: "Analíticas", href: "/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Contenido",
    items: [
      { name: "Pipeline", href: "/content", icon: FileText },
      { name: "Publicaciones", href: "/publishing", icon: Send },
      { name: "Estrategia", href: "/strategy", icon: Brain },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { name: "Agentes", href: "/agents", icon: Users },
      { name: "Tareas", href: "/tasks", icon: ListTodo },
      { name: "Monitoreo", href: "/monitoring", icon: Shield },
    ],
  },
  {
    label: "Configuración",
    items: [
      { name: "Base de Conocimiento", href: "/knowledge-base", icon: BookOpen },
      { name: "Ajustes", href: "/settings", icon: Settings },
    ],
  },
];

// Implementation: NavGroup component
export function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase text-stone-500"
      >
        <span>{label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="space-y-0.5 mt-1">
          {items.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Best Practices:**
- Max 3 navigation levels (research shows more causes disorientation)
- Keep frequently accessed items at top level (Home, Content)
- Use expandable sections, not drilldown menus (better for scanning)
- Persist expansion state in localStorage
- Show active group expanded by default

**Sources:** [Nielsen Norman Group on Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/), [PatternFly Navigation Guidelines](https://www.patternfly.org/components/navigation/design-guidelines/)

---

### Pattern 4: Design Token System (Three-Tier Architecture)

**What:** Organize CSS variables into three layers: primitives (raw values), semantic tokens (design intent), and component tokens (specific overrides).

**When to use:** For any dashboard with theming requirements. Essential for dark mode, brand customization, and design consistency.

**Trade-offs:**
- ✅ Single source of truth for design decisions
- ✅ Theme switching without component rewrites
- ✅ Enables brand-specific overrides (AMD supports multiple brands)
- ❌ Initial setup complexity
- ❌ Requires discipline to use tokens instead of hardcoded values

**Example:**
```css
/* globals.css - Three-tier token system */

/* ─── TIER 1: Primitive Tokens (raw values) ─── */
:root {
  --color-stone-50: #fafaf9;
  --color-stone-900: #1c1917;
  --color-orange-500: #f97316;

  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;

  --font-sans: var(--font-dm-sans);
  --font-serif: var(--font-playfair);
}

/* ─── TIER 2: Semantic Tokens (design intent) ─── */
:root {
  /* Surface system (4-tier depth) */
  --surface-0: #faf8f4;  /* Page background */
  --surface-1: #f5f0eb;  /* Raised cards */
  --surface-2: #e7e5e4;  /* Hover states */
  --surface-3: #d6d3d1;  /* Pressed states */

  /* Text hierarchy */
  --text-primary: #1c1917;    /* Headings, body */
  --text-secondary: #78716c;  /* Supporting text */
  --text-tertiary: #a8a29e;   /* De-emphasized text */

  /* Semantic colors */
  --accent: #ea580c;          /* Primary actions */
  --success: #16a34a;
  --warning: #d97706;
  --error: #dc2626;

  /* Borders */
  --border: #e7e5e4;
  --border-hover: #d6d3d1;
}

/* ─── TIER 3: Component Tokens (specific overrides) ─── */
:root {
  /* Sidebar tokens */
  --sidebar-bg: #1c1917;
  --sidebar-text: #a8a29e;
  --sidebar-text-active: #fb923c;
  --sidebar-active-bg: #292524;

  /* Card tokens */
  --card-bg: #ffffff;
  --card-border: #e7e5e4;
  --card-hover: #f5f0eb;
}

/* ─── Dark Mode Overrides ─── */
.dark {
  --surface-0: #0c0a09;
  --surface-1: #1c1917;
  --surface-2: #292524;
  --surface-3: #44403c;

  --text-primary: #fafaf9;
  --text-secondary: #a8a29e;
  --text-tertiary: #78716c;

  --accent: #fb923c;
  --border: #292524;

  /* Component tokens auto-update */
  --card-bg: var(--surface-1);
  --card-border: var(--border);
}

/* ─── Brand-Specific Overrides ─── */
[data-brand="berkespa"] {
  --accent: #10b981;  /* Emerald green for wellness brand */
  --accent-hover: #059669;
}

[data-brand="techcorp"] {
  --accent: #3b82f6;  /* Blue for tech brand */
  --accent-hover: #2563eb;
}
```

**Usage in Components:**
```typescript
// ✅ Use semantic tokens
<div className="bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)]">

// ❌ Don't hardcode colors
<div className="bg-gray-100 border border-gray-200 text-gray-900">
```

**AMD Current State:**
- Already has excellent token system in globals.css
- Has primitive, semantic, and component layers
- Supports dark mode and brand-specific overrides
- Opportunity: Document token usage guidelines for team

**Sources:** [Feature-Sliced Design on Design Tokens](https://feature-sliced.design/blog/design-tokens-architecture), [Penpot Developer's Guide to Design Tokens](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)

---

### Pattern 5: Responsive Layout Strategy (Mobile-First)

**What:** Use mobile-first breakpoints to progressively enhance layout. Start with stacked layout, expand to sidebar at tablet, add right panel at desktop.

**When to use:** For all dashboard layouts that need to work on mobile, tablet, and desktop.

**Trade-offs:**
- ✅ Ensures mobile usability (can't be an afterthought)
- ✅ Performance benefits (less CSS to override)
- ✅ Forces prioritization of content
- ❌ Desktop-first teams find it counterintuitive
- ❌ Complex desktop layouts require more planning

**Example:**
```typescript
// LayoutShell.tsx - Responsive layout
export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile: Hidden sidebar, bottom tab bar */}
      <Sidebar className="hidden md:flex" />  {/* Hidden < 768px */}

      <main
        className={cn(
          "flex-1",
          "ml-0 md:ml-56",          // No margin mobile, 224px margin desktop
          "mb-16 md:mb-0",          // Space for mobile nav, no space desktop
          "mr-0 lg:mr-80",          // No right margin < 1024px, 320px at desktop
        )}
      >
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile: Bottom tab bar (5 key routes) */}
      <MobileNav className="md:hidden" />  {/* Visible < 768px only */}

      {/* Desktop: Copilot panel (1024px+) */}
      <CopilotSidebar className="hidden lg:block" />
    </div>
  );
}

// Breakpoint strategy
const breakpoints = {
  sm: "640px",   // Mobile landscape, small tablets
  md: "768px",   // Show sidebar, hide mobile nav
  lg: "1024px",  // Show copilot panel, multi-column grids
  xl: "1280px",  // Wider content area, more data density
  "2xl": "1536px", // Full-width tables, side-by-side panels
};
```

**Responsive Sidebar Behavior:**
```typescript
// Sidebar.tsx
export function Sidebar({ className }: { className?: string }) {
  return (
    <nav className={cn(
      "h-screen w-56 flex-col fixed left-0 top-0",
      "bg-[#1c1917] border-r border-[#44403c]",
      className  // Parent controls visibility via md:flex
    )}>
      {/* Navigation items */}
    </nav>
  );
}

// MobileNav.tsx
export function MobileNav({ className }: { className?: string }) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-[#1c1917] border-t border-[#44403c]",
      "flex items-center justify-around",
      "h-16 pb-safe",  // Safe area for iOS notch
      className  // Parent controls visibility via md:hidden
    )}>
      {/* 5 key routes only (Home, Content, Strategy, Agents, Settings) */}
    </nav>
  );
}
```

**Grid Behavior Across Breakpoints:**
```typescript
// Dashboard home page - Stats grid
<div className={cn(
  "grid gap-4",
  "grid-cols-1",      // Mobile: 1 column
  "sm:grid-cols-2",   // Small tablet: 2 columns
  "lg:grid-cols-3",   // Desktop: 3 columns
  "xl:grid-cols-4",   // Wide desktop: 4 columns
)}>
  <StatsCard />
  <StatsCard />
  <StatsCard />
  <StatsCard />
</div>
```

**AMD Current Implementation:**
- ✅ Already has responsive LayoutShell with breakpoints
- ✅ Sidebar hidden on mobile, MobileNav shown
- ⚠️ Opportunity: Copilot panel not yet responsive (needs lg:block)

**Sources:** [LogRocket on Responsive Design Breakpoints](https://blog.logrocket.com/building-responsive-components-chakra-ui/), [Bootstrap 5 Layout Breakpoints Guide](https://thelinuxcode.com/bootstrap-5-layout-breakpoints-a-practical-modern-guide-2026/)

---

### Pattern 6: Keyboard Navigation and Accessibility

**What:** Implement keyboard shortcuts for common actions (Cmd+K for search, ? for help), skip-to-content links, and ARIA landmarks.

**When to use:** Required for all enterprise dashboards. WCAG 2.1 compliance mandates keyboard accessibility.

**Trade-offs:**
- ✅ Improves efficiency for power users
- ✅ Required for accessibility compliance
- ✅ Reduces mouse dependency (RSI prevention)
- ❌ Requires careful focus management
- ❌ Shortcuts can conflict with browser/OS

**Example:**
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(toggleHelp: () => void) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Open command palette logic
      }

      // Help Modal: ?
      if (e.key === "?" && !isInputFocused()) {
        e.preventDefault();
        toggleHelp();
      }

      // Navigate sections: F6
      if (e.key === "F6") {
        e.preventDefault();
        cycleFocusThroughRegions();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleHelp]);
}

// Skip-to-content link (LayoutShell.tsx)
<a href="#main-content" className="skip-to-content">
  Saltar al contenido
</a>

// CSS for skip link (visible on focus only)
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 1rem;
  background: var(--accent);
  color: white;
}

.skip-to-content:focus {
  left: 0;
  top: 0;
}

// ARIA Landmarks
<nav aria-label="Navegación principal">  {/* Sidebar */}
<main role="main" aria-label="Contenido principal">  {/* Main content */}
<aside aria-label="Asistente IA">  {/* Copilot panel */}
```

**Keyboard Shortcuts Table:**
| Shortcut | Action | Implementation |
|----------|--------|----------------|
| Cmd+K | Open command palette | Global event listener |
| ? | Show keyboard shortcuts help | Global event listener |
| Esc | Close modals/panels | Modal component |
| / | Focus search input | Input component |
| F6 | Navigate between regions | Focus management |
| Tab | Navigate interactive elements | Native browser |
| Shift+Tab | Navigate backwards | Native browser |

**AMD Current State:**
- ✅ Cmd+K command palette implemented
- ✅ ? keyboard shortcuts help modal
- ✅ Skip-to-content link in LayoutShell
- ✅ ARIA labels on navigation
- ⚠️ Opportunity: F6 region navigation not implemented

**Sources:** [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/), [WCAG 2.1.1 Keyboard Accessibility](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)

## Data Flow

### Request Flow

```
[User Interaction]
    ↓
[Page Component] → [Convex useQuery/useMutation] → [Convex Backend]
    ↓                       ↓                            ↓
[UI Update] ← [Real-time Subscription] ← [Database Change]
```

**Key Principles:**
1. **Server State:** Managed by Convex (real-time subscriptions)
2. **Client State:** Managed by React hooks (local UI state)
3. **URL State:** Managed by Next.js router (navigation, filters)

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      State Layers                           │
├─────────────────────────────────────────────────────────────┤
│  URL State (Next.js Router)                                 │
│  - Current page, query params, route params                 │
│  - Source of truth for navigation and filters               │
├─────────────────────────────────────────────────────────────┤
│  Server State (Convex Queries)                              │
│  - Database records, agent status, task executions          │
│  - Real-time subscriptions auto-update UI                   │
├─────────────────────────────────────────────────────────────┤
│  Context State (React Context)                              │
│  - Theme (dark/light), active brand, auth status            │
│  - Persisted across navigation (in layout)                  │
├─────────────────────────────────────────────────────────────┤
│  Local State (useState, useReducer)                         │
│  - Modal open/closed, form inputs, accordion expansion      │
│  - Component-scoped, resets on unmount                      │
└─────────────────────────────────────────────────────────────┘
```

**Example Data Flow:**
```typescript
// 1. User navigates to /strategy
// URL State: pathname = "/strategy"

// 2. Page component queries Convex for strategies
const strategies = useQuery(api.cmoEngine.listStrategies);

// 3. User clicks "Generate Strategy"
const generateStrategy = useMutation(api.cmoEngine.generateStrategy);
await generateStrategy({ goal: "Increase LinkedIn engagement" });

// 4. Convex backend processes request, updates database

// 5. Real-time subscription detects change, re-runs query

// 6. Component automatically re-renders with new data
// (No manual refetch needed)
```

### Key Data Flows

1. **Content Creation Flow:**
   ```
   User fills form → Mutation creates content → Query auto-updates list → UI re-renders
   ```

2. **Agent Execution Flow:**
   ```
   User triggers agent → Task created in database → n8n webhook fires → Agent executes → Result saved → UI updates
   ```

3. **Brand Context Flow:**
   ```
   User selects brand → Context updates → All queries include brandId → Pages re-fetch data
   ```

4. **Theme Toggle Flow:**
   ```
   User clicks toggle → Context updates → CSS variables change → UI re-renders with new colors
   ```

## Component Boundaries and Dependencies

### Build Order Recommendations

**Phase 1: Foundation (Week 1)**
Dependencies: None
Components to build:
1. Design token system (CSS variables)
2. UI primitives (Button, Card, Badge, Modal)
3. Layout shell (Sidebar, LayoutShell, MobileNav)
4. Theme provider (useTheme hook)

**Phase 2: Navigation (Week 2)**
Dependencies: Phase 1 (Layout shell, UI primitives)
Components to build:
1. NavGroup component (hierarchical sidebar)
2. CommandPalette component (Cmd+K search)
3. BrandSwitcher updates (if needed)
4. Mobile navigation optimization

**Phase 3: Feature Modules (Week 3-4)**
Dependencies: Phase 1-2 (All foundation and navigation)
Modules to refactor:
1. Strategy module (11 components) - Already well-structured
2. Content module (15 components) - Consolidate similar components
3. Brand module (7 components) - Already well-structured
4. Other modules as needed

**Phase 4: Cross-Cutting Concerns (Week 5)**
Dependencies: Phase 1-3 (All previous phases)
Features to enhance:
1. Keyboard shortcuts (useKeyboardShortcuts enhancement)
2. Accessibility audits (ARIA labels, focus management)
3. Responsive optimizations (breakpoint testing)
4. Performance optimizations (code splitting, lazy loading)

### Component Communication Patterns

**Parent → Child (Props):**
```typescript
<StrategyCard
  strategy={strategy}
  onExecute={handleExecute}
  className="custom-class"
/>
```

**Child → Parent (Callbacks):**
```typescript
function StrategyCard({ onExecute }: { onExecute: (id: Id) => void }) {
  return <button onClick={() => onExecute(strategy._id)}>Execute</button>;
}
```

**Sibling Communication (Lift State Up):**
```typescript
// ❌ Don't use shared global state for siblings
// ✅ Lift state to common parent
function StrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<Id | null>(null);

  return (
    <>
      <StrategyList onSelect={setSelectedStrategy} />
      <StrategyDetail strategyId={selectedStrategy} />
    </>
  );
}
```

**Cross-Feature Communication (Context):**
```typescript
// Only for truly global state (theme, auth, brand)
const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [activeBrand, setActiveBrand] = useState<Id | null>(null);
  return (
    <BrandContext.Provider value={{ activeBrand, setActiveBrand }}>
      {children}
    </BrandContext.Provider>
  );
}
```

## Migration Strategy: Flat to Hierarchical Navigation

### Current State Analysis

**Existing Sidebar:**
- 11 flat navigation items
- No grouping or hierarchy
- Linear list with icons and badges
- 224px width, fixed left position
- Active state indicated by left border + orange text

### Migration Approach

**Step 1: Information Architecture (Day 1)**
- Group related routes into 4 categories:
  1. **Overview**: Home, Reports, Analytics
  2. **Content & Strategy**: Content, Publishing, Strategy
  3. **Operations**: Agents, Tasks, Monitoring
  4. **Settings**: Knowledge Base, Settings

**Step 2: Create NavGroup Component (Day 2)**
```typescript
// components/layout/NavGroup.tsx
export function NavGroup({
  label,
  items,
  defaultExpanded = true
}: NavGroupProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useLocalStorage(
    `nav-group-${label.toLowerCase()}`,
    defaultExpanded
  );

  const hasActiveItem = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  );

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase text-stone-500 hover:text-stone-300"
      >
        <span>{label}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {isExpanded && (
        <div className="space-y-0.5 mt-1">
          {items.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      )}

      {/* Visual indicator for collapsed group with active item */}
      {!isExpanded && hasActiveItem && (
        <div className="h-0.5 bg-orange-500 rounded mt-1" />
      )}
    </div>
  );
}
```

**Step 3: Update Sidebar Component (Day 3)**
```typescript
// components/layout/Sidebar.tsx
const navigationGroups = [
  {
    label: "Overview",
    items: [
      { name: "Home", href: "/", icon: Home, ... },
      { name: "Reportes", href: "/reports", icon: BarChart3, ... },
      { name: "Analíticas", href: "/analytics", icon: TrendingUp, ... },
    ],
  },
  // ... other groups
];

export function Sidebar() {
  return (
    <nav className="...">
      {/* Brand header */}
      <div className="border-b">
        <BrandSwitcher />
        <BrandContextBar />
      </div>

      {/* Hierarchical navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {navigationGroups.map((group) => (
          <NavGroup key={group.label} {...group} />
        ))}
      </div>

      {/* Footer (theme, shortcuts, user) */}
      <div className="...">
        <ThemeToggle />
        <UserMenu />
      </div>
    </nav>
  );
}
```

**Step 4: Testing and Rollout (Day 4-5)**
- Test keyboard navigation (Tab, Arrow keys)
- Test expansion state persistence (localStorage)
- Test mobile responsiveness (groups should work on mobile nav too)
- Gather user feedback on groupings
- Iterate on group labels if needed

### Rollback Plan

If hierarchical navigation doesn't work:
1. Keep both implementations in separate files
2. Use feature flag to toggle between flat and hierarchical
3. Monitor analytics (navigation speed, clicks to reach page)
4. Decide based on data after 1 week

## Responsive Layout Breakpoints

### Breakpoint Strategy

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **xs** (mobile) | < 640px | Stacked layout, hidden sidebar, bottom nav visible, single column grids |
| **sm** (mobile landscape) | 640px - 767px | Stacked layout, hidden sidebar, bottom nav visible, 2-column grids possible |
| **md** (tablet) | 768px - 1023px | Sidebar visible, bottom nav hidden, main content full width (no copilot), 2-3 column grids |
| **lg** (desktop) | 1024px - 1279px | Sidebar visible, copilot panel visible, main content between sidebar and panel, 3-4 column grids |
| **xl** (wide desktop) | 1280px - 1535px | Full layout visible, wider content area (max-w-7xl), 4+ column grids, side-by-side panels |
| **2xl** (ultra-wide) | 1536px+ | Full layout visible, maximum content width, high data density, side-by-side panels |

### Layout Math

**Desktop Layout (1024px+):**
```
Total viewport: 1920px (common desktop)
- Sidebar: 224px (14rem / w-56)
- Main content: calc(100vw - 224px - 320px) = 1376px
- Copilot panel: 320px (20rem / w-80)
- Container max-width: 1280px (max-w-7xl)
- Content padding: 32px (p-8)
```

**Tablet Layout (768px - 1023px):**
```
Total viewport: 1024px (iPad landscape)
- Sidebar: 224px
- Main content: calc(100vw - 224px) = 800px
- No copilot panel (hidden)
- Container max-width: 800px (full width)
- Content padding: 32px (p-8)
```

**Mobile Layout (< 768px):**
```
Total viewport: 375px (iPhone)
- No sidebar (hidden)
- Main content: 100vw
- Bottom nav: 64px height (h-16)
- Container max-width: 375px (full width)
- Content padding: 16px (p-4)
- Bottom padding: 80px (pb-20) to avoid nav overlap
```

### Responsive Component Behavior

```typescript
// Example: Stats grid responsive behavior
<div className={cn(
  "grid gap-4",
  "grid-cols-1",          // xs, sm: 1 column
  "md:grid-cols-2",       // md: 2 columns
  "lg:grid-cols-3",       // lg: 3 columns
  "xl:grid-cols-4",       // xl, 2xl: 4 columns
)}>
  <StatsCard />
  <StatsCard />
  <StatsCard />
  <StatsCard />
</div>

// Example: Sidebar collapse behavior
<aside className={cn(
  "fixed left-0 top-0 h-screen w-56",
  "hidden md:flex",  // Hidden on mobile, visible tablet+
  "flex-col bg-[#1c1917] border-r border-[#44403c]"
)} />

// Example: Mobile nav visibility
<nav className={cn(
  "fixed bottom-0 left-0 right-0 z-50",
  "md:hidden",  // Visible on mobile, hidden tablet+
  "flex h-16 items-center justify-around bg-[#1c1917]"
)} />

// Example: Copilot panel progressive disclosure
<aside className={cn(
  "fixed right-0 top-0 h-screen w-80",
  "hidden lg:flex",  // Hidden until 1024px+
  "flex-col bg-[var(--surface-1)] border-l border-[var(--border)]"
)} />
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Component Kitchen Sink

**What people do:** Create one giant component with multiple responsibilities (data fetching, business logic, UI rendering, state management).

**Why it's wrong:** Makes components hard to test, reuse, and maintain. Violates single responsibility principle.

**Do this instead:**
```typescript
// ❌ Bad: Everything in one component
function StrategyPage() {
  // 500 lines of code...
  // Data fetching, business logic, UI, event handlers all mixed
}

// ✅ Good: Separation of concerns
function StrategyPage() {
  const strategies = useQuery(api.cmoEngine.listStrategies);
  const [selectedId, setSelectedId] = useState<Id | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <StrategyList
        strategies={strategies}
        onSelect={setSelectedId}
      />
      <StrategyDetail strategyId={selectedId} />
    </div>
  );
}

// Each component has single responsibility
function StrategyList({ strategies, onSelect }) { /* ... */ }
function StrategyDetail({ strategyId }) { /* ... */ }
```

---

### Anti-Pattern 2: Prop Drilling Hell

**What people do:** Pass props through 5+ levels of components to reach deeply nested child.

**Why it's wrong:** Makes refactoring brittle. Intermediate components become unnecessarily complex.

**Do this instead:**
```typescript
// ❌ Bad: Prop drilling
<Layout theme={theme}>
  <Sidebar theme={theme}>
    <NavGroup theme={theme}>
      <NavItem theme={theme} />  {/* Finally used here */}
    </NavGroup>
  </Sidebar>
</Layout>

// ✅ Good: Context for deeply shared state
const ThemeContext = createContext<Theme | null>(null);

function Layout({ children }) {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function NavItem() {
  const { theme } = useTheme();  // Direct access, no drilling
  // ...
}
```

**When to use each:**
- Props: 1-2 levels deep, component-specific data
- Context: 3+ levels deep, truly global state (theme, auth, brand)
- Avoid: Context for everything (overkill, performance issues)

---

### Anti-Pattern 3: Layout in Every Page

**What people do:** Repeat layout code (sidebar, header, footer) in every page component.

**Why it's wrong:** Causes re-mounts on navigation, DRY violation, layout state doesn't persist.

**Do this instead:**
```typescript
// ❌ Bad: Layout repeated in every page
export default function StrategyPage() {
  return (
    <>
      <Sidebar />  {/* Repeated */}
      <main>
        {/* Strategy content */}
      </main>
    </>
  );
}

// ✅ Good: Layout in Next.js layout.tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return <LayoutShell>{children}</LayoutShell>;
}

// app/(dashboard)/strategy/page.tsx
export default function StrategyPage() {
  // Just the page content, layout auto-wraps
  return <div>{/* Strategy content */}</div>;
}
```

**Benefits:**
- Sidebar renders once, preserves state
- No flicker on navigation
- Central place to update layout

---

### Anti-Pattern 4: Hardcoded Colors Instead of Tokens

**What people do:** Use Tailwind arbitrary values or hex codes directly in components.

**Why it's wrong:** Theme changes require find-replace across 200+ files. Dark mode breaks. Brand customization impossible.

**Do this instead:**
```typescript
// ❌ Bad: Hardcoded colors
<div className="bg-gray-100 text-gray-900 border-gray-200">

// ❌ Also bad: Arbitrary values
<div className="bg-[#f5f0eb] text-[#1c1917] border-[#e7e5e4]">

// ✅ Good: Semantic tokens
<div className="bg-[var(--surface-1)] text-[var(--text-primary)] border-[var(--border)]">

// ✅ Even better: Tailwind config with custom utilities
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'text-primary': 'var(--text-primary)',
      },
    },
  },
};

// Then use standard Tailwind classes
<div className="bg-surface-1 text-primary border-border">
```

---

### Anti-Pattern 5: Unmaintainable Navigation Structure

**What people do:** Hardcode navigation items directly in JSX with no abstraction.

**Why it's wrong:** Adding/removing/reordering routes requires editing JSX. Permissions logic becomes spaghetti. Can't share nav config with mobile nav.

**Do this instead:**
```typescript
// ❌ Bad: Inline navigation
<nav>
  <Link href="/">Home</Link>
  <Link href="/content">Content</Link>
  <Link href="/strategy">Strategy</Link>
  {/* 50 more inline links... */}
</nav>

// ✅ Good: Data-driven navigation
const navigationConfig = [
  { name: "Home", href: "/", icon: Home, roles: ["all"] },
  { name: "Content", href: "/content", icon: FileText, roles: ["editor", "admin"] },
  { name: "Strategy", href: "/strategy", icon: Brain, roles: ["admin"] },
];

function Sidebar() {
  const user = useUser();
  const filteredNav = navigationConfig.filter((item) =>
    item.roles.includes("all") || item.roles.includes(user.role)
  );

  return (
    <nav>
      {filteredNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}
```

**Benefits:**
- Single source of truth for routes
- Easy to add permissions logic
- Can reuse config for mobile nav, command palette, sitemap
- Can externalize to JSON/database

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Convex** | Real-time subscriptions via useQuery/useMutation | Already integrated, no changes needed |
| **Clerk** | Auth provider wraps app, useUser hook | Already integrated, dev bypass available |
| **Vercel** | Static generation + edge middleware | Already configured in next.config |
| **n8n** | Webhook-triggered workflows | Backend integration, no frontend changes |
| **Claude API** | Convex actions call API server-side | Backend integration, no frontend changes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Layout ↔ Pages** | Children prop, context providers | Layout wraps pages, provides theme/brand context |
| **Sidebar ↔ Pages** | URL state (pathname) | Sidebar reads pathname for active state, doesn't control pages |
| **Command Palette ↔ Router** | Next.js router.push() | Command palette triggers navigation, doesn't own routes |
| **Copilot ↔ Pages** | Context awareness via URL | Copilot reads pathname to provide context-relevant suggestions |
| **Feature Components ↔ Convex** | Direct queries, no middleware | Each component queries Convex independently |

## Scalability Considerations

| Concern | At 100 components | At 200 components (current) | At 500 components |
|---------|-------------------|----------------------------|-------------------|
| **Component Organization** | Flat structure OK | Feature-based folders required | Sub-feature folders, barrel exports |
| **Bundle Size** | Single bundle OK | Code splitting by route recommended | Lazy loading for modals, dynamic imports |
| **Re-renders** | No optimization needed | Memoization for expensive components | Virtual scrolling for lists, windowing |
| **State Management** | Local state + Context OK | Current approach sufficient | Consider Zustand for complex cross-feature state |
| **Testing** | Unit tests sufficient | Integration tests for key flows | E2E tests, visual regression tests |

## Performance Optimizations

### Code Splitting Strategy

```typescript
// ✅ Lazy load heavy modals
const EditContentModal = dynamic(
  () => import("@/components/content/EditContentModal"),
  { ssr: false }
);

// ✅ Lazy load copilot panel (not needed on initial load)
const CopilotSidebar = dynamic(
  () => import("@/components/copilot/CopilotSidebar"),
  { ssr: false }
);

// ✅ Lazy load charts (heavy dependency: recharts)
const LineChart = dynamic(
  () => import("@/components/charts/LineChart"),
  { loading: () => <ChartSkeleton /> }
);
```

### Memoization Examples

```typescript
// ✅ Memoize expensive calculations
const filteredStrategies = useMemo(() => {
  return strategies?.filter((s) => s.status === "executing") ?? [];
}, [strategies]);

// ✅ Memoize callbacks passed to children
const handleExecute = useCallback((strategyId: Id) => {
  executeMutation({ strategyId });
}, [executeMutation]);

// ✅ Memoize components with expensive rendering
const StrategyCard = memo(function StrategyCard({ strategy }: Props) {
  return <div>{/* Complex rendering */}</div>;
});
```

## Sources

**High Confidence (Official Docs + Context7):**
- [Next.js App Router Layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [React Component Patterns](https://react.dev/learn/describing-the-ui)
- [shadcn/ui Architecture](https://ui.shadcn.com/)
- [PatternFly Navigation Guidelines](https://www.patternfly.org/components/navigation/design-guidelines/)

**Medium Confidence (Design System Resources):**
- [Nielsen Norman Group: Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/)
- [Feature-Sliced Design: Design Tokens](https://feature-sliced.design/blog/design-tokens-architecture)
- [Penpot Developer's Guide to Design Tokens](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [LogRocket: Next.js Layouts Guide](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/)

**Medium Confidence (Best Practices):**
- [React Dashboard Project Structure](https://srobbin01.medium.com/react-admin-panel-dashboard-project-structure-best-practice-starter-kit-13fa5b3a71e7)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [WCAG 2.1.1 Keyboard Accessibility](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)
- [Material Design Navigation Patterns](https://m1.material.io/patterns/navigation.html)

---

**Architecture research for:** AI Marketing Department (AMD) SaaS Dashboard
**Researched:** 2026-02-15
**Current component count:** 204 components across 29 folders
**Target state:** Hierarchical navigation, feature-based organization, optimized for 500+ components
