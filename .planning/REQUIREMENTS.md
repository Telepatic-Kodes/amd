# Requirements: v4.0 Production Readiness

**Defined:** 2026-02-09
**Core Value:** Non-technical users can manage a complete marketing department in minutes, not hours.
**Scope:** All 5 areas — Deploy + CI/CD + Error Resilience + Performance + UX Audit
**Approach:** Parallel — start external processes (DNS, OAuth approvals) immediately while building other phases

---

## Deployment & Infrastructure

- [ ] **DEPLOY-01**: Vercel project configured with production + preview environments (auto-deploy on push)
- [ ] **DEPLOY-02**: Convex production deployment with deploy key (`npx convex deploy --prod`)
- [ ] **DEPLOY-03**: Clerk production instance with production API keys (`pk_live_`, `sk_live_`)
- [ ] **DEPLOY-04**: Custom domain configured (`app.amd.com`) with SSL on Vercel
- [ ] **DEPLOY-05**: Clerk custom domain (`clerk.amd.com`) with DNS verification
- [ ] **DEPLOY-06**: Environment variable matrix documented (`.env.example` with dev/staging/prod scopes)
- [ ] **DEPLOY-07**: Startup validation — throw error if production uses `pk_test_` keys or dev Convex URL
- [ ] **DEPLOY-08**: Three-tier environment strategy (Development localhost, Staging Vercel Preview, Production custom domain)

## OAuth Production Apps

- [ ] **OAUTH-01**: LinkedIn OAuth production app with `https://app.amd.com` callback URLs
- [ ] **OAUTH-02**: Twitter/X OAuth production app with `https://app.amd.com` callback URLs
- [ ] **OAUTH-03**: Instagram/Meta OAuth production app submitted for review (1-2 week approval)
- [ ] **OAUTH-04**: Environment-variable-driven callback URLs (`${NEXT_PUBLIC_APP_URL}/api/auth/callback/{provider}`)
- [ ] **OAUTH-05**: OAuth flow tested end-to-end on Vercel preview deployment before production

## CI/CD Pipeline

- [ ] **CICD-01**: GitHub Actions workflow — lint + typecheck on every PR
- [ ] **CICD-02**: GitHub Actions workflow — test suite runs on every PR (Vitest)
- [ ] **CICD-03**: GitHub Actions workflow — deploy Convex → deploy Vercel on push to main (sequential)
- [ ] **CICD-04**: Preview deployments per PR (Vercel + Convex preview environments)
- [ ] **CICD-05**: Build fails if `NEXT_PUBLIC_.*KEY` or `NEXT_PUBLIC_.*SECRET` detected in environment
- [ ] **CICD-06**: Husky + lint-staged pre-commit hooks (format + lint on staged files)
- [ ] **CICD-07**: Dependabot or npm audit automated dependency scanning

## Testing Foundation

- [ ] **TEST-01**: Vitest configured with TypeScript + React 19 support
- [ ] **TEST-02**: React Testing Library setup for component tests
- [ ] **TEST-03**: Critical path tests — brand onboarding flow (create profile, save, sync to KB)
- [ ] **TEST-04**: Critical path tests — content creation flow (create, edit, publish)
- [ ] **TEST-05**: Critical path tests — OAuth connection flows (LinkedIn, Twitter, Instagram)
- [ ] **TEST-06**: Convex function tests — authentication enforcement on all mutations
- [ ] **TEST-07**: Test coverage target: critical paths 80%+ (not blanket coverage)

## Error Handling & Validation

- [ ] **ERR-01**: Global error handler mapping API errors to Spanish user-friendly messages
- [ ] **ERR-02**: React Error Boundaries on every page with recovery option (reload button)
- [ ] **ERR-03**: Network error detection — offline state banner with retry option
- [ ] **ERR-04**: Form validation with Zod schemas — client-side inline feedback in Spanish
- [ ] **ERR-05**: Server-side validation on all Convex mutations (never trust client)
- [ ] **ERR-06**: AI agent failure messages — explain why (rate limit, timeout, unavailable) not generic "error"
- [ ] **ERR-07**: Authentication error handling — session expired message with re-login CTA
- [ ] **ERR-08**: Input sanitization — XSS prevention on all user-generated content (`sanitize-html`)

## Toast Notifications & Feedback

- [ ] **TOAST-01**: `sonner` integration for consistent toast UX across all pages
- [ ] **TOAST-02**: Success toasts auto-dismiss 3-5s ("Contenido creado exitosamente")
- [ ] **TOAST-03**: Error toasts require manual dismiss with details
- [ ] **TOAST-04**: Action buttons on toasts where applicable ("Deshacer", "Reintentar")

## Session Management

- [ ] **SESS-01**: Idle timeout warning at 28 min with 2-minute countdown modal
- [ ] **SESS-02**: Auto-save drafts before session expires
- [ ] **SESS-03**: Multi-tab logout sync (logout in one tab logs out all)

## Loading States & UX Polish

- [ ] **LOAD-01**: Skeleton screens for all pages (no blank white screens during data fetch)
- [ ] **LOAD-02**: Agent execution progress indicator with stage updates ("Analizando brief...", "Generando contenido...")
- [ ] **LOAD-03**: Button loading states on all form submissions (disabled + spinner, prevent double-submit)
- [ ] **LOAD-04**: Page transition animations (Framer Motion fade/slide)

## Empty States

- [ ] **EMPTY-01**: Content library empty state — illustration + "Crea tu primer contenido" CTA + value prop
- [ ] **EMPTY-02**: Agents page empty state — "Los 37 agentes están listos" + quick-start guide
- [ ] **EMPTY-03**: Analytics empty state — "Publica contenido para ver estadísticas" + sample preview
- [ ] **EMPTY-04**: Campaigns empty state — "Crea tu primera campaña" + campaign wizard preview

## Performance Optimization

- [ ] **PERF-01**: Lighthouse baseline audit on all pages (measure current state)
- [ ] **PERF-02**: Code splitting — dynamic imports for heavy components (agent modals, chart libraries, rich text editor)
- [ ] **PERF-03**: Image optimization — `next/image` with lazy loading and blur placeholders
- [ ] **PERF-04**: Bundle size analysis with `@next/bundle-analyzer` — target <200KB gzipped
- [ ] **PERF-05**: Core Web Vitals targets: LCP <2.5s, FCP <1.8s, TTI <3.5s, CLS <0.1
- [ ] **PERF-06**: Vercel Analytics + Speed Insights enabled for real-user monitoring

## Security Hardening

- [ ] **SEC-01**: HTTPS enforced with HSTS headers on Vercel
- [ ] **SEC-02**: Content Security Policy (CSP) headers configured
- [ ] **SEC-03**: Rate limiting on AI agent endpoints (prevent abuse of expensive Claude API calls)
- [ ] **SEC-04**: Clerk webhook signature verification with Svix library
- [ ] **SEC-05**: `NEXT_PUBLIC_` prefix audit — no secrets exposed to client bundle
- [ ] **SEC-06**: Dependency vulnerability scanning (npm audit + automated Dependabot PRs)

## Production Monitoring

- [ ] **MON-01**: Sentry error tracking with Next.js SDK (client + server + edge)
- [ ] **MON-02**: Sentry source map uploads for debugging minified production code
- [ ] **MON-03**: User context in Sentry (identify which user encountered error)
- [ ] **MON-04**: AI agent analytics — track execution success rate, tokens used, cost per agent
- [ ] **MON-05**: Alert thresholds — error rate >1% triggers notification

## Accessibility (WCAG 2.2 AA)

- [ ] **A11Y-01**: Keyboard navigation — all interactive elements accessible via Tab/Enter/Escape
- [ ] **A11Y-02**: Screen reader support — semantic HTML, ARIA labels, aria-live for dynamic content
- [ ] **A11Y-03**: Color contrast — 4.5:1 normal text, 3:1 large text (verify Warm Atelier theme)
- [ ] **A11Y-04**: Focus indicators — visible focus states on all interactive elements
- [ ] **A11Y-05**: Touch targets — 44x44px minimum for all interactive elements on mobile

## Mobile Responsiveness Verification

- [ ] **MOB-01**: iPhone SE (375x667) viewport testing — no horizontal scroll, readable text
- [ ] **MOB-02**: iPhone 14 (393x852) viewport testing — all features accessible
- [ ] **MOB-03**: iPad (768x1024) viewport testing — optimal layout for tablets
- [ ] **MOB-04**: Proper keyboard types on form inputs (`type="email"`, `inputMode="numeric"`)

## Onboarding & Help (Differentiators)

- [ ] **ONB-01**: Onboarding flow — Welcome + Goal selection -> Brand setup -> First content -> Success moment
- [ ] **ONB-02**: Contextual tooltips on complex features (agent cards, analytics, publishing)
- [ ] **ONB-03**: Keyboard shortcuts — Cmd+K command palette (global), N (new content), ? (help)
- [ ] **ONB-04**: Smart defaults — remember last agent used, default to brand voice

## Data Export & Compliance

- [ ] **DATA-01**: User data export (JSON — profile, preferences, settings)
- [ ] **DATA-02**: Content export (CSV + JSON — all posts, drafts, metadata)
- [ ] **DATA-03**: Audit logging — authentication events, content actions, agent executions

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| Deployment & Infrastructure | 8 | CRITICAL |
| OAuth Production Apps | 5 | CRITICAL |
| CI/CD Pipeline | 7 | HIGH |
| Testing Foundation | 7 | HIGH |
| Error Handling & Validation | 8 | HIGH |
| Toast Notifications | 4 | MEDIUM |
| Session Management | 3 | MEDIUM |
| Loading States & UX Polish | 4 | MEDIUM |
| Empty States | 4 | MEDIUM |
| Performance Optimization | 6 | HIGH |
| Security Hardening | 6 | HIGH |
| Production Monitoring | 5 | HIGH |
| Accessibility | 5 | MEDIUM |
| Mobile Responsiveness | 4 | MEDIUM |
| Onboarding & Help | 4 | MEDIUM |
| Data Export & Compliance | 3 | MEDIUM |

**Total requirements: 83**

## External Dependencies (Critical Path)

| Dependency | Wait Time | Started By |
|------------|-----------|------------|
| Clerk DNS propagation | 24-48 hours | Phase 19 |
| Custom domain DNS | 1-48 hours | Phase 19 |
| Instagram/Meta OAuth approval | 1-2 weeks | Phase 19 |
| LinkedIn OAuth production app | 1-3 days | Phase 19 |
| Twitter/X OAuth production app | 1-3 days | Phase 19 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 19 | Pending |
| DEPLOY-02 | Phase 19 | Pending |
| DEPLOY-03 | Phase 19 | Pending |
| DEPLOY-04 | Phase 19 | Pending |
| DEPLOY-05 | Phase 19 | Pending |
| DEPLOY-06 | Phase 19 | Pending |
| DEPLOY-07 | Phase 19 | Pending |
| DEPLOY-08 | Phase 19 | Pending |
| OAUTH-01 | Phase 19 | Pending |
| OAUTH-02 | Phase 19 | Pending |
| OAUTH-03 | Phase 19 | Pending |
| OAUTH-04 | Phase 19 | Pending |
| OAUTH-05 | Phase 19 | Pending |
| CICD-01 | Phase 19 | Pending |
| CICD-02 | Phase 19 | Pending |
| CICD-03 | Phase 19 | Pending |
| CICD-04 | Phase 19 | Pending |
| CICD-05 | Phase 19 | Pending |
| CICD-06 | Phase 19 | Pending |
| CICD-07 | Phase 19 | Pending |
| TEST-01 | Phase 19 | Pending |
| TEST-02 | Phase 19 | Pending |
| TEST-03 | Phase 19 | Pending |
| TEST-04 | Phase 19 | Pending |
| TEST-05 | Phase 19 | Pending |
| TEST-06 | Phase 19 | Pending |
| TEST-07 | Phase 19 | Pending |
| ERR-01 | Phase 20 | Pending |
| ERR-02 | Phase 20 | Pending |
| ERR-03 | Phase 20 | Pending |
| ERR-04 | Phase 20 | Pending |
| ERR-05 | Phase 20 | Pending |
| ERR-06 | Phase 20 | Pending |
| ERR-07 | Phase 20 | Pending |
| ERR-08 | Phase 20 | Pending |
| TOAST-01 | Phase 20 | Pending |
| TOAST-02 | Phase 20 | Pending |
| TOAST-03 | Phase 20 | Pending |
| TOAST-04 | Phase 20 | Pending |
| SESS-01 | Phase 20 | Pending |
| SESS-02 | Phase 20 | Pending |
| SESS-03 | Phase 20 | Pending |
| LOAD-01 | Phase 21 | Pending |
| LOAD-02 | Phase 21 | Pending |
| LOAD-03 | Phase 21 | Pending |
| LOAD-04 | Phase 21 | Pending |
| EMPTY-01 | Phase 21 | Pending |
| EMPTY-02 | Phase 21 | Pending |
| EMPTY-03 | Phase 21 | Pending |
| EMPTY-04 | Phase 21 | Pending |
| PERF-01 | Phase 22 | Pending |
| PERF-02 | Phase 22 | Pending |
| PERF-03 | Phase 22 | Pending |
| PERF-04 | Phase 22 | Pending |
| PERF-05 | Phase 22 | Pending |
| PERF-06 | Phase 22 | Pending |
| MOB-01 | Phase 22 | Pending |
| MOB-02 | Phase 22 | Pending |
| MOB-03 | Phase 22 | Pending |
| MOB-04 | Phase 22 | Pending |
| SEC-01 | Phase 23 | Pending |
| SEC-02 | Phase 23 | Pending |
| SEC-03 | Phase 23 | Pending |
| SEC-04 | Phase 23 | Pending |
| SEC-05 | Phase 23 | Pending |
| SEC-06 | Phase 23 | Pending |
| MON-01 | Phase 23 | Pending |
| MON-02 | Phase 23 | Pending |
| MON-03 | Phase 23 | Pending |
| MON-04 | Phase 23 | Pending |
| MON-05 | Phase 23 | Pending |
| DATA-01 | Phase 23 | Pending |
| DATA-02 | Phase 23 | Pending |
| DATA-03 | Phase 23 | Pending |
| ONB-01 | Phase 24 | Pending |
| ONB-02 | Phase 24 | Pending |
| ONB-03 | Phase 24 | Pending |
| ONB-04 | Phase 24 | Pending |
| A11Y-01 | Phase 24 | Pending |
| A11Y-02 | Phase 24 | Pending |
| A11Y-03 | Phase 24 | Pending |
| A11Y-04 | Phase 24 | Pending |
| A11Y-05 | Phase 24 | Pending |

---

*Requirements defined: 2026-02-09*
*Phases start at: 19 (continuing from v3.0 phase 18)*
*Estimated phases: 6 (19-24)*
*Estimated timeline: 6-7 weeks*
