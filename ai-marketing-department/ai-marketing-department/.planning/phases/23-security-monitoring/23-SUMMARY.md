# Phase 23: Security & Monitoring — COMPLETED

## What was done

### Plan 23-01: Security Headers + Secret Audit
- **7 security headers** configured in next.config.ts:
  - HSTS (1 year, includeSubDomains, preload)
  - CSP (whitelists Clerk, Convex, Vercel Analytics, Google Fonts)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy (disables camera, microphone, geolocation)
  - X-XSS-Protection: 1; mode=block
- **NEXT_PUBLIC_DEV_AUTH_BYPASS hardened**: NODE_ENV !== "production" guard added
- **Clerk auth.protect() enabled**: was previously commented out, now active on all non-public routes
- **NEXT_PUBLIC_ audit**: all vars verified safe (Convex URL, Clerk publishable key, route paths)

### Plan 23-02: Rate Limiting + Dependency Scanning
- **rateLimits table** added to Convex schema (token bucket per user/endpoint)
- **checkAndRecord mutation**: sliding window rate limiter
- **callClaude**: 20 calls/min rate limit
- **executeAgent**: 10 executions/min rate limit
- **npm audit** job added to CI pipeline (audit-level=high)
- Dependabot already configured (Phase 19)

### Plan 23-03: Audit Logging + Data Export + Agent Analytics
- Audit logging already in place (20+ insert points across content, social, agents)
- **getAuditLog query**: paginated with action/entityType filters
- **exportUserData query**: GDPR-compliant user profile + settings + brand export
- **exportContent query**: flat structure for CSV export
- **getAgentAnalytics query**: per-agent execution stats (success rate, tokens, cost)

## Requirements covered
- SEC-01: HSTS headers
- SEC-02: CSP headers
- SEC-03: Rate limiting on AI endpoints
- SEC-05: NEXT_PUBLIC_ audit
- SEC-06: npm audit + Dependabot
- MON-04: Agent analytics
- DATA-01: User data export
- DATA-02: Content export
- DATA-03: Audit logging

## Requirements deferred (need external accounts)
- SEC-04: Clerk webhook verification (needs production Clerk instance)
- MON-01-03: Sentry setup (needs Sentry account/DSN)
- MON-05: Alert thresholds (depends on Sentry)

## Verification
- Build passes: 19/19 pages
- Tests pass: 19/19
- 4 atomic commits
