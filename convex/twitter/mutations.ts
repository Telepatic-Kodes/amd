import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Store a new Twitter connection after successful OAuth
 */
export const storeConnection = internalMutation({
  args: {
    twitterUserId: v.string(),
    username: v.string(),
    displayName: v.string(),
    profileImageUrl: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing connection with same Twitter user ID
    const existing = await ctx.db
      .query("twitterConnections")
      .withIndex("by_twitterUserId", (q) => q.eq("twitterUserId", args.twitterUserId))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        profileImageUrl: args.profileImageUrl,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        scopes: args.scopes,
        status: "connected",
        updatedAt: now,
      });

      await ctx.db.insert("auditLog", {
        action: "twitter.reconnected",
        entityType: "twitterConnection",
        entityId: existing._id,
        performedBy: "user",
        metadata: { username: args.username },
        timestamp: now,
      });

      return existing._id;
    }

    // Disconnect any other active connections (single account)
    const activeConnections = await ctx.db
      .query("twitterConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of activeConnections) {
      await ctx.db.patch(conn._id, {
        status: "disconnected",
        updatedAt: now,
      });
    }

    // Create new connection
    const connectionId = await ctx.db.insert("twitterConnections", {
      twitterUserId: args.twitterUserId,
      username: args.username,
      displayName: args.displayName,
      profileImageUrl: args.profileImageUrl,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      scopes: args.scopes,
      status: "connected",
      dailyTweetCount: 0,
      lastTweetCountResetAt: now,
      connectedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "twitter.connected",
      entityType: "twitterConnection",
      entityId: connectionId,
      performedBy: "user",
      metadata: { username: args.username },
      timestamp: now,
    });

    return connectionId;
  },
});

/**
 * Disconnect Twitter account
 */
export const disconnect = mutation({
  args: { connectionId: v.id("twitterConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Conexión no encontrada");

    const now = Date.now();
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      accessToken: "",
      refreshToken: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "twitter.disconnected",
      entityType: "twitterConnection",
      entityId: args.connectionId,
      performedBy: "user",
      metadata: { username: connection.username },
      timestamp: now,
    });
  },
});

/**
 * Log a publish attempt
 */
export const logPublishAttempt = internalMutation({
  args: {
    contentId: v.id("content"),
    connectionId: v.id("twitterConnections"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("twitterPublishLog", {
      contentId: args.contentId,
      connectionId: args.connectionId,
      status: "pending",
      createdAt: now,
    });

    return logId;
  },
});

/**
 * Update publish log with result
 */
export const updatePublishLog = internalMutation({
  args: {
    logId: v.id("twitterPublishLog"),
    status: v.union(
      v.literal("published"),
      v.literal("failed")
    ),
    tweetIds: v.optional(v.array(v.string())),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.object({
      tweetCount: v.optional(v.number()),
      characterCount: v.optional(v.number()),
      isThread: v.optional(v.boolean()),
      threadUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.logId, {
      status: args.status,
      tweetIds: args.tweetIds,
      errorMessage: args.errorMessage,
      publishedAt: args.status === "published" ? now : undefined,
      metadata: args.metadata,
    });
  },
});

/**
 * Increment daily tweet count
 */
export const incrementDailyCount = internalMutation({
  args: { connectionId: v.id("twitterConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    const now = Date.now();

    // Reset counter if it's a new day
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const resetNeeded = connection.lastTweetCountResetAt < dayStart.getTime();

    await ctx.db.patch(args.connectionId, {
      dailyTweetCount: resetNeeded ? 1 : connection.dailyTweetCount + 1,
      lastTweetAt: now,
      lastTweetCountResetAt: resetNeeded ? dayStart.getTime() : connection.lastTweetCountResetAt,
      updatedAt: now,
    });
  },
});

/**
 * Mark connection as expired
 */
export const markExpired = internalMutation({
  args: { connectionId: v.id("twitterConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      status: "expired",
      updatedAt: Date.now(),
    });
  },
});
