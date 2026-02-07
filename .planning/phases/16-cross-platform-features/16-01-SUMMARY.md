---
phase: 16-cross-platform-features
plan: 01
subsystem: publishing
tags: [cross-platform, batch-publishing, content-adaptation, unified-history, typescript, convex]
dependencies:
  requires: [15-01, 15-02, 15-03]
  provides: [cross-platform-backend, content-adapters, unified-history]
  affects: [16-02]
tech-stack:
  added: []
  patterns: [pure-typescript-shared-module, promise-allsettled, platform-agnostic-adapter]
key-files:
  created:
    - ai-marketing-department/ai-marketing-department/lib/contentAdapters.ts
    - convex/crossPlatform/actions.ts
    - convex/crossPlatform/queries.ts
  modified: []
decisions:
  - id: pure-ts-adapter
    context: Content adaptation needed by both Convex backend and React frontend
    decision: Created lib/contentAdapters.ts as pure TypeScript module with NO Convex imports
    rationale: Enables sharing adaptation logic between server actions and client preview components without circular dependencies
    alternatives: [duplicate-logic, backend-only-adapter]
  - id: thread-splitter-inline
    context: Twitter thread splitting logic exists in convex/twitter/threadSplitter.ts
    decision: Duplicated thread splitting logic inline in contentAdapters.ts
    rationale: Avoids importing from Convex backend into shared lib (would break client-side usage)
    impact: Maintains two implementations but preserves importability
  - id: preview-only-adaptation
    context: Batch publish action needs to call platform actions
    decision: Adaptation functions are for PREVIEW purposes only - platform actions handle their own content
    rationale: Each platform action already reads and formats content; adapter is for frontend preview UI
    alternatives: [adapt-in-batch-action]
  - id: promise-allsettled
    context: Multiple platform publishes should not cascade failures
    decision: Use Promise.allSettled for parallel execution with independent error handling
    rationale: One platform failure should not block others; user sees per-platform results
    alternatives: [sequential-with-stop-on-error, promise-all]
metrics:
  duration: 5min
  completed: 2026-02-07
  tasks_completed: 2
  commits: 2
  files_created: 3
  files_modified: 0
---

# Phase 16 Plan 01: Cross-Platform Backend Summary

**One-liner:** Pure TypeScript content adapters (Twitter 280/thread, LinkedIn 3000, Instagram 2200/hashtags) + batch multi-platform publishing action + unified publishing history query

## Objective Completion

Created the cross-platform backend foundation: shared pure TS content adapter module (importable by both Convex and React), batch publishing action with parallel execution, and unified history query merging all 3 platform logs.

**Result:** Backend infrastructure ready for Plan 16-02 frontend to consume. Users can publish to multiple platforms in one action and view chronological cross-platform history.

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Shared content adapter + batch publish action | 5e8acdf | lib/contentAdapters.ts, convex/crossPlatform/actions.ts |
| 2 | Unified publishing history query | f06a0d0 | convex/crossPlatform/queries.ts |

## Key Deliverables

### 1. Shared Content Adapter (lib/contentAdapters.ts)

Pure TypeScript module with NO Convex imports - importable by both backend and frontend.

**Functions:**
- `adaptForTwitter(body, hashtags?)` → Splits into thread if >280 chars, appends top 3 hashtags if space allows
- `adaptForLinkedIn(body)` → Truncates at 3000 chars with sentence boundary logic
- `adaptForInstagram(body, hashtags?)` → Adds up to 30 hashtags from `targetKeywords`, max 2200 chars
- `adaptContentForPlatforms(body, platforms, hashtags?)` → Batch adapter for multiple platforms

**Thread Splitting Logic (inline implementation):**
- Priority: paragraph → sentence → word boundaries
- Each tweet max 280 chars
- Returns adapted text (first tweet for preview), thread flag, tweet count

**Design Pattern:**
Single source of truth for adaptation logic. Frontend preview components import directly without requiring backend calls.

### 2. Batch Publishing Action (convex/crossPlatform/actions.ts)

**Function:** `publishToMultiplePlatforms`

**Args:**
- `contentId: Id<"content">`
- `platforms: string[]` (e.g., ["linkedin", "twitter", "instagram"])
- `instagramImageUrl?: string` (required if instagram in platforms)
- `instagramImageUrls?: string[]` (for carousel)

**Execution:**
- Validates Instagram image requirements
- Calls each platform action via `api.{platform}.actions.publishTo{Platform}`
- Uses `Promise.allSettled` for parallel execution
- Returns per-platform results: `{ platform, success, error?, url? }[]`

**Error Handling:**
- One platform failure does not block others
- Per-platform error messages in Spanish
- Instagram validation: returns error for instagram only if no imageUrl, still publishes to other platforms

### 3. Unified Publishing History (convex/crossPlatform/queries.ts)

**Query:** `getUnifiedPublishHistory(limit?: number)`

**Behavior:**
- Queries all 3 publish log tables: `linkedinPublishLog`, `twitterPublishLog`, `instagramPublishLog`
- Fetches content title for each log entry via `db.get(contentId)`
- Normalizes into unified format: `{ _id, platform, contentId, contentTitle, status, publishedAt, createdAt, error, platformUrl, metadata }`
- Twitter: constructs URL from connection username + tweetId
- Instagram: extracts permalink from metadata
- LinkedIn: stores URN in metadata (no direct URL construction)
- Sorts by `createdAt` descending (newest first)
- Applies limit (default 50)

**Query:** `getPublishingSummary()`

**Returns:**
```typescript
{
  linkedin: { published: number, failed: number, pending: number },
  twitter: { published: number, failed: number, pending: number },
  instagram: { published: number, failed: number, pending: number },
  total: { published: number, failed: number, pending: number }
}
```

## Technical Implementation

### Content Adaptation Constraints

| Platform | Max Length | Hashtag Behavior | Special Handling |
|----------|-----------|------------------|------------------|
| Twitter | 280 chars | Top 3 appended if space | Thread splitting on paragraph → sentence → word |
| LinkedIn | 3000 chars | None | Truncate at sentence boundary before 2990, append "..." |
| Instagram | 2200 chars | Up to 30 from `targetKeywords` | Format as `#keyword` (lowercase, no spaces), append after double newline |

### Platform Action Signatures (for reference)

**LinkedIn:**
```typescript
publishToLinkedIn({ contentId: Id<"content"> })
→ { success: boolean, postUrn?: string, linkedinUrl: string | null }
```

**Twitter:**
```typescript
publishToTwitter({ contentId: Id<"content"> })
→ { success: boolean, tweetIds: string[], tweetUrl: string | null }
```

**Instagram:**
```typescript
publishToInstagram({
  contentId: Id<"content">,
  imageUrl?: string,
  imageUrls?: string[]
})
→ { success: boolean, instagramMediaId?: string, permalink?: string }
```

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**From Phase 15 (consumed):**
- `convex/linkedin/actions.ts:publishToLinkedIn`
- `convex/twitter/actions.ts:publishToTwitter`
- `convex/instagram/actions.ts:publishToInstagram`
- `linkedinPublishLog`, `twitterPublishLog`, `instagramPublishLog` tables

**To Phase 16-02 (provides):**
- `lib/contentAdapters.ts` exports for frontend preview components
- `api.crossPlatform.actions.publishToMultiplePlatforms` for batch publish UI
- `api.crossPlatform.queries.getUnifiedPublishHistory` for unified timeline
- `api.crossPlatform.queries.getPublishingSummary` for dashboard stats

## Success Criteria Verification

- ✅ Shared content adaptation functions (lib/contentAdapters.ts, pure TS) produce platform-compliant text
- ✅ Twitter: 280 char limit, thread splitting, hashtag appending
- ✅ LinkedIn: 3000 char limit, sentence boundary truncation
- ✅ Instagram: 2200 char limit, hashtag insertion from `targetKeywords`
- ✅ Batch publish action invokes all selected platforms with Promise.allSettled
- ✅ Per-platform results with independent error handling
- ✅ Instagram imageUrl validation without blocking other platforms
- ✅ Unified history query merges all 3 tables with normalized format
- ✅ Content titles fetched and included in unified entries
- ✅ Platform-specific metadata preserved (URN, tweetIds, permalink)
- ✅ Publishing summary provides per-platform and total counts
- ✅ All Convex types compile clean (no TypeScript errors in crossPlatform files)
- ✅ Spanish error messages throughout

## Next Phase Readiness

**Ready for Plan 16-02 (Cross-Platform Frontend UI):**

Frontend can now:
1. Import `lib/contentAdapters.ts` directly for client-side preview rendering
2. Call `publishToMultiplePlatforms` action with platform array
3. Display unified publishing history from `getUnifiedPublishHistory`
4. Show per-platform summary stats from `getPublishingSummary`

**No blockers.** All backend infrastructure complete.

## Performance Notes

- **Compilation:** Convex compiles in ~8s (clean build)
- **Parallel publish:** Promise.allSettled executes all platform actions concurrently
- **History query:** Fetches up to 50 entries (configurable limit) across 3 tables
- **Summary query:** Direct count queries per platform with filter by status

## Self-Check: PASSED

**Files created:**
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department/ai-marketing-department/lib/contentAdapters.ts
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/convex/crossPlatform/actions.ts
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/convex/crossPlatform/queries.ts

**Commits verified:**
- ✅ 5e8acdf feat(16-01): add shared content adapter and batch publish action
- ✅ f06a0d0 feat(16-01): add unified publishing history and summary queries

All files exist. All commits present in git log. Success criteria satisfied.
