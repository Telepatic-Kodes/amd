# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

**Large component files:**
- Issue: Report charts component and workflow engine exceed 300 lines, making them harder to maintain and test
- Files: `src/components/reports/report-charts.tsx` (292 lines), `src/lib/workflow-engine.ts` (350 lines), `src/lib/action-registry.ts` (267 lines)
- Impact: Increased cognitive load for developers, harder to locate specific functionality, higher risk of regression bugs
- Fix approach: Split chart components by type (SpendTrendChart, CostByProjectChart, ModelSplitChart, etc. into separate files), extract workflow generation logic into smaller focused modules, separate action registry into per-action definition files

**Synchronous file I/O in data access layer:**
- Issue: All data reads/writes use synchronous operations (`readFileSync`, `writeFileSync`) which can block server-side rendering
- Files: `src/lib/data.ts` (line 42), `src/lib/atomic-write.ts` (lines 21, 24), `src/lib/alert-evaluator.ts` (lines 22, 41, 51)
- Impact: SSR performance degradation under concurrent requests, potential timeout issues if data files are large or on slow storage
- Fix approach: Migrate to async file I/O using `fs.promises`, implement proper error handling for concurrent access, add timeouts for file operations

**Dual data access patterns:**
- Issue: Two different approaches to data persistence exist - `data-helpers.ts` uses async/promises while `data.ts` uses sync I/O and different patterns
- Files: `src/lib/data.ts` vs `src/lib/data-helpers.ts`
- Impact: Inconsistent error handling, multiple ways to do the same operation, harder to reason about data flow, potential sync issues
- Fix approach: Consolidate on single approach (async preferred), migrate command center data helpers to use main data.ts pattern, remove duplicate logic

**Incomplete error handling in API routes:**
- Issue: `/api/actions/execute` route doesn't have comprehensive error handling for all mutation types or validation failures
- Files: `src/app/api/actions/execute/route.ts` (lines 42-100+)
- Impact: Unhandled errors could crash route, missing mutation type could silently fail, no validation of project existence before operation
- Fix approach: Add explicit validation for project existence, add try-catch wrapping each mutation case, return detailed error messages with error types

**No input sanitization in form dialogs:**
- Issue: Form inputs (projects, clients, tasks) accepted directly without sanitizing whitespace or checking for duplicates
- Files: `src/components/projects/project-form-dialog.tsx`, `src/components/clients/client-form-dialog.tsx`, `src/components/finance/invoice-form-dialog.tsx`
- Impact: Whitespace-only names could be saved, leading to display issues; no prevention of duplicate project/client names
- Fix approach: Add trim() validation in schema parsers, add uniqueness checks before write operations, provide user feedback when duplicates detected

## Test Coverage Gaps

**No unit or integration tests:**
- What's not tested: All utility functions (`workflow-engine.ts`, `alert-evaluator.ts`, `analytics.ts`, `action-registry.ts`), API routes, data access layer
- Files: `src/lib/`, `src/app/api/`
- Risk: Business logic changes could introduce bugs without detection, data consistency issues undetected, regression issues in workflow scoring
- Priority: High - these are critical paths (project health scoring, alert evaluation, analytics generation)

**No component tests:**
- What's not tested: Chart components, form dialogs, assistant panel, command palette
- Files: `src/components/reports/`, `src/components/*/form-dialog.tsx`
- Risk: UI changes could break functionality silently, form validation bugs not caught, chart rendering issues with edge cases
- Priority: Medium - but becoming higher as UI complexity grows

**No E2E tests for data workflows:**
- What's not tested: Complete flows like "create task → save to disk → read back → update project", alert firing logic with real data
- Files: No test files exist in project
- Risk: Data persistence bugs only caught in production, alert thresholds misconfigured unnoticed, race conditions in concurrent operations
- Priority: High - data integrity is critical

## Known Bugs

**Date handling inconsistencies:**
- Symptoms: Date string comparisons use `.startsWith()` for month filtering, hardcoded ISO date manipulation
- Files: `src/lib/data.ts` (line 38), `src/app/reports/page.tsx` (line 38), `src/lib/alert-evaluator.ts` (line 53)
- Trigger: Changes to date format, timezone-aware dates, edge cases around month boundaries
- Workaround: Use strict ISO 8601 format consistently everywhere, avoid string comparison for date logic

**Potential race condition in alert state:**
- Symptoms: Alert state file could be read/written concurrently if multiple sync processes run in parallel
- Files: `src/lib/alert-evaluator.ts` (lines 20-35)
- Trigger: Fast consecutive sync runs or multiple app instances
- Workaround: Add file locking around alert state operations similar to `sync-manager.ts`

**Missing null coalescing in computed metrics:**
- Symptoms: Division by zero possible in health score calculation, undefined velocity values not handled
- Files: `src/lib/workflow-engine.ts` (lines 148, 243, 344)
- Trigger: Projects with velocity=0, calculations with undefined values
- Workaround: Add explicit null/zero checks before math operations

## Performance Bottlenecks

**Weekly data aggregation performance:**
- Problem: `getDailySpendByModel()` and `getQualityTrend()` iterate over entire dataset for every call
- Files: `src/lib/data.ts` (lines 137-168, 174-208)
- Cause: No memoization or caching, operations done on every page render
- Improvement path: Implement in-memory caching with invalidation on data writes, pre-compute daily aggregates during sync, use `useMemo` on client side

**Alert evaluation reads multiple files sequentially:**
- Problem: `getMonthlySpend()` reads analytics and tokens files independently, called on every alert check
- Files: `src/lib/alert-evaluator.ts` (lines 37-64)
- Cause: Synchronous file reads block, no batching of file operations
- Improvement path: Combine analytics + tokens read into single operation, cache monthly spend for duration of month, defer alert evaluation to scheduled sync rather than on-demand

**Chart data transformation on every render:**
- Problem: `SpendTrendChart` transforms raw Recharts data on every render, no memoization
- Files: `src/components/reports/report-charts.tsx` (lines 25-69)
- Cause: Data transformation happens in component, not pre-computed server-side
- Improvement path: Pre-compute chart series on server during data fetch, pass already-formatted data, use `React.memo` for chart components

## Security Considerations

**No validation of numeric inputs:**
- Risk: Cost, hours, budget values not validated for reasonable ranges - could overflow or cause negative values
- Files: `src/lib/schemas/token.ts`, `src/lib/schemas/time-entry.ts`, `src/app/api/actions/execute/route.ts` (lines 74)
- Current mitigation: Zod schemas define types but not bounds
- Recommendations: Add `.positive()` or `.min(0)` to numeric schema fields, add upper bounds for cost/hours (prevent billion-dollar entries)

**Timestamp manipulation not validated:**
- Risk: Any date string can be provided via API, could create entries for past/future
- Files: `src/app/api/actions/execute/route.ts` (line 51, 73), form dialogs
- Current mitigation: None - dates accepted as-is
- Recommendations: Enforce current date or recent dates in schema validation, add server-side validation for date reasonableness

**No authentication/authorization on API routes:**
- Risk: Anyone with network access could modify project status, create tasks, log time
- Files: `src/app/api/actions/execute/route.ts`
- Current mitigation: None visible - routes are public
- Recommendations: Add authentication check, implement role-based access control (creator only can modify), add API key validation if external access needed

## Fragile Areas

**Workflow health scoring logic:**
- Files: `src/lib/workflow-engine.ts` (lines 15-125)
- Why fragile: Complex scoring with many thresholds (7 separate penalties), hardcoded numbers scattered throughout, magic values (-20 pts, -35 pts, etc.)
- Safe modification: Extract all thresholds to a configuration object, add comprehensive test coverage for each scoring rule, document the reasoning behind each penalty value
- Test coverage: No tests - completely untested, high risk of regression

**Alert configuration and firing:**
- Files: `src/lib/alert-evaluator.ts` (lines 66-111), `src/lib/alert-config.ts`
- Why fragile: State file tracking requires synchronization, monthly reset logic could be missed if called at month boundary, no idempotency guarantee
- Safe modification: Add locks around state mutations, implement explicit monthly reset check with day-of-month tracking, make alert firing idempotent (alert key + month as unique identifier)
- Test coverage: No tests - logic untested, real data only validated in production

**Data persistence and consistency:**
- Files: `src/lib/data.ts`, `src/lib/atomic-write.ts`, `src/app/api/actions/execute/route.ts`
- Why fragile: Multiple places read and write same files, no transactions across multiple files, race conditions possible if sync runs during user action
- Safe modification: Implement read-modify-write operations with locks, batch multiple file writes into atomic operations, add read-before-write validation to catch corruption
- Test coverage: No tests - race conditions only visible under load

**Intent parsing for command interface:**
- Files: `src/lib/intent-parser.ts`, `src/components/assistant/assistant-panel.tsx`
- Why fragile: Pattern matching uses word-level fuzzy matching, no context awareness, could match wrong project by accident
- Safe modification: Add explicit context (show matching project name before confirming), implement higher matching threshold, add test coverage for ambiguous cases
- Test coverage: No tests

## Scaling Limits

**JSON file-based storage:**
- Current capacity: Effectively unlimited files, but each read/write is sequential and synchronous
- Limit: ~10k projects/tasks per file before performance degrades (10-20ms per read/write), concurrent users hit file lock contention
- Scaling path: Consider PostgreSQL for structured data (projects, tasks, time entries), keep JSON for configuration, implement connection pooling and async I/O

**Monthly alert state accumulation:**
- Current capacity: Unlimited alerts can accumulate in array, monthly reset is only mechanism
- Limit: If alert conditions persist, alert state grows unbounded (though capped by monthly reset)
- Scaling path: Implement alert deduplication (alert key uniqueness), add TTL for old alerts, archive alert history to separate JSONL file

**Chart data computation:**
- Current capacity: Linear with dataset size - 30-day spend trend requires scanning all token entries
- Limit: >100k entries = multi-second computation, worse with more complex aggregations
- Scaling path: Pre-compute rolling windows during sync, cache analytics for days, implement sampling/bucketing for very large datasets

## Dependencies at Risk

**No version pinning for critical deps:**
- Risk: Major version updates to `recharts`, `react`, `next` could break rendering or introduce incompatibilities
- Impact: Automatic updates could break production, no rollback path
- Migration plan: Pin all dependencies to patch versions, implement automated tests before updating, use renovate bot with scheduled updates, test in staging environment

**Manual sync scripts without error recovery:**
- Risk: If `sync-tokens.ts` or `sync-quality.ts` fail, analytics becomes stale without alerting
- Impact: Reports show incorrect data, alerts based on stale data, users make decisions on bad data
- Migration plan: Implement retry logic with exponential backoff, add monitoring/alerting when sync fails 2+ times, implement partial sync recovery (resume from checkpoint)

## Missing Critical Features

**No data backup mechanism:**
- Problem: All data in `/data` directory - single failure point, no disaster recovery
- Blocks: Cannot safely make changes, no version history, no rollback capability

**No audit logging:**
- Problem: Who changed what data when is not tracked
- Blocks: Cannot debug issues, compliance/accountability, cannot recover from accidental deletions

**No data validation UI:**
- Problem: No way to inspect/fix data integrity issues from UI
- Blocks: Corrupted data stuck until manual file editing, no visibility into data state

**No bulk operations:**
- Problem: Can only modify one item at a time, scaling becomes tedious
- Blocks: Bulk project status updates, bulk time log entry creation, bulk invoice generation

---

*Concerns audit: 2026-02-14*
