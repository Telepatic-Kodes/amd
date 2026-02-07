# Project State: AMD

**Started:** 2026-01-30
**Current Milestone:** v3.0 Intelligence & Scale
**Status:** Phase 14 complete — ready for Phase 15

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core Value:** Non-technical users can manage a complete marketing department in minutes, not hours.
**Current Focus:** Phase 15 complete — ready for Phase 16 (Cross-Platform Features)

## Current Position

Phase: 16 of 18 (Cross-Platform Features) — IN PROGRESS
Plan: 2 of 4 completed
Status: In progress
Last activity: 2026-02-07 — Completed 16-02-PLAN.md

Progress: [███████████████████░] 95% (v1.0 + v2.0 shipped: 12/18 phases, v3.0: 21/24 plans completed)

## Performance Metrics

**v1.0 Velocity (Archive):**
- Total plans completed: 19
- Total phases: 8
- Total execution time: ~9 hours (2026-01-30)
- Average duration: ~28 min/plan

**v2.0 Velocity (Archive):**
- Total plans completed: 6
- Total phases: 4
- Total execution time: ~45 min
- Average duration: ~7.5 min/plan

**v3.0 Velocity:**
- Total plans completed: 20/24
- Average duration: ~4.5 min/plan
- Total execution time: ~100 min

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: Spanish-first UI dramatically improved UX (✓ Good)
- v2.0: LinkedIn OAuth 2.0 with PKCE flow as publishing PoC (✓ Good)
- **v3.0: Clerk chosen over Convex Auth** — Production-ready, free tier 10K MAU, official Convex integration
- **v3.0: Direct platform SDKs** — twitter-api-v2, facebook-nodejs-business-sdk (not wrappers)
- **v3.0: Phase structure** — 6 phases (13-18), Auth first → Analytics/Multi-Platform parallel → Collaboration → Reports
- **v3.0: Instagram App Review critical path** — 60-90 day approval, start Week 1 of Phase 15
- **13-02: userId stores Clerk subject string** — Direct filtering without additional lookups, getUserId() extracts from identity.subject
- **13-02: First user becomes system owner** — Automatic role assignment with isSystemOwner flag for migrations
- **13-02: Optional userId fields** — Backward compatibility maintained, gradual migration supported
- **13-02b: Backward-compatible filtering pattern** — Queries filter with `item.userId === userId || item.userId === undefined` for migration grace period
- **13-02b: System resources remain shared** — Agents, settings, executions accessible to all authenticated users (not user-scoped)
- **14-01: In-memory analytics aggregation** — No @convex-dev/aggregate dependency; direct queries with .collect() + JS reduce/filter for date-filtered analytics
- **14-01: Query-time daily rollups** — No pre-aggregation tables; compute tasksByDay on-demand from filtered tasks
- **14-02: Dynamic TTL caching** — Hot posts (<48h) refresh every 30min, warm (2-14d) every 4h, cold (>14d) every 24h for optimal API usage
- **14-02: Rate limit protection at batch level** — Max 10 posts/run, 429 stops batch immediately to prevent cascade failures
- **14-03: Client-side CSV generation** — Blob + download link pattern avoids backend endpoint, works with Convex useQuery pre-fetch
- **14-03: Spanish locale for analytics** — Intl.NumberFormat('es-ES') for currency/dates matches UX-01 requirement
- **15-01: Twitter PKCE flow** — code_verifier generation + SHA-256 hashing for secure OAuth 2.0 with Twitter API
- **15-01: Instagram via Facebook OAuth** — Instagram Business API accessed through Facebook OAuth with Page linking requirement
- **15-01: Cookie-based CSRF with fallback** — State validation via cookies with warning-only if missing (browser compatibility)
- **15-03: Container status polling** — Instagram Container API is async; poll status_code until FINISHED (5 attempts, 2s delay) before publishing
- **15-03: 60-day Instagram tokens** — Long-lived tokens expire in 60 days (vs LinkedIn 365d), isExpiringSoon flag at <7 days
- **15-04: Client-side thread splitter** — Duplicates server logic for accurate tweet/thread preview; splits on paragraph → sentence → word boundaries
- **15-04: Twitter brand color #1DA1F2** — Classic Twitter blue for platform consistency, differentiates from LinkedIn (#0A66C2)
- **15-05: Instagram gradient branding** — from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] used consistently across Instagram components
- **15-05: Carousel URL management** — Dynamic array with add/remove buttons (max 10) for variable carousel sizes
- **15-05: Facebook requirement always visible** — Collapsible accordion explaining Business API requirements (60-90d App Review timeline)
- **16-01: Pure TypeScript shared adapter** — lib/contentAdapters.ts has NO Convex imports, importable by both backend and frontend
- **16-01: Promise.allSettled for batch publish** — Parallel execution with independent error handling; one platform failure doesn't block others
- **16-01: Adaptation for preview only** — Platform actions handle their own content; adapters are for frontend preview UI

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 13 (Authentication) - COMPLETE ✅:**
- ✓ Clerk + Convex auth infrastructure installed and configured
- ✓ Sign-in/sign-up pages with dark theme
- ✓ Users table, auth helpers, migration mutation
- ✓ Defense-in-depth complete: All user-facing Convex functions enforce auth independently
- ✓ Backward compatibility: Queries handle undefined userId gracefully during migration
- ✓ Frontend integration: Next.js middleware + Clerk + UserMenu + migration banner
- ✓ Clerk external service configured (JWT template "convex", env vars set)

**Phase 15 (Multi-Platform) - COMPLETE ✅:**
- ✓ Plan 15-01: Schema tables + OAuth routes for Twitter and Instagram
- ✓ Plan 15-02: Twitter backend actions (token exchange, publishing, threads)
- ✓ Plan 15-03: Instagram backend actions (token exchange, media upload, carousel)
- ✓ Plan 15-04: Twitter frontend components (connection card, publish button, previews)
- ✓ Plan 15-05: Instagram frontend components (connection card, image/carousel publish, previews)
- ✓ Plan 15-06: Settings integration + multi-platform publish panel + Spanish translations
- ✓ All 6 plans complete, 15 commits, Convex compiles clean
- Instagram Business API: App Review required (60-90 day timeline) - must start submission Week 1
- Twitter API pricing: Free tier is write-only; Basic tier ($200/mo) minimum for analytics access
- OAuth token refresh: Each platform has different expiry patterns (LinkedIn 365d, Instagram 60d, Twitter variable)

**Phase 14 (Analytics) - COMPLETE ✅:**
- ✓ Plan 14-01: linkedinEngagement table + 5 analytics queries (AI-01, AI-02, AI-03, AI-04)
- ✓ Plan 14-02: LinkedIn engagement fetcher with dynamic TTL caching and hourly cron
- ✓ Plan 14-03: Analytics dashboard UI with date filtering, LinkedIn engagement display, A/B insights (AL-04), CSV export
- ✓ Verification passed: 5/5 success criteria, 12/12 requirements satisfied
- ✓ All 9 commits clean, TypeScript compiles, Convex deploys

**Phase 16 (Cross-Platform Features) - IN PROGRESS:**
- ✓ Plan 16-01: Cross-platform backend (lib/contentAdapters.ts, batch publish action, unified history query)
- ✓ Plan 16-02: Cross-platform frontend UI (multi-platform publish panel, side-by-side previews, unified timeline)
- 6 files created, 4 commits, TypeScript and Convex compile clean
- Pure TS content adapters shared between backend and frontend
- Batch publish with checkboxes, previews showing adapted content, per-platform toast results
- Unified publishing history timeline with all 3 platforms, Spanish relative timestamps

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 16-02-PLAN.md (Cross-Platform Frontend UI)
Resume file: None
Next action: Plan 16-03 or 16-04 (remaining cross-platform features)

---

## v1.0 Milestone Archive

**Shipped:** 2026-01-30
**Stats:** 8 phases, 19 plans, 29 requirements, 53 commits, 18,108 LOC
**Key deliverables:** Spanish UI, Feed templates, Express onboarding, Rich text editor, File import

## v2.0 Milestone Archive

**Shipped:** 2026-02-05
**Stats:** 4 phases (9-12), 6 plans, 24 requirements, all verified
**Key deliverables:** Control Center, Content Pipeline, LinkedIn Integration, Guided UX

## v3.0 Milestone (Current)

**Status:** Roadmap created (2026-02-05)
**Phases:** 13-18 (6 phases total)
**Requirements:** 41 total (37 unique + 4 cross-cutting UX)
**Coverage:** 100% (all requirements mapped to phases)

**Phase breakdown:**
- Phase 13: Multi-User Authentication Foundation (AUTH-01 to AUTH-04)
- Phase 14: Analytics & Intelligence (AI-01 to AI-04, AL-01 to AL-04)
- Phase 15: Multi-Platform Publishing (TX-01 to TX-05, IG-01 to IG-05)
- Phase 16: Cross-Platform Features (CP-01 to CP-04)
- Phase 17: Team Collaboration & Version History (ROLE-01 to ROLE-04, VH-01 to VH-04)
- Phase 18: Automated Reports (AR-01 to AR-04)

**Parallelization:** Phase 14 and 15 can run in parallel after Phase 13 completes

---

*State updated: 2026-02-07*
*Phase 13 completed: 2026-02-05*
*Phase 14 completed: 2026-02-06*
*Phase 15 completed: 2026-02-06 (6 plans, 4 waves, 15 commits)*
*Phase 16 started: 2026-02-07 (1/4 plans complete, 2 commits)*
