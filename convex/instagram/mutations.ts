import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Store a new Instagram connection after successful OAuth via Facebook
 */
export const storeConnection = internalMutation({
  args: {
    instagramUserId: v.string(),
    username: v.string(),
    displayName: v.string(),
    profilePictureUrl: v.optional(v.string()),
    facebookPageId: v.string(),
    facebookPageName: v.optional(v.string()),
    accessToken: v.string(),
    accessTokenExpiresAt: v.number(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing connection with same Instagram user ID
    const existing = await ctx.db
      .query("instagramConnections")
      .withIndex("by_instagramUserId", (q) => q.eq("instagramUserId", args.instagramUserId))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        profilePictureUrl: args.profilePictureUrl,
        facebookPageId: args.facebookPageId,
        facebookPageName: args.facebookPageName,
        accessToken: args.accessToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        scopes: args.scopes,
        status: "connected",
        updatedAt: now,
      });

      await ctx.db.insert("auditLog", {
        action: "instagram.reconnected",
        entityType: "instagramConnection",
        entityId: existing._id,
        performedBy: "user",
        metadata: { username: args.username },
        timestamp: now,
      });

      return existing._id;
    }

    // Disconnect any other active connections (single account)
    const activeConnections = await ctx.db
      .query("instagramConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of activeConnections) {
      await ctx.db.patch(conn._id, {
        status: "disconnected",
        updatedAt: now,
      });
    }

    // Create new connection
    const connectionId = await ctx.db.insert("instagramConnections", {
      instagramUserId: args.instagramUserId,
      username: args.username,
      displayName: args.displayName,
      profilePictureUrl: args.profilePictureUrl,
      facebookPageId: args.facebookPageId,
      facebookPageName: args.facebookPageName,
      accessToken: args.accessToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      scopes: args.scopes,
      status: "connected",
      dailyPostCount: 0,
      lastPostCountResetAt: now,
      connectedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "instagram.connected",
      entityType: "instagramConnection",
      entityId: connectionId,
      performedBy: "user",
      metadata: { username: args.username, facebookPageName: args.facebookPageName },
      timestamp: now,
    });

    return connectionId;
  },
});

/**
 * Disconnect Instagram account
 */
export const disconnect = mutation({
  args: { connectionId: v.id("instagramConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Conexión no encontrada");

    const now = Date.now();
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      accessToken: "",
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "instagram.disconnected",
      entityType: "instagramConnection",
      entityId: args.connectionId,
      performedBy: "user",
      metadata: { username: connection.username },
      timestamp: now,
    });
  },
});

/**
 * Log a publish attempt (creates pending log entry)
 */
export const logPublishAttempt = internalMutation({
  args: {
    contentId: v.id("content"),
    connectionId: v.id("instagramConnections"),
    mediaType: v.union(v.literal("image"), v.literal("carousel"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("instagramPublishLog", {
      contentId: args.contentId,
      connectionId: args.connectionId,
      mediaType: args.mediaType,
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
    logId: v.id("instagramPublishLog"),
    status: v.union(v.literal("published"), v.literal("failed")),
    instagramMediaId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.object({
      captionLength: v.optional(v.number()),
      imageCount: v.optional(v.number()),
      permalink: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.logId, {
      status: args.status,
      instagramMediaId: args.instagramMediaId,
      errorMessage: args.errorMessage,
      publishedAt: args.status === "published" ? now : undefined,
      metadata: args.metadata,
    });
  },
});

/**
 * Increment daily post count
 */
export const incrementDailyCount = internalMutation({
  args: { connectionId: v.id("instagramConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const resetNeeded = connection.lastPostCountResetAt < dayStart.getTime();

    await ctx.db.patch(args.connectionId, {
      dailyPostCount: resetNeeded ? 1 : connection.dailyPostCount + 1,
      lastPostAt: now,
      lastPostCountResetAt: resetNeeded ? dayStart.getTime() : connection.lastPostCountResetAt,
      updatedAt: now,
    });
  },
});

/**
 * Mark connection as expired
 */
export const markExpired = internalMutation({
  args: { connectionId: v.id("instagramConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      status: "expired",
      updatedAt: Date.now(),
    });
  },
});
