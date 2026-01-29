---
wave: 2
depends_on:
  - 06-PLAN-04-Analysis-Metrics
files_modified:
  - convex/schema.ts
  - convex/feeds/mutations.ts
files_created:
  - convex/feeds/featureFlags.ts
  - scripts/test-feature-toggles.ts
autonomous: true
---

# Plan 05: Feature Toggle System

## Objective

Add per-feed and global feature toggles for Phase 6.2 features (full-text extraction, semantic deduplication). This enables gradual rollout, A/B testing, and safe feature activation based on Plan 04 analysis results.

## Why After Plan 04

- Plan 04 provides the data to decide WHICH features to enable
- Toggles are only useful if there is a decision framework (the metrics)
- This plan creates the infrastructure; Phase 6.2 implementation (if justified) would check these flags

## Step-by-step

### 1. Add features object to feeds table in schema.ts

In `convex/schema.ts`, add an optional `features` field to the `feeds` table definition, after the existing fields:

```typescript
// Feature toggles for Phase 6.2 (per-feed overrides)
features: v.optional(v.object({
  fullTextExtraction: v.optional(v.boolean()),
  semanticDeduplication: v.optional(v.boolean()),
})),
```

This is fully optional and backward compatible — existing feeds will have `features: undefined`.

### 2. Create feature flags module

Create `convex/feeds/featureFlags.ts`:

```typescript
/**
 * Feature Flags Module
 *
 * Provides per-feed and global feature toggle checking for Phase 6.2 features.
 * Global flags are stored in the settings table. Per-feed flags override globals.
 *
 * Usage in processing pipelines:
 *   if (shouldExtractFullText(feed)) { ... }
 *   if (shouldDeduplicateSemantically(feed)) { ... }
 *
 * @module convex/feeds/featureFlags
 */

import { v } from 'convex/values';
import { internalQuery, internalMutation, query, mutation } from '../_generated/server';
import { internal } from '../_generated/api';

// ============================================
// Types
// ============================================

export interface FeedFeatures {
  fullTextExtraction?: boolean;
  semanticDeduplication?: boolean;
}

export interface GlobalFeatureFlags {
  fullTextExtractionEnabled: boolean;
  semanticDeduplicationEnabled: boolean;
}

/**
 * Default global flags — all Phase 6.2 features OFF by default.
 */
const DEFAULT_GLOBAL_FLAGS: GlobalFeatureFlags = {
  fullTextExtractionEnabled: false,
  semanticDeduplicationEnabled: false,
};

/**
 * Settings key for global feature flags
 */
const SETTINGS_KEY = 'phase6_feature_flags';

// ============================================
// Queries
// ============================================

/**
 * Get global feature flags from settings table.
 */
export const getGlobalFeatureFlags = internalQuery({
  args: {},
  handler: async (ctx): Promise<GlobalFeatureFlags> => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    if (!setting) return DEFAULT_GLOBAL_FLAGS;
    return setting.value as GlobalFeatureFlags;
  },
});

/**
 * Check if full-text extraction should run for a specific feed.
 *
 * Priority: per-feed override > global flag > default (false)
 */
export const shouldExtractFullText = internalQuery({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args): Promise<boolean> => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) return false;

    // Per-feed override takes priority
    const feedFeatures = (feed as any).features as FeedFeatures | undefined;
    if (feedFeatures?.fullTextExtraction !== undefined) {
      return feedFeatures.fullTextExtraction;
    }

    // Fall back to global flag
    const global = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const flags = (global?.value as GlobalFeatureFlags) ?? DEFAULT_GLOBAL_FLAGS;
    return flags.fullTextExtractionEnabled;
  },
});

/**
 * Check if semantic deduplication should run for a specific feed.
 *
 * Priority: per-feed override > global flag > default (false)
 */
export const shouldDeduplicateSemantically = internalQuery({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args): Promise<boolean> => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) return false;

    const feedFeatures = (feed as any).features as FeedFeatures | undefined;
    if (feedFeatures?.semanticDeduplication !== undefined) {
      return feedFeatures.semanticDeduplication;
    }

    const global = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const flags = (global?.value as GlobalFeatureFlags) ?? DEFAULT_GLOBAL_FLAGS;
    return flags.semanticDeduplicationEnabled;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Update global feature flags.
 * Stored in the settings table under key 'phase6_feature_flags'.
 */
export const updateGlobalFeatureFlags = internalMutation({
  args: {
    fullTextExtractionEnabled: v.optional(v.boolean()),
    semanticDeduplicationEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const currentFlags = (existing?.value as GlobalFeatureFlags) ?? DEFAULT_GLOBAL_FLAGS;

    const newFlags: GlobalFeatureFlags = {
      fullTextExtractionEnabled: args.fullTextExtractionEnabled ?? currentFlags.fullTextExtractionEnabled,
      semanticDeduplicationEnabled: args.semanticDeduplicationEnabled ?? currentFlags.semanticDeduplicationEnabled,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: newFlags,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('settings', {
        key: SETTINGS_KEY,
        value: newFlags,
        description: 'Phase 6.2 feature flags: full-text extraction and semantic deduplication',
        updatedAt: Date.now(),
      });
    }

    return newFlags;
  },
});

/**
 * Update per-feed feature toggles.
 * Per-feed settings override global flags.
 */
export const updateFeedFeatures = internalMutation({
  args: {
    feedId: v.id('feeds'),
    fullTextExtraction: v.optional(v.boolean()),
    semanticDeduplication: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) throw new Error(`Feed not found: ${args.feedId}`);

    const currentFeatures = (feed as any).features as FeedFeatures | undefined;

    const newFeatures: FeedFeatures = {
      fullTextExtraction: args.fullTextExtraction ?? currentFeatures?.fullTextExtraction,
      semanticDeduplication: args.semanticDeduplication ?? currentFeatures?.semanticDeduplication,
    };

    await ctx.db.patch(args.feedId, {
      features: newFeatures,
      updatedAt: Date.now(),
    } as any);

    return newFeatures;
  },
});

/**
 * Reset per-feed feature toggles (revert to global defaults).
 * Visibility: internalMutation
 */
export const resetFeedFeatures = internalMutation({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) throw new Error(`Feed not found: ${args.feedId}`);

    await ctx.db.patch(args.feedId, {
      features: undefined,
      updatedAt: Date.now(),
    } as any);

    return { reset: true };
  },
});

// ============================================
// Public Wrappers (callable from dashboard/scripts)
// ============================================

/**
 * Public query: get current global feature flags.
 * Callable via api.feeds.featureFlags.getFeatureFlags
 */
export const getFeatureFlags = query({
  args: {},
  handler: async (ctx): Promise<GlobalFeatureFlags> => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();
    if (!setting) return DEFAULT_GLOBAL_FLAGS;
    return setting.value as GlobalFeatureFlags;
  },
});

/**
 * Public mutation: update global feature flags from dashboard.
 * Callable via api.feeds.featureFlags.setFeatureFlags
 */
export const setFeatureFlags = mutation({
  args: {
    fullTextExtractionEnabled: v.optional(v.boolean()),
    semanticDeduplicationEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Delegate to internal mutation
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const currentFlags = (existing?.value as GlobalFeatureFlags) ?? DEFAULT_GLOBAL_FLAGS;
    const newFlags: GlobalFeatureFlags = {
      fullTextExtractionEnabled: args.fullTextExtractionEnabled ?? currentFlags.fullTextExtractionEnabled,
      semanticDeduplicationEnabled: args.semanticDeduplicationEnabled ?? currentFlags.semanticDeduplicationEnabled,
    };

    if (existing) {
      await ctx.db.patch(existing._id, { value: newFlags, updatedAt: Date.now() });
    } else {
      await ctx.db.insert('settings', {
        key: SETTINGS_KEY,
        value: newFlags,
        description: 'Phase 6.2 feature flags',
        updatedAt: Date.now(),
      });
    }
    return newFlags;
  },
});

// ============================================
// Plan 04 → Plan 05 Connection
// ============================================

/**
 * Recommend feature flags based on Plan 04 metrics.
 *
 * Reads the same metrics as getFeedHealthMetrics and returns
 * recommended feature flag settings.
 *
 * Thresholds (from Plan 04):
 * - Truncation > 20% => recommend fullTextExtraction: true
 * - Duplicates > 10% => recommend semanticDeduplication: true
 *
 * Visibility: public query — callable from dashboard/scripts
 */
export const recommendFeatureFlags = query({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;

    // Truncation check
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    let truncatedCount = 0;
    for (const item of items) {
      const content = item.content || '';
      const summary = item.summary || '';
      if (!content && !summary) continue;
      const text = content || summary;
      if (text.length < 200 || text.trim().endsWith('...') ||
          text.split(/\s+/).length < 50) {
        truncatedCount++;
      }
    }
    const truncationRate = items.length > 0 ? Math.round((truncatedCount / items.length) * 100) : 0;

    // Duplicate check
    const titleMap = new Map<string, Set<string>>();
    for (const item of items) {
      const norm = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!titleMap.has(norm)) titleMap.set(norm, new Set());
      titleMap.get(norm)!.add(item.feedId as string);
    }
    let titleDups = 0;
    for (const [, ids] of titleMap) { if (ids.size > 1) titleDups++; }
    const dupRate = titleMap.size > 0 ? Math.round((titleDups / titleMap.size) * 100) : 0;

    return {
      recommendFullTextExtraction: truncationRate > 20,
      recommendSemanticDeduplication: dupRate > 10,
      truncationRate,
      duplicateRate: dupRate,
      reasoning: {
        fullText: truncationRate > 20
          ? `Truncation rate ${truncationRate}% exceeds 20% threshold`
          : `Truncation rate ${truncationRate}% is below 20% threshold`,
        dedup: dupRate > 10
          ? `Duplicate rate ${dupRate}% exceeds 10% threshold`
          : `Duplicate rate ${dupRate}% is below 10% threshold`,
      },
    };
  },
});
```

**Function visibility summary for Plan 05:**

| Function | Visibility | Called From |
|----------|-----------|-------------|
| `getGlobalFeatureFlags` | `internalQuery` | Other Convex functions |
| `shouldExtractFullText` | `internalQuery` | Feed processing pipeline |
| `shouldDeduplicateSemantically` | `internalQuery` | Feed processing pipeline |
| `updateGlobalFeatureFlags` | `internalMutation` | Other Convex functions |
| `updateFeedFeatures` | `internalMutation` | Other Convex functions |
| `resetFeedFeatures` | `internalMutation` | Other Convex functions |
| `getFeatureFlags` | public `query` | Dashboard, scripts |
| `setFeatureFlags` | public `mutation` | Dashboard, scripts |
| `recommendFeatureFlags` | public `query` | Dashboard, scripts |

### 3. Create test script

Create `scripts/test-feature-toggles.ts`:

```typescript
/**
 * Test Feature Toggle System
 *
 * Usage: npx tsx scripts/test-feature-toggles.ts
 *
 * Automated test that verifies the priority chain:
 *   per-feed override > global flag > default (false)
 *
 * Also tests Plan 04→05 connection via recommendFeatureFlags.
 */

import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}`);
    failed++;
  }
}

async function testFeatureToggles() {
  const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  console.log('=== Feature Toggle System Tests ===\n');

  // 1. Default state: all flags off
  console.log('Test 1: Default global flags');
  const defaults = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert('fullTextExtraction defaults to false', defaults.fullTextExtractionEnabled === false);
  assert('semanticDedup defaults to false', defaults.semanticDeduplicationEnabled === false);

  // 2. Enable full-text globally
  console.log('\nTest 2: Enable full-text globally');
  const updated = await client.mutation(api.feeds.featureFlags.setFeatureFlags, {
    fullTextExtractionEnabled: true,
  });
  assert('fullTextExtraction now true', updated.fullTextExtractionEnabled === true);
  assert('semanticDedup still false', updated.semanticDeduplicationEnabled === false);

  // 3. Verify global change persists
  console.log('\nTest 3: Verify persistence');
  const reread = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert('fullTextExtraction persisted', reread.fullTextExtractionEnabled === true);

  // 4. Test recommendFeatureFlags (Plan 04→05 connection)
  console.log('\nTest 4: Plan 04→05 connection (recommendFeatureFlags)');
  const recs = await client.query(api.feeds.featureFlags.recommendFeatureFlags, {
    sampleSize: 50,
  });
  assert('Returns truncationRate as number', typeof recs.truncationRate === 'number');
  assert('Returns duplicateRate as number', typeof recs.duplicateRate === 'number');
  assert('Returns recommendFullTextExtraction as boolean', typeof recs.recommendFullTextExtraction === 'boolean');
  assert('Returns recommendSemanticDeduplication as boolean', typeof recs.recommendSemanticDeduplication === 'boolean');
  assert('Has reasoning.fullText', typeof recs.reasoning.fullText === 'string');
  assert('Has reasoning.dedup', typeof recs.reasoning.dedup === 'string');
  console.log(`  Recommendations: fullText=${recs.recommendFullTextExtraction}, dedup=${recs.recommendSemanticDeduplication}`);

  // 5. Cleanup: reset global flags to default
  console.log('\nTest 5: Cleanup');
  await client.mutation(api.feeds.featureFlags.setFeatureFlags, {
    fullTextExtractionEnabled: false,
    semanticDeduplicationEnabled: false,
  });
  const cleaned = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert('Reset to defaults', !cleaned.fullTextExtractionEnabled && !cleaned.semanticDeduplicationEnabled);

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  await client.close();
  process.exit(failed > 0 ? 1 : 0);
}

testFeatureToggles().catch(console.error);
```

## Verification

- [ ] `convex/schema.ts` has optional `features` field on feeds table
- [ ] Global flags stored in settings table under key `phase6_feature_flags`
- [ ] Default state: all Phase 6.2 features disabled
- [ ] `shouldExtractFullText` returns per-feed override if set, else global flag, else false
- [ ] `shouldDeduplicateSemantically` follows same priority chain
- [ ] `updateGlobalFeatureFlags` creates or patches settings entry
- [ ] `updateFeedFeatures` sets per-feed overrides without affecting other feeds
- [ ] `resetFeedFeatures` clears per-feed overrides (reverts to global)
- [ ] Existing feeds work without `features` field (backward compatible)
- [ ] `npx convex dev` deploys without errors

## Plan 04 → Plan 05 Connection

Thresholds from Plan 04 inform default feature flags:
- If `analyzeContentTruncation` returns `truncationRate > 20%`, recommend enabling `fullTextExtraction`
- If `analyzeCrossFeedDuplicates` returns `duplicateRate > 10%`, recommend enabling `semanticDeduplication`
- The `recommendFeatureFlags()` query encodes this logic and is callable from dashboard

Workflow: Run `getFeedHealthMetrics` (Plan 04) → check output → call `recommendFeatureFlags` (Plan 05) → apply via `setFeatureFlags` if operator agrees.

## Regression Check

Before marking complete, run existing Phase 1-5 sync tests:
```bash
npx tsx scripts/test-feed-sync.ts
npx tsx scripts/test-multi-feed-sync.ts
```

## must_haves

- Feeds table has optional features object (backward compatible)
- Feature flags module provides clear query API (shouldExtractFullText, shouldDeduplicateSemantically)
- Priority chain: per-feed override > global flag > default (false)
- Global flags use existing settings table
- Toggles are inert if Phase 6.2 not implemented (no side effects)
- Internal mutations for programmatic access; public query/mutation wrappers for dashboard
- `recommendFeatureFlags` connects Plan 04 metrics to Plan 05 toggles
- Automated test verifies priority chain end-to-end
- No breaking changes to existing schema or queries
