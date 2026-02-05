---
phase: 09-control-center-foundation
plan: 01
subsystem: api
tags: [convex, queries, real-time, performance-optimization]

# Dependency graph
requires:
  - phase: 08-budget-alerts
    provides: Convex schema with agents, tasks, executions tables
provides:
  - Three optimized Control Center backend queries (getControlCenterStatus, getRecentActivity, getControlCenterMetrics)
  - Single aggregated subscription pattern for all 37 agents (prevents subscription cost explosion)
  - Performance-optimized queries using .take(limit) on large tables
affects: [09-control-center-foundation, 10-*, 11-*, 12-*]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single aggregated query pattern for multi-entity subscriptions"
    - "Batch agent lookups to avoid N+1 queries"
    - "Performance-aware query design with .take(limit) on large tables"

key-files:
  created:
    - convex/controlCenter.ts
  modified: []

key-decisions:
  - "Used single aggregated query for all agent statuses instead of 37 separate subscriptions"
  - "Implemented batch agent lookups in activity feed to avoid N+1 queries"
  - "Applied .take(limit) to executions and tasks queries for performance"
  - "Used .collect() only on agents table (37 rows, safe size)"

patterns-established:
  - "Pattern 1: Aggregated subscriptions - group related entities in single query to minimize subscription cost"
  - "Pattern 2: Batch lookups - collect unique IDs first, then lookup each once to avoid N+1 queries"
  - "Pattern 3: Performance-aware data access - use .take(limit) on large tables, .collect() only on small tables"

# Metrics
duration: 1min
completed: 2026-02-05
---

# Phase 09 Plan 01: Control Center Backend Queries Summary

**Three optimized Convex queries power real-time Control Center with single aggregated subscription for 37 agents, batched lookups, and .take(limit) performance patterns**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-05T19:47:48Z
- **Completed:** 2026-02-05T19:49:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `getControlCenterStatus` query returning all 37 agents grouped by department with status counts in single subscription (Pitfall #1 prevention)
- Created `getRecentActivity` query merging executions and tasks chronologically with batch agent lookups (N+1 prevention)
- Created `getControlCenterMetrics` query aggregating tokens, tasks, success rate, and cost with today vs total breakdowns
- Applied performance optimization patterns: .take(limit) on large tables, batch lookups, aggregated subscriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create aggregated Control Center status query** - `ca72215` (feat)

## Files Created/Modified
- `convex/controlCenter.ts` - Three optimized Control Center queries (getControlCenterStatus, getRecentActivity, getControlCenterMetrics)

## Decisions Made

**1. Single aggregated subscription for agents**
- Instead of 37 separate subscriptions (one per agent), created single query returning all agents grouped by department
- Rationale: Prevents subscription cost explosion (Pitfall #1 from research), reduces real-time update overhead, agents table is small (37 rows)

**2. Batch agent lookups in activity feed**
- Collected unique agent IDs first, then looked up each agent once using Map for O(1) access
- Rationale: Avoids N+1 query problem when resolving agent names for executions/tasks

**3. Performance-aware query patterns**
- Used .take(limit) on executions and tasks tables (large, unbounded)
- Used .collect() only on agents table (37 rows, bounded and small)
- Rationale: Prevents performance degradation as data grows, follows Convex best practices

**4. TypeScript compatibility**
- Used Array.from() to iterate over Set (downlevelIteration compatibility)
- Used string keys for agentMap instead of Id type
- Rationale: Ensures TypeScript compilation without requiring special compiler flags

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript compilation errors (resolved)**
- **Issue:** Initial implementation used `for (const x of Set)` which requires --downlevelIteration flag
- **Resolution:** Changed to `for (const x of Array.from(Set))` for compatibility
- **Issue:** Map key type mismatch with Id<"agents">
- **Resolution:** Changed to string keys using .toString() for consistent access pattern

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 09 Plan 02 (Control Center UI)**
- Backend queries complete and optimized
- Three queries available: getControlCenterStatus, getRecentActivity, getControlCenterMetrics
- Performance patterns established for frontend to follow

**Next steps:**
- Build Control Center UI page consuming these queries
- Implement department-based agent grouping visualization
- Add activity feed with real-time updates
- Display operational metrics with today vs total comparisons

---
*Phase: 09-control-center-foundation*
*Completed: 2026-02-05*
