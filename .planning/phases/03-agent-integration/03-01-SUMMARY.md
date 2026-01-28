---
phase: 03-agent-integration
plan: 01
subsystem: feeds-agent-integration
tags: [convex, search-index, feed-items, agent-queries]

dependency-graph:
  requires:
    - 02-01 (Feed CRUD & Dashboard Queries)
    - 02-02 (Sync Orchestration)
  provides:
    - Search infrastructure for feed items
    - Execution tracking with feed item references
    - Internal query for agent feed access
  affects:
    - 03-02 (Agent Context Injection)
    - 04-XX (AI Enrichment phases)

tech-stack:
  added: []
  patterns:
    - "Convex searchIndex for full-text search"
    - "Internal queries for action-to-query communication"
    - "Optional tracking fields for gradual adoption"

key-files:
  created:
    - convex/feeds/agentQueries.ts
  modified:
    - convex/schema.ts
    - convex/functions.ts
    - convex/feeds/index.ts

decisions:
  - id: AGT-01
    decision: "Use Convex searchIndex with title as searchField"
    rationale: "Title provides best semantic match for keyword searches; content would require full-text indexing"
  - id: AGT-02
    decision: "feedId as filterField in searchIndex"
    rationale: "Allows efficient scoping of search to specific feeds by category"
  - id: AGT-03
    decision: "Optional feedItemsUsed field on executions"
    rationale: "Gradual adoption - existing code continues to work without changes"
  - id: AGT-04
    decision: "7-day default lookback for feed queries"
    rationale: "Balance between recency and coverage for marketing content"

metrics:
  duration: 223s
  completed: 2026-01-28
---

# Phase 3 Plan 01: Search Infrastructure & Agent Feed Query Summary

**Search index, execution tracking, and agent feed query for Phase 3 integration.**

## One-liner

Convex searchIndex on feedItems.title with category filtering and optional feedItemsUsed tracking on executions.

## What Was Built

### 1. Search Index on feedItems Table

Added `searchIndex("search_content")` to the feedItems table with:
- **searchField:** `title` - enables full-text keyword matching
- **filterFields:** `feedId` - allows scoping search to specific feeds

```typescript
.searchIndex("search_content", {
  searchField: "title",
  filterFields: ["feedId"],
})
```

### 2. Feed Tracking on Executions

Added `feedItemsUsed` field to the executions table schema:
- Type: `v.optional(v.array(v.id("feedItems")))`
- Purpose: Track which feed items were used during agent execution
- Placement: After error field, before timestamp

### 3. Updated logExecution Mutation

Extended the `logExecution` mutation to accept the new field:
- Added to args: `feedItemsUsed: v.optional(v.array(v.id("feedItems")))`
- Uses spread operator so field flows through to db.insert automatically

### 4. Agent Feed Query

Created `convex/feeds/agentQueries.ts` with `getRelevantFeedItems` internal query:

```typescript
getRelevantFeedItems({
  keywords: string,          // Search terms from task input
  categories: string[],      // Feed categories to search
  limit?: number,            // Max results (default: 5)
  daysBack?: number,         // History window (default: 7)
})
```

**Returns:**
```typescript
{
  _id: Id<"feedItems">,
  title: string,
  link: string,
  summary: string | null,
  content: string | null,    // Truncated to 500 chars
  publishedAt: number | null,
  feedName: string,
}[]
```

**Query behavior:**
1. Filters feeds by status="active" and matching categories
2. Uses searchIndex for keyword matching on each feed
3. Filters results by date (excludes items older than daysBack)
4. Sorts by recency (most recent first)
5. Returns up to `limit` results

## Task Commits

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Schema: searchIndex + feedItemsUsed | a749977 | convex/schema.ts |
| 2 | logExecution mutation update | b2c2726 | convex/functions.ts |
| 3 | Agent feed query | d156dbc | convex/feeds/agentQueries.ts, convex/feeds/index.ts |

## Verification Results

- [x] Schema deployed successfully with search index
- [x] logExecution mutation accepts feedItemsUsed parameter
- [x] `npx convex codegen` generates internal.feeds/agentQueries
- [x] No TypeScript errors in convex/ directory
- [x] All success criteria met

## Deviations from Plan

None - plan executed exactly as written.

## How It Will Be Used

In Phase 3 Plan 02, the `executeAgent` action will:

1. Extract keywords from task input
2. Map agent department to feed categories
3. Call `getRelevantFeedItems` with keywords and categories
4. Inject feed items into agent prompt as context
5. Track which items were used via `feedItemsUsed` in `logExecution`

## Next Phase Readiness

**Ready for:** 03-02 (Agent Context Injection)

**Prerequisites met:**
- Search index is deployed and active
- Internal query is available via `internal["feeds/agentQueries"].getRelevantFeedItems`
- Execution tracking field ready for feed item IDs

**No blockers identified.**
