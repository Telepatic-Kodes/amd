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

## Phase 5: Design Polish (COMPLETE ✓)

**Goal:** Improve visual hierarchy, spacing, typography, and mobile responsiveness.

**Status:** ✓ COMPLETE (all 2 plans executed)

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

## Phase 6: Product Tour (COMPLETE ✓)

**Goal:** Create interactive 7-step tutorial for new users.

**Status:** ✓ COMPLETE (all 1 plan executed)

**Requirements Covered:**
- TOUR-01 through TOUR-05: Interactive tour, step tooltips, skip functionality, first-time detection

**Success Criteria:**
1. Interactive 7-step tour for key features (Sidebar → Home → Content → Results → Health → Templates → Settings)
2. Contextual tooltips explaining each step
3. Users can skip tour and return later from help
4. Tour displays only to first-time users
5. Smooth animations and clear next/prev navigation

**Plans:** 1 plan (COMPLETE)

Plans:
- [x] 06-01-PLAN.md — Product tour component with 7-step walkthrough, skip/finish controls, and first-time detection

**Estimated Scope:** 1 plan, 1 wave

---

## Phase 7: Rich Text Editor Integration (PENDING)

**Goal:** Replace textarea with WYSIWYG editor (TipTap) in EditContentModal with formatting support, preview, and validation.

**Status:** ⏳ PENDING (not planned)

**Requirements Covered:**
- EDITOR-01: WYSIWYG editor with formatting (bold, italic, headers, lists, links, code)
- EDITOR-02: Real-time preview alongside editor
- EDITOR-03: Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- EDITOR-04: Content validation and character count
- EDITOR-05: Export to plain text and HTML

**Success Criteria:**
1. TipTap editor integrated in EditContentModal
2. Full formatting toolbar (text styles, lists, alignment, links, code blocks)
3. Live preview pane showing formatted content
4. Keyboard shortcuts working for common formats
5. Character/word count indicator
6. Validation rules enforced (min 50 chars)
7. Content serializable to HTML and plain text
8. Responsive on mobile with adjusted toolbar

**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 7 to break down)

**Estimated Scope:** To be determined during planning

---

## Phase 8: File Upload & Content Import (PENDING)

**Goal:** Enable drag-drop file upload (PDF, DOCX) with automatic content parsing and import into editor.

**Status:** ⏳ PENDING (not planned)

**Requirements Covered:**
- FILE-01: Drag-drop file upload for PDF, DOCX, TXT
- FILE-02: Content extraction and parsing
- FILE-03: Preview before import
- FILE-04: Error handling for unsupported formats
- FILE-05: File size validation

**Success Criteria:**
1. Drag-drop zone in UploadContentForm and EditContentModal
2. File upload handling for PDF (pdf-parse) and DOCX (mammoth)
3. Content extracted and displayed in preview modal
4. User can edit extracted content before import
5. File size limit enforced (max 10MB)
6. Unsupported formats show clear error messages
7. Upload progress indicator
8. Failed uploads recoverable with retry

**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

**Estimated Scope:** To be determined during planning

---

## Phase Summary

| Phase | Name | Status | Plans | Requirements | Deliverables |
|-------|------|--------|-------|--------------|--------------|
| 1 | Navigation Simplification | ✓ Complete | 3/3 | 8 | Sidebar, Home, Results, Health pages |
| 2 | Feed Templates System | ✓ Complete | 2/2 | 2 | Feed templates, UI integration |
| 3 | Onboarding Express | ✓ Complete | 2/2 | 2 | 3-step flow, auto-config |
| 4 | Spanish Translation | ✓ Complete | 3/3 | 1 | Translation dictionary |
| 5 | Design Polish | ✓ Complete | 2/2 | 10 | Spacing, typography, mobile UI |
| 6 | Product Tour | ✓ Complete | 1/1 | 5 | Interactive tutorial |
| 7 | Rich Text Editor | ✓ Complete | 4/4 | 9 | WYSIWYG editor with formatting |
| 8 | File Upload | ⏳ Pending | 0 | 5 | Drag-drop file import |

---

## Execution Path

**Completed:** Phases 1-7 (7 phases, 16 plans, 100% execution rate)

**Remaining:** Phase 8 (1 phase, TBD plans)

**Total Coverage:**
- v1 Requirements: 29 total
- Phases 1-7 Covered: 24 requirements (design + tour + rich editor)
- Phase 8 Will Cover: 5 requirements (file upload)
- Full Coverage: 29/29 ✓

---

## What's Next

1. **Plan Phase 8:** File Upload & Content Import
   - `/gsd:plan-phase 8`
   - Drag-drop file upload for PDF, DOCX, TXT
   - Content parsing and import workflow

2. **Execute Phase 8:** Run file upload implementation
   - `/gsd:execute-phase 8`

3. **Validate with users:** Collect feedback on Phases 1-8 complete feature set

4. **Deploy to production:** Once all features verified and user tested

---

*Roadmap created: 2026-01-30*
*Phases 1-4 completion: 2026-01-30*
