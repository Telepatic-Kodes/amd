import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    await ctx.db.insert("onboarding", {
      ...args,
      completedAt: Date.now(),
    });
  },
});

export const get = query({
  handler: async (ctx) => {
    // Obtener el último onboarding completado
    const onboarding = await ctx.db
      .query("onboarding")
      .order("desc")
      .first();

    return onboarding;
  },
});
