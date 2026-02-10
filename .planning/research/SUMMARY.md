# v4.0 Production Readiness Research Summary

**Project:** AI Marketing Department (AMD) v4.0
**Domain:** Marketing SaaS with 37 AI agents — Production deployment and hardening
**Researched:** 2026-02-09
**Confidence:** HIGH

---

## Executive Summary

AMD is a sophisticated marketing SaaS with 37 AI agents, ~223,000 lines of TypeScript/React code, and full features for content creation, social media management, and analytics. The system works perfectly in development but needs comprehensive production hardening across five critical dimensions: **deployment infrastructure** (Vercel + Convex + Clerk production instances), **CI/CD automation** (GitHub Actions), **error resilience** (Sentry monitoring + graceful degradation), **performance optimization** (Core Web Vitals), and **UX polish** (loading states, empty states, onboarding).

**The recommended approach:** Deploy production infrastructure first (Vercel, Clerk production instance, OAuth apps), then layer on defensive UX patterns (error handling, validation, loading states), followed by performance optimization and security hardening. The critical insight is that **80% of production readiness is about handling failure gracefully** — every unhandled error, every blank loading screen, every confusing 500 message erodes user trust faster than features build it.

**Key risks and mitigation:**
1. **OAuth app approval delays** (1-2 weeks for Instagram/Meta) — mitigate by starting approvals early, having staging fallbacks
2. **Environment variable configuration errors** (mismatched Clerk keys, leaked secrets) — mitigate with startup validation and comprehensive .env.example documentation
3. **Rate limit exhaustion** (Claude API, Resend email) — mitigate with exponential backoff, queue systems, and tier upgrades before launch
4. **Serverless function timeouts** (AI workflows >60s) — mitigate with background job queues (Inngest) and async polling patterns

**Production readiness timeline:** 6-7 weeks from working prototype to launch-ready, with 2-3 weeks blocked on external approvals (OAuth, DNS propagation).

---

## Key Findings

### Recommended Production Stack

AMD's development stack (Next.js 16, Convex, Clerk) is production-ready but requires **operational additions** for reliability, monitoring, and deployment automation. The recommended additions total **$0-20/month** (all free tiers until significant scale).

**Core technologies (do not change):**
- **Next.js 16 + React 19** — Already implemented, Turbopack significantly faster than Webpack
- **Convex** — Serverless backend with real-time sync, handles production at scale
- **Clerk** — Multi-user auth, requires separate production instance with custom domain
- **Tailwind 4 + shadcn/ui** — Styling complete, no changes needed

**Production additions (deploy infrastructure):**
- **Vercel** (free tier → $20/mo) — Official Next.js platform, automatic preview deployments, edge CDN, zero-config for Next.js 16
- **GitHub Actions** (free: 2,000 min/mo) — CI/CD pipeline running lint/test/build on every PR, blocks broken code from production
- **Sentry** (free: 5K errors/mo) — Industry-standard error tracking with Next.js SDK, React 19 error boundaries, source maps for debugging minified code
- **Vercel Analytics + Speed Insights** (free) — Real user monitoring for Core Web Vitals, privacy-first (no cookies)

**Production additions (code quality & testing):**
- **Vitest** (free) — Test runner 10-20x faster than Jest, native ESM/TypeScript support, better DX than Jest for modern apps
- **React Testing Library** (free) — Industry standard for component testing, React 19 compatible
- **ESLint + Prettier + Husky** (free) — Already installed, add pre-commit hooks to enforce quality
- **npm audit + Dependabot** (free) — Automated dependency vulnerability scanning and PRs

**Why Vercel over alternatives:**
- Zero-config deployment for Next.js 16 (official platform)
- Automatic preview deployments for every PR (staging environments)
- Built-in environment variable management with "Sensitive" flag encryption
- Free tier sufficient for 100-500 users (100GB bandwidth, unlimited preview deployments)
- Seamless Convex integration (deploy Convex → deploy Vercel in sequence)

**Why Sentry over alternatives:**
- Official Next.js SDK with automatic instrumentation (client + server)
- React 19 error boundary support
- Source map uploads for debugging production code
- User context integration (see which user encountered error)
- Free tier sufficient for MVP (5,000 errors/month, 10,000 performance transactions/month)

**Why Vitest over Jest:**
- 10-20x faster in watch mode (hot module reloading)
- Native ESM support (Jest only experimental)
- Zero-config TypeScript (no ts-jest needed)
- Better error messages and modern DX
- Next.js 16 uses Vite-compatible Turbopack, so Vitest integrates naturally

**Total monthly cost:** $0 (stays free until growth requires Vercel Pro)

**Confidence:** HIGH — All recommendations verified with official documentation and battle-tested at scale.

---

### Expected Production Features

Production readiness for AMD is not about new features but about **defensive UX** and **graceful failure handling**. The gap between "works in development" and "ready for paying customers" is trust-building through polish that becomes invisible when present but glaringly obvious when absent.

#### Must Have (Table Stakes)

**1. Comprehensive Error Handling** (Complexity: Medium)
Users expect clear, actionable error messages in Spanish, not raw error objects or white screens of death. Research shows **47% of users abandon apps with confusing error messages**.

- **API errors:** Map all error types to Spanish user-friendly messages ("No pudimos completar esta acción. Intenta de nuevo en unos momentos.")
- **Network errors:** Detect offline state, show retry option, queue actions for later
- **Validation errors:** Inline, specific feedback ("El título debe tener al menos 5 caracteres")
- **AI agent failures:** Explain why (rate limit, invalid input, service unavailable) instead of generic "error"
- **Component crashes:** React Error Boundaries with recovery options (reload button)
- **Authentication errors:** Clear session expired message with re-login CTA

**2. Professional Loading States** (Complexity: Low-Medium)
AMD's AI agents can take 10-30 seconds to generate content. **47% of users expect pages to load in under 2 seconds** — skeleton screens reduce perceived wait time.

- **Page transitions:** Skeleton screens matching final layout (no blank white screens)
- **Agent execution:** Progress indicator with stage updates ("Analizando brief...", "Generando contenido...", "Optimizando SEO...")
- **Content generation:** Streaming progress for long operations
- **Form submissions:** Disabled button with loading state (prevent double-submit)
- **Data fetching:** Skeleton placeholders for cards, tables, lists

**3. Empty State Design** (Complexity: Low-Medium)
Every user starts with zero content. **80% of users abandon if they don't reach activation within the first week.** Empty states guide users to their first success.

- **Content library empty:** Illustration + "Crea tu primer contenido" button + value proposition
- **Agents page (no executions):** "Los 37 agentes están listos" + quick-start guide
- **Campaigns page (no campaigns):** "Crea tu primera campaña" + campaign wizard preview
- **Analytics (no data):** "Publica contenido para ver estadísticas" + sample dashboard preview

**4. Form Validation & Input Sanitization** (Complexity: Medium)
Security requirement and UX expectation. Prevents user mistakes, prevents malicious input, reduces support burden.

- **Client-side validation:** Immediate feedback with Zod schemas (title min 5, body min 50)
- **Server-side validation:** Enforce same rules on Convex mutations (never trust client)
- **XSS sanitization:** Escape all user-generated content before rendering (use `sanitize-html`)
- **Rate limiting:** Prevent abuse of AI agent endpoints (expensive) — 10 executions per hour per user

**5. Toast Notifications & Feedback** (Complexity: Low)
Every action needs immediate confirmation that it succeeded or failed. Use `sonner` library for consistent toast UX.

- **Success toasts:** Auto-dismiss after 3-5 seconds ("Contenido creado exitosamente")
- **Error toasts:** Require manual dismiss (user reads error)
- **Action buttons:** "Deshacer", "Ver detalles", "Reintentar"
- **Max 1 toast at a time:** Queue additional toasts

**6. Session Management & Timeouts** (Complexity: Medium)
NIST recommends **30-minute inactivity timeout** for security. Clerk handles authentication but verify idle timeout is configured.

- **Idle timeout:** 30 minutes of inactivity triggers warning
- **Warning modal:** 2-minute warning before auto-logout
- **Activity tracking:** Mouse, keyboard, scroll events reset timer
- **Auto-save:** Save drafts before session expires
- **Multi-tab sync:** Logout in one tab logs out all tabs

**7. Performance Optimization** (Complexity: Medium-High)
**47% of users expect pages to load in under 2 seconds. 40% abandon after 3 seconds.** Every 100ms delay cuts conversions by ~7%.

- **Core Web Vitals targets:** FCP <1.8s, LCP <2.5s, TTI <3.5s, TBT <300ms, CLS <0.1
- **Code splitting:** Dynamic imports for heavy components (agent modals)
- **Image optimization:** Use `next/image` with lazy loading, blur placeholder
- **Bundle size:** <200KB gzipped (currently unknown — needs measurement)

**8. Mobile Responsiveness** (Complexity: Low — verify existing)
50%+ of traffic is mobile. AMD already has responsive design, just verify it works.

- **Viewport testing:** iPhone SE (375x667), iPhone 14 (393x852), iPad (768x1024)
- **Touch targets:** 44x44px minimum for all interactive elements
- **Forms:** Proper keyboard types (`type="email"`, `inputMode="numeric"`)
- **No horizontal scrolling:** `overflow-x-hidden`, responsive images

**9. Accessibility Compliance (WCAG 2.2 AA)** (Complexity: Medium-High)
Legal requirement in EU (since June 2025), U.S. public sector (April 2026). Enterprise customers often require WCAG compliance.

- **Keyboard navigation:** All interactive elements accessible via Tab, Enter, Escape
- **Screen reader support:** Semantic HTML, ARIA labels, aria-live regions for dynamic content
- **Color contrast:** 4.5:1 for normal text, 3:1 for large text
- **Focus indicators:** Visible focus states on all interactive elements
- **Agent execution modals:** Announce progress to screen readers ("Agente ejecutándose, por favor espera")

**10. Security Hardening** (Complexity: High)
Production SaaS handles sensitive business data (brand assets, content, API keys). Security breaches destroy trust and business.

- **HTTPS everywhere:** Vercel handles this, verify HSTS headers enabled
- **Content Security Policy:** CSP headers to prevent XSS
- **Rate limiting:** Prevent brute-force, DDoS, API abuse (use Upstash Redis)
- **Input sanitization:** Escape all user content, validate types
- **Dependency scanning:** Regular `npm audit`, automated scanning with Dependabot

**11. Production Monitoring & Error Tracking** (Complexity: Medium)
You can't fix what you can't see. Production issues must be detected and resolved before users complain.

- **Error tracking:** Sentry for unhandled exceptions, API errors, agent failures
- **Performance monitoring:** Vercel Analytics for Core Web Vitals, page load times, API latency
- **AI agent analytics:** Custom dashboard tracking agent execution success rate, tokens used, costs
- **Alerting thresholds:** Error rate >1% → Slack notification, Agent failure rate >5% → email

**12. Audit Logging** (Complexity: Medium-High)
Enterprise customers **require** audit logs for compliance (SOC 2, GDPR). Many B2B buyers won't consider SaaS without it.

- **Authentication events:** Login attempts, logout, session expired (1 year retention)
- **Content actions:** Created, edited, deleted, published (2 years retention)
- **Agent executions:** Agent ID, task type, input, result, tokens used (1 year retention)
- **Export functionality:** GDPR right to data portability (CSV export)

#### Should Have (Differentiators)

**1. Comprehensive Onboarding Flow** (Complexity: Medium-High)
Research shows **75% of users abandon products within a week without clear onboarding**. Effective onboarding reduces churn by 50%+. For AMD with 37 agents, onboarding is critical to prevent overwhelm.

- **Step 1: Welcome & Goal Selection** — "¿Qué quieres lograr primero?" (crear contenido, analizar audiencia, gestionar equipo)
- **Step 2: Simplified Brand Setup** — Name, description, tone (professional/casual/friendly/technical)
- **Step 3: First Content Creation (Interactive)** — Generate first LinkedIn post with guided walkthrough
- **Step 4: Success Moment** — Confetti animation + "¡Listo! Ya puedes usar AMD" + next steps

**2. Contextual In-App Help** (Complexity: Medium)
Reduces support burden, empowers users to self-serve. Non-technical users need help understanding 37 agents.

- **Help widget:** Floating button (bottom-right) with search, videos, guides
- **Contextual tooltips:** Hover/click on `?` icons ("Este agente se especializa en...")
- **Video tutorials:** Short (<2 min) Loom videos for key features
- **Cmd+K help search:** "¿Cómo ejecuto un agente?"

**3. Smart Defaults & Personalization** (Complexity: Low-Medium)
Reduces cognitive load, makes product feel intuitive. AMD has many options — smart defaults prevent overwhelm.

- **Agent execution:** Remember last agent used, suggest agents based on content type
- **Content tone:** Default to brand voice, learn preferred tone over time
- **Dashboard view:** Show most-used department, customizable widget layout

**4. Keyboard Shortcuts & Power User Features** (Complexity: Low-Medium)
Makes power users efficient, builds product love and advocacy.

- **Cmd/Ctrl + K:** Command palette (global)
- **N:** New content (on /content page)
- **E:** Execute selected agent (on /agents page)
- **?:** Show shortcuts help (global)

**5. Data Export & Portability (GDPR)** (Complexity: Medium)
GDPR right to data portability (required for EU users). Builds trust — users own their data.

- **User data export:** JSON (profile, preferences, settings)
- **Content export:** CSV + JSON (all posts, drafts, metadata)
- **Agent executions export:** CSV (execution history, results)
- **7-day download link:** Email with secure S3 URL

#### Defer to v2+ (Anti-Features)

**1. Real-Time Collaborative Editing** — High complexity (CRDT, WebSockets), AMD is not a document editor
**2. Custom AI Model Selection** — Non-technical users don't understand model differences (Sonnet vs Opus)
**3. White-Label / Custom Branding** — Massive complexity, target market is SMBs not agencies
**4. Multi-Language UI (Beyond Spanish/English)** — Translation overhead for 37 agent descriptions
**5. Native Mobile Apps** — Huge development burden, responsive web app sufficient
**6. Video Content Generation** — AMD agents are text-focused, scope creep
**7. Advanced Analytics (ML-Powered Predictions)** — Requires significant data volume to be accurate
**8. Custom Agent Builder** — Target audience lacks prompt engineering skills

---

### Architecture Approach

AMD uses a **three-tier environment strategy** (Development, Staging, Production) with separate deployments for Convex backend, Clerk authentication, and OAuth integrations. The architecture ensures **environment isolation** with no shared resources between dev/staging/prod.

**Major components:**

1. **Frontend (Next.js 16 on Vercel)**
   - Development: `localhost:3000`
   - Staging: Vercel Preview Deployments (`amd-git-{branch}.vercel.app`)
   - Production: Custom domain (`app.amd.com`)
   - Responsibility: UI rendering, client-side routing, server components

2. **Backend (Convex Serverless)**
   - Development: Convex dev deployment (`dev-xxx.convex.cloud`)
   - Staging: Convex preview deployment (one per PR branch)
   - Production: Convex production deployment (`prod-xxx.convex.cloud`)
   - Responsibility: Real-time database, queries/mutations, AI agent execution

3. **Authentication (Clerk)**
   - Development: Clerk Development Instance (`pk_test_...`)
   - Staging: Shared Development Instance (same as dev)
   - Production: Clerk Production Instance (`pk_live_...`) with custom domain (`clerk.amd.com`)
   - Responsibility: User authentication, session management, JWT validation

4. **OAuth Providers (LinkedIn, Twitter, Instagram)**
   - Development: OAuth dev apps with `http://localhost:3000` callbacks
   - Staging: OAuth staging apps with `https://staging.amd.com` callbacks
   - Production: OAuth production apps with `https://app.amd.com` callbacks
   - Responsibility: Social platform integrations, content publishing

5. **CI/CD Pipeline (GitHub Actions)**
   - Trigger: Pull request (staging), push to main (production)
   - Jobs: Lint → Type check → Test → Deploy Convex → Deploy Vercel
   - Responsibility: Automated quality checks, deployment orchestration

**Key architectural patterns:**
- **Environment-specific OAuth apps:** Prevents localhost redirects in production
- **Sequential deployment:** Deploy Convex first (generates types) → then Next.js build
- **Preview deployments per PR:** Every branch gets isolated Convex + Vercel deployment
- **Separate Clerk instances:** Development (`pk_test_`) vs Production (`pk_live_`) with different domain restrictions

**Deployment dependency graph:**
1. Create Convex production deployment → Generate deploy key
2. Create Clerk production instance → Configure custom domain (24-48 hour DNS propagation)
3. Create OAuth production apps → Submit for approval (1-2 weeks for Instagram/Meta)
4. Configure Vercel project → Set environment variables (production + preview scopes)
5. Setup GitHub Actions → Test CI/CD pipeline with preview deployments
6. First production deployment → Verify OAuth flows work end-to-end

**Critical path blockers:** Clerk DNS propagation (24-48 hours), OAuth app approvals (1-2 weeks for Meta), custom domain DNS (1-48 hours).

**Estimated total time to production:** 2-3 weeks (mostly waiting for external approvals).

---

### Critical Pitfalls

Based on comprehensive production deployment research, these are the **top 5 most dangerous pitfalls** that will break AMD in production (ordered by severity):

**1. Clerk API Keys in Wrong Environment (CRITICAL)**
**What breaks:** Production keys (`pk_live_`, `sk_live_`) only work with configured production domains. Using development keys in production causes complete authentication failure — no users can sign in.

**How to avoid:**
- Use Vercel environment variables interface, never copy `.env.local`
- Create separate Clerk applications for dev/staging/prod
- Implement startup validation: throw error if production uses `pk_test_` keys
- Document key format requirements in `.env.example`

**2. OAuth Callback URLs Point to Localhost (CRITICAL)**
**What breaks:** LinkedIn, Twitter, Instagram OAuth configured with `http://localhost:3000/api/auth/callback/*` in production. After users authenticate, they're redirected to localhost → "connection refused" errors.

**How to avoid:**
- Register production HTTPS redirect URIs in all OAuth provider dashboards
- Use environment variables for callback URLs: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/linkedin`
- Test OAuth flow on Vercel preview deployments before production
- Create OAuth app setup checklist documenting all three providers

**3. Convex Deployment URL Not Set in Next.js (CRITICAL)**
**What breaks:** Next.js app uses development Convex deployment URL in production. All database queries fail, real-time subscriptions never connect, app shows infinite loading spinners.

**How to avoid:**
- Run `npx convex deploy --prod` to create production deployment
- Set `NEXT_PUBLIC_CONVEX_URL` in Vercel to production Convex URL (not dev URL)
- Verify environment variable is set for "Production" scope in Vercel (not just "Preview")
- Document deployment URLs in `.env.example` with comments

**4. Environment Variables with NEXT_PUBLIC_ Leak Secrets (CRITICAL)**
**What breaks:** Developer prefixes API keys with `NEXT_PUBLIC_` thinking it's a naming convention. Next.js bakes these into client JavaScript bundle → secrets exposed in page source.

**How to avoid:**
- **NEVER** prefix secrets with `NEXT_PUBLIC_` (no `NEXT_PUBLIC_ANTHROPIC_API_KEY`, `NEXT_PUBLIC_RESEND_API_KEY`)
- Only use `NEXT_PUBLIC_` for truly public values (app URL, Clerk publishable key, Convex URL)
- Use Server Actions or API routes for sensitive operations
- Add CI check: fail build if `NEXT_PUBLIC_.*KEY` or `NEXT_PUBLIC_.*SECRET` detected in .env

**5. Claude API Rate Limits Hit in Production (HIGH)**
**What breaks:** 37 AI agents making Claude API calls with no rate limiting. During production traffic spikes, app hits Anthropic rate limits (Tier 1: 50 RPM), causing 429 errors → all AI features break simultaneously.

**How to avoid:**
- Implement exponential backoff with jitter for all Claude API calls
- Use queue system (Inngest, BullMQ) for background agent execution with concurrency limits
- Upgrade to Tier 4 before launch ($400 deposit → 4000 RPM vs Tier 1's 50 RPM)
- Monitor rate limit usage and alert when approaching limits
- Implement graceful degradation (show cached result or "AI temporarily unavailable")

**Additional high-priority pitfalls:**
- **Convex Schema Changes Without Migration (CRITICAL):** Changing field types or adding required fields breaks production data → use two-deploy pattern (optional first, migrate data, then required)
- **Clerk Webhook Signature Verification Disabled (CRITICAL):** Attackers can forge webhook payloads to inject admin accounts → always verify with Svix library
- **Resend Email Rate Limits Exceeded (HIGH):** 2 requests/second default → use queue with rate limiting, request increase before launch
- **Vercel Serverless Function Timeouts (HIGH):** Hobby plan: 10s, Pro: 60s timeout → use background jobs for long AI workflows, configure `maxDuration` for routes

---

## Implications for Roadmap

Based on research, suggested **6-phase structure** for v4.0 Production Readiness:

### Phase 1: Environment Setup & Infrastructure (Week 1-2)

**Rationale:** Nothing works in production without correct environment configuration. This is the foundation layer that unblocks all other work. Must happen first because deployment infrastructure (Vercel, Clerk, OAuth apps) has external dependencies with multi-day wait times (DNS propagation, OAuth approvals).

**Delivers:**
- Vercel project configured with production + preview environments
- Clerk production instance with custom domain (`clerk.amd.com`)
- OAuth production apps for LinkedIn, Twitter, Instagram (submitted for approval)
- Convex production deployment with deploy keys
- GitHub Actions CI/CD pipeline (lint → test → deploy)
- Environment variable matrix documented and validated

**Addresses features:**
- Environment variable security (prevents secret leaks)
- OAuth callback URL management (prevents localhost redirects)
- CI/CD automation (GitHub Actions)

**Avoids pitfalls:**
- #1 (Clerk API keys in wrong environment)
- #2 (OAuth callback URLs point to localhost)
- #3 (Convex deployment URL not set)
- #4 (NEXT_PUBLIC_ secret leaks)
- #15 (Instagram OAuth HTTPS requirement)

**Blockers:**
- Clerk DNS propagation (24-48 hours)
- OAuth app approvals (1-2 weeks for Instagram/Meta)
- Custom domain DNS (1-48 hours)

**Estimated duration:** 2 weeks (mostly waiting for external approvals)

---

### Phase 2: Error Handling & Validation (Week 3)

**Rationale:** After infrastructure is deployed, the next critical layer is **defensive UX** — preventing errors from reaching users and handling failures gracefully. This comes before features because every unhandled error destroys user trust faster than features build it.

**Delivers:**
- Global error handler (API, network, component crashes)
- Spanish error messages dictionary (user-friendly translations)
- React Error Boundaries with recovery options
- Form validation (Zod schemas client + server)
- Input sanitization (XSS prevention with `sanitize-html`)
- Toast notification system (`sonner` integration)
- Session timeout detection (30-minute idle timeout)

**Addresses features:**
- Comprehensive error handling (table stakes)
- Form validation & input sanitization (table stakes)
- Toast notifications & feedback (table stakes)
- Session management & timeouts (table stakes)

**Avoids pitfalls:**
- No specific pitfall, but prevents 80% of production issues
- Implements foundation for monitoring (Phase 5)

**Estimated duration:** 1 week

---

### Phase 3: Loading States & UX Polish (Week 4)

**Rationale:** After error handling prevents negative experiences, add positive feedback loops. Loading states and empty states guide users through success paths and reduce perceived wait time for AI operations (10-30 seconds).

**Delivers:**
- Skeleton screens for all pages (no blank white screens)
- Agent execution progress indicators ("Analizando brief...", "Generando contenido...")
- Empty state designs for all pages (content, agents, campaigns, analytics)
- Loading states for all buttons/forms (prevent double-submit)
- Professional animations (Framer Motion integration)

**Addresses features:**
- Professional loading states (table stakes)
- Empty state design (table stakes)

**Avoids pitfalls:**
- No specific pitfall, but improves user retention
- Addresses research finding: 80% of users abandon without clear activation path

**Estimated duration:** 1 week

---

### Phase 4: Performance Optimization (Week 5)

**Rationale:** After UX polish, optimize for speed. Research shows **47% of users expect pages to load in <2 seconds, 40% abandon after 3 seconds**. Every 100ms delay cuts conversions by ~7%.

**Delivers:**
- Lighthouse audit baseline (measure current performance)
- Code splitting (dynamic imports for heavy components)
- Image optimization (`next/image` with lazy loading)
- Bundle size analysis and reduction (<200KB gzipped target)
- API response caching (Convex queries)
- Core Web Vitals targets: LCP <2.5s, FCP <1.8s, TTI <3.5s

**Addresses features:**
- Performance optimization (table stakes)
- Mobile responsiveness verification (table stakes)

**Avoids pitfalls:**
- No specific pitfall, but improves conversion rates
- Implements Vercel Analytics + Speed Insights for monitoring

**Estimated duration:** 1 week

---

### Phase 5: Security & Monitoring (Week 6)

**Rationale:** After performance optimization, layer on security hardening and production monitoring. This phase implements observability needed to detect and resolve issues before users complain.

**Delivers:**
- Rate limiting (Upstash Redis for API abuse prevention)
- CSP headers (Content Security Policy for XSS prevention)
- Dependency audit and updates (`npm audit`, Dependabot)
- Sentry error tracking setup (Next.js SDK + React 19 error boundaries)
- Audit log implementation (authentication, content, agent executions)
- Data export functionality (GDPR compliance)
- AI agent analytics dashboard (success rate, tokens, costs)

**Addresses features:**
- Security hardening (table stakes)
- Production monitoring & error tracking (table stakes)
- Audit logging (table stakes for enterprise)
- Data export & portability (should have for GDPR)

**Avoids pitfalls:**
- #6 (Clerk webhook signature verification disabled)
- #7 (Claude API rate limits hit in production)
- #8 (Resend email rate limits exceeded)
- Implements foundation for alerting

**Estimated duration:** 1 week

---

### Phase 6: Onboarding & Polish (Week 7)

**Rationale:** Final polish layer before launch. Onboarding is **critical** for AMD with 37 agents — 75% of users abandon without clear onboarding. This phase focuses on reducing time-to-first-value and building product love.

**Delivers:**
- Onboarding flow (4 steps: Welcome → Brand setup → First content → Success)
- Help widget with search (contextual tooltips, video tutorials)
- Accessibility audit (WCAG 2.2 AA compliance)
- Keyboard shortcuts (Cmd+K command palette, power user features)
- Mobile responsiveness verification (iPhone, iPad, Android viewports)
- Smart defaults & personalization (remember last agent, default tone)

**Addresses features:**
- Comprehensive onboarding flow (differentiator)
- Contextual in-app help (differentiator)
- Accessibility compliance (table stakes for enterprise)
- Keyboard shortcuts (differentiator for power users)
- Smart defaults (differentiator)

**Avoids pitfalls:**
- Addresses research finding: 75% abandon without onboarding
- Improves activation rate and reduces churn

**Estimated duration:** 1 week

---

### Phase Ordering Rationale

**Why this order:**
1. **Infrastructure first (Phase 1)** — Nothing deploys without Vercel, Clerk, OAuth configured. External dependencies (DNS, approvals) have multi-day wait times → start early.
2. **Error handling before features (Phase 2)** — Prevents 80% of production issues, builds foundation for monitoring. Defensive UX more important than additive features.
3. **UX polish before performance (Phase 3)** — Users need feedback during loading (skeleton screens, progress indicators) before we optimize load times.
4. **Performance before security (Phase 4)** — Speed affects all users, security affects specific attack vectors. Optimize experience first.
5. **Security + monitoring together (Phase 5)** — Monitoring detects security issues, so implement together. Audit logs and rate limiting are security + compliance requirements.
6. **Onboarding last (Phase 6)** — Polished onboarding only works if underlying app is reliable. Don't onboard users to broken experience.

**Dependencies discovered:**
- Clerk custom domain (Phase 1) must complete before production auth works
- OAuth app approvals (Phase 1) must complete before production OAuth works
- Error boundaries (Phase 2) required for Sentry integration (Phase 5)
- Sentry setup (Phase 5) required for alerting on rate limits

**How this avoids pitfalls:**
- Phase 1 addresses all CRITICAL environment configuration pitfalls (#1-4)
- Phase 2 implements validation to prevent bad data from reaching production
- Phase 5 implements rate limiting and monitoring to detect/prevent API limit issues (#7-8)
- Sequential deployment (Convex → Vercel) prevents type generation race conditions

---

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Performance):** Bundle size analysis needed to identify optimization opportunities. Current bundle size unknown.
- **Phase 5 (Security):** Rate limiting strategy needs API usage projections (37 agents × avg requests/min × concurrent users).
- **Phase 6 (Accessibility):** WCAG 2.2 AA manual testing needs screen reader verification (NVDA, JAWS, VoiceOver).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Infrastructure):** Well-documented Vercel + Convex + Clerk deployment patterns, official docs comprehensive.
- **Phase 2 (Error Handling):** Industry-standard patterns (React Error Boundaries, Zod validation, toast notifications).
- **Phase 3 (Loading States):** Established UX patterns (skeleton screens, progress indicators) with proven libraries.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack (deployment)** | HIGH | Vercel is official Next.js platform, proven at scale. Convex production docs comprehensive. Clerk production deployment well-documented. |
| **Stack (monitoring)** | HIGH | Sentry Next.js SDK mature, React 19 support confirmed. Vercel Analytics well-documented. |
| **Stack (testing)** | HIGH | Vitest proven faster than Jest, strong TypeScript + React 19 support, growing community. |
| **Features (table stakes)** | HIGH | Error handling, loading states, validation are industry best practices with multiple authoritative sources. |
| **Features (differentiators)** | MEDIUM | Onboarding patterns well-researched but AMD-specific implementation needs user testing. |
| **Architecture (environment strategy)** | HIGH | Three-tier strategy is standard practice, Convex preview deployments documented, Clerk multi-instance well-supported. |
| **Architecture (OAuth callbacks)** | MEDIUM | Provider docs comprehensive but dated in some cases. Instagram/Meta approval process unpredictable (1-2 weeks). |
| **Pitfalls (environment config)** | HIGH | All CRITICAL pitfalls verified with official documentation (Clerk, Convex, Next.js). |
| **Pitfalls (rate limiting)** | HIGH | Claude API rate limits officially documented, Resend limits confirmed in docs. |
| **Pitfalls (schema migrations)** | HIGH | Convex migration patterns well-documented in Stack articles and official docs. |

**Overall confidence:** HIGH for production readiness with this roadmap. MEDIUM for exact implementation details (bundle size, rate limit thresholds, WCAG manual testing).

---

### Gaps to Address

**Before starting Phase 1 (Infrastructure):**
1. **OAuth app approval timeline:** Instagram/Meta approval can take 1-2 weeks and may be rejected. Start submissions early, have contingency plan if rejected (defer Instagram to v4.1).
2. **Custom domain ownership:** Verify control of DNS for `app.amd.com` and `clerk.amd.com` subdomains before starting Clerk production setup.

**Before starting Phase 4 (Performance):**
1. **Lighthouse baseline:** Run current performance audit to understand starting point (unknown bundle size, current Core Web Vitals).
2. **Bundle size analysis:** Use `@next/bundle-analyzer` to identify optimization opportunities (currently unknown which components are heavy).

**Before starting Phase 5 (Security):**
1. **Rate limit projections:** Calculate expected Claude API RPM based on: 37 agents × average requests per agent × concurrent users × burst factor. Determine if Tier 4 (4000 RPM) sufficient or need Tier 5.
2. **Email volume projections:** Estimate welcome emails + password resets + notifications to determine if Resend default (2 req/sec) sufficient or need rate limit increase.

**Before starting Phase 6 (Onboarding):**
1. **User testing:** Validate onboarding flow with 5-10 beta users to ensure 4-step flow reduces time-to-first-value.
2. **Accessibility audit:** Manual testing with screen readers (NVDA, JAWS, VoiceOver) required for 70% of WCAG issues (automated tools catch only 30%).

**Validation needed during implementation:**
1. **Convex rate limiting:** Verify if Convex has built-in rate limiting or needs external service (Upstash Redis).
2. **Clerk session timeout:** Verify current idle timeout settings, determine if custom implementation needed or Clerk built-in sufficient.
3. **Error tracking coverage:** After Sentry integration, verify all critical paths (agent execution, content creation, OAuth flows) are instrumented.

---

## Sources

### Primary (HIGH confidence)

**Deployment & Hosting:**
- [Vercel Deployment Configuration (2026)](https://oneuptime.com/blog/post/2026-01-24-configure-vercel-deployment/view)
- [Next.js 16 Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Convex Production Deployment](https://docs.convex.dev/production)
- [Convex + Vercel Integration](https://docs.convex.dev/production/hosting/vercel)

**Authentication & Security:**
- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk Security Best Practices](https://clerk.com/docs/guides/secure/best-practices/fixation-protection)
- [Convex + Clerk + Next.js Authentication](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs)

**CI/CD:**
- [GitHub Actions CI/CD for Next.js](https://arnab-k.medium.com/setting-up-ci-cd-pipelines-for-next-js-projects-354d500f7461)
- [Next.js CI/CD Guide 2024](https://nextjsstarter.com/blog/nextjs-cicd-deployment-guide-2024/)

**Error Monitoring:**
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Convex Exception Reporting](https://docs.convex.dev/production/integrations/exception-reporting)
- [Convex + Sentry Integration](https://sentry.io/integrations/convex/)

**Performance:**
- [Optimizing Core Web Vitals 2024](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024)
- [Next.js Web Performance](https://nextjs.org/learn/seo/web-performance)
- [Optimize Core Web Vitals Next.js App Router 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)

**Testing:**
- [Vitest vs Jest Comparison](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
- [Vitest for Next.js Apps](https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app)
- [Testing in 2026: Full Stack Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)

**UX & Accessibility:**
- [Error Message UX Best Practices](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback)
- [SaaS UX Design Guide 2026](https://www.designstudiouiux.com/blog/saas-ux-design-the-ultimate-guide/)
- [Best Practices for Loading States in Next.js](https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs)
- [Empty State in SaaS Applications](https://userpilot.com/blog/empty-state-saas/)
- [WCAG 2.2 Level AA Requirements 2026](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/)
- [SaaS Onboarding Best Practices 2026](https://www.sales-hacking.com/en/post/best-practices-onboarding-saas)

**Security & Compliance:**
- [SaaS Security Best Practices 2026](https://www.nudgesecurity.com/post/saas-security-best-practices)
- [State of SaaS Security 2025-2026](https://cloudsecurityalliance.org/artifacts/state-of-saas-security-report-2025)
- [Enterprise Ready Audit Logging](https://www.enterpriseready.io/features/audit-log/)

**API Rate Limits:**
- [Claude API Rate Limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Claude API Production Scaling Guide](https://www.hashbuilds.com/articles/claude-api-rate-limits-production-scaling-guide-for-saas)
- [Resend API Rate Limit](https://resend.com/docs/api-reference/rate-limit)
- [Mastering Email Rate Limits - Resend API](https://dalenguyen.me/blog/2025-09-07-mastering-email-rate-limits-resend-api-cloud-run-debugging)

**Deployment Pitfalls:**
- [Convex Intro to Migrations](https://stack.convex.dev/intro-to-migrations)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- [Vercel Function Timeouts](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Next.js Environment Variables (2026)](https://thelinuxcode.com/nextjs-environment-variables-2026-build-time-vs-runtime-security-and-production-patterns/)

### Secondary (MEDIUM confidence)

**OAuth Configuration:**
- [LinkedIn 3-Legged OAuth Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Twitter Callback URLs](https://developer.twitter.com/en/docs/apps/callback-urls)
- [Instagram Platform API Guide](https://gist.github.com/PrenSJ2/0213e60e834e66b7e09f7f93999163fc)
- [Solving Dynamic OAuth 2.0 Callbacks](https://release.com/blog/solving-for-dynamic-oauth-2-0-callbacks-with-environment-handles)

**Performance Benchmarks:**
- [SaaS Performance Benchmarking 2026](https://www.binadox.com/blog/saas-performance-benchmarking-industry-standards-for-speed-uptime-and-user-satisfaction/)
- [Website Load Time Statistics 2026](https://www.hostinger.com/tutorials/website-load-time-statistics)
- [Page Load Speed for SaaS Success](https://www.getmonetizely.com/articles/why-page-load-speed-matters-for-saas-success-measurement-impact-and-optimization)

**Monitoring:**
- [Top 10 SaaS Monitoring Tools 2026](https://themantrix.com/en/blog/Top-10-Tools-for-Monitoring-SaaS-Availability-and-Uptime-in-2026)
- [11 Best Error Tracking Tools 2026](https://betterstack.com/community/comparisons/error-tracking-tools/)

---

*Research completed: 2026-02-09*

*Ready for roadmap: Yes — 6-phase structure with clear dependencies, blockers, and timelines*

*Total effort: 6-7 weeks from working prototype to production launch*
