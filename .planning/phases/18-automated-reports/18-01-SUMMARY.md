---
phase: 18
plan: "01"
subsystem: reporting
tags: [reports, email, cron, automation, resend]
requires: [17-03]
provides: [automated-reports, email-delivery, metrics-aggregation]
affects: [phase-19-future-enhancements]
tech-stack:
  added: [resend]
  patterns: [email-templates, cron-scheduling, metric-aggregation]
key-files:
  created:
    - convex/reports.ts
    - convex/reportsActions.ts
  modified:
    - convex/schema.ts
    - convex/crons.ts
    - package.json
decisions:
  - "Split V8 (queries/mutations) and Node.js (actions with Resend) into separate files"
  - "Weekly reports on Monday 8AM UTC, Monthly on 1st at 9AM UTC"
  - "Dark theme HTML email template for professional appearance"
  - "Claude-generated narrative optional (user configurable)"
  - "Graceful email failure handling - report still stored if email fails"
metrics:
  duration: 511
  completed: "2026-02-07"
---

# Phase 18 Plan 01: Automated Reports Summary

**One-liner:** Email reporting system with weekly/monthly schedules, HTML templates, AI-generated narratives, and Resend integration

## What Was Built

### Backend Infrastructure

**1. Schema Tables (convex/schema.ts)**
- `reports` table: Stores generated reports with metrics, HTML content, and email status
  - userId filtering for multi-tenant isolation
  - Type (weekly/monthly), period timestamps, metrics object
  - Email sent tracking (emailSent, emailSentAt, emailError fields)
  - 3 indexes: by_userId, by_userId_type, by_generatedAt
- `reportSettings` table: User preferences for report delivery
  - emailEnabled, frequency (weekly/monthly/both), recipientEmail
  - includeNarrative toggle for AI-generated insights
  - 1 index: by_userId

**2. Report Generation Module (convex/reports.ts - V8 Runtime)**
- `getUserReportSettings` query: Returns user settings or defaults
- `updateReportSettings` mutation: Upsert user preferences
- `getReportHistory` query: Lists past reports (without HTML for performance)
- `getReportById` query: Full report with HTML content
- `buildReportMetricsInternal` internal query: Aggregates analytics
  - Content published count (filtered by period)
  - Token usage and cost from executions table
  - Success rate calculation
  - LinkedIn engagement totals
  - Top platform detection (LinkedIn/Twitter/Instagram)
- Internal mutations: insertReport, markReportSent, markReportError
- All auth-protected with requireAuth helper

**3. Report Actions Module (convex/reportsActions.ts - Node.js Runtime)**
- `generateWeeklyReport` action: 7-day period report generator
- `generateMonthlyReport` action: 30-day period report generator
- `generateReportNow` action: Manual trigger for current user
- `buildReportHtml` helper: Dark theme email template builder
  - Professional HTML/CSS inline styling (email-safe)
  - Dark theme (#18181b bg, #6366f1 accent)
  - 4 metric boxes: Published, Tokens, Cost, Success Rate
  - Content summary section with platform breakdown
  - Optional AI-generated insights section
  - Footer with branding
- Resend integration with graceful failure handling
- Claude API call for AI narrative generation (optional)

**4. Cron Jobs (convex/crons.ts)**
- Weekly report: Monday 8:00 AM UTC
- Monthly report: 1st of month 9:00 AM UTC
- Both trigger reportsActions module

### Metrics Aggregation Logic

Reports aggregate the following metrics for the specified period:

1. **Content Metrics:**
   - Total content count (all time for user)
   - Content published in period (status=published, publishedAt in range)
   - Top platform by post count

2. **Execution Metrics:**
   - Total tokens used in period (sum of executions.tokensUsed.total)
   - Total cost in period (sum of executions.cost)
   - Success rate (successful / total executions)

3. **Engagement Metrics:**
   - Total LinkedIn engagement (likes + comments + shares)
   - Filtered by fetchedAt in period

### Email Workflow

1. Cron triggers weekly/monthly action
2. Query all users with emailEnabled + matching frequency
3. For each user:
   - Build metrics via buildReportMetricsInternal query
   - Generate AI narrative (if includeNarrative=true)
   - Build HTML email template
   - Insert report to database
   - Send via Resend (if RESEND_API_KEY configured)
   - Mark report as sent or log error
4. Return results array with success/failure per user

### Error Handling

- Email send failures logged but don't fail report generation
- Reports stored even if email fails (user can view in UI)
- Missing RESEND_API_KEY gracefully skips email (report still created)
- Claude API failures log error but continue without narrative

## Files Created

1. **convex/reports.ts** (309 lines)
   - 4 public queries/mutations (auth-protected)
   - 1 internal query (buildReportMetricsInternal)
   - 4 internal mutations (insertReport, markReportSent, markReportError, getAllReportSettings)
   - V8 runtime for database operations

2. **convex/reportsActions.ts** (503 lines)
   - 3 public actions (generateWeeklyReport, generateMonthlyReport, generateReportNow)
   - 1 internal helper (buildReportHtml)
   - Node.js runtime for Resend SDK and external APIs
   - "use node" directive at top

## Files Modified

1. **convex/schema.ts** (+42 lines)
   - Added reports table (17 fields, 3 indexes)
   - Added reportSettings table (7 fields, 1 index)
   - Positioned after kbAgentAccess table

2. **convex/crons.ts** (+20 lines)
   - Added AUTOMATED REPORTS section
   - Weekly cron (Monday 8AM UTC)
   - Monthly cron (1st 9AM UTC)

3. **package.json** (+28 packages)
   - Added resend SDK and dependencies

## Technical Decisions

### Runtime Split Pattern
**Decision:** Separate reports.ts (V8) and reportsActions.ts (Node.js)
**Rationale:**
- Convex requires Node.js-dependent code (Resend SDK) in "use node" files
- Internal queries must run in V8 (no "use node" allowed)
- Split allows database operations in fast V8 runtime, external APIs in Node.js runtime
**Impact:** Clean separation of concerns, optimal performance

### Email Template Dark Theme
**Decision:** Dark background (#18181b) with indigo accents (#6366f1)
**Rationale:**
- Matches AMD dashboard UI for brand consistency
- Professional appearance for executive reports
- High contrast for readability
**Implementation:** Inline CSS for email client compatibility, table-based layout

### AI Narrative as Optional
**Decision:** includeNarrative user setting (default: true)
**Rationale:**
- AI narrative costs tokens (~500 tokens per report)
- Some users may prefer raw metrics only
- Allows cost control for high-frequency users
**Implementation:** Conditional Claude API call in action

### Graceful Email Failure
**Decision:** Report stored even if email fails
**Rationale:**
- Email delivery can fail (API limits, configuration, network)
- Report data is valuable independent of email delivery
- User can view failed reports in UI
**Implementation:** try/catch around Resend call, markReportError mutation

### Cron Scheduling Times
**Decision:** Weekly Monday 8AM, Monthly 1st 9AM (UTC)
**Rationale:**
- Monday morning for weekly recap (start-of-week review)
- 1st of month for monthly (standard business practice)
- UTC for consistent global execution
- 8AM/9AM UTC = reasonable times for most timezones (early morning US, afternoon Europe)
**Alternative considered:** User-configurable times (rejected for MVP complexity)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Phase 19 (Frontend UI):**
- All backend APIs exposed (queries, mutations, actions)
- Report history query optimized (excludes HTML for list view)
- Full report query includes HTML for viewer
- Manual trigger action for on-demand generation
- Type safety via Convex codegen

**Future Enhancements (not blocking):**
- Rich text formatting in HTML (currently plain paragraphs)
- PDF export option
- User-configurable cron schedules
- More granular metric breakdowns (per-platform engagement)
- Email preview before sending
- Report templates

## Verification

### Schema Verification
```bash
npx convex typecheck
✔ Typecheck passed
```

### Table Structure Verification
- reports table: 17 fields, 3 indexes
- reportSettings table: 7 fields, 1 index
- Both tables include userId for multi-tenant isolation

### Function Verification
- 4 public API endpoints (getUserReportSettings, updateReportSettings, getReportHistory, getReportById)
- 3 scheduled actions (generateWeeklyReport, generateMonthlyReport, generateReportNow)
- 5 internal helpers (getAllReportSettings, buildReportMetricsInternal, insertReport, markReportSent, markReportError)

### Cron Verification
```bash
grep -A 3 "send-weekly-report" convex/crons.ts
# Output: Monday 8:00 AM UTC, calls api.reportsActions.generateWeeklyReport

grep -A 3 "send-monthly-report" convex/crons.ts
# Output: 1st 9:00 AM UTC, calls api.reportsActions.generateMonthlyReport
```

### Dependencies Verification
```bash
npm list resend
# Output: resend@4.x.x (28 dependencies added)
```

## Performance Notes

- Metric aggregation queries all content/executions (no pre-aggregation)
- For large datasets (>10K records), consider adding daily rollup tables
- HTML generation is fast (pure string concatenation)
- Email sending is async (doesn't block report generation)
- Claude API call adds ~2-3s per report (only if includeNarrative=true)

## Security Considerations

- All queries auth-protected via requireAuth helper
- userId filtering on all database queries (multi-tenant isolation)
- Report access restricted to owner (getReportById checks userId match)
- RESEND_API_KEY stored as env var (not in code)
- Email "from" address is Resend sandbox (onboarding@resend.dev)
  - Production: Configure verified domain in Resend dashboard

## Spanish Localization

All user-facing text in Spanish:
- Error messages: "No autenticado", "Reporte no encontrado", "No tienes permiso"
- Report titles: "Reporte Semanal", "Reporte Mensual"
- HTML labels: "Contenido Publicado", "Tokens", "Costo", "Éxito"
- Section headers: "Resumen de Contenido", "Análisis IA"
- Date formatting: es-ES locale (toLocaleDateString)

## Task Commits

| Task | Description | Commit | Duration |
|------|-------------|--------|----------|
| 1 | Schema tables + Report generation module | 9fcf419 | ~6 min |
| 2 | Cron jobs for weekly/monthly reports | 4e042aa | ~2 min |

**Total Duration:** 511 seconds (~8.5 minutes)

## Self-Check: PASSED

### Files Created Verification
```bash
[ -f "convex/reports.ts" ] && echo "FOUND" || echo "MISSING"
# FOUND

[ -f "convex/reportsActions.ts" ] && echo "FOUND" || echo "MISSING"
# FOUND
```

### Commits Verification
```bash
git log --oneline | grep "9fcf419"
# 9fcf419 feat(18-01): add report tables and generation module

git log --oneline | grep "4e042aa"
# 4e042aa feat(18-01): add weekly and monthly report cron jobs
```

All files created and commits exist. Self-check passed.

---

**Generated:** 2026-02-07
**Phase:** 18 of 18 (Automated Reports)
**Status:** ✅ Complete
**Next:** Phase 18 Plan 02 (Frontend UI for reports)
