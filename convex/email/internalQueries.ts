import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Get connection with API key (internal only, never expose to frontend)
 */
export const getConnectionWithApiKey = internalQuery({
  args: { connectionId: v.id("emailProviderConnections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get content by _id for send action
 */
export const getContentById = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

/**
 * Get active subscribers for sending
 */
export const getActiveSubscribers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("emailSubscribers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Get active connection (internal)
 */
export const getActiveConnection = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("emailProviderConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();
  },
});
