import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the active Instagram connection (single account per AMD instance)
 */
export const getConnection = query({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("instagramConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connection) {
      // Check for expired connection
      const expired = await ctx.db
        .query("instagramConnections")
        .withIndex("by_status", (q) => q.eq("status", "expired"))
        .first();

      if (expired) {
        return {
          ...expired,
          accessToken: undefined, // Never expose tokens to frontend
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
      instagramUserId: connection.instagramUserId,
      username: connection.username,
      displayName: connection.displayName,
      profilePictureUrl: connection.profilePictureUrl,
      facebookPageId: connection.facebookPageId,
      facebookPageName: connection.facebookPageName,
      status: isExpired ? "expired" as const : connection.status,
      scopes: connection.scopes,
      dailyPostCount: connection.dailyPostCount,
      lastPostAt: connection.lastPostAt,
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
      .query("instagramConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connected) {
      const expired = await ctx.db
        .query("instagramConnections")
        .withIndex("by_status", (q) => q.eq("status", "expired"))
        .first();

      return {
        isConnected: false,
        status: expired ? "expired" as const : "disconnected" as const,
        username: expired?.username,
        displayName: expired?.displayName,
      };
    }

    const now = Date.now();
    const isExpired = connected.accessTokenExpiresAt < now;

    return {
      isConnected: !isExpired,
      status: isExpired ? "expired" as const : "connected" as const,
      username: connected.username,
      displayName: connected.displayName,
      profilePictureUrl: connected.profilePictureUrl,
      facebookPageName: connected.facebookPageName,
      dailyPostCount: connected.dailyPostCount,
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
      .query("instagramPublishLog")
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
      .query("instagramPublishLog")
      .order("desc")
      .take(limit);
  },
});
