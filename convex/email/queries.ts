import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the active email provider connection
 */
export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("emailProviderConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connection) return null;

    return {
      _id: connection._id,
      provider: connection.provider,
      senderEmail: connection.senderEmail,
      senderName: connection.senderName,
      status: connection.status,
      dailySendCount: connection.dailySendCount,
      dailySendLimit: connection.dailySendLimit,
      lastSendAt: connection.lastSendAt,
      connectedAt: connection.connectedAt,
      // Never expose apiKey to frontend
    };
  },
});

/**
 * Get connection status summary for dashboard widgets
 */
export const getConnectionStatus = query({
  args: {},
  handler: async (ctx) => {
    const connected = await ctx.db
      .query("emailProviderConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connected) {
      return {
        isConnected: false,
        status: "disconnected" as const,
        provider: null,
        senderEmail: null,
      };
    }

    return {
      isConnected: true,
      status: "connected" as const,
      provider: connected.provider,
      senderEmail: connected.senderEmail,
      senderName: connected.senderName,
      dailySendCount: connected.dailySendCount,
      dailySendLimit: connected.dailySendLimit,
    };
  },
});

/**
 * Get subscribers with optional search and status filter
 */
export const getSubscribers = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // If searching by email, use search index
    if (args.search && args.search.length > 0) {
      let searchQuery = ctx.db
        .query("emailSubscribers")
        .withSearchIndex("search_email", (q) => {
          let sq = q.search("email", args.search!);
          if (args.status) {
            sq = sq.eq("status", args.status as "active" | "unsubscribed" | "bounced" | "complained");
          }
          return sq;
        });

      return await searchQuery.take(limit);
    }

    // Otherwise filter by status
    if (args.status) {
      return await ctx.db
        .query("emailSubscribers")
        .withIndex("by_status", (q) => q.eq("status", args.status as "active" | "unsubscribed" | "bounced" | "complained"))
        .take(limit);
    }

    return await ctx.db
      .query("emailSubscribers")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get subscriber stats (counts by status)
 */
export const getSubscriberStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("emailSubscribers").collect();

    return {
      total: all.length,
      active: all.filter((s) => s.status === "active").length,
      unsubscribed: all.filter((s) => s.status === "unsubscribed").length,
      bounced: all.filter((s) => s.status === "bounced").length,
      complained: all.filter((s) => s.status === "complained").length,
    };
  },
});

/**
 * Get send history for a specific content piece
 */
export const getSendHistory = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailSendLog")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .order("desc")
      .collect();
  },
});

/**
 * Get recent sends (for dashboard/monitoring)
 */
export const getRecentSends = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("emailSendLog")
      .order("desc")
      .take(limit);
  },
});
