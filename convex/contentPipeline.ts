import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getUserId } from "./lib/auth";

// ===========================================
// ALLOWED TRANSITIONS MAP
// Define valid state transitions for the content pipeline workflow
// ===========================================

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["review"],
  review: ["approved", "revision_needed"],
  revision_needed: ["review"],
  approved: ["scheduled", "published"],
  scheduled: ["published", "approved"], // Can un-schedule back to approved
  published: ["archived"],
  archived: ["draft"], // Can reactivate archived content
};

// ===========================================
// CONTENT PIPELINE QUERIES
// ===========================================

/**
 * getContentByStatus - Fetch all content grouped by pipeline status for Kanban columns.
 * Returns { columns: Record<string, Content[]> } with each status array sorted by updatedAt desc.
 */
export const getContentByStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allContent = await ctx.db.query("content").collect();

    // Filter by userId - show user's content + legacy unassigned content
    const userContent = allContent.filter(item => item.userId === userId || item.userId === undefined);

    // Initialize columns for all 7 Kanban-relevant statuses
    const columns: Record<string, typeof userContent> = {
      draft: [],
      review: [],
      revision_needed: [],
      approved: [],
      scheduled: [],
      published: [],
      archived: [],
    };

    // Group content by status
    for (const item of userContent) {
      if (columns[item.status]) {
        columns[item.status].push(item);
      }
    }

    // Sort each column by updatedAt descending (most recently updated first)
    for (const status of Object.keys(columns)) {
      columns[status].sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return { columns };
  },
});

/**
 * getContentStatusCounts - Count items per status + total.
 * Used for column headers and pipeline summary stats.
 */
export const getContentStatusCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allContent = await ctx.db.query("content").collect();

    // Filter by userId - show user's content + legacy unassigned content
    const userContent = allContent.filter(item => item.userId === userId || item.userId === undefined);

    const counts = {
      draft: 0,
      review: 0,
      revision_needed: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
      total: userContent.length,
    };

    for (const item of userContent) {
      if (item.status in counts) {
        counts[item.status as keyof Omit<typeof counts, "total">]++;
      }
    }

    return counts;
  },
});

/**
 * getScheduledContent - Fetch content with status "scheduled" sorted by scheduledFor asc.
 * Uses the by_status index for efficiency. Returns array of scheduled items
 * for the "Contenido Programado" scheduled content view.
 */
export const getScheduledContent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    const scheduledItems = await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    // Filter by userId - show user's content + legacy unassigned content
    const userScheduledItems = scheduledItems.filter(item => item.userId === userId || item.userId === undefined);

    // Sort by scheduledFor ascending (soonest first)
    userScheduledItems.sort((a, b) => {
      const aTime = a.scheduledFor ?? Infinity;
      const bTime = b.scheduledFor ?? Infinity;
      return aTime - bTime;
    });

    // Return relevant fields for the scheduled content view
    return userScheduledItems.map((item) => ({
      _id: item._id,
      contentId: item.contentId,
      title: item.title,
      type: item.type,
      scheduledFor: item.scheduledFor,
      createdAt: item.createdAt,
      metadata: item.metadata,
    }));
  },
});

// ===========================================
// CONTENT PIPELINE MUTATIONS
// ===========================================

/**
 * moveContent - Generic validated transition.
 * Accepts any from/to pair that exists in ALLOWED_TRANSITIONS.
 */
export const moveContent = mutation({
  args: {
    id: v.id("content"),
    toStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedTargets || !allowedTargets.includes(args.toStatus)) {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> ${args.toStatus}`
      );
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.toStatus,
      updatedAt: now,
    };

    // If transitioning to published, also set publishedAt
    if (args.toStatus === "published") {
      updates.publishedAt = now;
    }

    await ctx.db.patch(args.id, updates);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.status_changed",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: args.toStatus },
      timestamp: now,
    });

    return args.id;
  },
});

/**
 * moveContentToReview - Validates content is "draft" or "revision_needed" before transitioning to "review".
 */
export const moveContentToReview = mutation({
  args: {
    id: v.id("content"),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    if (currentStatus !== "draft" && currentStatus !== "revision_needed") {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> review`
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "review",
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.moved_to_review",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: "review" },
      timestamp: now,
    });

    return args.id;
  },
});

/**
 * approveContent - Validates content is "review" before transitioning to "approved".
 * Optionally sets approvedBy field.
 */
export const approveContent = mutation({
  args: {
    id: v.id("content"),
    approvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    if (currentStatus !== "review") {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> approved`
      );
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: "approved",
      updatedAt: now,
    };

    if (args.approvedBy) {
      updates.approvedBy = args.approvedBy;
    }

    await ctx.db.patch(args.id, updates);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.approved",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: {
        from: currentStatus,
        to: "approved",
        approvedBy: args.approvedBy ?? null,
      },
      timestamp: now,
    });

    return args.id;
  },
});

/**
 * rejectContent - Validates content is "review" before transitioning to "revision_needed".
 */
export const rejectContent = mutation({
  args: {
    id: v.id("content"),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    if (currentStatus !== "review") {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> revision_needed`
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "revision_needed",
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.rejected",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: "revision_needed" },
      timestamp: now,
    });

    return args.id;
  },
});

/**
 * scheduleContent - Validates content is "approved" and scheduledFor is in the future.
 * Transitions to "scheduled" and sets the scheduledFor field.
 */
export const scheduleContent = mutation({
  args: {
    id: v.id("content"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    if (currentStatus !== "approved") {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> scheduled`
      );
    }

    // Validate scheduledFor is in the future
    const now = Date.now();
    if (args.scheduledFor <= now) {
      throw new Error(
        "La fecha de programacion debe ser en el futuro"
      );
    }

    await ctx.db.patch(args.id, {
      status: "scheduled",
      scheduledFor: args.scheduledFor,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.scheduled",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: {
        from: currentStatus,
        to: "scheduled",
        scheduledFor: args.scheduledFor,
      },
      timestamp: now,
    });

    return args.id;
  },
});

/**
 * publishContent - Validates content is "approved" or "scheduled" before publishing.
 * Sets publishedAt timestamp and optionally publishedUrl.
 */
export const publishContent = mutation({
  args: {
    id: v.id("content"),
    publishedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const currentStatus = content.status;
    if (currentStatus !== "approved" && currentStatus !== "scheduled") {
      throw new Error(
        `Transicion no permitida: ${currentStatus} -> published`
      );
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    };

    if (args.publishedUrl) {
      updates.publishedUrl = args.publishedUrl;
    }

    await ctx.db.patch(args.id, updates);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.published",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: {
        from: currentStatus,
        to: "published",
        publishedUrl: args.publishedUrl ?? null,
      },
      timestamp: now,
    });

    return args.id;
  },
});
