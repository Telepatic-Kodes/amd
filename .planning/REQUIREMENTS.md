# Requirements: v5.0 Autonomy & Platform

**Defined:** 2026-02-11
**Core Value:** Non-technical users can manage a complete marketing department in minutes, not hours.
**Scope:** CMO Autopilot + Dark Mode + Public API + Webhooks + Agent Customization
**Target:** Paying customers — every feature must justify subscription value

---

## CMO Autopilot — Strategy Engine

- [ ] **CMO-01**: Strategy data model in Convex: strategies table with goal, phases, tasks, status, timeline, createdBy, audit trail
- [ ] **CMO-02**: Strategy creation mutation: accepts natural language goal, uses Claude to decompose into phases and tasks
- [ ] **CMO-03**: Goal decomposition: Claude analyzes brand context + goal → produces multi-week strategy with 3-8 phases
- [ ] **CMO-04**: Task assignment: each strategy phase maps to specific agents with concrete deliverables and deadlines
- [ ] **CMO-05**: Task dependency graph: defines execution order (research before brief, brief before draft, draft before review)
- [ ] **CMO-06**: Multi-agent orchestration: executes tasks in dependency order, handles handoffs, waits for completion
- [ ] **CMO-07**: Autonomous content pipeline: strategy → content briefs → AI-generated drafts → auto-review → ready for publish
- [ ] **CMO-08**: Strategy audit trail: every decision, delegation, and result logged with timestamp and agent ID

## CMO Autopilot — Dashboard & Execution

- [ ] **CMO-09**: Strategy Dashboard page showing all strategies with status (active/paused/completed), progress %, timeline
- [ ] **CMO-10**: Strategy Launcher: natural language input field → strategy preview with phases/tasks → confirm to execute
- [ ] **CMO-11**: Real-time execution view: live agent activity, current task stage, estimated completion time
- [ ] **CMO-12**: Performance tracking: strategy goals vs. actual results (content produced, engagement, publishing rate)
- [ ] **CMO-13**: Pause/resume controls: pause a running strategy, resume from where it stopped, no lost progress
- [ ] **CMO-14**: Strategy adjustment: modify goals or parameters of an active strategy, re-plan remaining phases
- [ ] **CMO-15**: Strategy history: completed strategies archived with full results, replayable as templates

## Dark Mode & Theme System

- [ ] **THEME-01**: CSS variable system: extract all colors from Warm Atelier theme into CSS custom properties
- [ ] **THEME-02**: Tailwind dark mode configuration: `darkMode: 'class'` with dark variant utilities
- [ ] **THEME-03**: Theme provider React context: manages current theme, provides toggle function, syncs to storage
- [ ] **THEME-04**: Theme toggle component: sun/moon icon button in header + settings page option
- [ ] **THEME-05**: Theme persistence: localStorage for instant load + Convex user preferences for cross-device sync
- [ ] **THEME-06**: System preference detection: `prefers-color-scheme` media query as default, user choice overrides

## Public REST API

- [ ] **API-01**: API key generation: cryptographically secure keys with prefix `amd_live_` (prod) / `amd_test_` (dev)
- [ ] **API-02**: API key storage: Convex table with hashed key, permissions scope, rate limits, last used timestamp
- [ ] **API-03**: API key management UI: create/revoke/rotate keys from Settings → API page
- [ ] **API-04**: API authentication middleware: validates API key, checks permissions, attaches user context
- [ ] **API-05**: Content API endpoints: GET/POST/PATCH /api/v1/content with filtering, pagination, and status management
- [ ] **API-06**: Agent API endpoints: GET /api/v1/agents (list), POST /api/v1/agents/:id/execute (trigger execution)
- [ ] **API-07**: Analytics API endpoints: GET /api/v1/analytics with date range, platform filters, metric selection
- [ ] **API-08**: OpenAPI 3.0 spec: auto-generated from route definitions, browsable at /api/docs with try-it-out

## Webhooks & Event System

- [ ] **HOOK-01**: Webhook registration: Convex table with URL, event types, secret, status (active/paused), owner
- [ ] **HOOK-02**: Event emission: content.published, content.status_changed, agent.execution_completed, strategy.completed, report.generated
- [ ] **HOOK-03**: Webhook delivery engine: POST to registered URLs with JSON payload, exponential backoff (3 retries)
- [ ] **HOOK-04**: Payload signing: HMAC-SHA256 signature in `X-AMD-Signature` header, per-webhook secret
- [ ] **HOOK-05**: Delivery tracking: log every attempt with status code, response time, success/failure
- [ ] **HOOK-06**: Webhook management UI: registration form, event picker, delivery history table, test ping button

## Agent Customization

- [ ] **AGENT-01**: Agent config schema: editable fields (systemPrompt, temperature, maxTokens, model) with version history
- [ ] **AGENT-02**: System prompt editor: textarea with syntax highlighting, character count, preview of generated output
- [ ] **AGENT-03**: Parameter controls: temperature slider (0-1), max tokens input, model dropdown (Sonnet/Haiku)
- [ ] **AGENT-04**: Trigger configuration: toggle switches for manual/cron/webhook/handoff, cron schedule picker
- [ ] **AGENT-05**: Version history + reset: view previous configurations, diff view, "Restaurar Defaults" button

---

## Summary

| Category | Count | Priority | Phase |
|----------|-------|----------|-------|
| CMO Autopilot — Engine | 8 | CRITICAL | 25 |
| CMO Autopilot — Dashboard | 7 | CRITICAL | 26 |
| Dark Mode & Theming | 6 | HIGH | 27 |
| Public REST API | 8 | HIGH | 28 |
| Webhooks & Events | 6 | MEDIUM | 29 |
| Agent Customization | 5 | MEDIUM | 30 |

**Total requirements: 40**

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMO-01 | Phase 25 | Pending |
| CMO-02 | Phase 25 | Pending |
| CMO-03 | Phase 25 | Pending |
| CMO-04 | Phase 25 | Pending |
| CMO-05 | Phase 25 | Pending |
| CMO-06 | Phase 25 | Pending |
| CMO-07 | Phase 25 | Pending |
| CMO-08 | Phase 25 | Pending |
| CMO-09 | Phase 26 | Pending |
| CMO-10 | Phase 26 | Pending |
| CMO-11 | Phase 26 | Pending |
| CMO-12 | Phase 26 | Pending |
| CMO-13 | Phase 26 | Pending |
| CMO-14 | Phase 26 | Pending |
| CMO-15 | Phase 26 | Pending |
| THEME-01 | Phase 27 | Pending |
| THEME-02 | Phase 27 | Pending |
| THEME-03 | Phase 27 | Pending |
| THEME-04 | Phase 27 | Pending |
| THEME-05 | Phase 27 | Pending |
| THEME-06 | Phase 27 | Pending |
| API-01 | Phase 28 | Pending |
| API-02 | Phase 28 | Pending |
| API-03 | Phase 28 | Pending |
| API-04 | Phase 28 | Pending |
| API-05 | Phase 28 | Pending |
| API-06 | Phase 28 | Pending |
| API-07 | Phase 28 | Pending |
| API-08 | Phase 28 | Pending |
| HOOK-01 | Phase 29 | Pending |
| HOOK-02 | Phase 29 | Pending |
| HOOK-03 | Phase 29 | Pending |
| HOOK-04 | Phase 29 | Pending |
| HOOK-05 | Phase 29 | Pending |
| HOOK-06 | Phase 29 | Pending |
| AGENT-01 | Phase 30 | Pending |
| AGENT-02 | Phase 30 | Pending |
| AGENT-03 | Phase 30 | Pending |
| AGENT-04 | Phase 30 | Pending |
| AGENT-05 | Phase 30 | Pending |

---

*Requirements defined: 2026-02-11*
*Phases start at: 25 (continuing from v4.0 phase 24)*
*Estimated phases: 6 (25-30)*
*Requirements: 40 mapped to 6 phases*
