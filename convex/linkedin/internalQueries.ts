import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Internal query to get connection with sensitive token data
 * Only used by actions, never exposed to frontend
 */
export const getConnectionWithToken = internalQuery({
  args: { connectionId: v.id("linkedinConnections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get content by _id for publish action
 */
export const getContentById = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

/**
 * Get all connected accounts (for cron token check)
 */
export const getActiveConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("linkedinConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();
  },
});
