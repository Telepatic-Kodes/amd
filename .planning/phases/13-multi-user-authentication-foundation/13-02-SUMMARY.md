---
phase: 13-multi-user-authentication-foundation
plan: 02
subsystem: auth
tags: [convex, clerk, multi-user, schema, auth-helpers, data-migration]

# Dependency graph
requires:
  - phase: 13-01
    provides: Clerk authentication infrastructure
provides:
  - Users table in Convex schema for syncing Clerk user data
  - Auth helper functions (requireAuth, getUserId, optionalAuth)
  - User sync mutations (getOrCreateUser, getCurrentUser, listUsers)
  - Data migration mutation (migrateExistingDataToOwner)
  - Optional userId fields on all user-facing tables for data isolation
affects: [13-03, 13-04, all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clerk identity synced to Convex users table"
    - "getUserId() returns Clerk subject string for data isolation"
    - "First user automatically becomes system owner (isSystemOwner flag)"
    - "Optional userId fields on user-facing tables for backward compatibility"

key-files:
  created:
    - convex/lib/auth.ts
    - convex/users.ts
    - convex/migration.ts
  modified:
    - convex/schema.ts

key-decisions:
  - "userId stores Clerk subject string (not Convex Id) for direct filtering"
  - "First user automatically becomes system owner with special flag"
  - "userId is optional on all tables to maintain backward compatibility"
  - "Migration mutation only callable by system owner for security"

patterns-established:
  - "Pattern 1: All user-facing queries/mutations call requireAuth() first"
  - "Pattern 2: getUserId() extracts Clerk subject for data isolation filters"
  - "Pattern 3: Migration mutations check isSystemOwner before executing"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 13 Plan 02: Multi-User Authentication Foundation Summary

**Convex backend foundation for multi-user authentication with Clerk identity sync, auth helpers, and data migration support**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T23:15:44Z
- **Completed:** 2026-02-05T23:18:21Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created users table in Convex schema with clerkId, email, role, and isSystemOwner fields
- Built auth helper functions for authentication verification and user ID extraction
- Implemented user sync mutations to create/update users from Clerk identity
- Created data migration mutation to assign existing records to system owner
- Added optional userId field to all 6 user-facing tables for data isolation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add users table to schema and create auth helpers** - `8d5ace5` (feat)
2. **Task 2: Create data migration mutation** - `58aad5c` (feat)

## Files Created/Modified

**Created:**
- `convex/lib/auth.ts` - Authentication helper functions (requireAuth, getUserId, optionalAuth)
- `convex/users.ts` - User sync mutations (getOrCreateUser, getCurrentUser, listUsers)
- `convex/migration.ts` - Data migration mutation (migrateExistingDataToOwner)

**Modified:**
- `convex/schema.ts` - Added users table and optional userId field to 6 user-facing tables (content, tasks, campaigns, onboarding, userGuidance, linkedinConnections)

## Decisions Made

1. **userId stores Clerk subject string:** We store the Clerk subject ID directly (not a Convex Id) because we need to filter by it in queries and Clerk IDs come from getUserIdentity().subject. This enables direct filtering without additional lookups.

2. **First user becomes system owner:** The first user to log in automatically receives the "owner" role and isSystemOwner=true flag. This ensures there's always a designated owner for migration and admin operations.

3. **Optional userId fields:** Made userId optional on all user-facing tables to maintain backward compatibility with existing data. This allows gradual migration without breaking changes.

4. **Migration security:** The migrateExistingDataToOwner mutation verifies the caller has isSystemOwner=true before executing. This prevents regular users from accidentally or maliciously triggering migrations.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration mutation will be run manually after first Clerk login in phase 13-03.

## Next Phase Readiness

**Ready for Phase 13-03:**
- Users table exists and is ready to sync Clerk identities
- Auth helpers are available for all mutations/queries
- Migration mutation is ready to backfill existing data
- Schema supports both legacy (no userId) and new (with userId) records

**No blockers.**

---
*Phase: 13-multi-user-authentication-foundation*
*Completed: 2026-02-05*
