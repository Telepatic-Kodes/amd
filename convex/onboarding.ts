import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getUserId } from "./lib/auth";

export const complete = mutation({
  args: {
    companyName: v.string(),
    industry: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
    channels: v.array(v.string()),
    feeds: v.array(v.string()),
    departments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    await ctx.db.insert("onboarding", {
      ...args,
      userId,
      completedAt: Date.now(),
    });
  },
});

export const get = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    // Obtener el último onboarding completado del usuario
    const allOnboarding = await ctx.db
      .query("onboarding")
      .order("desc")
      .collect();

    const userOnboarding = allOnboarding.find(o => o.userId === userId);
    return userOnboarding;
  },
});

/**
 * completeUnified — Saves both onboarding data AND brand profile in one step.
 * Used by the unified onboarding flow to combine the old 3-step onboarding
 * with the 6-step brand wizard into a single mutation.
 */
export const completeUnified = mutation({
  args: {
    // Onboarding fields
    companyName: v.string(),
    industry: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
    feeds: v.array(v.string()),
    activationMode: v.union(v.literal("demo"), v.literal("real")),
    // Brand profile fields
    website: v.optional(v.string()),
    voice: v.object({
      tone: v.array(v.string()),
      personality: v.array(v.string()),
      dos: v.array(v.string()),
      donts: v.array(v.string()),
    }),
    audience: v.object({
      segments: v.array(
        v.object({
          name: v.string(),
          demographics: v.optional(v.string()),
          painPoints: v.array(v.string()),
        })
      ),
    }),
    strategy: v.object({
      topics: v.array(v.string()),
      channels: v.array(v.string()),
      postingFrequency: v.optional(v.string()),
    }),
    competitors: v.array(
      v.object({
        name: v.string(),
        url: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    references: v.optional(v.array(v.string())),
    visual: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        secondaryColor: v.optional(v.string()),
        logoDescription: v.optional(v.string()),
        styleNotes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    // 1. Save onboarding record
    await ctx.db.insert("onboarding", {
      userId,
      companyName: args.companyName,
      industry: args.industry,
      description: args.description,
      goals: args.goals,
      channels: args.strategy.channels,
      feeds: args.feeds,
      departments: ["content", "social", "seo", "demandgen", "brand", "ops", "leadership"],
      completedAt: now,
    });

    // 2. Upsert brand profile
    const existing = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const brandData = {
      companyName: args.companyName,
      industry: args.industry,
      website: args.website,
      description: args.description,
      voice: args.voice,
      audience: args.audience,
      strategy: args.strategy,
      competitors: args.competitors.filter((c) => c.name.trim() !== ""),
      references: args.references,
      visual: args.visual,
      status: "complete" as const,
      updatedAt: now,
    };

    let brandProfileId;
    if (existing) {
      await ctx.db.patch(existing._id, brandData);
      brandProfileId = existing._id;
    } else {
      brandProfileId = await ctx.db.insert("brandProfiles", {
        userId,
        ...brandData,
        createdAt: now,
      });
    }

    return { brandProfileId, activationMode: args.activationMode };
  },
});

/**
 * getActivationData — Returns agents grouped by department for the activation sequence.
 * Used by the unified onboarding's activation screen to show departments coming online.
 */
export const getActivationData = query({
  handler: async (ctx) => {
    await requireAuth(ctx);

    const allAgents = await ctx.db.query("agents").collect();

    const departments = [
      { key: "leadership", label: "Leadership", icon: "crown" },
      { key: "brand", label: "Brand & Creative", icon: "palette" },
      { key: "content", label: "Content", icon: "pen-tool" },
      { key: "seo", label: "SEO", icon: "search" },
      { key: "social", label: "Social Media", icon: "share-2" },
      { key: "demandgen", label: "Demand Gen", icon: "target" },
      { key: "ops", label: "Marketing Ops", icon: "settings" },
    ];

    return departments.map((dept) => {
      const agents = allAgents.filter((a) => a.department === dept.key);
      return {
        key: dept.key,
        label: dept.label,
        icon: dept.icon,
        agentCount: agents.length,
        agents: agents.map((a) => ({
          id: a._id,
          agentId: a.agentId,
          name: a.name,
          role: a.role,
          status: a.status,
        })),
      };
    });
  },
});

// DEV ONLY: Reset onboarding + brand profile for testing
export const devReset = mutation({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const records = await ctx.db
      .query("onboarding")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const r of records) await ctx.db.delete(r._id);
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const p of profiles) await ctx.db.delete(p._id);
    return { deleted: { onboarding: records.length, brandProfiles: profiles.length } };
  },
});
