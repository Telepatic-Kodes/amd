# Project Research Summary

**Project:** AMD (AI Marketing Department) v2.0 UX/UI Excellence
**Domain:** Marketing Automation Dashboard with Multi-Agent Operations
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

AMD v2.0 adds operational capabilities to an existing 37-agent marketing automation system. The research examined four feature categories: Control Center (real-time monitoring), Content Pipeline (workflow management), LinkedIn Integration (social publishing), and Guided UX (onboarding/wizards). The key finding is that **90% of requirements can be met with the existing stack** (Next.js 16, React 19, Convex, Tailwind 4) by adding only two lightweight libraries: Sonner (toast notifications, 8KB) and Onborda (guided tours, 15KB).

The recommended approach leverages Convex's reactive query system for real-time features, implements OAuth via Convex actions for security, extends the existing content schema with workflow states, and uses a headless state machine for guided onboarding. The core risk is **complexity creep** — v1.0 solved "too complex" by simplifying to 4 navigation items and 3-step onboarding; v2.0 must avoid recreating that problem by adding operational features without careful UX design.

Critical mitigation strategies: implement subscription budgeting to prevent Convex cost explosion (Pitfall #1), design smart alert filtering to avoid alert fatigue (Pitfall #2), use progressive disclosure to hide advanced pipeline features behind "Quick mode" (Pitfall #3), implement centralized rate limiting before any LinkedIn API calls (Pitfall #4), and follow OAuth security best practices with PKCE flow and httpOnly cookies (Pitfall #5). All pitfalls are addressable if caught during architecture design before implementation.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19, Tailwind 4, Convex, Recharts) covers 90% of v2.0 needs. Research found NO major refactoring required. Only three targeted additions needed:

**Core technologies (existing):**
- **Next.js 16 + React 19**: App Router with Server/Client components — already working in v1.0
- **Convex**: Real-time subscriptions via WebSocket — already provides reactive queries out-of-the-box, no Socket.io needed
- **Recharts**: Chart library — custom components already built (LineChart, AreaChart, DonutChart) with theme system
- **Tailwind 4 + Framer Motion**: Styling and animations — already integrated
- **TipTap**: Rich text editor — already installed for content creation

**Required additions (new):**
- **Sonner** (8KB): Toast notifications for alerts, status updates, LinkedIn publish confirmations — React 19 compatible, TypeScript-first
- **Onborda** (15KB): Guided UX wizard system — built for Next.js, uses Framer Motion (already installed), Tailwind-based
- **LinkedIn Posts API**: Native `fetch` (no library) — OAuth 2.0 authentication, ~20 requests/day rate limit

**Explicitly rejected:**
- Socket.io (Convex already provides real-time via WebSocket)
- Tremor UI library (custom Recharts components sufficient)
- React Flow (content pipeline is linear, not DAG-based)
- State management library (Convex handles server state, React Context for UI state)
- Scheduling library (Convex has built-in cron jobs)

### Expected Features

Research identified table stakes features (users expect them) versus differentiators (competitive advantage).

**Must have (table stakes):**
- **Control Center:** Real-time agent status, activity feed, task queue, responsive mobile layout
- **Content Pipeline:** Draft/Review/Approved/Published states, content preview, version history, edit locks
- **LinkedIn Integration:** OAuth 2.0 auth, text post publishing, rate limit handling, error feedback
- **Guided UX:** Progress indicator, Back/Next navigation, step validation, 3-5 steps max, clear labels

**Should have (competitive):**
- **Control Center:** Agent performance metrics (success rate, avg duration), smart notifications (context-aware, not every event)
- **Content Pipeline:** Bulk actions (approve/reject multiple items), conditional approval rules (CFO approval for budget posts)
- **LinkedIn Integration:** Image optimization (auto-resize to LinkedIn specs), optimal timing suggestions
- **Guided UX:** Contextual help tooltips, smart field pre-fill, progress persistence (resume after abandonment)

**Defer (v2+):**
- Agent interrupt/escalation controls (high complexity)
- Parallel approval tracks (complex state machine)
- LinkedIn post performance tracking (requires Analytics API)
- Multi-account LinkedIn management (multiple OAuth tokens)
- Conditional wizard branching (dynamic state machine)

### Architecture Approach

Use Convex's reactive query system for all real-time features, implement OAuth via Convex actions (server-side security), extend existing content schema with workflow states, and use headless state machine for guided UX.

**Major components:**

1. **Control Center (Real-time Dashboard)**
   - Pattern: Reactive queries with aggregation
   - Use `useQuery(api.controlCenter.getLiveAgentStatus)` — auto-updates on agent execution
   - Single aggregated subscription instead of 37 separate subscriptions (cost optimization)
   - Limit result sets with `.take(limit)` instead of `.collect()` (performance)

2. **Content Pipeline (Workflow Extension)**
   - Pattern: Schema extension + optimistic updates
   - Extend existing `content` table with `workflowStage`, `assignedTo`, `stateTransitions`
   - State machine validates transitions (draft → review → approved → published)
   - React 19's `useOptimistic` for drag-and-drop state updates

3. **LinkedIn Integration (OAuth + API)**
   - Pattern: OAuth via Convex actions + secure token storage
   - NEVER expose client secret in frontend — use Convex actions (server-side)
   - Store tokens in Convex database with encryption (ENCRYPTION_KEY env var)
   - Validate state parameter for CSRF protection
   - Centralized rate limiter (80% of limit, reserve 20% for manual)

4. **Guided UX Onboarding (State Machine)**
   - Pattern: Headless state machine + backend persistence
   - Add `onboardingProgress` table (userId, currentStep, completedSteps, skippedSteps)
   - OnboardingStateMachine class handles step logic, conditions, dependencies
   - Wizards are OPTIONAL, not mandatory — offer "Quick mode" after 3 completions

### Critical Pitfalls

Research identified 15 domain-specific pitfalls with verified prevention strategies.

**Top 5 critical (require architecture changes):**

1. **Real-Time Subscription Cost Explosion**
   - **Problem:** Unoptimized subscriptions create 37+ active connections per user, Convex costs spike 400%+
   - **Prevention:** Aggregate agent status into single subscription, use polling (5-30s) for non-critical data, implement subscription budgeting in Phase 1
   - **Detection:** Monitor Convex dashboard "Active Subscriptions" metric (alert if >100)

2. **Alert Fatigue from Real-Time Monitoring**
   - **Problem:** 50+ alerts/day, users ignore all notifications including critical ones (51% of teams overwhelmed)
   - **Prevention:** Evaluation windows (alert only if condition persists 5+ minutes), group related alerts, severity levels (critical/warning/info)
   - **Detection:** Track alert-to-action ratio (target: >60% of alerts result in action)

3. **Content Pipeline Complexity Creep**
   - **Problem:** v1.0 solved "too complex," v2.0 recreates it by adding 12-step workflows
   - **Prevention:** Default to simplest path (draft → publish directly), hide advanced workflow behind "Advanced mode" toggle, measure >70% using simple 2-step flow
   - **Detection:** Track steps-per-publish (target: median ≤3), time-from-draft-to-published (target: <5min)

4. **LinkedIn API Rate Limit Cascading Failures**
   - **Problem:** 100 connection requests/week limit, exceeding causes account restrictions (days to weeks resolution)
   - **Prevention:** Centralized rate limiter BEFORE any API calls, use 80% of limit (reserve 20%), queue system with automatic pacing
   - **Detection:** Monitor daily/weekly usage, alert at 80% limit, block at 100%

5. **OAuth Flow Security Vulnerabilities**
   - **Problem:** Redirect URI not validated, tokens in localStorage (XSS vulnerable), refresh tokens mishandled
   - **Prevention:** Use PKCE flow, validate redirect URI server-side, store tokens in httpOnly cookies, implement token rotation
   - **Detection:** Security audit against RFC 9700, penetration test redirect URI manipulation

**Top 5 moderate (require design changes):**

6. **Next.js Server/Client Component Confusion** — Default to Server Components, add "use client" only when needed
7. **React 19 Third-Party Library Incompatibility** — Audit dependencies before phases, test in isolation
8. **Multi-Platform Content Formatting Breakdown** — Platform-specific formatters, preview for each platform
9. **Approval Workflow Bottlenecks** — Multiple approvers, escalation rules, auto-approve after 48h
10. **Version Control Chaos in Content Editing** — Store versions as separate records, not in-place updates

## Implications for Roadmap

Based on research, recommended 4-phase structure aligned with dependencies and complexity:

### Phase 1: Control Center Foundation (2 weeks)
**Rationale:** Visibility is #1 user pain point ("what are agents doing?"). Real-time features require subscription architecture design upfront to prevent cost explosion.

**Delivers:**
- Real-time agent status dashboard (what's running now)
- Agent activity feed (chronological log)
- Task queue visualization (pending/running/completed)
- Mobile-responsive monitoring

**Addresses (from FEATURES.md):**
- Table stakes: Real-time status, activity feed, task queue, responsive layout
- Defer: Agent performance metrics (analytics), interrupt controls (complex)

**Avoids (from PITFALLS.md):**
- Pitfall #1 (Subscription cost explosion) — implement aggregated queries from start
- Pitfall #2 (Alert fatigue) — smart alert filtering with evaluation windows
- Pitfall #15 (Performance degradation) — test with long-running sessions

**Uses (from STACK.md):**
- Convex reactive queries (existing)
- Recharts custom components (existing)
- Sonner for toast alerts (NEW — install in Phase 1)

**Research flag:** YES — Needs deeper research on Convex subscription patterns and cost optimization strategies.

### Phase 2: Content Pipeline Enhancement (2 weeks)
**Rationale:** Builds on existing content management (evolutionary, not revolutionary). Must design with progressive disclosure from start to avoid complexity creep.

**Delivers:**
- Review/Approved/Published workflow states
- Content preview (reuse existing rendering)
- Version history (timestamp + user)
- Bulk approval actions

**Addresses (from FEATURES.md):**
- Table stakes: Status states, preview, version history, edit locks
- Should have: Bulk actions (low complexity win)
- Defer: AI-powered routing (complex), parallel approvals (state machine complexity)

**Avoids (from PITFALLS.md):**
- Pitfall #3 (Complexity creep) — default to simple 2-step flow (draft → publish)
- Pitfall #9 (Multi-platform formatting) — platform-specific formatters with preview
- Pitfall #10 (Approval bottlenecks) — multiple approvers, escalation rules
- Pitfall #11 (Version control chaos) — versioned records from start

**Implements (from ARCHITECTURE.md):**
- Schema extension: `workflowStage`, `assignedTo`, `stateTransitions` fields
- Optimistic updates: React 19's `useOptimistic` for drag-and-drop

**Research flag:** NO — Standard CMS patterns, well-documented state machines.

### Phase 3: LinkedIn Publishing Integration (2 weeks)
**Rationale:** Requires content pipeline states (approved content → publish). High complexity due to OAuth + API integration. CRITICAL security review required before production.

**Delivers:**
- OAuth 2.0 authentication flow
- Text post publishing (LinkedIn Posts API)
- Basic rate limit handling
- Image optimization (auto-resize to LinkedIn specs)

**Addresses (from FEATURES.md):**
- Table stakes: OAuth flow, text publishing, rate limit handling, error feedback
- Should have: Image optimization (low complexity win)
- Defer: Multi-account (complex OAuth), performance tracking (Analytics API), hashtag suggestions (NLP)

**Avoids (from PITFALLS.md):**
- Pitfall #4 (Rate limit failures) — centralized rate limiter BEFORE first API call
- Pitfall #5 (OAuth vulnerabilities) — PKCE flow, httpOnly cookies, CSRF protection

**Implements (from ARCHITECTURE.md):**
- Convex actions for OAuth token exchange (server-side security)
- Encrypted token storage in Convex database
- Scheduled publishing via Convex cron jobs (every 5 minutes)

**Research flag:** YES — OAuth flow specifics, rate limit handling strategy, token refresh implementation.

### Phase 4: Guided UX Layer (2 weeks)
**Rationale:** Applies to all previous phases; easier to add after core features exist. Wizard patterns are well-established, implementation is straightforward.

**Delivers:**
- Wizard component library (reusable)
- Progress indicator (step X of Y)
- LinkedIn OAuth setup wizard
- Content creation wizard (optional alternative to full editor)

**Addresses (from FEATURES.md):**
- Table stakes: Progress indicator, Back/Next navigation, step validation, linear flow
- Should have: Contextual help tooltips (low complexity, high value)
- Defer: Conditional branching (state machine complexity), progress persistence (draft storage)

**Avoids (from PITFALLS.md):**
- Pitfall #6 (Wizard annoyance) — adaptive behavior, offer "Quick mode" after 3 completions
- Pitfall #14 (Hiding essential features) — progressive disclosure for OPTIONAL features only

**Implements (from ARCHITECTURE.md):**
- `onboardingProgress` table (userId, currentStep, completedSteps)
- OnboardingStateMachine class with conditional step logic
- Smart recommendations engine based on user state

**Research flag:** NO — Wizard patterns well-established (Nielsen Norman Group guidelines).

### Phase Ordering Rationale

**Dependencies:**
1. Content Pipeline MUST precede LinkedIn Integration (approved state required before publishing)
2. Control Center can be parallel to Content Pipeline (independent features)
3. Guided UX can be applied incrementally (doesn't block other features)

**Groupings:**
- Phase 1 + 2 address core operational visibility (monitoring + workflows)
- Phase 3 is isolated (external integration)
- Phase 4 is a layer across all features

**Risk mitigation:**
- Phases 1 + 3 have critical pitfalls requiring architecture design BEFORE implementation
- Phases 2 + 4 have standard patterns, lower risk

**Complexity gradient:**
- Phase 1: Medium (real-time patterns, existing in v1.0)
- Phase 2: Low (CMS patterns, well-documented)
- Phase 3: High (OAuth + API, security critical)
- Phase 4: Medium (state machine, UX patterns)

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1 (Control Center):** Convex subscription optimization patterns, cost modeling for 50+ users, alert aggregation strategies
- **Phase 3 (LinkedIn Integration):** OAuth 2.0 PKCE flow implementation, token refresh logic, rate limiter architecture, scheduled publishing with timezone support

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Content Pipeline):** CMS workflow states are well-documented, multiple references (Sanity, Contentstack, Planable)
- **Phase 4 (Guided UX):** Wizard patterns established by Nielsen Norman Group, onboarding libraries well-reviewed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack verified working in v1.0, new libraries (Sonner, Onborda) verified with official docs and React 19 compatibility |
| Features | HIGH | Feature expectations cross-referenced with multiple 2026 sources (InfoQ, NN/g, Microsoft Learn), table stakes vs differentiators validated |
| Architecture | HIGH | Convex real-time patterns already working in v1.0, OAuth patterns verified with RFC 9700 and Microsoft Learn official docs |
| Pitfalls | HIGH | 15 pitfalls researched with 2026 sources, prevention strategies validated (Convex pricing, LinkedIn API limits, OAuth security, wizard UX) |

**Overall confidence:** HIGH

### Gaps to Address

**Cost modeling (Phase 1):**
- What's realistic monthly Convex cost for 50 users with Control Center?
- At what point does Convex become prohibitively expensive?
- **How to handle:** Run cost simulation in Phase 1 development, monitor Convex dashboard metrics weekly

**LinkedIn API restrictions (Phase 3):**
- Does LinkedIn differentiate between app posts and bot posts?
- Can rate limiter prevent account bans, or are bans inevitable with automation?
- **How to handle:** Test with burner LinkedIn account in Phase 3, implement safety margin (80% of limit)

**Spanish UI expansion (all phases):**
- Are there AMD-specific translations that exceed 30% expansion (verified average)?
- Do button labels fit on mobile at 150% zoom?
- **How to handle:** UI audit with longest Spanish translations before each phase, use relative widths (not fixed pixels)

**Multi-platform formatting (Phase 2):**
- Can we achieve 80% automation (20% manual tweaking acceptable)?
- Which platform causes most formatting issues (LinkedIn 3000 char limit, Twitter threads)?
- **How to handle:** Prototype formatters in Phase 2 before full implementation, provide platform-specific previews

**Wizard adaptation (Phase 4):**
- At what point do users prefer quick mode? (3 completions? 5? 10?)
- Does wizard preference vary by user role (creator vs manager)?
- **How to handle:** A/B test wizard frequency in Phase 4, track completion time by experience level

## Sources

### Primary (HIGH confidence)

**Stack & Technology:**
- [Sonner GitHub](https://github.com/emilkowalski/sonner) — Toast notification library, React 19 compatibility verified
- [Onborda GitHub](https://github.com/uixmat/onborda) — Guided onboarding for Next.js, Framer Motion integration
- [LinkedIn Posts API Official Docs](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-01) — 2026-01 version, rate limits, API versioning
- [LinkedIn OAuth 2.0 Authentication](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication) — 3-legged flow, PKCE requirements
- [Convex Documentation](https://docs.convex.dev/home) — Real-time subscriptions, reactive queries

**Features & UX:**
- [Multi-Agent Design Patterns (InfoQ, January 2026)](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/) — Hub-and-spoke architecture, human-in-the-loop patterns
- [Wizards: Design Guidelines (Nielsen Norman Group)](https://www.nngroup.com/articles/wizards/) — Step validation, progress indicators, wizard vs forms
- [Content Approval Workflow (Smartsheet)](https://www.smartsheet.com/content-approval-workflow) — Standard state transitions, bottleneck prevention
- [Drafts & Publishing Workflow (Sanity CMS)](https://www.sanity.io/glossary/drafts--publishing-workflow) — Version control, collaborative editing

**Pitfalls & Security:**
- [OAuth 2.0 Security BCP (RFC 9700)](https://treblle.com/blog/oauth-2.0-for-apis) — PKCE flow, state validation, token storage
- [LinkedIn API Rate Limits (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits) — 100 connection requests/week, 500 API calls/day standard tier
- [Alert Fatigue: What It Is and How to Prevent It (Datadog)](https://www.datadoghq.com/blog/best-practices-to-prevent-alert-fatigue/) — Evaluation windows, severity levels
- [ConvexDB Pricing Guide (Airbyte)](https://airbyte.com/data-engineering-resources/convexdb-pricing) — Usage-based pricing, database operations
- [Next.js App Router: common mistakes (Upsun)](https://upsun.com/blog/avoid-common-mistakes-with-next-js-app-router/) — Server/Client component patterns

### Secondary (MEDIUM confidence)

**Best Practices:**
- [Top 9 React notification libraries in 2026 (Knock)](https://knock.app/blog/the-top-notification-libraries-for-react) — Sonner vs alternatives comparison
- [5 Best React Onboarding Libraries in 2026 (OnboardJS)](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) — Onborda vs React Joyride vs Intro.js
- [Server-Sent Events Beat WebSockets for 95% of Real-Time Apps (Dev.to)](https://dev.to/polliog/server-sent-events-beat-websockets-for-95-of-real-time-apps-heres-why-a4l) — When to use SSE vs WebSocket
- [React 19 Upgrade Guide (React.dev)](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) — Deprecated patterns, breaking changes
- [Feature Creep Is Killing Your Software (DesignRush)](https://www.designrush.com/agency/software-development/trends/feature-creep) — 80% of features rarely used (Pendo study)

### Tertiary (community insights)

- [Convex Plans and Pricing (Convex)](https://www.convex.dev/pricing) — Plan details, need real-world usage data
- [Spanish requires 30% more characters than English (LatinoB ridge)](https://latinobridge.com/blog/a-guide-to-ui-localization/) — Text expansion in Romance languages
- [Progressive Disclosure Examples (UserPilot)](https://userpilot.com/blog/progressive-disclosure-examples/) — SaaS examples, needs AMD-specific validation

---
*Research completed: 2026-02-05*
*Ready for roadmap: yes*
