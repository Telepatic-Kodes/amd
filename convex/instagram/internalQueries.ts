import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Internal query to get connection with sensitive token data
 * Only used by actions, never exposed to frontend
 */
export const getConnectionWithToken = internalQuery({
  args: { connectionId: v.id("instagramConnections") },
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
 * Get all connected Instagram accounts
 */
export const getActiveConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("instagramConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();
  },
});
