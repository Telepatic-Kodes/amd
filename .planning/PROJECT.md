# AMD — AI Marketing Department

## What This Is

AMD is a system of 37 AI agents organized in 6 departments that automate marketing workflows. The dashboard lets non-technical users manage a complete marketing department — from brand configuration and agent management, to multi-platform content publishing (LinkedIn, Twitter/X, Instagram), team collaboration with role-based permissions, analytics with real engagement data, and automated performance reports. Three milestones shipped: v1.0 simplified the interface, v2.0 made the system fully operational, and v3.0 added multi-user auth, multi-platform intelligence, and team collaboration.

## Core Value

**Non-technical users can manage a complete marketing department in minutes, not hours. Simplicity enables adoption.**

When tradeoffs arise, prioritize reducing friction and cognitive load over advanced features. Technical jargon gets replaced with plain language. Complex workflows get collapsed into 1-click actions. Setup time matters more than customization options.

## Requirements

### Validated

- Authentication & multi-user with Clerk (login, signup, session, data isolation) — v3.0
- 6-role RBAC (owner, admin, editor, reviewer, publisher, viewer) with server-side enforcement — v3.0
- Analytics dashboards (internal metrics + LinkedIn real engagement data + date filtering + CSV export) — v3.0
- Multi-platform publishing: LinkedIn OAuth + Twitter/X PKCE + Instagram Business API — v3.0
- Cross-platform batch publishing with unified timeline and side-by-side previews — v3.0
- Content version history with automatic snapshots, diff, and rollback — v3.0
- Automated weekly/monthly reports with AI narrative and email delivery — v3.0
- Control Center with real-time agent monitoring (37 agents) — v2.0
- Content Pipeline with Kanban board, drag-and-drop, scheduling — v2.0
- LinkedIn Integration with OAuth 2.0, publishing, preview — v2.0
- Guided UX (wizard, next-action, tooltips, quick mode, setup progress) — v2.0
- Navigation simplified (10 to 4 items in Spanish) — v1.0
- Onboarding reduced (6 to 3 steps, <2 min setup) — v1.0
- Feed templates system (10 pre-configured industry bundles) — v1.0
- Full Spanish translation (100% of UI) — v1.0
- Rich text editor (TipTap WYSIWYG with formatting and export) — v1.0
- File upload & import (PDF/DOCX/TXT parsing with preview) — v1.0
- Product tour (interactive 7-step tutorial) — v1.0
- Design polish (spacing, typography, visual hierarchy) — v1.0
- Mobile responsiveness (touch-friendly, WCAG 2.1 compliance) — v1.0

### Active

- [ ] Vercel production deployment with environment configs and domain setup
- [ ] Full CI/CD pipeline (GitHub Actions: lint, typecheck, tests, staging preview, production deploy with rollback)
- [ ] Error resilience (error boundaries, retry logic, graceful degradation, Sentry monitoring)
- [ ] Performance optimization (page load, image optimization, caching, API response times)
- [ ] Full UX audit (every page, every state, mobile breakpoints, empty states, loading skeletons, accessibility, translations)

### Out of Scope

- TikTok / YouTube publishing — Focus on LinkedIn, Twitter/X, Instagram for v3.0; consider for v4.0
- Collaborative real-time editing — Requires CRDT; high complexity, defer to v4.0+
- Multilingual (i18n framework) — Spanish-only continues; i18n deferred
- Dark mode / theming — Deferred, not core to UX clarity problem
- Custom workflow builder — Sensible defaults preferred over configuration
- Video post publishing — Platform video APIs add significant complexity
- Agent customization UI — Stays in backend configuration

## Context

**What Exists (v3.0 Shipped):**
- Backend: 37 pre-configured AI agents in Convex (fully functional)
- Frontend: Next.js 16 + React 19 + Tailwind 4 (complete dashboard)
- Database: Convex real-time backend with Clerk authentication
- Auth: Clerk multi-user with 6-role RBAC
- Publishing: LinkedIn, Twitter/X, Instagram with cross-platform batch publish
- Analytics: Internal metrics + LinkedIn engagement + automated reports
- Codebase: ~223,000 LOC TypeScript/React
- User Base: Non-technical marketers using simplified interface

**Key Insights Across 3 Milestones:**
- Spanish-first UI dramatically improved user comprehension and confidence
- 1-click feed templates eliminated #1 friction point
- Defense-in-depth auth (every Convex function checks independently) is the right pattern
- Pure TypeScript shared modules (no Convex imports) enable code reuse across frontend/backend
- Promise.allSettled for batch operations (one failure doesn't block others)
- Dynamic TTL caching (hot/warm/cold) optimizes API usage without complexity

## Constraints

- **Technology:** Next.js 16 + React 19 + Tailwind 4 + Convex + Clerk (locked in)
- **Language:** 100% Spanish for UI (user base requirement)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile:** Must function on mobile (responsive design, touch targets >44px)
- **Database:** Convex backend (no changes to existing agent system)
- **External Dependencies:**
  - Instagram App Review: 60-90 day approval timeline (pending)
  - Twitter API: Free tier write-only; Basic tier ($200/mo) needed for analytics
  - OAuth tokens: LinkedIn 365d, Instagram 60d, Twitter variable expiry

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spanish-first UI | User base is Spanish-speaking, non-technical | Good |
| 4-item navigation | 10 items too overwhelming | Good |
| 1-click feed setup (templates) | Manual selection is expert-mode friction | Good |
| 3-step onboarding | 6 steps was abandonment cliff | Good |
| TipTap for rich text | Modern React 19 support, extensible | Good |
| Clerk over Convex Auth | Production-ready, free 10K MAU, official Convex integration | Good |
| Direct platform SDKs | twitter-api-v2, facebook-nodejs-business-sdk (not wrappers) | Good |
| In-memory analytics aggregation | No @convex-dev/aggregate dependency; simpler | Good |
| Dynamic TTL caching | Hot <48h/30min, warm 2-14d/4h, cold >14d/24h | Good |
| Twitter PKCE flow | Secure OAuth 2.0 with code_verifier | Good |
| Instagram via Facebook OAuth | Business API requires Page linking | Good |
| Pure TS shared adapter | No Convex imports, works in both environments | Good |
| Promise.allSettled for batch | One platform failure doesn't block others | Good |
| 6-role RBAC hierarchy | owner > admin > editor > reviewer > publisher > viewer | Good |
| Sequential version numbering | Simple, human-readable (1, 2, 3...) | Good |
| Client-side text diffing | Backend provides snapshots; diffing on client for perf | Good |
| Runtime split for Node.js | reports.ts (V8) + reportsActions.ts (Node.js) for Convex | Good |
| Dark theme email templates | Match dashboard UI for brand consistency | Good |
| AI narrative optional | User setting (default: true) for cost control | Good |

## Current Milestone: v4.0 Production Readiness

**Goal:** Take AMD from "works in dev" to "ready for real paying clients" — deploy, harden, optimize, and polish every surface.

**Target features:**
- Vercel production deployment with domain, SSL, environment configs
- Full CI/CD pipeline (GitHub Actions: lint + typecheck + test + staging preview + production deploy + rollback)
- Error resilience (error boundaries, retry logic, Sentry free tier, graceful degradation)
- Performance optimization (Lighthouse >90, image optimization, caching, lazy loading)
- Full UX audit (every page, every state, every breakpoint — no rough edges for real users)

## Previous Milestones

- v1.0 UX Simplification (shipped 2026-01-30, 8 phases, 19 plans, 29 requirements)
- v2.0 UX/UI Excellence (shipped 2026-02-05, 4 phases, 6 plans, 24 requirements)
- v3.0 Intelligence & Scale (shipped 2026-02-07, 6 phases, 20 plans, 41 requirements)

---

*Last updated: 2026-02-09 after v4.0 milestone initialization*
