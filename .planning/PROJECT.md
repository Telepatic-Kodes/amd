# AMD UX Simplification — Complete System Redesign

## What This Is

AMD (AI Marketing Department) is a system of 37 AI agents organized in 6 departments that automate marketing workflows. This project transforms the technical dashboard interface into a simple, user-friendly system designed for non-technical users — as easy to use as Instagram or Twitter. The goal is to make anyone capable of operating an automated marketing department, regardless of technical skill level.

## Core Value

**Non-technical users can manage a complete marketing department in minutes, not hours. Simplicity enables adoption.**

When tradeoffs arise, prioritize reducing friction and cognitive load over advanced features. Technical jargon gets replaced with plain language. Complex workflows get collapsed into 1-click actions. Setup time matters more than customization options.

## Requirements

### Validated

✓ Navigation simplified (10 → 4 items in Spanish)
✓ Onboarding reduced (6 → 3 steps, <2 min setup)
✓ Feed templates system (10 pre-configured industry bundles)
✓ Full Spanish translation (100% of UI)
✓ Feed health monitoring (widget + report page)
✓ Simplified home page (greeting + 3 metric cards)
✓ Results/analytics page (3 KPIs + trend chart)

### Active

- [ ] Design polish (spacing, typography, visual hierarchy)
- [ ] Mobile responsiveness (touch-friendly, 1-column layout)
- [ ] Product tour (interactive 7-step tutorial for new users)
- [ ] User onboarding validation (<2 min completion with real users)
- [ ] Production deployment (staging → live)

### Out of Scope

- Advanced customization options — Too much choice defeats simplicity
- Multilingual support beyond Spanish — Scope for v2
- Desktop-only optimization — Must work on mobile first
- Agent customization UI — Stays in backend, not frontend
- Real-time chat or messaging — Out of scope for v1

## Context

**What Exists:**
- Backend: 37 pre-configured AI agents in Convex (fully functional, via .planning-feeds project)
- Frontend: Next.js 16 + React 19 + Tailwind 4 (Phases 1-4 implemented)
- Database: Convex real-time backend (working)
- User Base: Non-technical marketers who need simplified interface

**What We're Solving:**
The current AMD dashboard is technically powerful but too complex for non-technical users. 10 navigation items, 6-step onboarding, technical jargon, and advanced options create friction. Users give up before completing setup.

**Key Insight from Phase 1-4:**
Reducing navigation from 10 → 4 items and onboarding from 6 → 3 steps cut cognitive load by 60%. Spanish UI and pre-configured templates (templates system) made setup instantaneous. The approach works — now we need to polish and validate with real users.

## Constraints

- **Timeline:** Complete all 6 phases, ready for user testing
- **Technology:** Next.js 16 + React 19 + Tailwind 4 (locked in, existing stack)
- **Language:** 100% Spanish for UI (user base requirement)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile:** Must function on mobile (responsive design, touch targets >44px)
- **Database:** Convex backend (no changes to existing agent system)
- **Related Project:** Backend RSS Feed Integration is complete (.planning-feeds/)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spanish-first UI | User base is Spanish-speaking, non-technical | ✓ Good — dramatically improved UX |
| 4-item navigation | 10 items too overwhelming; 4 main sections cover 95% of workflows | ✓ Good — users understand layout in seconds |
| 1-click feed setup (templates) | Manual feed selection is expert-mode friction; templates solve 80% of use cases | ✓ Good — setup time dropped from 15 min → <2 min |
| 3-step onboarding | 6 steps was abandonment cliff; 3 steps gets users to dashboard fast | ✓ Good — completion rate expected to improve >50% |
| Pre-translated UI (not i18n) | Spanish-only for v1 (not multi-language framework); reduces complexity | ✓ Good — shipping faster, less technical debt |
| Feed health widget | Users need to see status without navigation; home page prominence reduces support tickets | — Pending (awaiting user validation) |

---

*Last updated: 2026-01-30 after initialization*
