# Project State: AMD

**Started:** 2026-01-30
**Current Milestone:** v3.0 Intelligence & Scale
**Status:** Ready to plan Phase 13

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core Value:** Non-technical users can manage a complete marketing department in minutes, not hours.
**Current Focus:** Phase 13 - Multi-User Authentication Foundation

## Current Position

Phase: 13 of 18 (Multi-User Authentication Foundation)
Plan: 02b of 04 completed (Wave 2)
Status: In progress
Last activity: 2026-02-05 — Completed 13-02b-PLAN.md (Function-level auth enforcement)

Progress: [████████████░░░░░░] 69% (v1.0 + v2.0 shipped: 12/18 phases, v3.0: 3/24 plans completed)

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
- Total plans completed: 3/24
- Average duration: ~5 min/plan
- Total execution time: ~13 min

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

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 13 (Authentication) - IMMEDIATE:**
- Data migration risk: Existing v2.0 content/agents must be assigned to "system owner" to avoid orphaned records (13-04 will resolve)
- ✓ Defense-in-depth complete: All user-facing Convex functions enforce auth independently
- ✓ Backward compatibility: Queries handle undefined userId gracefully during migration
- Frontend integration pending: Next.js middleware + Clerk components needed (13-03)

**Phase 15 (Multi-Platform) - UPCOMING:**
- Instagram Business API: App Review required (60-90 day timeline) - must start submission Week 1
- Twitter API pricing: Free tier is write-only; Basic tier ($200/mo) minimum for analytics access
- OAuth token refresh: Each platform has different expiry patterns (LinkedIn 365d, Instagram 60d, Twitter variable)

**Phase 14 (Analytics) - UPCOMING:**
- API rate limits: Instagram 200/hr, LinkedIn ~500/day, Twitter 15K reads/month - caching strategy critical
- Convex Aggregate component: Limited production case studies - needs early prototyping for validation
- Stale-while-revalidate caching: Dynamic TTL based on post age (hot: 5min, warm: 1hr, cold: 24hr)

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 13-02b-PLAN.md - Function-level auth enforcement on all user-facing queries/mutations
Resume file: None
Next action: Plan and execute 13-03 (Frontend integration with Clerk components and middleware)

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

*State updated: 2026-02-05*
*Milestone v3.0: ROADMAP CREATED*
