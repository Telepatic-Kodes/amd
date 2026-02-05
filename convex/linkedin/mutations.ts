import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Store a new LinkedIn connection after successful OAuth
 */
export const storeConnection = internalMutation({
  args: {
    linkedinMemberId: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    refreshTokenExpiresAt: v.optional(v.number()),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing connection with same member ID
    const existing = await ctx.db
      .query("linkedinConnections")
      .withIndex("by_memberId", (q) => q.eq("linkedinMemberId", args.linkedinMemberId))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        email: args.email,
        profilePicture: args.profilePicture,
        profileUrl: args.profileUrl,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        refreshTokenExpiresAt: args.refreshTokenExpiresAt,
        scopes: args.scopes,
        status: "connected",
        updatedAt: now,
      });

      await ctx.db.insert("auditLog", {
        action: "linkedin.reconnected",
        entityType: "linkedinConnection",
        entityId: existing._id,
        performedBy: "user",
        metadata: { displayName: args.displayName },
        timestamp: now,
      });

      return existing._id;
    }

    // Disconnect any other active connections (single account)
    const activeConnections = await ctx.db
      .query("linkedinConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of activeConnections) {
      await ctx.db.patch(conn._id, {
        status: "disconnected",
        updatedAt: now,
      });
    }

    // Create new connection
    const connectionId = await ctx.db.insert("linkedinConnections", {
      linkedinMemberId: args.linkedinMemberId,
      displayName: args.displayName,
      email: args.email,
      profilePicture: args.profilePicture,
      profileUrl: args.profileUrl,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      scopes: args.scopes,
      status: "connected",
      dailyPostCount: 0,
      lastPostCountResetAt: now,
      connectedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "linkedin.connected",
      entityType: "linkedinConnection",
      entityId: connectionId,
      performedBy: "user",
      metadata: { displayName: args.displayName },
      timestamp: now,
    });

    return connectionId;
  },
});

/**
 * Disconnect LinkedIn account
 */
export const disconnect = mutation({
  args: { connectionId: v.id("linkedinConnections") },
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
      action: "linkedin.disconnected",
      entityType: "linkedinConnection",
      entityId: args.connectionId,
      performedBy: "user",
      metadata: { displayName: connection.displayName },
      timestamp: now,
    });
  },
});

/**
 * Update connection tokens after refresh
 */
export const updateTokens = internalMutation({
  args: {
    connectionId: v.id("linkedinConnections"),
    accessToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshToken: v.optional(v.string()),
    refreshTokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshToken: args.refreshToken,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      status: "connected",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark connection as expired
 */
export const markExpired = internalMutation({
  args: { connectionId: v.id("linkedinConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      status: "expired",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Log a publish attempt
 */
export const logPublishAttempt = internalMutation({
  args: {
    contentId: v.id("content"),
    connectionId: v.id("linkedinConnections"),
    status: v.union(
      v.literal("pending"),
      v.literal("published"),
      v.literal("failed")
    ),
    linkedinPostUrn: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.object({
      postType: v.optional(v.string()),
      characterCount: v.optional(v.number()),
      hasImage: v.optional(v.boolean()),
      visibility: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("linkedinPublishLog", {
      contentId: args.contentId,
      connectionId: args.connectionId,
      linkedinPostUrn: args.linkedinPostUrn,
      status: args.status,
      errorMessage: args.errorMessage,
      publishedAt: args.status === "published" ? now : undefined,
      metadata: args.metadata,
      createdAt: now,
    });

    // Update daily post count if published
    if (args.status === "published") {
      const connection = await ctx.db.get(args.connectionId);
      if (connection) {
        // Reset counter if it's a new day
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const resetNeeded = connection.lastPostCountResetAt < dayStart.getTime();

        await ctx.db.patch(args.connectionId, {
          dailyPostCount: resetNeeded ? 1 : connection.dailyPostCount + 1,
          lastPostAt: now,
          lastPostCountResetAt: resetNeeded ? dayStart.getTime() : connection.lastPostCountResetAt,
          updatedAt: now,
        });
      }
    }

    return logId;
  },
});

/**
 * Check and update token expiration status (called by cron)
 */
export const checkTokenExpiration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const connections = await ctx.db
      .query("linkedinConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of connections) {
      if (conn.accessTokenExpiresAt < now) {
        await ctx.db.patch(conn._id, {
          status: "expired",
          updatedAt: now,
        });

        await ctx.db.insert("auditLog", {
          action: "linkedin.token_expired",
          entityType: "linkedinConnection",
          entityId: conn._id,
          performedBy: "system",
          metadata: { displayName: conn.displayName },
          timestamp: now,
        });
      }
    }
  },
});
