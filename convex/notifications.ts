import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getUserId } from "./lib/auth";

// ===========================================
// NOTIFICATION QUERIES
// ===========================================

/**
 * getNotifications - Fetch notifications for the current user.
 * Supports optional limit and unreadOnly filter.
 * Returns notifications sorted by createdAt descending.
 */
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = args.limit ?? 50;

    const q = ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId));

    const all = await q.collect();

    const filtered = args.unreadOnly
      ? all.filter((n) => !n.read)
      : all;

    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * countUnread - Count unread notifications for the current user.
 * Uses the by_userId_read compound index for efficient lookup.
 */
export const countUnread = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();
    return notifications.length;
  },
});

// ===========================================
// NOTIFICATION MUTATIONS (Frontend-callable)
// ===========================================

/**
 * markAsRead - Mark a single notification as read.
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;
    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
  },
});

/**
 * markAllAsRead - Mark all unread notifications for current user as read.
 * Returns the count of notifications marked as read.
 */
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true, readAt: Date.now() });
    }
    return unread.length;
  },
});

// ===========================================
// INTERNAL MUTATIONS (Backend-to-backend)
// ===========================================

const notificationTypeValidator = v.union(
  v.literal("content_review"),
  v.literal("content_approved"),
  v.literal("content_rejected"),
  v.literal("content_published"),
  v.literal("content_scheduled"),
  v.literal("agent_error"),
  v.literal("brand_update"),
  v.literal("strategy_insight"),
  v.literal("system")
);

type NotificationType =
  | "content_review"
  | "content_approved"
  | "content_rejected"
  | "content_published"
  | "content_scheduled"
  | "agent_error"
  | "brand_update"
  | "strategy_insight"
  | "system";

/**
 * _createNotification - Internal mutation to create a notification.
 * Called from other backend functions (e.g., content pipeline, agent engine).
 */
export const _createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    contentId: v.optional(v.id("content")),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      contentId: args.contentId,
      linkUrl: args.linkUrl,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * _notifyContentStateChange - Notify relevant users about content state changes.
 * Targets users with roles: owner, admin, editor, reviewer, publisher.
 * Skips the user who triggered the change (triggeredByUserId).
 */
export const _notifyContentStateChange = internalMutation({
  args: {
    contentId: v.id("content"),
    contentTitle: v.string(),
    fromStatus: v.string(),
    toStatus: v.string(),
    triggeredByUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all users who should be notified
    const users = await ctx.db.query("users").collect();
    const relevantRoles = ["owner", "admin", "editor", "reviewer", "publisher"];
    const targetUsers = users.filter((u) => relevantRoles.includes(u.role));

    const typeMap: Record<string, NotificationType> = {
      review: "content_review",
      approved: "content_approved",
      revision_needed: "content_rejected",
      published: "content_published",
      scheduled: "content_scheduled",
    };

    const titleMap: Record<string, string> = {
      review: "Contenido pendiente de revision",
      approved: "Contenido aprobado",
      revision_needed: "Contenido requiere revision",
      published: "Contenido publicado",
      scheduled: "Contenido programado",
    };

    const notificationType: NotificationType =
      typeMap[args.toStatus] || "system";
    const title =
      titleMap[args.toStatus] ||
      `Contenido movido a ${args.toStatus}`;

    for (const user of targetUsers) {
      // Don't notify the person who triggered the change
      if (user.clerkId === args.triggeredByUserId) continue;

      await ctx.db.insert("notifications", {
        userId: user.clerkId,
        type: notificationType,
        title,
        message: `"${args.contentTitle}" — ${args.fromStatus} → ${args.toStatus}`,
        contentId: args.contentId,
        linkUrl: "/content",
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});
