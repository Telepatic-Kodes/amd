# Roadmap: AI Marketing Department (AMD)

## Milestones

- ✅ **v1.0 UX Simplification** - Phases 1-8 (shipped 2026-01-30)
- ✅ **v2.0 UX/UI Excellence** - Phases 9-12 (shipped 2026-02-05)
- 🚧 **v3.0 Intelligence & Scale** - Phases 13-18 (in progress)

## Phases

<details>
<summary>✅ v1.0 UX Simplification (Phases 1-8) - SHIPPED 2026-01-30</summary>

**Milestone Goal:** Transform technical dashboard into simple, user-friendly system for non-technical users

**Key Accomplishments:**
- Navigation simplified from 10 complex items to 4 intuitive sections with Spanish labels
- Feed templates system with 10 industry bundles enabling 1-click setup
- Express onboarding reduced from 6 steps to 3 steps (<2 min setup)
- Complete Spanish translation (100% UI coverage) with consistent terminology
- Design polish with enhanced spacing, typography, and full mobile responsiveness
- Interactive 7-step product tour with spotlight highlighting
- Rich text editor (TipTap WYSIWYG) with formatting, preview, and export
- File upload with PDF/DOCX/TXT parsing and seamless import workflow

**Stats:** 8 phases, 19 plans, 29 requirements (100% coverage), 53 commits, 18,108 LOC

</details>

<details>
<summary>✅ v2.0 UX/UI Excellence (Phases 9-12) - SHIPPED 2026-02-05</summary>

**Milestone Goal:** Make AMD 100% operational with real-time monitoring, guided workflows, and end-to-end content publishing.

**Target:** Control Center operativo, Pipeline de contenido completo, LinkedIn integration, Sistema de guía inteligente, Claridad de ejecución

### Phase 9: Control Center Foundation ✅

**Goal:** Users can monitor what all 37 agents are doing in real-time with clear visibility into system operations

**Depends on:** Phase 8 (v1.0 complete)

**Requirements:** CC-01, CC-02, CC-03, CC-04, CC-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. ✅ User can see real-time status of all 37 agents (active/idle/error) without page refresh
  2. ✅ User can view chronological activity feed showing what each agent did and when
  3. ✅ User can see key metrics (tokens used, tasks completed, success rate) at a glance
  4. ✅ User receives toast notifications for critical events (agent errors, limits reached)
  5. ✅ Control Center works on mobile devices with touch-friendly interface

**Plans:** 3 plans
- [x] 09-01: Convex backend queries for Control Center
- [x] 09-02: Control Center page with agent status grid
- [x] 09-03: Activity feed component and toast notifications

**Completed:** 2026-02-05

### Phase 10: Content Pipeline Enhancement ✅

**Goal:** Users can manage content through complete workflow from draft to publish with visual clarity

**Depends on:** Phase 9

**Requirements:** CP-01, CP-02, CP-03, CP-04, CP-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. ✅ User can see all content organized by workflow stage (Draft → Review → Approved → Published)
  2. ✅ User can move content between stages with drag-and-drop or buttons
  3. ✅ User can perform workflow actions (send to review, approve, reject, publish) with one click
  4. ✅ User can schedule content for future publication with date/time picker
  5. ✅ User can view all scheduled content in calendar or list view

**Plans:** 1 plan
- [x] 10-01: Content pipeline with Kanban and scheduling

**Completed:** 2026-02-05

### Phase 11: LinkedIn Publishing Integration ✅

**Goal:** Users can publish approved content directly to LinkedIn as proof-of-concept for multi-platform publishing

**Depends on:** Phase 10

**Requirements:** LI-01, LI-02, LI-03, LI-04, LI-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. ✅ User can connect their LinkedIn account securely through OAuth 2.0 flow
  2. ✅ User can publish approved content to LinkedIn directly from the app
  3. ✅ User can preview how post will look on LinkedIn before publishing
  4. ✅ User can see connection status (connected/disconnected/token expired) in dashboard
  5. ✅ System respects LinkedIn rate limits and prevents account restrictions

**Plans:** 1 plan
- [x] 11-01: OAuth + Backend + Frontend + Publishing (full implementation)

**Completed:** 2026-02-05

### Phase 12: Guided UX Layer ✅

**Goal:** Users receive contextual guidance and recommendations throughout the system for faster onboarding and efficiency

**Depends on:** Phases 9, 10, 11

**Requirements:** GX-01, GX-02, GX-03, GX-04, GX-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. ✅ New users are guided through 3-5 key setup steps with clear progress indicator
  2. ✅ Returning users see "next recommended action" on dashboard based on current state
  3. ✅ Users can hover/click any feature to see contextual help tooltips
  4. ✅ Users who complete wizard 3+ times see "Quick mode" option to skip it
  5. ✅ Users can see setup progress (% complete) and resume incomplete setup

**Plans:** 1 plan
- [x] 12-01: Guidance State + Next Action + Setup Progress + Contextual Help + Adaptive Wizard

**Completed:** 2026-02-05

</details>

---

## 📋 v3.0 Intelligence & Scale (Planned)

**Milestone Goal:** Transform AMD from a single-user publishing tool into a multi-user, multi-platform marketing intelligence system with real analytics data.

**Target Features:**
- Analytics & Intelligence (internal metrics dashboards + LinkedIn API real engagement data)
- Multi-Platform Publishing (expand from LinkedIn to Twitter/X, Instagram; cross-platform scheduling)
- Team Collaboration (real multi-user auth with Clerk, separate accounts, roles & permissions)
- Content version history and automated performance reports

**Priority Order:** Authentication first → Analytics/Multi-Platform (parallel) → Collaboration → Reports

---

### Phase 13: Multi-User Authentication Foundation ✅

**Goal:** Users can securely access the system with separate accounts and data isolation, establishing the foundation for all team features

**Depends on:** Phase 12 (v2.0 complete)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. ✅ User can create account and log in with email/password through Clerk
  2. ✅ User can see only their own content and data (no leakage across users)
  3. ✅ Existing v2.0 data is assigned to a "system owner" account (no orphaned records)
  4. ✅ All pages require authentication (redirect to login if not authenticated)
  5. ✅ User session persists across browser tabs and page refreshes

**Plans:** 4 plans in 3 waves

Plans:
- [x] 13-01-PLAN.md — Clerk + Convex auth infrastructure, middleware, sign-in/sign-up pages (Wave 1)
- [x] 13-02-PLAN.md — Schema (users table, userId fields), auth helpers, migration mutation (Wave 2)
- [x] 13-02b-PLAN.md — Auth enforcement on all queries/mutations (Wave 2)
- [x] 13-03-PLAN.md — Dashboard auth UI, user sync, migration prompt, toasts (Wave 3)

**Completed:** 2026-02-05

---

### Phase 14: Analytics & Intelligence

**Goal:** Users can see real engagement data from LinkedIn combined with internal metrics to understand marketing performance

**Depends on:** Phase 13

**Requirements:** AI-01, AI-02, AI-03, AI-04, AL-01, AL-02, AL-03, AL-04, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can view dashboard showing tokens used, costs, and agent activity over time
  2. User can see LinkedIn post engagement (likes, comments, shares, impressions) for published content
  3. User can filter analytics by date range (last 7 days, 30 days, custom range)
  4. User can export analytics data as CSV for external reporting
  5. User can identify best-performing content by engagement metrics

**Plans:** TBD (estimated 2-3 plans)

Plans:
- [ ] 14-01: TBD during phase planning
- [ ] 14-02: TBD during phase planning

---

### Phase 15: Multi-Platform Publishing (Twitter/X + Instagram)

**Goal:** Users can publish approved content to LinkedIn, Twitter/X, and Instagram from a single interface with platform-specific formatting

**Depends on:** Phase 13 (auth needed for platform connections)

**Requirements:** TX-01, TX-02, TX-03, TX-04, TX-05, IG-01, IG-02, IG-03, IG-04, IG-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can connect Twitter/X account and publish tweets (with thread support for long content)
  2. User can connect Instagram Business account and publish image posts with captions
  3. User can preview how content looks on each platform before publishing
  4. User can see platform connection status and rate limit warnings in settings
  5. User receives clear error messages when platform-specific requirements aren't met

**Plans:** TBD (estimated 3-4 plans)

Plans:
- [ ] 15-01: TBD during phase planning (likely Twitter OAuth + publishing)
- [ ] 15-02: TBD during phase planning (likely Instagram OAuth + publishing)
- [ ] 15-03: TBD during phase planning (likely cross-platform UI)

**Note:** Instagram App Review takes 60-90 days. Start submission in Week 1 of this phase.

---

### Phase 16: Cross-Platform Features

**Goal:** Users can schedule and manage content across multiple platforms from a unified interface with automatic platform-specific adaptations

**Depends on:** Phase 15

**Requirements:** CP-01, CP-02, CP-03, CP-04, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can create one content piece and schedule it to multiple platforms simultaneously
  2. User can see unified publishing history showing all platforms in one timeline
  3. User can see platform-specific previews side-by-side before publishing
  4. Content automatically adapts to platform requirements (truncate for Twitter, hashtags for Instagram)
  5. User receives consolidated status updates (success/failure per platform)

**Plans:** TBD (estimated 2 plans)

Plans:
- [ ] 16-01: TBD during phase planning
- [ ] 16-02: TBD during phase planning

---

### Phase 17: Team Collaboration & Version History

**Goal:** Users can collaborate on content with role-based permissions and track all changes over time

**Depends on:** Phase 13 (requires auth and user accounts)

**Requirements:** ROLE-01, ROLE-02, ROLE-03, ROLE-04, VH-01, VH-02, VH-03, VH-04, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. Admin can assign roles (admin, editor, reviewer, publisher) to team members
  2. Users only see actions and features allowed by their role (UI adapts to permissions)
  3. User can view version history showing who changed what and when
  4. User can compare two versions to see differences (diff view)
  5. User can rollback to a previous version with confirmation dialog

**Plans:** TBD (estimated 2-3 plans)

Plans:
- [ ] 17-01: TBD during phase planning (likely RBAC implementation)
- [ ] 17-02: TBD during phase planning (likely version history)

---

### Phase 18: Automated Reports

**Goal:** Users receive automated performance reports via email without manual effort, synthesizing cross-platform analytics

**Depends on:** Phase 14 (requires analytics data)

**Requirements:** AR-01, AR-02, AR-03, AR-04, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User receives weekly performance report via email (content published, engagement, costs)
  2. User can view monthly analytics summary with trends and recommendations in dashboard
  3. User can export reports as PDF with charts and data tables
  4. Reports include AI-generated narrative insights (using CMO Agent to write summary)
  5. User can toggle email delivery on/off in settings

**Plans:** TBD (estimated 2 plans)

Plans:
- [ ] 18-01: TBD during phase planning
- [ ] 18-02: TBD during phase planning

---

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18

*Note: Phase 14 (Analytics) and Phase 15 (Multi-Platform) can run in parallel after Phase 13 completes.*

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Multi-User Authentication | 4/4 | ✅ Complete | 2026-02-05 |
| 14. Analytics & Intelligence | 0/TBD | Not started | - |
| 15. Multi-Platform Publishing | 0/TBD | Not started | - |
| 16. Cross-Platform Features | 0/TBD | Not started | - |
| 17. Team Collaboration & Version History | 0/TBD | Not started | - |
| 18. Automated Reports | 0/TBD | Not started | - |

---

**v3.0 Coverage:** 41/41 requirements mapped (100%)

**UX Requirements Note:** UX-01 through UX-04 (Spanish UI, mobile responsive, toast notifications, loading states) are cross-cutting concerns mapped to ALL phases (13-18). Each phase must implement these requirements for its specific features.

**Parallelization Opportunity:** After Phase 13 completes, Phase 14 (Analytics) and Phase 15 (Multi-Platform) are independent and can be executed in parallel for faster delivery.

---

*Roadmap created: 2026-02-05*
*v1.0 shipped: 2026-01-30*
*v2.0 shipped: 2026-02-05*
*v3.0 Phase 13 completed: 2026-02-05*
