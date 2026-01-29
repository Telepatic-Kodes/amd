---
wave: 2
depends_on:
  - 05-PLAN-01-Schema-Configuration
  - 05-PLAN-02-Enrichment-Extension
files_created:
  - convex/monitoring/queries.ts
  - convex/monitoring/mutations.ts
autonomous: true
---

## Objective

Create the query and mutation layer for alert digests: fetch alert-worthy feed items, store generated digests. This is the data access layer that the cron action (Plan 04) will call.

## Why This Order

Plans 01-02 must be complete: the schema has the alertDigests table and feedItems now have brandMentions/competitorMentions fields. This plan builds the read/write operations; Plan 04 wires them into the cron.

## Step-by-step

### 1. Create convex/monitoring/queries.ts

```typescript
/**
 * Brand Monitoring Queries
 *
 * Queries for fetching alert-worthy feed items and existing digests.
 *
 * @module convex/monitoring/queries
 */

import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { ALERT_THRESHOLDS } from "./config";

/**
 * Get feed items that qualify for the alert digest.
 *
 * Criteria: processed, relevanceScore >= threshold, AND at least one of:
 * - relevanceScore >= highRelevanceThreshold
 * - brandMentions.length > 0
 * - competitorMentions.length > 0
 *
 * Filters by time window to avoid re-alerting on old items.
 *
 * @param since - Only items processed after this timestamp
 * @param limit - Max items to return (default: ALERT_THRESHOLDS.maxDigestItems)
 */
export const getAlertCandidates = internalQuery({
  args: {
    since: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxItems = args.limit ?? ALERT_THRESHOLDS.maxDigestItems;

    // Query processed items by relevance score index, descending
    // Then filter for alert-worthy criteria in memory
    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_relevanceScore")
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("processed"), true),
          q.gte(q.field("relevanceScore"), ALERT_THRESHOLDS.minRelevanceScore),
          q.gte(q.field("processedAt"), args.since)
        )
      )
      .take(maxItems);

    // Further filter: must have high relevance, brand mentions, or competitor mentions
    return items.filter((item) => {
      const isHighRelevance =
        (item.relevanceScore ?? 0) >= ALERT_THRESHOLDS.highRelevanceThreshold;
      const hasBrandMentions = (item.brandMentions ?? []).length > 0;
      const hasCompetitorMentions = (item.competitorMentions ?? []).length > 0;
      return isHighRelevance || hasBrandMentions || hasCompetitorMentions;
    });
  },
});

/**
 * Get the most recent alert digest.
 * Used to determine the time window for the next digest.
 */
export const getLatestDigest = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("alertDigests")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
  },
});

/**
 * Public query: list recent alert digests for the dashboard.
 */
export const listDigests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("alertDigests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

/**
 * Public query: get a single digest by ID.
 */
export const getDigest = query({
  args: {
    digestId: v.id("alertDigests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.digestId);
  },
});

/**
 * Public query: get feed items with brand mentions.
 * Useful for agents querying "top brand mentions this week".
 */
export const getItemsWithBrandMentions = query({
  args: {
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 7 * 24 * 60 * 60 * 1000; // default: last 7 days
    const limit = args.limit ?? 20;

    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt")
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("processed"), true),
          q.gte(q.field("processedAt"), since)
        )
      )
      .take(limit * 3); // Over-fetch since we filter in memory

    return items
      .filter((item) => (item.brandMentions ?? []).length > 0)
      .slice(0, limit);
  },
});

/**
 * Public query: get feed items with competitor mentions.
 */
export const getItemsWithCompetitorMentions = query({
  args: {
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
    competitor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 7 * 24 * 60 * 60 * 1000;
    const limit = args.limit ?? 20;

    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt")
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("processed"), true),
          q.gte(q.field("processedAt"), since)
        )
      )
      .take(limit * 3);

    return items
      .filter((item) => {
        const mentions = item.competitorMentions ?? [];
        if (mentions.length === 0) return false;
        if (args.competitor) {
          return mentions.includes(args.competitor);
        }
        return true;
      })
      .slice(0, limit);
  },
});
```

### 2. Create convex/monitoring/mutations.ts

```typescript
/**
 * Brand Monitoring Mutations
 *
 * Internal mutations for storing alert digests.
 *
 * @module convex/monitoring/mutations
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Store a generated alert digest.
 */
export const storeAlertDigest = internalMutation({
  args: {
    period: v.object({
      start: v.number(),
      end: v.number(),
    }),
    items: v.array(
      v.object({
        feedItemId: v.id("feedItems"),
        title: v.string(),
        relevanceScore: v.number(),
        brandMentions: v.array(v.string()),
        competitorMentions: v.array(v.string()),
        sentiment: v.union(
          v.literal("positive"),
          v.literal("neutral"),
          v.literal("negative")
        ),
      })
    ),
    summary: v.optional(v.string()),
    stats: v.optional(
      v.object({
        totalItems: v.number(),
        highRelevance: v.number(),
        brandMentionCount: v.number(),
        competitorMentionCount: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const digestId = await ctx.db.insert("alertDigests", {
      createdAt: now,
      status: "generated",
      period: args.period,
      items: args.items,
      summary: args.summary,
      stats: args.stats,
    });

    console.log(
      `[monitoring] Stored alert digest ${digestId}: ${args.items.length} items, ` +
        `period ${new Date(args.period.start).toISOString()} - ${new Date(args.period.end).toISOString()}`
    );

    return { digestId };
  },
});

/**
 * Mark a digest as sent/delivered.
 */
export const markDigestSent = internalMutation({
  args: {
    digestId: v.id("alertDigests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.digestId, {
      status: "sent",
      sentAt: Date.now(),
    });
  },
});
```

### 3. Update convex/monitoring/index.ts

Add the new modules to the barrel export:

```typescript
/**
 * Brand Monitoring Module
 *
 * Phase 5: Brand mention detection and competitor tracking.
 *
 * @module convex/monitoring
 */

export {
  MONITORED_COMPETITORS,
  MONITORED_BRAND_TERMS,
  ALERT_THRESHOLDS,
  getCompetitorNames,
  getAllCompetitorTerms,
} from "./config";

// Queries and mutations are accessed via Convex API paths:
// - monitoring.queries.getAlertCandidates
// - monitoring.queries.listDigests
// - monitoring.mutations.storeAlertDigest
// etc.
```

### 4. Verify

```bash
cd /home/tomas/Escritorio/amd && npx convex dev --once
```

Then test the public queries return empty results (no digests exist yet):
```bash
npx convex run monitoring/queries:listDigests '{"limit": 5}'
```

## Verification

- [ ] convex/monitoring/queries.ts exports getAlertCandidates, getLatestDigest, listDigests, getDigest, getItemsWithBrandMentions, getItemsWithCompetitorMentions
- [ ] convex/monitoring/mutations.ts exports storeAlertDigest, markDigestSent
- [ ] getAlertCandidates filters by relevanceScore, processedAt, and requires high relevance OR mentions
- [ ] listDigests query returns empty array (no digests yet)
- [ ] Schema compiles without errors

## must_haves

- getAlertCandidates internal query filters by since timestamp, relevance threshold, and mention presence
- getLatestDigest returns most recent digest for time window calculation
- listDigests and getDigest public queries for dashboard access
- getItemsWithBrandMentions and getItemsWithCompetitorMentions public queries for agent access
- storeAlertDigest internal mutation creates digest with status "generated"
- markDigestSent internal mutation updates status to "sent" with timestamp
- All queries and mutations compile without TypeScript errors
