# AMD UX Redesign

## What This Is

A comprehensive UX/UI redesign of the AI Marketing Department (AMD) dashboard — a SaaS platform where agencies and consultants manage automated marketing for multiple client brands using 37 AI agents. The redesign transforms the current cluttered navigation into a Linear/Notion-inspired minimal, clean, keyboard-first experience.

## Core Value

Every page has a clear purpose and every action is reachable in 2 clicks or less — agencies can manage multiple brands without getting lost.

## Requirements

### Validated

- ✓ Multi-brand support with brand context switching — existing
- ✓ Dashboard with overview metrics — existing
- ✓ Agent management (37 agents across 6 departments) — existing
- ✓ Content creation, editing, and publishing workflow — existing
- ✓ Strategy generation with CMO engine (goal input, autopilot) — existing
- ✓ Brand profile management and brand audit — existing
- ✓ Analytics and reporting — existing
- ✓ Settings and configuration — existing
- ✓ Dark mode / theme support via CSS variables — existing
- ✓ Authentication via Clerk — existing
- ✓ Real-time data via Convex — existing
- ✓ Content pillars, funnel coverage, TAYA analysis — existing
- ✓ Org chart visualization — existing

### Active

- [ ] Reorganize sidebar navigation with logical grouping
- [ ] Simplify page layouts — reduce information density per view
- [ ] Redesign visual identity — Linear/Notion-inspired minimal aesthetic
- [ ] Improve page-to-page flow (clear paths between related actions)
- [ ] Consistent component design system across all pages
- [ ] Keyboard-first navigation and shortcuts
- [ ] Responsive improvements for all breakpoints

### Out of Scope

- New features or functionality — this is purely UX/UI improvement
- Backend/Convex schema changes — frontend only
- New pages — all existing pages stay, just reorganized
- Mobile native app — web responsive only

## Context

The AMD app currently has 204 React components across ~10 dashboard pages. The navigation uses a sidebar with flat structure (Dashboard, Agents, Content, Strategy, Analytics, Settings, Org Chart). Pages like Strategy already received a tab-based redesign but other pages still have inconsistent layouts, hardcoded colors, and overwhelming information density.

The app serves agencies managing multiple client brands. Each brand has its own profile, strategy, content, and analytics. The brand switcher exists but the overall navigation doesn't reflect the multi-brand workflow well.

Current tech: Next.js 16, React 19, Tailwind 4, Convex backend, Clerk auth, Lucide icons, Framer Motion, shadcn/ui components.

The strategy page was recently redesigned with CSS variable theming, proper tab organization, and consistent component patterns — this should serve as the reference standard for all other pages.

## Constraints

- **Tech stack**: Must use existing Next.js 16 + Tailwind 4 + shadcn/ui stack
- **Backend**: No Convex schema changes — frontend-only redesign
- **Compatibility**: Must maintain all existing functionality
- **Theming**: Must use CSS variable system (var(--surface-0), var(--border), etc.) for dark mode
- **Performance**: No regression in page load or interaction speed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Linear/Notion as visual reference | User prefers minimal, clean, keyboard-first aesthetic | — Pending |
| All pages stay (no removal) | User confirmed all pages are necessary | — Pending |
| Frontend-only changes | Minimize risk, focus on UX improvements | — Pending |
| Strategy page as reference standard | Already redesigned with proper theming and organization | — Pending |

---
*Last updated: 2026-02-15 after initialization*
