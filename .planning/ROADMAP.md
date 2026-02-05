# Roadmap: AI Marketing Department (AMD)

## Milestones

- ✅ **v1.0 UX Simplification** - Phases 1-8 (shipped 2026-01-30)
- 🚧 **v2.0 UX/UI Excellence** - Phases 9-12 (in progress)

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

## 🚧 v2.0 UX/UI Excellence (In Progress)

**Milestone Goal:** Make AMD 100% operational with real-time monitoring, guided workflows, and end-to-end content publishing.

**Target:** Control Center operativo, Pipeline de contenido completo, LinkedIn integration, Sistema de guía inteligente, Claridad de ejecución

---

### Phase 9: Control Center Foundation

**Goal:** Users can monitor what all 37 agents are doing in real-time with clear visibility into system operations

**Depends on:** Phase 8 (v1.0 complete)

**Requirements:** CC-01, CC-02, CC-03, CC-04, CC-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can see real-time status of all 37 agents (active/idle/error) without page refresh
  2. User can view chronological activity feed showing what each agent did and when
  3. User can see key metrics (tokens used, tasks completed, success rate) at a glance
  4. User receives toast notifications for critical events (agent errors, limits reached)
  5. Control Center works on mobile devices with touch-friendly interface

**Plans:** 3 plans

Plans:
- [ ] 09-01-PLAN.md — Convex backend queries for Control Center (aggregated agent status, activity feed, metrics)
- [ ] 09-02-PLAN.md — Control Center page with agent status grid, metrics summary, navigation, and Spanish translations
- [ ] 09-03-PLAN.md — Activity feed component, toast notifications for critical events, mobile responsiveness polish

---

### Phase 10: Content Pipeline Enhancement

**Goal:** Users can manage content through complete workflow from draft to publish with visual clarity

**Depends on:** Phase 9

**Requirements:** CP-01, CP-02, CP-03, CP-04, CP-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can see all content organized by workflow stage (Draft → Review → Approved → Published)
  2. User can move content between stages with drag-and-drop or buttons
  3. User can perform workflow actions (send to review, approve, reject, publish) with one click
  4. User can schedule content for future publication with date/time picker
  5. User can view all scheduled content in calendar or list view

**Plans:** TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

---

### Phase 11: LinkedIn Publishing Integration

**Goal:** Users can publish approved content directly to LinkedIn as proof-of-concept for multi-platform publishing

**Depends on:** Phase 10

**Requirements:** LI-01, LI-02, LI-03, LI-04, LI-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. User can connect their LinkedIn account securely through OAuth 2.0 flow
  2. User can publish approved content to LinkedIn directly from the app
  3. User can preview how post will look on LinkedIn before publishing
  4. User can see connection status (connected/disconnected/token expired) in dashboard
  5. System respects LinkedIn rate limits and prevents account restrictions

**Plans:** TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

---

### Phase 12: Guided UX Layer

**Goal:** Users receive contextual guidance and recommendations throughout the system for faster onboarding and efficiency

**Depends on:** Phases 9, 10, 11

**Requirements:** GX-01, GX-02, GX-03, GX-04, GX-05, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):
  1. New users are guided through 3-5 key setup steps with clear progress indicator
  2. Returning users see "next recommended action" on dashboard based on current state
  3. Users can hover/click any feature to see contextual help tooltips
  4. Users who complete wizard 3+ times see "Quick mode" option to skip it
  5. Users can see setup progress (% complete) and resume incomplete setup

**Plans:** TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Control Center Foundation | 0/3 | Planned | - |
| 10. Content Pipeline Enhancement | 0/TBD | Not started | - |
| 11. LinkedIn Publishing Integration | 0/TBD | Not started | - |
| 12. Guided UX Layer | 0/TBD | Not started | - |

---

**v2.0 Coverage:** 24/24 requirements mapped (100%)

**UX Requirements Note:** UX-01 through UX-04 (Spanish UI, mobile responsive, toast notifications, loading states) are cross-cutting concerns mapped to ALL phases. Each phase must implement these requirements for its specific features.

---

*Roadmap created: 2026-02-05*
*Phase 9 planned: 2026-02-05*
*Ready for: `/gsd:execute-phase 9`*
