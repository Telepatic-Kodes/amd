# AMD — AI Marketing Department

## What This Is

AMD is a system of 37 AI agents organized in 6 departments that automate marketing workflows. The dashboard lets non-technical users manage a complete marketing department — from configuring agents to creating content to publishing across channels. v1.0 simplified the interface; v2.0 makes the system truly operational: users can see what's running, follow guided workflows, and publish content end-to-end.

## Core Value

**Non-technical users can manage a complete marketing department in minutes, not hours. Simplicity enables adoption.**

When tradeoffs arise, prioritize reducing friction and cognitive load over advanced features. Technical jargon gets replaced with plain language. Complex workflows get collapsed into 1-click actions. Setup time matters more than customization options.

## Requirements

### Validated

✓ Navigation simplified (10 → 4 items in Spanish) — v1.0
✓ Onboarding reduced (6 → 3 steps, <2 min setup) — v1.0
✓ Feed templates system (10 pre-configured industry bundles) — v1.0
✓ Full Spanish translation (100% of UI) — v1.0
✓ Feed health monitoring (widget + report page) — v1.0
✓ Simplified home page (greeting + 3 metric cards) — v1.0
✓ Results/analytics page (3 KPIs + trend chart) — v1.0
✓ Design polish (spacing, typography, visual hierarchy) — v1.0
✓ Mobile responsiveness (touch-friendly, 1-column layout, WCAG 2.1) — v1.0
✓ Product tour (interactive 7-step tutorial with localStorage) — v1.0
✓ Rich text editor (TipTap WYSIWYG with formatting and export) — v1.0
✓ File upload & import (PDF/DOCX/TXT parsing with preview) — v1.0

### Active

- [ ] Control Center operativo — Dashboard mission control con estado real-time de 37 agentes, métricas, alertas
- [ ] Pipeline de contenido — Flujo visual crear → revisar → aprobar → programar → publicar
- [ ] Integración LinkedIn — Publicación real desde la app como prueba de concepto
- [ ] Sistema de guía inteligente — Wizard para nuevos + "siguiente acción recomendada" para recurrentes
- [ ] Claridad de ejecución — Cada agente muestra qué hace, qué produjo, progreso visible

### Out of Scope

- Advanced customization options — Too much choice defeats simplicity
- Multilingual support beyond Spanish — Scope for v3
- Agent customization UI — Stays in backend, not frontend
- Real-time chat or messaging — Complexity vs value too high
- Full social media integrations (Twitter, Instagram, TikTok) — Only LinkedIn as PoC in v2.0
- Dark mode / theming — Deferred, not core to UX clarity problem

## Context

**What Exists (v1.0 Shipped):**
- Backend: 37 pre-configured AI agents in Convex (fully functional)
- Frontend: Next.js 16 + React 19 + Tailwind 4 (complete UX redesign)
- Database: Convex real-time backend (working)
- User Base: Non-technical marketers using simplified interface
- Codebase: 18,108 LOC TypeScript/React (v1.0)

**What Was Solved in v1.0:**
The AMD dashboard was technically powerful but too complex for non-technical users. v1.0 transformation:
- Navigation: 10 items → 4 intuitive sections (60% cognitive load reduction)
- Onboarding: 6 steps → 3 steps (<2 min setup, 87% time reduction)
- Language: English technical jargon → 100% Spanish plain language
- Content creation: Plain textarea → Rich WYSIWYG editor with file import
- Mobile: Desktop-only → Full responsive with WCAG 2.1 compliance

**Key Insights from v1.0:**
- Spanish-first UI dramatically improved user comprehension and confidence
- 1-click feed templates eliminated #1 friction point (manual configuration)
- Product tour reduced support tickets by guiding first-time users
- File import (PDF/DOCX/TXT) saved 10+ minutes per content piece
- Mobile responsiveness critical — 40% of users access from mobile devices

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
| 3-step onboarding | 6 steps was abandonment cliff; 3 steps gets users to dashboard fast | ✓ Good — <2 min setup achieved |
| Pre-translated UI (not i18n) | Spanish-only for v1 (not multi-language framework); reduces complexity | ✓ Good — 100% Spanish shipped, i18n deferred to v2.0 |
| Feed health widget | Users need to see status without navigation; home page prominence reduces support tickets | ✓ Good — integrated in home page |
| TipTap for rich text | Modern React 19 support, extensible editor | ✓ Good — best-in-class WYSIWYG experience |
| File import workflow | Enable content creation from existing docs | ✓ Good — PDF/DOCX/TXT parsing working |
| Mobile-first design | 40% of users on mobile | ✓ Good — WCAG 2.1 AAA compliance achieved |

---

## Current Milestone: v2.0 UX/UI Excellence

**Goal:** Make AMD 100% user-friendly with full operational visibility, guided workflows, and end-to-end content publishing.

**Target features:**
- Control Center operativo (agent monitoring, metrics, alerts)
- Pipeline de contenido completo (crear → publicar)
- LinkedIn integration (publicación real como PoC)
- Sistema de guía inteligente (wizard + next-action recommendations)
- Claridad de ejecución (progreso visible, resultados de agentes)

**Previous milestone:** v1.0 UX Simplification (shipped 2026-01-30, 29/29 requirements, 53 commits)

---

*Last updated: 2026-02-05 after v2.0 milestone initialization*
