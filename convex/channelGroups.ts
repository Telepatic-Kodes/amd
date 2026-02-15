import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

// ===========================================
// CHANNEL GROUPS — Platform publishing groups
// ===========================================

export const listChannelGroups = query({
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (args.brandProfileId) {
      return await ctx.db
        .query("channelGroups")
        .withIndex("by_brandProfileId", (q) =>
          q.eq("brandProfileId", args.brandProfileId!)
        )
        .collect();
    }
    return await ctx.db
      .query("channelGroups")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createChannelGroup = mutation({
  args: {
    name: v.string(),
    platforms: v.array(v.string()),
    brandProfileId: v.optional(v.id("brandProfiles")),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("channelGroups", {
      userId,
      name: args.name,
      platforms: args.platforms,
      brandProfileId: args.brandProfileId,
      isDefault: args.isDefault,
      createdAt: Date.now(),
    });
  },
});

export const deleteChannelGroup = mutation({
  args: {
    id: v.id("channelGroups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleDefault = mutation({
  args: {
    id: v.id("channelGroups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) return;

    // Unset default on all other groups for this user
    if (!group.isDefault) {
      const allGroups = await ctx.db
        .query("channelGroups")
        .withIndex("by_userId", (q) => q.eq("userId", group.userId))
        .collect();
      for (const g of allGroups) {
        if (g.isDefault) {
          await ctx.db.patch(g._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(args.id, { isDefault: !group.isDefault });
  },
});
