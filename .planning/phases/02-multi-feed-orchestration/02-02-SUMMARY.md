---
phase: 02
plan: 02
subsystem: feed-sync
tags: [cron, scheduler, fan-out, orchestration]
depends_on: [02-01]
provides:
  - syncAllFeeds orchestrator action
  - scheduleFeedSync internal mutation
  - triggerManualSync public mutation
  - Daily/hourly/weekly cron jobs
affects: [02-03, 02-04, 02-05]
tech-stack:
  patterns:
    - Fan-out scheduling with staggered delays
    - Cron-based automated sync
key-files:
  created:
    - convex/feeds/syncAllFeeds.ts
    - convex/feeds/scheduleFeedSync.ts
  modified:
    - convex/crons.ts
    - convex/feeds/index.ts
decisions:
  - 1-second stagger between feed syncs to prevent thundering herd
  - Hourly cron at :05 to avoid overlap with agent crons at :00
  - Weekly sync on Monday 5:00 UTC (before daily at 6:00)
metrics:
  duration: ~10 minutes
  completed: 2026-01-28
---

# Phase 2 Plan 02: Multi-Feed Orchestration Summary

**One-liner:** Fan-out cron scheduling with staggered delays for scalable multi-feed sync.

## What Was Built

### 1. Scheduler Mutation (`convex/feeds/scheduleFeedSync.ts`)

Two mutations for scheduling feed syncs:

- **scheduleFeedSync** (internal): Schedules a single feed with configurable delay
- **triggerManualSync** (public): Dashboard mutation for manual sync trigger (DASH-04)

Both use `ctx.scheduler.runAfter()` to schedule the `fetchFeed` internal action.

### 2. Orchestrator Action (`convex/feeds/syncAllFeeds.ts`)

Cron-triggered action that implements the fan-out pattern:

1. Queries feeds due for sync based on frequency
2. Schedules each feed with 1-second stagger
3. Returns summary of scheduled feeds

The stagger pattern prevents:
- Rate limiting from target RSS servers
- Thundering herd on database writes
- Memory spikes from parallel processing

### 3. Cron Job Registration (`convex/crons.ts`)

Three new cron jobs added:

| Job Name | Schedule | Frequency |
|----------|----------|-----------|
| sync-daily-feeds | 6:00 AM UTC | Daily |
| sync-hourly-feeds | :05 each hour | Hourly |
| sync-weekly-feeds | Monday 5:00 AM UTC | Weekly |

## Key Implementation Details

### Fan-Out Pattern

```
syncAllFeeds (cron trigger)
    |
    +-- scheduleFeedSync(feed1, delay=0ms)
    |       |
    |       +-- fetchFeed(feed1) [separate action]
    |
    +-- scheduleFeedSync(feed2, delay=1000ms)
    |       |
    |       +-- fetchFeed(feed2) [separate action]
    |
    +-- scheduleFeedSync(feedN, delay=N*1000ms)
            |
            +-- fetchFeed(feedN) [separate action]
```

Each feed runs in its own action, so:
- Individual feed failures don't block others
- No timeout issues with many feeds
- Easy to debug via Convex logs

### Scheduler Pattern

```typescript
await ctx.scheduler.runAfter(
  delayMs,
  internal.feeds.fetchFeed.fetchFeed,
  { feedId: feed._id }
);
```

## Files Changed

| File | Change |
|------|--------|
| `convex/feeds/scheduleFeedSync.ts` | Created - scheduler mutations |
| `convex/feeds/syncAllFeeds.ts` | Created - orchestrator action |
| `convex/crons.ts` | Modified - added 3 feed sync cron jobs |
| `convex/feeds/index.ts` | Modified - added barrel exports |

## Commits

| Hash | Message |
|------|---------|
| 36b30cd | feat(02-02): add scheduler mutation for fan-out feed sync |
| 2b7efb6 | feat(02-01): includes syncAllFeeds.ts |
| 6a9bb81 | feat(02-02): register feed sync cron jobs |

## Deviations from Plan

None - plan executed as written.

Note: syncAllFeeds.ts was included in a prior commit (2b7efb6) during an overlapping execution session. The file was already present and correctly implemented.

## Requirements Covered

- **SYNC-01**: System syncs all active feeds daily via cron
- **SYNC-04**: Fan-out pattern - each feed in separate action
- **DASH-04**: Manual sync trigger from dashboard (triggerManualSync)

## Verification

```bash
# Compiles without errors
npx convex dev --once

# Cron jobs registered
grep -E 'sync-(daily|hourly|weekly)-feeds' convex/crons.ts
# Output: "sync-daily-feeds", "sync-hourly-feeds", "sync-weekly-feeds"

# Exports available
grep -E "^export const" convex/feeds/scheduleFeedSync.ts
# Output: scheduleFeedSync, triggerManualSync

grep -E "^export const" convex/feeds/syncAllFeeds.ts
# Output: syncAllFeeds
```

## Next Phase Readiness

Ready for Plan 03 (Error Recovery) and Plan 04 (Progress Tracking):
- Orchestrator is in place
- Scheduler mutations available
- Individual feed syncs run in isolation
