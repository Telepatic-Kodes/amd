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
