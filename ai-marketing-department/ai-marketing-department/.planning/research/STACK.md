# Stack Research: Linear/Notion-Inspired SaaS Dashboard UX

**Domain:** UX/UI Redesign for SaaS Dashboard
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

The 2025/2026 standard for premium, keyboard-first SaaS dashboards has converged around a mature, performance-focused stack that prioritizes developer experience, bundle size, and accessibility. The Linear/Notion aesthetic is achieved through **minimal component primitives** (Radix UI or shadcn/ui), **physics-based micro-animations** (Framer Motion or AutoAnimate), and **keyboard-first interactions** (cmdk + react-hotkeys-hook or TanStack Hotkeys).

**Key Finding:** shadcn/ui has become the de facto standard for new projects because it provides component **ownership** rather than package dependencies—you copy the code into your project and control every line. This aligns perfectly with the "minimal, clean" aesthetic because you only include what you need.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.x | App framework (existing) | You already use this; Next.js 16 with React 19 is production-ready and stable |
| **React** | 19.x | UI library (existing) | Already in place; works seamlessly with all recommended libraries |
| **Tailwind CSS** | 4.x | Styling (existing) | Tailwind v4 introduces `@theme` for design tokens, making it perfect for consistent minimal aesthetics |
| **TypeScript** | 5.x+ | Type safety | Essential for keyboard shortcuts, command palettes, and complex state—prevents runtime errors |

### Animation & Interaction

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **Framer Motion** | 12.x | Primary animation library | Industry standard for smooth micro-interactions. Physics-based springs feel natural. 60fps performance. Used by Linear, Vercel, and top SaaS products. Tree-shakeable. |
| **AutoAnimate** | 1.x | Drop-in animations | 2.5kb library for automatic DOM change animations. Perfect for 90% of UI interactions (dropdowns, lists, tabs) where you want premium feel without configuration. Use alongside Framer Motion for zero-config needs. |

**Rationale:** Keep Framer Motion for hero animations, page transitions, and complex interactions. Add AutoAnimate for standard UI elements that just need to "feel right" with zero setup.

**Alternative Considered:** React Spring (29k stars, physics-based) is excellent for complex spring animations but has steeper learning curve. GSAP is industry-standard for timeline animations but adds 40kb. Stick with Framer Motion for your use case.

### Command Palette & Keyboard Shortcuts

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **cmdk** | 1.1.1+ | Command palette UI | Built by Paco Coursey (Vercel). Used by Vercel, Linear, and Raycast. Handles 2,000-3,000 items efficiently. Unstyled—perfect for minimal aesthetic. High source reputation (94.6 benchmark score). |
| **react-hotkeys-hook** | 4.x | Global keyboard shortcuts | Declarative React hook for keyboard shortcuts. Supports scopes (prevents conflicts), focus trapping, key sequences. 86.9 benchmark score. Production-ready with 325+ code examples. Better React integration than vanilla hotkeys.js. |

**Alternative Considered:** TanStack Hotkeys is newer (432 code examples, 94.1 benchmark score) and fully type-safe with template-string bindings. Production-ready but less battle-tested than react-hotkeys-hook. Consider TanStack Hotkeys if you need advanced cross-platform Mod key handling or are already using other TanStack libraries.

### Component Primitives & Design System

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **shadcn/ui** | Latest | Component collection (existing) | You already use this. Continue using it. It's built on Radix Primitives + Tailwind + CVA. Provides ownership model—copy/paste components into your codebase. 2026 standard for new React projects. |
| **Radix UI Primitives** | Latest | Headless components | Already part of shadcn/ui. Radix provides accessibility, keyboard navigation, and focus management. Don't install separately unless building custom components. |
| **class-variance-authority** | Latest | Variant management | Already part of shadcn/ui. CVA provides declarative API for component variants (sizes, colors, states). Expressive and works perfectly with Tailwind. |
| **Lucide React** | Latest | Icon library (existing) | Continue using. Consistent with Linear/Notion aesthetic—minimal, clean SVG icons. |

**Do NOT Install:** Radix Themes. It's a pre-styled component library that conflicts with shadcn/ui's approach. You'd lose the ownership model and minimal control you need.

### Navigation & Layout

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Vaul** | 1.1.2+ | Drawer/sheet component | For mobile-responsive drawers (side panels, detail views). Built on Radix Dialog. Used by Vercel in production. Physics-based gestures, snap points, keyboard accessible. Already integrated with shadcn/ui Drawer component. |
| **react-resizable-panels** | Latest | Split pane layouts | For IDE-like UIs, resizable sidebars, or inspector panes. Keyboard accessible, supports persistence, smooth interactions. Use if you need Linear-style resizable panels. |

### State Management

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zustand** | 5.x | Client state | 3kb library. Single store approach. Perfect for interconnected state (UI preferences, keyboard shortcuts, command palette state). Use for global client state that doesn't come from server. |
| **nuqs** | Latest | URL state | Type-safe URL query params as React state. 6kb. Used by Sentry, Supabase, Vercel. Perfect for filters, tabs, search—any state that should persist in URL. Works seamlessly with Next.js 16 app router. |

**Do NOT Use:** Redux/Redux Toolkit for a 204-component dashboard unless you have deeply interconnected state. Zustand is sufficient. Jotai is excellent but adds complexity you don't need.

### Form Validation

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **react-hook-form** | 7.x | Form state | Minimal re-renders, excellent DX, integrates with Zod. Already standard in shadcn/ui form patterns. |
| **Zod** | 3.x | Schema validation | TypeScript-first validation. Schemas serve as both runtime validators and TS types. Seamless integration with react-hook-form via @hookform/resolvers. |

### Notifications & Feedback

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **Sonner** | Latest | Toast notifications | Modern, opinionated toast component. Built for React 18+. Used by OpenAI, Sonos, Adobe. Lightweight, customizable. Integrates with shadcn/ui. Better DX than react-hot-toast. |

### Data Visualization & Tables

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Recharts** | Latest | Charts (existing) | Continue using for dashboard visualizations. Wraps D3 in idiomatic React components. Good for standard charts. |
| **TanStack Table** | 8.x | Data tables | Headless table state management. Use if you need advanced tables (multi-sort, pagination, filtering). Provides logic, you control UI. Maximum flexibility for clean aesthetic. |
| **TanStack Virtual** | 3.x | List virtualization | Use only if rendering 1,000+ items in lists/tables. 10-15kb. Headless—full control over markup. Supports vertical, horizontal, and grid virtualization. |

### Utilities

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **date-fns** | 3.x | Date formatting | Tree-shakeable (imports one function per file). Functional syntax. Better for dashboards with analytics/reporting. 2kb final bundle for typical usage. |
| **next-themes** | Latest | Dark mode | 2 lines for perfect dark mode. No flash on load (SSR/SSG). System setting support. Tab synchronization. Standard for Next.js. |
| **clsx** / **tailwind-merge** | Latest | Class name utilities | clsx for conditional classes, tailwind-merge for de-duplicating Tailwind classes. Essential for clean component APIs with Tailwind. |

## Installation

```bash
# Animation
npm install framer-motion @formkit/auto-animate

# Command Palette & Keyboard
npm install cmdk react-hotkeys-hook

# State Management
npm install zustand nuqs

# Forms
npm install react-hook-form zod @hookform/resolvers

# Notifications
npm install sonner

# Navigation & Layout (optional - install only if needed)
npm install vaul react-resizable-panels

# Data Tables (optional - install only if needed)
npm install @tanstack/react-table @tanstack/react-virtual

# Utilities
npm install date-fns next-themes clsx tailwind-merge

# Dev Dependencies (TypeScript types)
npm install -D @types/node
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Animation | Framer Motion + AutoAnimate | React Spring | If you need precise physics control for complex interactions or mobile gestures. React Spring gives you finer control but steeper learning curve. |
| Animation | Framer Motion | GSAP | If you need professional-grade scroll animations or timeline-driven sequences. GSAP is battle-tested but adds 40kb and uses imperative API. |
| Command Palette | cmdk | react-cmdk | If you need a batteries-included solution with built-in theming. But cmdk is more flexible and lighter. |
| Keyboard Shortcuts | react-hotkeys-hook | TanStack Hotkeys | If you need advanced cross-platform Mod key handling or are already using TanStack ecosystem. Both are production-ready. |
| Component Library | shadcn/ui | Radix Themes | If you want pre-styled components for rapid prototyping. But you lose ownership model and minimal control. Not recommended for custom aesthetics. |
| State Management | Zustand | Jotai | If you need fine-grained reactivity with atom-level updates. Jotai minimizes re-renders but adds complexity. Zustand is simpler for your use case. |
| Date Library | date-fns | day.js | If you prefer chaining syntax (moment.js style). day.js is 2kb but date-fns is more tree-shakeable and better for dashboards. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Radix Themes** | Pre-styled components conflict with shadcn/ui's ownership model. You'd be locked into their design system and lose the minimal, clean control you need. | shadcn/ui (already using) |
| **Redux / Redux Toolkit** | Overkill for a dashboard redesign. Adds boilerplate, learning curve, and complexity you don't need. React 19 + Zustand handles 99% of use cases. | Zustand for global state, nuqs for URL state |
| **Moment.js** | Deprecated. 67kb bundle size. No tree-shaking. | date-fns or day.js |
| **Ant Design / Material UI** | Heavy component libraries with opinionated designs. You can't achieve Linear/Notion minimal aesthetic with these. They add 200kb+. | shadcn/ui (already using) |
| **react-window / react-virtuoso** | Older virtualization libraries. TanStack Virtual is more modern with better DX. | TanStack Virtual (only if needed) |
| **@apply in Tailwind** | Tailwind v4 discourages @apply. Use explicit CSS properties for better IDE support and debugging. | Tailwind utility classes directly |

## Stack Patterns by Variant

**If building keyboard-first power user features:**
- Use cmdk for command palette (⌘K)
- Use react-hotkeys-hook for global shortcuts with scopes
- Use nuqs to make shortcuts shareable via URL
- Document all shortcuts in a help modal (shadcn/ui Dialog)

**If building mobile-responsive views:**
- Use Vaul for bottom sheets and drawers (already in shadcn/ui)
- Use Framer Motion's drag gestures for swipe interactions
- Use responsive Tailwind breakpoints (`md:`, `lg:`)

**If building data-heavy dashboards:**
- Use TanStack Table for advanced tables (multi-sort, filters)
- Use TanStack Virtual only if rendering 1,000+ rows
- Use Recharts for standard charts, consider TanStack Charts if you need custom visualizations

**If building settings/preferences:**
- Use react-hook-form + Zod for type-safe forms
- Use Zustand to persist preferences across sessions
- Use next-themes for dark mode toggle

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Framer Motion 12.x | React 19.x | Fully compatible. Use latest 12.x version. |
| cmdk 1.x | React 18+, Next.js 14-16 | Production-ready. Used by Vercel. |
| react-hotkeys-hook 4.x | React 18+, React 19 | Supports concurrent mode. |
| shadcn/ui | Radix Primitives, Tailwind 3-4 | Already integrated. Works with Tailwind v4. |
| Zustand 5.x | React 18+, React 19 | Zero dependencies. Works with server components. |
| nuqs | Next.js 14.2.0+ | Tested against every Next.js release. |
| TanStack Table 8.x | React 18+, React 19 | Headless—fully compatible. |

## Design Token Strategy (Tailwind v4)

Tailwind v4 introduces `@theme` for CSS-first design tokens. For your minimal aesthetic:

```css
@theme {
  /* Colors - minimal palette */
  --color-gray-950: #0a0a0a;
  --color-gray-900: #1a1a1a;
  --color-gray-50: #fafafa;

  /* Spacing - consistent rhythm */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;

  /* Typography - Linear-inspired */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;

  /* Animations - minimal durations */
  --duration-fast: 150ms;
  --duration-base: 200ms;
}
```

**Benefits:**
- Tokens are portable, inspectable in DevTools, overridable at runtime
- No JavaScript config file sprawl
- Browser exposes them as CSS variables
- Works seamlessly with shadcn/ui and CVA

## Performance Considerations

**Bundle Size (Production):**
- Framer Motion: ~40kb (tree-shakeable)
- AutoAnimate: 2.5kb
- cmdk: ~8kb
- react-hotkeys-hook: ~5kb
- Zustand: 3kb
- nuqs: 6kb
- date-fns: ~2kb (typical usage after tree-shaking)
- **Total added:** ~66kb (minimal impact)

**Optimization Strategies:**
1. **Code splitting:** Dynamic import command palette and heavy components
2. **Tree shaking:** Import only what you need from date-fns, Framer Motion
3. **Virtualization:** Use TanStack Virtual only for 1,000+ item lists
4. **Animation:** Use AutoAnimate for 90% of interactions, Framer Motion for hero moments

## Sources

### Context7 (HIGH Confidence)
- `/grx7/framer-motion` — Animation patterns, performance best practices
- `/pacocoursey/cmdk` — Command palette integration, keyboard shortcuts
- `/websites/radix-ui_primitives` — Headless component patterns
- `/johannesklauss/react-hotkeys-hook` — Scope management, keyboard shortcuts
- `/tanstack/hotkeys` — Type-safe keyboard shortcuts alternative

### Official Documentation (HIGH Confidence)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) — `@theme` design tokens, best practices
- [Framer Motion Latest](https://www.npmjs.com/package/framer-motion) — Version 12.34.0 (Feb 2026)
- [cmdk Latest](https://www.npmjs.com/package/cmdk) — Version 1.1.1
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) — Accessibility, customization

### Web Search (MEDIUM-HIGH Confidence)
- [SaaSIndie: Radix Themes vs shadcn/ui Comparison 2026](https://saasindie.com/blog/shadcn-vs-radix-themes-comparison) — shadcn/ui ownership model advantages
- [Syncfusion: React Animation Libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries) — AutoAnimate vs Framer Motion vs React Spring
- [LogRocket: Best React Animation Libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — Performance comparisons
- [Medium: react-keyboard-shortcuts Jan 2026](https://medium.com/@amarkanala/introducing-react-keyboard-shortcuts-clean-performant-hook-based-keyboard-shortcuts-for-modern-f9edefbf92bb) — New hook-based library
- [FrontendTools: Tailwind Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) — Design token strategies
- [Medium: Tailwind v4 @theme Guide](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06) — CSS-first design tokens
- [Knock: React Notification Libraries 2026](https://knock.app/blog/the-top-notification-libraries-for-react) — Sonner recommendations
- [InfoQ: nuqs React Advanced 2025](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) — Type-safe URL state management
- [Better Stack: Zustand vs Redux vs Jotai](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux-toolkit-vs-jotai/) — State management comparisons
- [Nucamp: State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) — React 19 patterns
- [GitHub: Vaul Repository](https://github.com/emilkowalski/vaul) — Drawer component (7.4k stars)
- [shadcn/ui: Sonner](https://ui.shadcn.com/docs/components/radix/sonner) — Toast integration
- [TanStack Virtual](https://github.com/TanStack/virtual) — Virtualization for large lists
- [GitHub: react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) — Split pane layouts

---

**Research Notes:**
- All version numbers verified against npm registry or official sources (Feb 2026)
- Recommendations prioritize ownership model, bundle size, and keyboard-first UX
- Stack is optimized for 204-component frontend-only redesign with no backend changes
- Target aesthetic: Linear/Notion — minimal, clean, keyboard-first
- All libraries are production-ready and battle-tested by major SaaS companies

**Confidence Assessment:**
- Animation libraries: HIGH (Context7 + official docs + battle-tested)
- Command palette: HIGH (Context7 + used by Vercel/Linear)
- Keyboard shortcuts: HIGH (Context7 + multiple authoritative sources)
- Component primitives: HIGH (already using shadcn/ui, confirmed 2026 standard)
- State management: MEDIUM-HIGH (web search + community consensus)
- Utilities: HIGH (official docs + npm registry)
