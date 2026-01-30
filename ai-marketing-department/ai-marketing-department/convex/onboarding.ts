import { mutation } from "./_generated/server";
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
