import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserId } from "./lib/auth";

function shortId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===========================================
// QUERIES
// ===========================================

export const getPillarsByBrand = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentPillars")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();
  },
});

export const getPillarWithStats = query({
  args: { pillarId: v.id("contentPillars") },
  handler: async (ctx, args) => {
    const pillar = await ctx.db.get(args.pillarId);
    if (!pillar) return null;

    // Count content linked to this pillar
    const contentItems = await ctx.db
      .query("content")
      .withIndex("by_pillarId", (q) => q.eq("pillarId", args.pillarId))
      .collect();

    const published = contentItems.filter((c) => c.status === "published").length;
    const draft = contentItems.filter((c) => c.status === "draft").length;
    const tierBreakdown = {
      hero: contentItems.filter((c) => c.contentTier === "hero").length,
      hub: contentItems.filter((c) => c.contentTier === "hub").length,
      hygiene: contentItems.filter((c) => c.contentTier === "hygiene").length,
    };
    const funnelBreakdown = {
      reach: contentItems.filter((c) => c.funnelStage === "reach").length,
      act: contentItems.filter((c) => c.funnelStage === "act").length,
      convert: contentItems.filter((c) => c.funnelStage === "convert").length,
      engage: contentItems.filter((c) => c.funnelStage === "engage").length,
    };

    return {
      ...pillar,
      stats: {
        total: contentItems.length,
        published,
        draft,
        tierBreakdown,
        funnelBreakdown,
      },
    };
  },
});

export const getActivePillars = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return [];

    return await ctx.db
      .query("contentPillars")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", profile._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const createPillar = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    name: v.string(),
    description: v.string(),
    tayaCategories: v.optional(v.array(v.string())),
    funnelStages: v.optional(v.array(v.string())),
    contentTiers: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contentPillars", {
      pillarId: `pillar_${shortId()}`,
      brandProfileId: args.brandProfileId,
      name: args.name,
      description: args.description,
      tayaCategories: args.tayaCategories as ("cost" | "problems" | "comparisons" | "reviews" | "best")[] | undefined,
      funnelStages: args.funnelStages as ("reach" | "act" | "convert" | "engage")[] | undefined,
      contentTiers: args.contentTiers as ("hero" | "hub" | "hygiene")[] | undefined,
      keywords: args.keywords,
      status: "active",
      contentCount: 0,
      performanceScore: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePillar = mutation({
  args: {
    pillarId: v.id("contentPillars"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tayaCategories: v.optional(v.array(v.string())),
    funnelStages: v.optional(v.array(v.string())),
    contentTiers: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("archived"))),
    performanceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { pillarId, ...updates } = args;
    const pillar = await ctx.db.get(pillarId);
    if (!pillar) throw new Error("Pilar no encontrado");

    await ctx.db.patch(pillarId, {
      ...updates,
      updatedAt: Date.now(),
    } as Record<string, unknown>);
  },
});

export const deletePillar = mutation({
  args: { pillarId: v.id("contentPillars") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pillarId);
  },
});

// Batch create pillars from strategy generation
export const createPillarsFromStrategy = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    pillars: v.array(v.object({
      name: v.string(),
      description: v.string(),
      tayaCategories: v.optional(v.array(v.string())),
      funnelStages: v.optional(v.array(v.string())),
      contentTiers: v.optional(v.array(v.string())),
      keywords: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];
    for (const p of args.pillars) {
      const id = await ctx.db.insert("contentPillars", {
        pillarId: `pillar_${shortId()}`,
        brandProfileId: args.brandProfileId,
        name: p.name,
        description: p.description,
        tayaCategories: p.tayaCategories as ("cost" | "problems" | "comparisons" | "reviews" | "best")[] | undefined,
        funnelStages: p.funnelStages as ("reach" | "act" | "convert" | "engage")[] | undefined,
        contentTiers: p.contentTiers as ("hero" | "hub" | "hygiene")[] | undefined,
        keywords: p.keywords,
        status: "active",
        contentCount: 0,
        performanceScore: 0,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return ids;
  },
});
