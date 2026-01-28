---
phase: 04-ai-enrichment
plan: 01
subsystem: data-layer
tags: [convex, schema, enrichment, ai, queries, mutations]

dependency_graph:
  requires: [03-02]
  provides: [enrichment-schema, enrichment-queries, enrichment-mutations]
  affects: [04-02, 04-03]

tech_stack:
  added: []
  patterns:
    - processed-flag-for-idempotency
    - three-state-processing (undefined/true/false)

key_files:
  created:
    - convex/enrichment/queries.ts
    - convex/enrichment/mutations.ts
    - convex/enrichment/index.ts
  modified:
    - convex/schema.ts

decisions:
  - id: "ENRICH-01"
    title: "Rename summary to aiSummary"
    choice: "Use aiSummary field for AI-generated summary"
    reason: "feedItems already has summary field for RSS feed summary"

metrics:
  duration: "~5 minutes"
  completed: "2026-01-28"
---

# Phase 04 Plan 01: Enrichment Schema & Foundation Summary

**One-liner:** Extended feedItems schema with 7 AI enrichment fields, 2 indexes, and created enrichment module with internal queries/mutations for processing pipeline.

## What Was Built

### Schema Extensions (convex/schema.ts)

Added 7 enrichment fields to feedItems table:

| Field | Type | Purpose |
|-------|------|---------|
| topics | v.optional(v.array(v.string())) | AI-extracted topic tags |
| sentiment | v.optional(v.union("positive", "neutral", "negative")) | Content sentiment classification |
| aiSummary | v.optional(v.string()) | AI-generated summary |
| relevanceScore | v.optional(v.number()) | 0-100 marketing relevance score |
| processed | v.optional(v.boolean()) | Enrichment status flag |
| processedAt | v.optional(v.number()) | Timestamp when enriched |
| processingError | v.optional(v.string()) | Error message if failed |

Added 2 new indexes:
- `by_processed` - Efficient querying of unprocessed items
- `by_relevanceScore` - Filter by high-relevance content

### Enrichment Module (convex/enrichment/)

**queries.ts:**
- `getUnprocessedItems` - Returns items where processed === undefined, ordered by publishedAt desc
- `getItem` - Fetches single feedItem by ID for enrichment

**mutations.ts:**
- `storeEnrichment` - Atomically saves enrichment data, sets processed: true
- `markFailed` - Marks failed items with processed: false to prevent retry loops

**index.ts:**
- Barrel export for clean imports

### Three-State Processing Pattern

| processed value | Meaning | Action |
|-----------------|---------|--------|
| undefined | Never processed | Include in queue |
| true | Successfully enriched | Skip |
| false | Failed enrichment | Skip (prevent infinite retries) |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f17e835 | feat | Add enrichment fields and indexes to feedItems schema |
| 0948e02 | feat | Create enrichment module queries |
| c93b773 | feat | Create enrichment mutations and module barrel export |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate summary field**
- **Found during:** Task 1
- **Issue:** Plan specified adding `summary` field, but feedItems already had `summary` for RSS feed content
- **Fix:** Renamed to `aiSummary` to distinguish AI-generated summary from feed's original summary
- **Files modified:** convex/schema.ts
- **Commit:** f17e835

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| ENRICH-01 | Use aiSummary instead of summary | feedItems.summary already exists for RSS content; need distinct field for AI output |

## Verification Results

- [x] `npx convex dev` deploys without errors
- [x] feedItems has all 7 enrichment fields
- [x] by_processed index visible in schema
- [x] by_relevanceScore index visible in schema
- [x] enrichment/queries.ts exports getUnprocessedItems, getItem
- [x] enrichment/mutations.ts exports storeEnrichment, markFailed
- [x] enrichment/index.ts provides clean barrel export
- [x] TypeScript compiles without errors

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Unprocessed items queryable | Complete | by_processed index + getUnprocessedItems query |
| Enrichment data persists | Complete | storeEnrichment mutation with all fields |
| Items marked atomically | Complete | processed flag set in single patch operation |

## Next Phase Readiness

**Ready for 04-02:** Enrichment action implementation
- Schema in place with all required fields
- Queries ready to fetch unprocessed items
- Mutations ready to store results
- Module structure mirrors feeds module pattern

**Dependencies satisfied:**
- Internal queries available via `internal.enrichment.queries`
- Internal mutations available via `internal.enrichment.mutations`
