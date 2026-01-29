/**
 * Brand Monitoring Queries
 *
 * Internal queries for digest generation and public queries for agents/dashboard.
 */

import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * INTERNAL: Get feed items eligible for alert digest
 * Used by cron to build daily digests
 */
export const getAlertCandidates = internalQuery({
  args: {
    since: v.number(),  // Timestamp: start of period
    until: v.number(),  // Timestamp: end of period
    minRelevance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all items in the time range
    let items = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt", (q) =>
        q.gte("publishedAt", args.since).lte("publishedAt", args.until)
      )
      .collect();

    // Filter items with brand or competitor mentions
    items = items.filter((item) =>
      (item.brandMentions && item.brandMentions.length > 0) ||
      (item.competitorMentions && item.competitorMentions.length > 0)
    );

    // Apply relevance score filter if provided
    if (args.minRelevance !== undefined) {
      items = items.filter((item) =>
        item.relevanceScore !== undefined && item.relevanceScore >= args.minRelevance!
      );
    }

    return items;
  },
});

/**
 * INTERNAL: Get latest digest timestamp for scheduling
 */
export const getLatestDigest = internalQuery({
  handler: async (ctx) => {
    const digests = await ctx.db
      .query("alertDigests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(1);

    return digests[0] || null;
  },
});

/**
 * PUBLIC: List all digests (for dashboard)
 */
export const listDigests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("generated"), v.literal("sent"), v.literal("failed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const digests = await ctx.db
        .query("alertDigests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 50);
      return digests;
    } else {
      const digests = await ctx.db
        .query("alertDigests")
        .withIndex("by_createdAt")
        .order("desc")
        .take(args.limit || 50);
      return digests;
    }
  },
});

/**
 * PUBLIC: Get single digest by ID
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
 * PUBLIC: Get items with brand mentions (for agents)
 */
export const getItemsWithBrandMentions = query({
  args: {
    since: v.optional(v.number()),  // Default: 7 days ago
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lookback = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000;

    let items = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt", (q) => q.gte("publishedAt", lookback))
      .order("desc")
      .collect();

    // Filter for items with brand mentions
    items = items.filter((item) => item.brandMentions && item.brandMentions.length > 0);

    return items.slice(0, args.limit || 20);
  },
});

/**
 * PUBLIC: Get items with competitor mentions (for agents)
 */
export const getItemsWithCompetitorMentions = query({
  args: {
    competitors: v.optional(v.array(v.string())),  // Filter by specific competitors
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lookback = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000;

    let items = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt", (q) => q.gte("publishedAt", lookback))
      .order("desc")
      .collect();

    // Filter for items with competitor mentions
    items = items.filter((item) => item.competitorMentions && item.competitorMentions.length > 0);

    // Client-side filtering by specific competitors if requested
    if (args.competitors && args.competitors.length > 0) {
      items = items.filter((item) =>
        item.competitorMentions?.some((m) => args.competitors!.includes(m))
      );
    }

    return items.slice(0, args.limit || 20);
  },
});
