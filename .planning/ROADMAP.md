# Roadmap: AMD v4.0 Production Readiness

## Overview

Take AMD from "works in dev" to "ready for real paying clients" across 6 phases. Phase 19 deploys production infrastructure and kicks off external approval processes (DNS, OAuth apps) whose 1-2 week wait times overlap with Phases 20-21 execution. Phases 20-21 build defensive UX (error handling, loading states, empty states). Phase 22 optimizes performance. Phase 23 layers security hardening and monitoring. Phase 24 adds onboarding and accessibility polish as the final quality gate before launch.

## Milestones

- v1.0 UX Simplification - Phases 1-8 (shipped 2026-01-30)
- v2.0 UX/UI Excellence - Phases 9-12 (shipped 2026-02-05)
- v3.0 Intelligence & Scale - Phases 13-18 (shipped 2026-02-07)
- **v4.0 Production Readiness** - Phases 19-24 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (19, 20, 21...): Planned milestone work
- Decimal phases (20.1, 20.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 19: Environment Setup & Infrastructure** - Deploy production stack, submit OAuth apps, build CI/CD pipeline and testing foundation
- [ ] **Phase 20: Error Handling & Validation** - Global error handling, form validation, toast system, session management
- [ ] **Phase 21: Loading States & UX Polish** - Skeleton screens, progress indicators, empty states, page transitions
- [ ] **Phase 22: Performance Optimization** - Lighthouse audit, code splitting, image optimization, Core Web Vitals, mobile verification
- [ ] **Phase 23: Security & Monitoring** - Rate limiting, CSP headers, Sentry, audit logging, data export
- [ ] **Phase 24: Onboarding & Polish** - Onboarding flow, accessibility audit, keyboard shortcuts, smart defaults

## Phase Details

### Phase 19: Environment Setup & Infrastructure

**Goal:** Production infrastructure is deployed and automated, with all external approval processes started so their wait times overlap with subsequent phases

**Depends on:** Phase 18 (v3.0 complete)

**Requirements:** DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, OAUTH-01, OAUTH-02, OAUTH-03, OAUTH-04, OAUTH-05, CICD-01, CICD-02, CICD-03, CICD-04, CICD-05, CICD-06, CICD-07, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07

**Success Criteria** (what must be TRUE):
1. App is accessible at production URL on Vercel with SSL, and preview deployments generate per PR
2. Clerk production instance is live with `pk_live_` keys and custom domain DNS verified
3. OAuth production apps for LinkedIn, Twitter, and Instagram are submitted (Instagram approval pending is acceptable)
4. Pushing to main triggers automated lint + typecheck + test + deploy (Convex then Vercel) via GitHub Actions
5. `npm test` runs Vitest suite with critical path tests for brand onboarding, content creation, OAuth flows, and auth enforcement

**Plans:** 4 plans

Plans:
- [ ] 19-01-PLAN.md -- Vercel + Convex + Clerk production deployment, env var docs, startup validation
- [ ] 19-02-PLAN.md -- OAuth production apps with environment-driven callback URLs
- [ ] 19-03-PLAN.md -- GitHub Actions CI/CD, Husky pre-commit hooks, Dependabot
- [ ] 19-04-PLAN.md -- Vitest + React Testing Library setup with critical path tests

---

### Phase 20: Error Handling & Validation

**Goal:** Every failure the user encounters produces a clear, actionable Spanish message with recovery options instead of raw errors or white screens

**Depends on:** Phase 19 (production environment needed for realistic error scenarios)

**Requirements:** ERR-01, ERR-02, ERR-03, ERR-04, ERR-05, ERR-06, ERR-07, ERR-08, TOAST-01, TOAST-02, TOAST-03, TOAST-04, SESS-01, SESS-02, SESS-03

**Success Criteria** (what must be TRUE):
1. Any page crash shows a styled error boundary with a "Reintentar" button instead of a white screen
2. Form submissions show inline Spanish validation errors (Zod client-side) and server rejects invalid data (Convex server-side)
3. Network disconnection shows an offline banner with retry; AI agent failures explain the specific reason (rate limit, timeout)
4. All mutations produce toast notifications: success auto-dismisses in 3-5s, errors persist until dismissed
5. After 28 minutes of inactivity, a warning modal appears; drafts auto-save before session expiry; multi-tab logout syncs

**Plans:** TBD

Plans:
- [ ] 20-01: Global error handler + React Error Boundaries on all pages + Spanish error message dictionary
- [ ] 20-02: Zod validation schemas (client + server) + input sanitization (sanitize-html) + AI agent error messages
- [ ] 20-03: Sonner toast system + session timeout (idle detection, warning modal, auto-save, multi-tab sync)

---

### Phase 21: Loading States & UX Polish

**Goal:** Users always see visual feedback during data loading and clear guidance when there is no data yet, eliminating blank screens and confusion

**Depends on:** Phase 20 (error handling ensures loading failures are caught gracefully)

**Requirements:** LOAD-01, LOAD-02, LOAD-03, LOAD-04, EMPTY-01, EMPTY-02, EMPTY-03, EMPTY-04

**Success Criteria** (what must be TRUE):
1. Every page shows a skeleton screen matching its final layout during data fetch (no blank white screens)
2. Agent execution shows a progress indicator with stage updates in Spanish ("Analizando brief...", "Generando contenido...")
3. All form submit buttons show a spinner and disable during submission (no double-submit possible)
4. Content library, Agents, Analytics, and Campaigns pages each show an illustrated empty state with a clear CTA when no data exists

**Plans:** TBD

Plans:
- [ ] 21-01: Skeleton screens for all pages + button loading states + page transition animations (Framer Motion)
- [ ] 21-02: Agent execution progress indicator + empty states for all 4 key pages

---

### Phase 22: Performance Optimization

**Goal:** Pages load fast enough that users never wait, meeting Core Web Vitals targets and working correctly across all mobile viewports

**Depends on:** Phase 21 (skeleton screens and loading states must exist before measuring perceived performance)

**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, MOB-01, MOB-02, MOB-03, MOB-04

**Success Criteria** (what must be TRUE):
1. Lighthouse audit shows LCP <2.5s, FCP <1.8s, CLS <0.1 on all main pages
2. Bundle size is under 200KB gzipped (verified with @next/bundle-analyzer)
3. Heavy components (agent modals, charts, rich text editor) load via dynamic imports, not in the initial bundle
4. All images use next/image with lazy loading and blur placeholders
5. App works correctly on iPhone SE (375px), iPhone 14 (393px), and iPad (768px) with no horizontal scroll, proper keyboard types, and 44x44px touch targets

**Plans:** TBD

Plans:
- [ ] 22-01: Lighthouse baseline audit + code splitting (dynamic imports) + bundle analysis + image optimization
- [ ] 22-02: Core Web Vitals fixes + Vercel Analytics/Speed Insights + mobile viewport testing (3 breakpoints)

---

### Phase 23: Security & Monitoring

**Goal:** Production is hardened against abuse and fully observable, with error tracking, audit logs, and data export for compliance

**Depends on:** Phase 19 (production environment), Phase 20 (error boundaries needed for Sentry integration)

**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, MON-01, MON-02, MON-03, MON-04, MON-05, DATA-01, DATA-02, DATA-03

**Success Criteria** (what must be TRUE):
1. Sentry captures unhandled exceptions with source maps and user context, and alerts fire when error rate exceeds 1%
2. AI agent endpoints have rate limiting (prevents abuse of expensive Claude API calls)
3. CSP headers are configured and HSTS is enforced; no secrets are exposed via NEXT_PUBLIC_ prefix (verified by audit)
4. Authentication events, content actions, and agent executions are logged in an audit trail
5. User can export their data (profile as JSON, content as CSV+JSON) from settings

**Plans:** TBD

Plans:
- [ ] 23-01: Sentry setup (Next.js SDK, source maps, user context, alert thresholds) + Vercel security headers (HSTS, CSP)
- [ ] 23-02: Rate limiting on AI endpoints + Clerk webhook verification + NEXT_PUBLIC_ secret audit + dependency scanning
- [ ] 23-03: Audit logging (auth events, content actions, agent executions) + data export (JSON + CSV) + AI agent analytics

---

### Phase 24: Onboarding & Polish

**Goal:** New users reach their first success moment within 5 minutes, and the app meets accessibility standards for all users

**Depends on:** Phase 21 (loading states and empty states needed for onboarding flow), Phase 22 (performance must be optimized before final polish)

**Requirements:** ONB-01, ONB-02, ONB-03, ONB-04, A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05

**Success Criteria** (what must be TRUE):
1. New user completes 4-step onboarding (Welcome + Brand setup + First content + Success moment) and lands on a populated dashboard
2. Complex features show contextual tooltips on hover/click explaining what they do in Spanish
3. Cmd+K opens a command palette; keyboard shortcuts N (new content) and ? (help) work globally
4. All interactive elements are reachable via Tab/Enter/Escape with visible focus indicators
5. Color contrast passes 4.5:1 for normal text, touch targets are 44x44px minimum, and screen readers can navigate with ARIA labels

**Plans:** TBD

Plans:
- [ ] 24-01: 4-step onboarding flow (Welcome, Brand setup, First content, Success) + smart defaults (remember last agent, default voice)
- [ ] 24-02: Accessibility audit (keyboard nav, focus indicators, ARIA labels, contrast, touch targets) + contextual tooltips + keyboard shortcuts (Cmd+K, N, ?)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 19 > 20 > 21 > 22 > 23 > 24

**External Dependencies (started in Phase 19, resolved by Phase 22-23):**
- Clerk DNS propagation: 24-48 hours
- Custom domain DNS: 1-48 hours
- LinkedIn/Twitter OAuth: 1-3 days
- Instagram/Meta OAuth: 1-2 weeks (may extend)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 19. Environment Setup & Infrastructure | 0/4 | Planning complete | - |
| 20. Error Handling & Validation | 0/3 | Not started | - |
| 21. Loading States & UX Polish | 0/2 | Not started | - |
| 22. Performance Optimization | 0/2 | Not started | - |
| 23. Security & Monitoring | 0/3 | Not started | - |
| 24. Onboarding & Polish | 0/2 | Not started | - |

---

## Coverage

**83/83 v1 requirements mapped (100%)**

| Category | Count | Phase |
|----------|-------|-------|
| Deployment & Infrastructure (DEPLOY) | 8 | 19 |
| OAuth Production Apps (OAUTH) | 5 | 19 |
| CI/CD Pipeline (CICD) | 7 | 19 |
| Testing Foundation (TEST) | 7 | 19 |
| Error Handling & Validation (ERR) | 8 | 20 |
| Toast Notifications (TOAST) | 4 | 20 |
| Session Management (SESS) | 3 | 20 |
| Loading States & UX Polish (LOAD) | 4 | 21 |
| Empty States (EMPTY) | 4 | 21 |
| Performance Optimization (PERF) | 6 | 22 |
| Mobile Responsiveness (MOB) | 4 | 22 |
| Security Hardening (SEC) | 6 | 23 |
| Production Monitoring (MON) | 5 | 23 |
| Data Export & Compliance (DATA) | 3 | 23 |
| Onboarding & Help (ONB) | 4 | 24 |
| Accessibility (A11Y) | 5 | 24 |

No orphaned requirements. No duplicate assignments.

---

*Roadmap created: 2026-02-09*
*Milestone: v4.0 Production Readiness*
*Phases: 19-24 (6 phases, 16 plans estimated)*
*Requirements: 83 mapped to 6 phases*
