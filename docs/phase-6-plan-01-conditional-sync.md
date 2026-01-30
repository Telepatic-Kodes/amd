# Phase 6 - Plan 01: HTTP Conditional Sync (ETag / Last-Modified)

## Objective

Reduce bandwidth and server load by implementing HTTP conditional requests
(ETag + Last-Modified). When a feed hasn't changed since last sync, the server
returns 304 Not Modified and we skip XML parsing entirely.

---

## Files Modified

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `etag`, `lastModified`, `consecutiveNotModified` fields to `feeds` table |
| `convex/feeds/fetchFeed.ts` | Send conditional headers, handle 304 response |
| `convex/feeds/storeFeedItems.ts` | Add mutation to store cache headers + increment notModified counter |
| `convex/feeds/storeFeedItems.ts` | Extend `logSync` to accept `"not_modified"` status |
| `convex/feeds/publicQueries.ts` | Add `getRecentSyncLogs` query for test verification |
| `scripts/test-conditional-sync.ts` | Executable verification script |

---

## Step 1: Add Schema Fields

**File:** `/home/tomas/Escritorio/amd/convex/schema.ts`

**Location:** Lines 409-433 (the `feeds` table definition).

Search for this exact code block at **line 424**:
```typescript
    lastSyncAt: v.optional(v.number()), // Timestamp of last successful sync
    consecutiveErrors: v.number(), // Error count for health tracking (SYNC-06)
    lastErrorMessage: v.optional(v.string()), // Most recent error
    createdAt: v.number(),
    updatedAt: v.number(),
```

**Replace with:**
```typescript
    lastSyncAt: v.optional(v.number()), // Timestamp of last successful sync
    consecutiveErrors: v.number(), // Error count for health tracking (SYNC-06)
    lastErrorMessage: v.optional(v.string()), // Most recent error
    etag: v.optional(v.string()), // ETag from last successful response
    lastModified: v.optional(v.string()), // Last-Modified header from last successful response
    consecutiveNotModified: v.optional(v.number()), // Count of consecutive 304 responses
    createdAt: v.number(),
    updatedAt: v.number(),
```

**What changed:** Added 3 optional fields: `etag`, `lastModified`, `consecutiveNotModified`.

---

## Step 2: Add Conditional Headers to fetchWithTimeout

**File:** `/home/tomas/Escritorio/amd/convex/feeds/fetchFeed.ts`

**Location:** The `fetchWithTimeout` function starts at **line 65** and ends at **line 86**.

Search for this exact function signature at **line 65**:
```typescript
async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
```

**Replace the entire function (lines 65-86) with:**
```typescript
async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  conditionalHeaders?: { etag?: string; lastModified?: string }
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept:
      'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  };

  // Add conditional request headers if available
  if (conditionalHeaders?.etag) {
    headers['If-None-Match'] = conditionalHeaders.etag;
  }
  if (conditionalHeaders?.lastModified) {
    headers['If-Modified-Since'] = conditionalHeaders.lastModified;
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

**What changed:** Added optional `conditionalHeaders` parameter. When provided,
sends `If-None-Match` (ETag) and/or `If-Modified-Since` headers.

---

## Step 3: Pass Conditional Headers from Handler

**File:** `/home/tomas/Escritorio/amd/convex/feeds/fetchFeed.ts`

**Location:** Line 153, inside the handler. Search for:
```typescript
      response = await fetchWithTimeout(feed.url, FETCH_TIMEOUT_MS);
```
This is at exactly **line 153**.

**Replace line 153 with:**
```typescript
      response = await fetchWithTimeout(feed.url, FETCH_TIMEOUT_MS, {
        etag: feed.etag,
        lastModified: feed.lastModified,
      });
```

**What changed:** Passes stored ETag/Last-Modified from the feed document to the fetch call.

---

## Step 4: Handle 304 Not Modified Response

**File:** `/home/tomas/Escritorio/amd/convex/feeds/fetchFeed.ts`

**Location:** After the rate limit check block and before the generic HTTP error check.
Search for this exact comment at **line 263**:
```typescript
    // 2.6. Not rate limited - check for other HTTP errors
    if (!response.ok) {
```

**Insert the following block BEFORE line 263** (between the rate limit block ending at line 261 and line 263):

```typescript
    // 2.55. Handle 304 Not Modified (conditional sync)
    if (response.status === 304) {
      console.log(
        `[fetchFeed] 304 Not Modified for feed ${feed.url} - skipping XML parse`
      );

      // Increment consecutiveNotModified counter
      await ctx.runMutation(internal.feeds.storeFeedItems.updateCacheHeaders, {
        feedId,
        consecutiveNotModified: (feed.consecutiveNotModified ?? 0) + 1,
      });

      // Update feed health (still a successful sync)
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: true,
      });

      // Log as not_modified
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'not_modified',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
      };
    }

```

**What changed:** When server returns 304, we skip XML download/parsing entirely,
increment the notModified counter, log the sync as `not_modified`, and return early.

---

## Step 5: Store Cache Headers After Successful Sync

**File:** `/home/tomas/Escritorio/amd/convex/feeds/fetchFeed.ts`

**Location:** After the successful sync logging. Search for this exact block starting at **line 430**:
```typescript
    // 7. Log successful sync
    const syncStatus = validationErrors > 0 ? 'partial' : 'success';
    await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
```

**Insert the following BEFORE the return statement at line 441** (after the logSync call that ends around line 439, before `return {`):

```typescript
    // 7.5. Store ETag and Last-Modified for conditional requests
    const newEtag = response.headers.get('ETag');
    const newLastModified = response.headers.get('Last-Modified');
    if (newEtag || newLastModified) {
      await ctx.runMutation(internal.feeds.storeFeedItems.updateCacheHeaders, {
        feedId,
        etag: newEtag ?? undefined,
        lastModified: newLastModified ?? undefined,
        consecutiveNotModified: 0, // Reset on full sync
      });
    }

```

**What changed:** After a successful 200 response, we extract and store the
ETag and Last-Modified headers for use in the next sync.

---

## Step 6: Add Mutations to storeFeedItems.ts

**File:** `/home/tomas/Escritorio/amd/convex/feeds/storeFeedItems.ts`

### 6a. Add updateCacheHeaders mutation

**Location:** Append at the end of the file (after line 190).

```typescript
/**
 * Updates cache headers (ETag, Last-Modified) on a feed document
 *
 * Called after successful sync to store response headers for
 * conditional requests on next sync.
 *
 * @param feedId - ID of the feed to update
 * @param etag - ETag header value
 * @param lastModified - Last-Modified header value
 * @param consecutiveNotModified - Counter for 304 responses
 */
export const updateCacheHeaders = internalMutation({
  args: {
    feedId: v.id('feeds'),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    consecutiveNotModified: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { feedId, etag, lastModified, consecutiveNotModified } = args;
    const now = Date.now();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      return;
    }

    const patch: Record<string, unknown> = { updatedAt: now };
    if (etag !== undefined) {
      patch.etag = etag;
    }
    if (lastModified !== undefined) {
      patch.lastModified = lastModified;
    }
    if (consecutiveNotModified !== undefined) {
      patch.consecutiveNotModified = consecutiveNotModified;
    }

    await ctx.db.patch(feedId, patch);
  },
});
```

### 6b. Extend logSync status union

**Location:** Line 167-170 in storeFeedItems.ts. Search for:
```typescript
    status: v.union(
      v.literal('success'),
      v.literal('partial'),
      v.literal('failed')
    ),
```

**Replace with:**
```typescript
    status: v.union(
      v.literal('success'),
      v.literal('partial'),
      v.literal('failed'),
      v.literal('not_modified')
    ),
```

Also update the same union in the schema at **line 485-489** in `convex/schema.ts`.
Search for:
```typescript
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ), // Sync outcome
```

**Replace with:**
```typescript
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed"),
      v.literal("not_modified")
    ), // Sync outcome
```

---

## Step 7: Add Public Query for Sync Logs (needed by test script)

**File:** `/home/tomas/Escritorio/amd/convex/feeds/publicQueries.ts`

Append the following query to the file:

```typescript
/**
 * Gets recent sync logs for a feed
 *
 * @param feedId - Feed ID to query
 * @param limit - Max number of logs to return (default 10)
 * @returns Array of recent sync log entries
 */
export const getRecentSyncLogs = query({
  args: {
    feedId: v.id('feeds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query('feedSyncLog')
      .withIndex('by_feedId', (q) => q.eq('feedId', args.feedId))
      .order('desc')
      .take(limit);
  },
});
```

---

## Step 8: Executable Test Script

**File:** `/home/tomas/Escritorio/amd/scripts/test-conditional-sync.ts`

This script uses the Convex HTTP client and `npx convex run` to trigger actual
syncs and verify 304 behavior end-to-end.

```typescript
/**
 * Test Script: Verify HTTP Conditional Sync (304 Not Modified)
 *
 * This script:
 * 1. Connects to the Convex deployment
 * 2. Finds an active feed
 * 3. Triggers sync #1 (200 - stores ETag/Last-Modified)
 * 4. Verifies cache headers stored on feed document
 * 5. Triggers sync #2 (304 if server supports conditional requests)
 * 6. Verifies consecutiveNotModified incremented
 * 7. Checks feedSyncLog for "not_modified" status entry
 *
 * Usage:
 *   npx tsx scripts/test-conditional-sync.ts
 *
 * Prerequisites:
 *   - Convex dev running (npx convex dev)
 *   - At least one active feed in the database
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { execFileSync } from 'child_process';
import { resolve } from 'path';

// ── Configuration ──────────────────────────────────────────────

const PROJECT_ROOT = resolve(__dirname, '..');
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    'ERROR: Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable.\n' +
    'Example: CONVEX_URL=https://your-deployment.convex.cloud npx tsx scripts/test-conditional-sync.ts'
  );
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// ── Helpers ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function convexRun(functionPath: string, argsJson: string): string {
  try {
    return execFileSync('npx', ['convex', 'run', functionPath, argsJson], {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      timeout: 60000,
    }).trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    return `ERROR: ${error.stderr || error.message || 'unknown'}`;
  }
}

// ── Main Test ──────────────────────────────────────────────────

async function main() {
  console.log('=== Phase 6 Plan 01: Conditional Sync (304) Test ===\n');
  console.log(`Convex URL: ${CONVEX_URL}\n`);

  // ── Step 1: Find an active feed ──
  console.log('[Step 1] Finding an active feed...');
  const feeds = await client.query(api.feeds.publicQueries.listPublicFeeds, {});
  const activeFeed = feeds.find(
    (f: Record<string, unknown>) => f.status === 'active'
  );

  if (!activeFeed) {
    console.error('No active feeds found. Add at least one active feed first.');
    process.exit(1);
  }

  const feedId = activeFeed._id as string;
  console.log(`  Feed: "${activeFeed.name}" (${activeFeed.url})`);
  console.log(`  ID: ${feedId}\n`);

  // ── Step 2: Record initial state ──
  console.log('[Step 2] Recording initial cache header state...');
  const initialNotModified = (activeFeed as Record<string, unknown>).consecutiveNotModified as number | undefined ?? 0;
  const initialEtag = (activeFeed as Record<string, unknown>).etag as string | undefined;
  const initialLastModified = (activeFeed as Record<string, unknown>).lastModified as string | undefined;
  console.log(`  etag: ${initialEtag ?? '(none)'}`);
  console.log(`  lastModified: ${initialLastModified ?? '(none)'}`);
  console.log(`  consecutiveNotModified: ${initialNotModified}\n`);

  // ── Step 3: Trigger first sync ──
  console.log('[Step 3] Triggering first sync (expect 200, stores cache headers)...');
  const result1 = convexRun(
    'feeds/fetchFeed:fetchFeed',
    JSON.stringify({ feedId })
  );
  console.log(`  Result: ${result1.substring(0, 200)}`);

  console.log('  Waiting 8s for sync to complete...');
  await sleep(8000);

  // ── Step 4: Verify cache headers stored ──
  console.log('\n[Step 4] Verifying cache headers stored after first sync...');
  const feedsAfter1 = await client.query(api.feeds.publicQueries.listPublicFeeds, {});
  const feedAfter1 = feedsAfter1.find(
    (f: Record<string, unknown>) => f._id === feedId
  ) as Record<string, unknown> | undefined;

  assert(!!feedAfter1, 'Feed document still exists');

  const etag1 = feedAfter1?.etag as string | undefined;
  const lastMod1 = feedAfter1?.lastModified as string | undefined;
  console.log(`  etag: ${etag1 ?? '(none)'}`);
  console.log(`  lastModified: ${lastMod1 ?? '(none)'}`);

  const hasCacheHeaders = !!(etag1 || lastMod1);
  assert(hasCacheHeaders, 'At least one cache header (ETag or Last-Modified) stored');

  if (!hasCacheHeaders) {
    console.log('\n  WARNING: Feed server does not return ETag/Last-Modified.');
    console.log('  Cannot verify 304 behavior. Try a different feed.');
    console.log(`\n=== RESULT: ${passed} passed, ${failed} failed (partial) ===`);
    process.exit(failed > 0 ? 1 : 0);
  }

  // ── Step 5: Trigger second sync (expect 304) ──
  console.log('\n[Step 5] Triggering second sync (expect 304 Not Modified)...');
  const result2 = convexRun(
    'feeds/fetchFeed:fetchFeed',
    JSON.stringify({ feedId })
  );
  console.log(`  Result: ${result2.substring(0, 200)}`);

  console.log('  Waiting 8s for sync to complete...');
  await sleep(8000);

  // ── Step 6: Verify consecutiveNotModified incremented ──
  console.log('\n[Step 6] Verifying 304 behavior...');
  const feedsAfter2 = await client.query(api.feeds.publicQueries.listPublicFeeds, {});
  const feedAfter2 = feedsAfter2.find(
    (f: Record<string, unknown>) => f._id === feedId
  ) as Record<string, unknown> | undefined;

  const finalNotModified = (feedAfter2?.consecutiveNotModified as number | undefined) ?? 0;
  console.log(`  consecutiveNotModified: ${initialNotModified} -> ${finalNotModified}`);
  assert(
    finalNotModified > initialNotModified,
    `consecutiveNotModified incremented (${initialNotModified} -> ${finalNotModified})`
  );

  // Check that itemsAdded is 0 (no XML parsed)
  const itemsAdded = result2.includes('"itemsAdded":0') || result2.includes('"itemsAdded": 0');
  assert(
    itemsAdded || result2.includes('304'),
    'Second sync added 0 items (304 skipped parsing)'
  );

  // ── Step 7: Check sync log for not_modified entry ──
  console.log('\n[Step 7] Checking feedSyncLog for not_modified entry...');
  const logsResult = convexRun(
    'feeds/publicQueries:getRecentSyncLogs',
    JSON.stringify({ feedId, limit: 5 })
  );
  console.log(`  Recent logs: ${logsResult.substring(0, 300)}`);

  const hasNotModifiedLog = logsResult.includes('not_modified');
  assert(hasNotModifiedLog, 'feedSyncLog contains "not_modified" status entry');

  // ── Summary ──
  console.log(`\n=== TEST RESULT: ${passed} passed, ${failed} failed ===`);
  if (failed === 0) {
    console.log('All checks passed. Conditional sync (304) is working correctly.');
  } else {
    console.log('Some checks failed. Review output above.');
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
```

---

## Verification Checklist

After implementing all steps, run:

```bash
# 1. Verify TypeScript compiles
npx convex dev

# 2. Run the test script
npx tsx scripts/test-conditional-sync.ts
```

Expected outcomes:
- [ ] Schema deploys without errors (new fields are all optional)
- [ ] First sync stores ETag/Last-Modified on the feed document
- [ ] Second sync sends If-None-Match / If-Modified-Since headers
- [ ] Server returns 304, XML parsing is skipped
- [ ] consecutiveNotModified counter increments
- [ ] feedSyncLog has entry with status "not_modified"
- [ ] Feed health remains "active" (304 is treated as success)
