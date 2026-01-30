# Roadmap: AMD UX Simplification

**Version:** v1.0
**Created:** 2026-01-30
**Status:** Phases 1-4 Complete (85%), Phases 5-6 Remaining

## Milestone Overview

```
Phase 1 (Foundation) ──┐
Phase 2 (Templates)    ├── Phase 3 (Onboarding) ──┐
Phase 4 (Translation)  │                            ├── Phase 5 (Polish) ──── Phase 6 (Tour)
```

---

## Phase 1: Navigation Simplification (COMPLETE ✓)

**Goal:** Reduce navigation from 10 complex items to 4 simple sections in Spanish.

**Status:** ✓ COMPLETE (all 3 plans executed)

**Requirements Covered:**
- NAV-01: Sidebar reduced to 4 items
- NAV-02: Spanish labels + tooltips
- HOME-01, HOME-02, HOME-03: Home page refresh
- RESULT-01, RESULT-02, RESULT-03: Results page
- HEALTH-01: Feed health report

**Deliverables:**
- Sidebar component with 4 main navigation items
- Home page with greeting + 3 metric cards + feed health widget
- Results page with 3 KPIs and trend chart
- Feed health report page (/feeds/health)
- Translation dictionary (lib/language.ts)

---

## Phase 2: Feed Templates System (COMPLETE ✓)

**Goal:** Enable 1-click feed setup with pre-configured industry bundles.

**Status:** ✓ COMPLETE (all 2 plans executed)

**Requirements Covered:**
- FEEDS-01: 10 industry templates available
- FEEDS-02: 1-click feed setup from templates

**Deliverables:**
- Feed templates bundle system (10 templates × 5 feeds each)
- Template selection UI in onboarding
- Feed mutations for template-based setup
- Auto-population of feeds based on industry

---

## Phase 3: Onboarding Express (COMPLETE ✓)

**Goal:** Reduce onboarding from 6 complex steps to 3 simple steps (<2 min).

**Status:** ✓ COMPLETE (all 2 plans executed)

**Requirements Covered:**
- ONBOARD-01: 3-step flow
- ONBOARD-02: <2 min setup with auto-configured departments

**Deliverables:**
- Refactored onboarding flow (3 steps: Company → Goals → Feeds)
- Auto-configured departments
- Visual progress bar
- Template selection UI

---

## Phase 4: Spanish Translation (COMPLETE ✓)

**Goal:** 100% Spanish translation of all UI components.

**Status:** ✓ COMPLETE (all 3 plans executed)

**Requirements Covered:**
- LANG-01: 100% Spanish UI translation

**Deliverables:**
- Translation dictionary (100+ terms)
- All components updated with Spanish labels
- Consistent terminology across UI
- Spanish placeholder text and validation messages

---

## Phase 5: Design Polish (PENDING)

**Goal:** Improve visual hierarchy, spacing, typography, and mobile responsiveness.

**Status:** ⏳ PENDING (2 plans)

**Requirements Covered:**
- DESIGN-01 through DESIGN-05: Spacing, typography, buttons, progressive disclosure
- MOBILE-01 through MOBILE-05: Mobile responsiveness, touch targets, responsive layouts

**Success Criteria:**
1. Global spacing increased (32px → 48px), padding on cards (16px → 24px)
2. All headers and body text larger (text-3xl → text-4xl)
3. Buttons more prominent with gradient backgrounds
4. Filters and advanced options collapsed by default
5. Fully responsive on mobile (375px width)
6. Touch targets meet WCAG standard (44x44px minimum)
7. Single-column layout on mobile screens
8. All text readable on small screens (min 16px body)

**Plans:** 2 plans

Plans:
- [ ] 05-01-PLAN.md — Visual design improvements (spacing, typography, buttons, progressive disclosure)
- [ ] 05-02-PLAN.md — Mobile responsiveness (responsive grid, touch targets, mobile navigation)

**Estimated Scope:** 2 plans, 1 wave (both plans independent, can run in parallel)

---

## Phase 6: Product Tour (PENDING)

**Goal:** Create interactive 7-step tutorial for new users.

**Status:** ⏳ PENDING (1 plan)

**Requirements Covered:**
- TOUR-01 through TOUR-05: Interactive tour, step tooltips, skip functionality, first-time detection

**Success Criteria:**
1. Interactive 7-step tour for key features (Sidebar → Home → Content → Results → Health → Templates → Settings)
2. Contextual tooltips explaining each step
3. Users can skip tour and return later from help
4. Tour displays only to first-time users
5. Smooth animations and clear next/prev navigation

**Plans:**
- 06-01: Product tour implementation (tour component, step definitions, first-time detection)

**Estimated Scope:** 1 plan, 1 wave

---

## Phase Summary

| Phase | Name | Status | Plans | Requirements | Deliverables |
|-------|------|--------|-------|--------------|--------------|
| 1 | Navigation Simplification | ✓ Complete | 3/3 | 8 | Sidebar, Home, Results, Health pages |
| 2 | Feed Templates System | ✓ Complete | 2/2 | 2 | Feed templates, UI integration |
| 3 | Onboarding Express | ✓ Complete | 2/2 | 2 | 3-step flow, auto-config |
| 4 | Spanish Translation | ✓ Complete | 3/3 | 1 | Translation dictionary |
| 5 | Design Polish | ⏳ Pending | 2 | 10 | Spacing, typography, mobile UI |
| 6 | Product Tour | ⏳ Pending | 1 | 5 | Interactive tutorial |

---

## Execution Path

**Completed:** Phases 1-4 (4 phases, 10 plans, 100% execution rate)

**Remaining:** Phases 5-6 (2 phases, 3 plans)

**Total Coverage:**
- v1 Requirements: 29 total
- Phases 1-4 Covered: 14 requirements (100% of Phases 1-4)
- Phases 5-6 Will Cover: 15 requirements (design + tour)
- Full Coverage: 29/29 ✓

---

## What's Next

1. **Execute Phase 5:** Design Polish
   - Plan 05-01: Visual improvements (spacing, typography, buttons)
   - Plan 05-02: Mobile responsiveness

2. **Execute Phase 6:** Product Tour
   - Plan 06-01: Interactive tutorial implementation

3. **Validate with users:** Collect feedback on Phases 1-6 combined

4. **Deploy to production:** Once user feedback confirms readiness

---

*Roadmap created: 2026-01-30*
*Phases 1-4 completion: 2026-01-30*
