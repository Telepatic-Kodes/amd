---
wave: 2
depends_on:
  - 06-PLAN-01-HTTP-Optimization
files_modified:
  - convex/feeds/queries.ts
files_created:
  - convex/analysis/metrics.ts
  - scripts/analyze-feed-health.ts
autonomous: true
---

# Plan 04: Truncation and Duplicate Analysis (Metrics)

## Objective

Measure content truncation rate and cross-feed duplicate rate across stored feed items. These metrics determine whether Phase 6.2 features (full-text extraction, semantic deduplication) are worth implementing. Thresholds: truncation >20% triggers full-text extraction; duplicates >10% triggers semantic dedup.

## Why After Wave 1

- Depends on having HTTP optimization in place (Plan 01) so `consecutiveNotModified` data exists for stale feed detection
- Requires existing feed items in the database (100+ feeds already syncing)
- Pure read-only analysis — zero risk to production data

## Step-by-step

### 1. Create analysis metrics module

Create directory `convex/analysis/` and file `convex/analysis/metrics.ts`:

```typescript
/**
 * Feed Health Analysis Metrics
 *
 * Read-only queries that analyze feed item data to determine
 * whether Phase 6.2 features are justified.
 *
 * Thresholds:
 * - Truncation > 20% => recommend full-text extraction
 * - Cross-feed duplicates > 10% => recommend semantic dedup
 *
 * @module convex/analysis/metrics
 */

import { v } from 'convex/values';
import { internalQuery, query } from '../_generated/server';

// ============================================
// Internal Queries (called by other Convex functions)
// ============================================

/**
 * Analyze content truncation across feed items.
 * Visibility: internalQuery — use getFeedHealthMetrics for external access.
 *
 * Heuristics for truncated content:
 * - Content length < 200 characters
 * - Content ends with "..." or "[...]" or "Read more"
 * - Content has no paragraph breaks (single block of text)
 * - Summary exists but content is missing or identical to summary
 */
export const analyzeContentTruncation = internalQuery({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;

    // Get recent feed items
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    let truncatedCount = 0;
    let noContentCount = 0;
    let fullContentCount = 0;
    const truncationReasons: Record<string, number> = {};

    for (const item of items) {
      const content = item.content || '';
      const summary = item.summary || '';

      if (!content && !summary) {
        noContentCount++;
        continue;
      }

      const textToCheck = content || summary;
      let isTruncated = false;
      const reasons: string[] = [];

      // Check 1: Very short content (< 200 chars)
      if (textToCheck.length < 200) {
        isTruncated = true;
        reasons.push('short_content');
      }

      // Check 2: Ends with truncation markers
      const trimmed = textToCheck.trim();
      if (
        trimmed.endsWith('...') ||
        trimmed.endsWith('[...]') ||
        trimmed.endsWith('Read more') ||
        trimmed.endsWith('Continue reading') ||
        trimmed.match(/\[&hellip;\]$/) ||
        trimmed.match(/&#8230;$/)
      ) {
        isTruncated = true;
        reasons.push('truncation_marker');
      }

      // Check 3: Content identical to summary (feed only provides excerpt)
      if (content && summary && content.trim() === summary.trim()) {
        isTruncated = true;
        reasons.push('content_equals_summary');
      }

      // Check 4: Word count below threshold (< 50 words)
      const wordCount = textToCheck.split(/\s+/).length;
      if (wordCount < 50) {
        isTruncated = true;
        reasons.push('low_word_count');
      }

      if (isTruncated) {
        truncatedCount++;
        for (const r of reasons) {
          truncationReasons[r] = (truncationReasons[r] || 0) + 1;
        }
      } else {
        fullContentCount++;
      }
    }

    const truncationRate = items.length > 0
      ? Math.round((truncatedCount / items.length) * 100)
      : 0;

    return {
      sampleSize: items.length,
      truncatedCount,
      fullContentCount,
      noContentCount,
      truncationRate,
      truncationReasons,
      recommendation: truncationRate > 20
        ? 'RECOMMENDED: Enable full-text extraction (truncation rate exceeds 20%)'
        : `NOT NEEDED: Truncation rate ${truncationRate}% is below 20% threshold`,
    };
  },
});

/**
 * Analyze cross-feed duplicate rate.
 *
 * Detects items appearing in multiple feeds by comparing:
 * - Exact title matches across different feeds
 * - Exact link/URL matches across different feeds
 * - Similar content hashes (first 100 chars normalized)
 */
export const analyzeCrossFeedDuplicates = internalQuery({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;

    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    // Group by normalized title
    const titleMap = new Map<string, Set<string>>();
    // Group by link
    const linkMap = new Map<string, Set<string>>();

    for (const item of items) {
      const feedId = item.feedId as string;

      // Normalize title: lowercase, strip whitespace
      const normTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!titleMap.has(normTitle)) titleMap.set(normTitle, new Set());
      titleMap.get(normTitle)!.add(feedId);

      // Normalize link: remove trailing slash, lowercase
      const normLink = item.link.toLowerCase().replace(/\/+$/, '');
      if (!linkMap.has(normLink)) linkMap.set(normLink, new Set());
      linkMap.get(normLink)!.add(feedId);
    }

    // Count items that appear in multiple feeds
    let titleDuplicates = 0;
    let linkDuplicates = 0;
    const duplicateTitles: string[] = [];

    for (const [title, feedIds] of titleMap) {
      if (feedIds.size > 1) {
        titleDuplicates++;
        if (duplicateTitles.length < 10) {
          duplicateTitles.push(title);
        }
      }
    }

    for (const [, feedIds] of linkMap) {
      if (feedIds.size > 1) {
        linkDuplicates++;
      }
    }

    const uniqueTitles = titleMap.size;
    const duplicateRate = uniqueTitles > 0
      ? Math.round((titleDuplicates / uniqueTitles) * 100)
      : 0;

    return {
      sampleSize: items.length,
      uniqueTitles,
      titleDuplicates,
      linkDuplicates,
      duplicateRate,
      sampleDuplicateTitles: duplicateTitles,
      recommendation: duplicateRate > 10
        ? 'RECOMMENDED: Enable semantic deduplication (duplicate rate exceeds 10%)'
        : `NOT NEEDED: Duplicate rate ${duplicateRate}% is below 10% threshold`,
    };
  },
});

/**
 * Analyze feed staleness using consecutiveNotModified from Plan 01.
 *
 * Identifies feeds that may be dead or abandoned.
 */
export const analyzeFeedStaleness = internalQuery({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db.query('feeds').collect();

    let activeCount = 0;
    let staleCount = 0;     // >7 consecutive 304s
    let deadCount = 0;      // >30 consecutive 304s
    let errorCount = 0;
    const staleFeeds: Array<{ name: string; url: string; consecutive304s: number }> = [];

    for (const feed of feeds) {
      if (feed.status === 'error') {
        errorCount++;
        continue;
      }

      const notModified = (feed as any).consecutiveNotModified ?? 0;

      if (notModified > 30) {
        deadCount++;
        staleFeeds.push({ name: feed.name, url: feed.url, consecutive304s: notModified });
      } else if (notModified > 7) {
        staleCount++;
        staleFeeds.push({ name: feed.name, url: feed.url, consecutive304s: notModified });
      } else {
        activeCount++;
      }
    }

    return {
      totalFeeds: feeds.length,
      activeCount,
      staleCount,
      deadCount,
      errorCount,
      staleFeeds: staleFeeds.slice(0, 20), // Top 20
      recommendation: deadCount > 0
        ? `Consider removing ${deadCount} dead feeds (>30 consecutive 304 responses)`
        : 'All feeds appear active',
    };
  },
});
// ============================================
// Public Query (callable from dashboard/scripts)
// ============================================

/**
 * Public query wrapper that runs all three analyses and returns a combined report.
 * Callable from dashboard, scripts, or any external client.
 *
 * Visibility: public query — accessible via api.analysis.metrics.getFeedHealthMetrics
 */
export const getFeedHealthMetrics = query({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;

    // Run all three analyses inline (cannot call internal queries from public queries,
    // so we duplicate the logic here as a thin orchestrator)
    // NOTE: In Convex, queries can't call other queries. So this query contains
    // the same analysis logic. For DRY, extract shared logic into pure functions
    // (not Convex functions) and call them from both internalQuery and query handlers.

    // --- Truncation analysis ---
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    let truncatedCount = 0;
    let noContentCount = 0;
    let fullContentCount = 0;

    for (const item of items) {
      const content = item.content || '';
      const summary = item.summary || '';
      if (!content && !summary) { noContentCount++; continue; }
      const textToCheck = content || summary;
      let isTruncated = false;
      if (textToCheck.length < 200) isTruncated = true;
      const trimmed = textToCheck.trim();
      if (trimmed.endsWith('...') || trimmed.endsWith('[...]') ||
          trimmed.endsWith('Read more') || trimmed.endsWith('Continue reading')) {
        isTruncated = true;
      }
      if (content && summary && content.trim() === summary.trim()) isTruncated = true;
      if (textToCheck.split(/\s+/).length < 50) isTruncated = true;
      if (isTruncated) truncatedCount++; else fullContentCount++;
    }

    const truncationRate = items.length > 0 ? Math.round((truncatedCount / items.length) * 100) : 0;

    // --- Duplicate analysis ---
    const titleMap = new Map<string, Set<string>>();
    for (const item of items) {
      const normTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!titleMap.has(normTitle)) titleMap.set(normTitle, new Set());
      titleMap.get(normTitle)!.add(item.feedId as string);
    }
    let titleDuplicates = 0;
    for (const [, feedIds] of titleMap) { if (feedIds.size > 1) titleDuplicates++; }
    const duplicateRate = titleMap.size > 0 ? Math.round((titleDuplicates / titleMap.size) * 100) : 0;

    // --- Staleness analysis ---
    const feeds = await ctx.db.query('feeds').collect();
    let staleCount = 0;
    let deadCount = 0;
    for (const feed of feeds) {
      const nm = (feed as any).consecutiveNotModified ?? 0;
      if (nm > 30) deadCount++;
      else if (nm > 7) staleCount++;
    }

    return {
      truncation: {
        sampleSize: items.length,
        truncatedCount, fullContentCount, noContentCount, truncationRate,
        recommendation: truncationRate > 20
          ? 'ENABLE full-text extraction' : 'NOT NEEDED',
      },
      duplicates: {
        sampleSize: items.length,
        uniqueTitles: titleMap.size,
        titleDuplicates, duplicateRate,
        recommendation: duplicateRate > 10
          ? 'ENABLE semantic deduplication' : 'NOT NEEDED',
      },
      staleness: {
        totalFeeds: feeds.length,
        staleCount, deadCount,
        recommendation: deadCount > 0
          ? `Remove ${deadCount} dead feeds` : 'All feeds active',
      },
    };
  },
});
```

### 2. Create analysis script

Create `scripts/analyze-feed-health.ts`:

```typescript
/**
 * Feed Health Analysis Script
 *
 * Usage: npx tsx scripts/analyze-feed-health.ts
 *
 * Runs all analysis metrics and outputs a JSON report.
 * Use to decide whether Phase 6.2 features are needed.
 */

import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function analyzeFeedHealth() {
  const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  console.log('=== AMD Feed Health Analysis ===\n');
  console.log('Running analysis via public query...\n');

  // Call the public query wrapper (accessible from any client)
  const metrics = await client.query(api.analysis.metrics.getFeedHealthMetrics, {
    sampleSize: 200,
  });

  console.log('--- Truncation Analysis ---');
  console.log(`  Sample size: ${metrics.truncation.sampleSize}`);
  console.log(`  Truncated: ${metrics.truncation.truncatedCount}`);
  console.log(`  Full content: ${metrics.truncation.fullContentCount}`);
  console.log(`  No content: ${metrics.truncation.noContentCount}`);
  console.log(`  Truncation rate: ${metrics.truncation.truncationRate}%`);
  console.log(`  Recommendation: ${metrics.truncation.recommendation}`);

  console.log('\n--- Duplicate Analysis ---');
  console.log(`  Sample size: ${metrics.duplicates.sampleSize}`);
  console.log(`  Unique titles: ${metrics.duplicates.uniqueTitles}`);
  console.log(`  Cross-feed duplicates: ${metrics.duplicates.titleDuplicates}`);
  console.log(`  Duplicate rate: ${metrics.duplicates.duplicateRate}%`);
  console.log(`  Recommendation: ${metrics.duplicates.recommendation}`);

  console.log('\n--- Staleness Analysis ---');
  console.log(`  Total feeds: ${metrics.staleness.totalFeeds}`);
  console.log(`  Stale (>7 consecutive 304s): ${metrics.staleness.staleCount}`);
  console.log(`  Dead (>30 consecutive 304s): ${metrics.staleness.deadCount}`);
  console.log(`  Recommendation: ${metrics.staleness.recommendation}`);

  console.log('\n--- Decision Thresholds ---');
  console.log(`  Truncation > 20%: ${metrics.truncation.truncationRate > 20 ? 'YES => Enable full-text extraction' : 'No'}`);
  console.log(`  Duplicates > 10%: ${metrics.duplicates.duplicateRate > 10 ? 'YES => Enable semantic dedup' : 'No'}`);
  console.log(`  Dead feeds: ${metrics.staleness.deadCount > 0 ? `YES => Remove ${metrics.staleness.deadCount} feeds` : 'None'}`);

  await client.close();
}

analyzeFeedHealth().catch(console.error);
```

## Verification

- [ ] `analyzeContentTruncation` correctly identifies truncated content using 4 heuristics
- [ ] `analyzeCrossFeedDuplicates` detects items appearing across multiple feeds by title and link
- [ ] `analyzeFeedStaleness` uses `consecutiveNotModified` to identify stale/dead feeds
- [ ] All queries are read-only and do not modify any data
- [ ] Queries handle empty databases gracefully (return 0 counts, no errors)
- [ ] `npx convex dev` deploys without errors
- [ ] Recommendations match threshold logic (>20% truncation, >10% duplicates)

## Regression Check

Before marking complete, run existing Phase 1-5 sync tests:
```bash
npx tsx scripts/test-feed-sync.ts
npx tsx scripts/test-multi-feed-sync.ts
```

## must_haves

- Three internal analysis queries: truncation, duplicates, staleness
- Public query `getFeedHealthMetrics` accessible via `api.analysis.metrics.getFeedHealthMetrics`
- Each returns structured data with counts, rates, and a recommendation string
- Read-only — zero writes to database
- Handles edge cases (no items, no content, empty DB)
- Truncation heuristics cover: short content, truncation markers, content=summary, low word count
- Duplicate detection uses both title and link matching
- Staleness uses consecutiveNotModified from Plan 01
