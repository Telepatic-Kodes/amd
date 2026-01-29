/**
 * Brand Monitoring Mutations
 */

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Store a generated alert digest (INTERNAL - called by actions)
 */
export const storeAlertDigest = internalMutation({
  args: {
    period: v.object({ start: v.number(), end: v.number() }),
    items: v.array(
      v.object({
        feedItemId: v.id("feedItems"),
        title: v.string(),
        relevanceScore: v.number(),
        brandMentions: v.array(v.string()),
        competitorMentions: v.array(v.string()),
        sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
      })
    ),
    stats: v.object({
      totalItems: v.number(),
      highRelevance: v.number(),
      brandMentionCount: v.number(),
      competitorMentionCount: v.number(),
    }),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alertDigests", {
      createdAt: Date.now(),
      status: "generated",
      period: args.period,
      items: args.items,
      stats: args.stats,
      summary: args.summary,
    });
  },
});

/**
 * Mark digest as sent/delivered
 */
export const markDigestSent = mutation({
  args: {
    digestId: v.id("alertDigests"),
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.digestId, {
      status: "sent",
      sentAt: args.sentAt || Date.now(),
    });
  },
});

/**
 * Mark digest as failed
 */
export const markDigestFailed = mutation({
  args: {
    digestId: v.id("alertDigests"),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.digestId, {
      status: "failed",
    });
  },
});
