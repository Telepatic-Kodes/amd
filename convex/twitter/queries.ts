import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the active Twitter connection (single account per AMD instance)
 */
export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("twitterConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connection) {
      // Check for expired connection
      const expired = await ctx.db
        .query("twitterConnections")
        .withIndex("by_status", (q) => q.eq("status", "expired"))
        .first();

      if (expired) {
        return {
          ...expired,
          accessToken: undefined, // Never expose tokens to frontend
          refreshToken: undefined,
        };
      }
      return null;
    }

    // Check if access token is expired
    const now = Date.now();
    const isExpired = connection.accessTokenExpiresAt < now;
    const expiresInDays = Math.floor(
      (connection.accessTokenExpiresAt - now) / (1000 * 60 * 60 * 24)
    );

    return {
      _id: connection._id,
      twitterUserId: connection.twitterUserId,
      username: connection.username,
      displayName: connection.displayName,
      profileImageUrl: connection.profileImageUrl,
      status: isExpired ? ("expired" as const) : connection.status,
      scopes: connection.scopes,
      dailyTweetCount: connection.dailyTweetCount,
      lastTweetAt: connection.lastTweetAt,
      connectedAt: connection.connectedAt,
      expiresInDays,
      isExpiringSoon: expiresInDays <= 7 && expiresInDays > 0,
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
      .query("twitterConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connected) {
      const expired = await ctx.db
        .query("twitterConnections")
        .withIndex("by_status", (q) => q.eq("status", "expired"))
        .first();

      return {
        isConnected: false,
        status: expired ? ("expired" as const) : ("disconnected" as const),
        username: expired?.username,
        displayName: expired?.displayName,
      };
    }

    const now = Date.now();
    const isExpired = connected.accessTokenExpiresAt < now;

    return {
      isConnected: !isExpired,
      status: isExpired ? ("expired" as const) : ("connected" as const),
      username: connected.username,
      displayName: connected.displayName,
      profileImageUrl: connected.profileImageUrl,
      dailyTweetCount: connected.dailyTweetCount,
    };
  },
});

/**
 * Get publish history for a specific content piece
 */
export const getPublishHistory = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("twitterPublishLog")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .order("desc")
      .collect();
  },
});

/**
 * Get recent publish logs (for settings/monitoring)
 */
export const getRecentPublishLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("twitterPublishLog")
      .order("desc")
      .take(limit);
  },
});
