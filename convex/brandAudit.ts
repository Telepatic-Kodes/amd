import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { getUserId } from "./lib/auth";

// ===========================================
// QUERIES
// ===========================================

export const getLatest = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    const audits = await ctx.db
      .query("brandAudits")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .order("desc")
      .take(1);
    return audits[0] ?? null;
  },
});

export const list = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    return await ctx.db
      .query("brandAudits")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .order("desc")
      .take(20);
  },
});

// ===========================================
// INTERNAL MUTATIONS & QUERIES (used by action)
// ===========================================

export const _saveAudit = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    instagramHandle: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    // B6: Multi-platform handles
    linkedinHandle: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    youtubeHandle: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    metrics: v.object({
      followers: v.string(),
      following: v.string(),
      posts: v.string(),
      engagementNote: v.string(),
    }),
    // B6: Per-platform metrics
    platformMetrics: v.optional(v.any()),
    strengths: v.array(v.object({
      title: v.string(),
      description: v.string(),
      icon: v.string(),
    })),
    weaknesses: v.array(v.object({
      title: v.string(),
      description: v.string(),
      icon: v.string(),
    })),
    actionPlan: v.array(v.object({
      priority: v.union(
        v.literal("immediate"),
        v.literal("short"),
        v.literal("medium"),
        v.literal("long")
      ),
      title: v.string(),
      description: v.string(),
      timeframe: v.string(),
    })),
    summary: v.string(),
    rawContent: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brandAudits", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const _getBrandProfile = internalQuery({
  args: { id: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
