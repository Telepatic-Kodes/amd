import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Connect an email provider (form-based, no OAuth)
 */
export const connectProvider = mutation({
  args: {
    provider: v.union(
      v.literal("sendgrid"),
      v.literal("resend"),
      v.literal("mailgun"),
      v.literal("mock")
    ),
    apiKey: v.string(),
    senderEmail: v.string(),
    senderName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Disconnect any existing active connections (single provider)
    const activeConnections = await ctx.db
      .query("emailProviderConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of activeConnections) {
      await ctx.db.patch(conn._id, {
        status: "disconnected",
        updatedAt: now,
      });
    }

    // Create new connection
    const connectionId = await ctx.db.insert("emailProviderConnections", {
      provider: args.provider,
      apiKey: args.apiKey,
      senderEmail: args.senderEmail,
      senderName: args.senderName,
      status: "connected",
      dailySendCount: 0,
      dailySendLimit: args.provider === "mock" ? 10000 : 100,
      lastSendCountResetAt: now,
      connectedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "email.connected",
      entityType: "emailProviderConnection",
      entityId: connectionId,
      performedBy: "user",
      metadata: { provider: args.provider, senderEmail: args.senderEmail },
      timestamp: now,
    });

    return connectionId;
  },
});

/**
 * Disconnect email provider
 */
export const disconnect = mutation({
  args: { connectionId: v.id("emailProviderConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Conexión no encontrada");

    const now = Date.now();
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      apiKey: "",
      updatedAt: now,
    });

    await ctx.db.insert("auditLog", {
      action: "email.disconnected",
      entityType: "emailProviderConnection",
      entityId: args.connectionId,
      performedBy: "user",
      metadata: { provider: connection.provider },
      timestamp: now,
    });
  },
});

/**
 * Add a single subscriber
 */
export const addSubscriber = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    segments: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for duplicate email
    const existing = await ctx.db
      .query("emailSubscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error(`El suscriptor ${args.email} ya existe`);
    }

    return await ctx.db.insert("emailSubscribers", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      status: "active",
      tags: args.tags || [],
      segments: args.segments || [],
      source: args.source || "manual",
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      subscribedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Bulk import subscribers from JSON array
 */
export const importSubscribers = mutation({
  args: {
    subscribers: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        segments: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let imported = 0;
    let skipped = 0;

    for (const sub of args.subscribers) {
      const existing = await ctx.db
        .query("emailSubscribers")
        .withIndex("by_email", (q) => q.eq("email", sub.email))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("emailSubscribers", {
        email: sub.email,
        firstName: sub.firstName,
        lastName: sub.lastName,
        status: "active",
        tags: sub.tags || [],
        segments: sub.segments || [],
        source: "import",
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        subscribedAt: now,
        updatedAt: now,
      });
      imported++;
    }

    return { imported, skipped, total: args.subscribers.length };
  },
});

/**
 * Update subscriber status (unsubscribe/bounce/reactivate)
 */
export const updateSubscriberStatus = mutation({
  args: {
    subscriberId: v.id("emailSubscribers"),
    status: v.union(
      v.literal("active"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained")
    ),
  },
  handler: async (ctx, args) => {
    const subscriber = await ctx.db.get(args.subscriberId);
    if (!subscriber) throw new Error("Suscriptor no encontrado");

    await ctx.db.patch(args.subscriberId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Log a send attempt (internal, called by send action)
 */
export const logSendAttempt = internalMutation({
  args: {
    contentId: v.id("content"),
    connectionId: v.id("emailProviderConnections"),
    subject: v.string(),
    recipientCount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.object({
      openRate: v.optional(v.number()),
      clickRate: v.optional(v.number()),
      bounceRate: v.optional(v.number()),
      unsubscribeRate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("emailSendLog", {
      contentId: args.contentId,
      connectionId: args.connectionId,
      subject: args.subject,
      recipientCount: args.recipientCount,
      status: args.status,
      errorMessage: args.errorMessage,
      sentAt: args.status === "sent" ? now : undefined,
      metadata: args.metadata,
      createdAt: now,
    });

    // Update daily send count if sent
    if (args.status === "sent") {
      const connection = await ctx.db.get(args.connectionId);
      if (connection) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const resetNeeded = connection.lastSendCountResetAt < dayStart.getTime();

        await ctx.db.patch(args.connectionId, {
          dailySendCount: resetNeeded
            ? args.recipientCount
            : connection.dailySendCount + args.recipientCount,
          lastSendAt: now,
          lastSendCountResetAt: resetNeeded
            ? dayStart.getTime()
            : connection.lastSendCountResetAt,
          updatedAt: now,
        });
      }
    }

    return logId;
  },
});

/**
 * Store email engagement data (internal)
 */
export const storeEngagement = internalMutation({
  args: {
    contentId: v.id("content"),
    sendLogId: v.id("emailSendLog"),
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    unsubscribed: v.number(),
  },
  handler: async (ctx, args) => {
    const deliveryRate = args.sent > 0 ? (args.delivered / args.sent) * 100 : 0;
    const openRate = args.delivered > 0 ? (args.opened / args.delivered) * 100 : 0;
    const clickRate = args.delivered > 0 ? (args.clicked / args.delivered) * 100 : 0;
    const bounceRate = args.sent > 0 ? (args.bounced / args.sent) * 100 : 0;

    return await ctx.db.insert("emailEngagement", {
      contentId: args.contentId,
      sendLogId: args.sendLogId,
      sent: args.sent,
      delivered: args.delivered,
      opened: args.opened,
      clicked: args.clicked,
      bounced: args.bounced,
      unsubscribed: args.unsubscribed,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      fetchedAt: Date.now(),
    });
  },
});
