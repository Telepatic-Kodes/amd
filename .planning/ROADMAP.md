# Roadmap: AMD v5.0 Autonomy & Platform

## Overview

Transform AMD from a tool into a platform. The CMO Autopilot makes AMD think and act autonomously — planning strategy, delegating to agents, executing content pipelines without human intervention. Dark Mode signals premium SaaS quality. Public API + Webhooks unlock agency/enterprise adoption by enabling external integrations. Agent Customization gives power users control without breaking simplicity for beginners.

**Target audience:** Paying customers. Every feature must justify subscription value.

## Milestones

- v1.0 UX Simplification - Phases 1-8 (shipped 2026-01-30)
- v2.0 UX/UI Excellence - Phases 9-12 (shipped 2026-02-05)
- v3.0 Intelligence & Scale - Phases 13-18 (shipped 2026-02-07)
- v4.0 Production Readiness - Phases 19-24 (shipped 2026-02-11)
- **v5.0 Autonomy & Platform** - Phases 25-30 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (25, 26, 27...): Planned milestone work
- Decimal phases (25.1, 25.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 25: CMO Autopilot — Strategy Engine** - Complete backend strategy engine: planning, delegation, multi-agent orchestration, autonomous content pipelines
- [ ] **Phase 26: CMO Autopilot — Dashboard & Execution** - Strategy dashboard, launcher UI, execution monitoring, performance tracking, auto-adjustment
- [ ] **Phase 27: Dark Mode & Theme System** - CSS variable-based theming, light/dark toggle, persistence, consistent across all components
- [ ] **Phase 28: Public REST API** - API endpoints for content, agents, analytics; API key management; rate limiting; OpenAPI docs
- [ ] **Phase 29: Webhooks & Event System** - Webhook registration, event notifications, delivery with retry, management UI
- [ ] **Phase 30: Agent Customization UI** - User-configurable agent prompts, triggers, temperature, model selection from dashboard

## Phase Details

### Phase 25: CMO Autopilot — Strategy Engine

**Goal:** The CMO agent can autonomously create marketing strategies, decompose them into tasks, delegate to department agents, and orchestrate multi-step content pipelines without human intervention

**Depends on:** Phase 24 (v4.0 shipped, production-ready platform)

**Requirements:** CMO-01, CMO-02, CMO-03, CMO-04, CMO-05, CMO-06, CMO-07, CMO-08

**Success Criteria** (what must be TRUE):
1. CMO agent accepts a high-level goal ("Aumentar engagement en LinkedIn 20%") and produces a multi-week strategy with phases, tasks, and assigned agents
2. Strategy decomposition creates concrete tasks for individual agents (content briefs, social posts, SEO audits) with dependencies and ordering
3. Multi-agent orchestration chains execute sequentially: research → brief → draft → review → publish, with handoff between agents
4. Autonomous content pipeline generates 5+ pieces of content from a single strategy without human input
5. Strategy state persists in Convex with full audit trail (who created, when, what decisions, results)

**Plans:** 3 plans

Plans:
- [ ] 25-01-PLAN.md -- Strategy data model (Convex schema), strategy creation mutation, goal decomposition with Claude
- [ ] 25-02-PLAN.md -- Multi-agent orchestration engine: task dependency graph, execution order, handoff chains
- [ ] 25-03-PLAN.md -- Autonomous content pipeline: strategy → briefs → content → review → publish (end-to-end)

---

### Phase 26: CMO Autopilot — Dashboard & Execution

**Goal:** Users can create, monitor, and adjust strategies through an intuitive dashboard that shows real-time execution progress and performance results

**Depends on:** Phase 25 (strategy engine functional in backend)

**Requirements:** CMO-09, CMO-10, CMO-11, CMO-12, CMO-13, CMO-14, CMO-15

**Success Criteria** (what must be TRUE):
1. Strategy Dashboard shows active strategies with progress bars, agent assignments, and timeline visualization
2. Strategy Launcher accepts natural language goals and converts them to strategies with 1-click confirmation
3. Real-time execution view shows which agents are working, what stage each task is in, and estimated completion
4. Performance tracking compares strategy goals vs. actual results (engagement, content produced, publishing rate)
5. Users can pause, resume, or adjust a running strategy without losing progress

**Plans:** 3 plans

Plans:
- [ ] 26-01-PLAN.md -- Strategy Dashboard component: strategy list, progress visualization, agent assignment view
- [ ] 26-02-PLAN.md -- Strategy Launcher: natural language input → strategy preview → confirm → execute
- [ ] 26-03-PLAN.md -- Execution monitoring: real-time progress, pause/resume controls, performance vs. goals comparison

---

### Phase 27: Dark Mode & Theme System

**Goal:** Users can toggle between light and dark themes with a single click, and the theme persists across sessions with consistent styling on every component

**Depends on:** Phase 24 (all components must be production-ready before theming)

**Requirements:** THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06

**Success Criteria** (what must be TRUE):
1. CSS variable-based theme system with light (default) and dark themes, no hardcoded colors in components
2. Toggle in settings and header persists selection in localStorage + Convex user preferences
3. All 10+ pages render correctly in dark mode with proper contrast ratios (WCAG AA)
4. Charts (Recharts), modals, dropdowns, toasts, and third-party components respect the active theme
5. System preference detection (`prefers-color-scheme`) as default, user override takes priority

**Plans:** 2 plans

Plans:
- [ ] 27-01-PLAN.md -- CSS variable extraction, Tailwind dark mode config, theme provider context, toggle component
- [ ] 27-02-PLAN.md -- Component-by-component dark mode audit: pages, charts, modals, toasts, third-party elements

---

### Phase 28: Public REST API

**Goal:** External systems can programmatically access AMD's content, agents, and analytics through a documented, authenticated REST API

**Depends on:** Phase 24 (production security hardening), Phase 25 (strategy API useful for external orchestration)

**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08

**Success Criteria** (what must be TRUE):
1. API endpoints exist for: content CRUD, agent listing/execution, analytics read, strategy creation
2. API key authentication system with create/revoke/rotate from settings, scoped permissions (read/write/admin)
3. Rate limiting per API key (100 req/min default, configurable per plan)
4. OpenAPI 3.0 specification auto-generated from route definitions, browsable at `/api/docs`
5. API responses follow consistent JSON format: `{ data, meta, error }` with pagination support

**Plans:** 3 plans

Plans:
- [ ] 28-01-PLAN.md -- API key system: generation, storage (Convex), scoped permissions, middleware authentication
- [ ] 28-02-PLAN.md -- Core API endpoints: /api/v1/content, /api/v1/agents, /api/v1/analytics, /api/v1/strategies
- [ ] 28-03-PLAN.md -- API documentation: OpenAPI spec generation, /api/docs page, rate limiting per key, usage tracking

---

### Phase 29: Webhooks & Event System

**Goal:** External systems receive real-time notifications when important events happen in AMD, enabling integration with CRMs, Slack, custom workflows

**Depends on:** Phase 28 (API infrastructure: key auth, rate limiting)

**Requirements:** HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, HOOK-06

**Success Criteria** (what must be TRUE):
1. Webhook registration system: users configure URLs for specific event types from settings
2. Events emitted for: content.published, content.status_changed, agent.execution_completed, strategy.completed, report.generated
3. Webhook delivery with exponential backoff retry (3 attempts) and delivery status tracking
4. Webhook payloads are signed (HMAC-SHA256) with a per-webhook secret for security verification
5. Webhook management UI shows delivery history, success/failure rate, and test ping functionality

**Plans:** 2 plans

Plans:
- [ ] 29-01-PLAN.md -- Event system architecture, webhook registration (Convex schema), HMAC signing, delivery engine with retries
- [ ] 29-02-PLAN.md -- Webhook management UI: registration form, event type selector, delivery history, test ping, status indicators

---

### Phase 30: Agent Customization UI

**Goal:** Power users can customize agent behavior (prompts, temperature, triggers, model) directly from the dashboard without touching backend code

**Depends on:** Phase 25 (CMO engine provides context for why customization matters)

**Requirements:** AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05

**Success Criteria** (what must be TRUE):
1. Agent detail page shows editable system prompt with syntax highlighting and character count
2. Temperature, max tokens, and model (Sonnet/Haiku) are configurable per agent with safe defaults
3. Trigger configuration UI: enable/disable triggers (manual, cron, webhook, handoff) with schedule picker
4. Changes create a version history; users can revert to any previous agent configuration
5. "Restaurar Defaults" button resets agent to its original pre-configured state

**Plans:** 2 plans

Plans:
- [ ] 30-01-PLAN.md -- Agent configuration schema (Convex), edit mutations with version history, permission guards (owner/admin only)
- [ ] 30-02-PLAN.md -- Agent customization UI: prompt editor, parameter controls, trigger toggles, version history, reset defaults

---

## Progress

**Execution Order:**
Phases execute in numeric order: 25 > 26 > 27 > 28 > 29 > 30
Phase 27 (Dark Mode) can run in parallel with 25-26 if needed (no dependencies on CMO).

**Priority tiers:**
- **MUST-HAVE:** Phases 25, 26, 27, 28, 29
- **NICE-TO-HAVE:** Phase 30

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. CMO Autopilot — Strategy Engine | 3/3 | Shipped | 2026-02-11 |
| 26. CMO Autopilot — Dashboard & Execution | 0/3 | Pending | — |
| 27. Dark Mode & Theme System | 0/2 | Pending | — |
| 28. Public REST API | 0/3 | Pending | — |
| 29. Webhooks & Event System | 0/2 | Pending | — |
| 30. Agent Customization UI | 0/2 | Pending | — |

---

## Coverage

**~55 v5.0 requirements mapped (100%)**

| Category | Count | Phase |
|----------|-------|-------|
| CMO Autopilot Engine (CMO) | 8 | 25 |
| CMO Dashboard & Execution (CMO) | 7 | 26 |
| Theme System (THEME) | 6 | 27 |
| Public API (API) | 8 | 28 |
| Webhooks & Events (HOOK) | 6 | 29 |
| Agent Customization (AGENT) | 5 | 30 |

No orphaned requirements. No duplicate assignments.

## Deferred to v6.0+

- TikTok / YouTube publishing — Evaluate after v5.0 API enables integrations
- i18n (English) — Market expansion after revenue validation
- Collaborative real-time editing — CRDT complexity; defer
- Stripe billing — Consider as v5.1 insertion once API usage data exists
- A/B content testing — Needs sufficient content volume from CMO Autopilot first
- Video post publishing — Platform video APIs remain complex

---

*Roadmap created: 2026-02-11*
*Milestone: v5.0 Autonomy & Platform*
*Phases: 25-30 (6 phases, 15 plans estimated)*
*Requirements: ~55 mapped to 6 phases*
