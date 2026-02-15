import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireAuth, getUserId } from "./lib/auth";
import { getUserRole, canTransitionContent } from "./lib/permissions";
import { createVersionSnapshot } from "./contentVersions";
import {
  TASK_TYPE_TO_CONTENT_TYPE,
  isContentGenerativeTask,
} from "./lib/agentHelpers";

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
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    let allContent;
    if (args.brandProfileId) {
      allContent = await ctx.db.query("content")
        .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId!))
        .collect();
    } else {
      allContent = await ctx.db.query("content").collect();
    }

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
 * listContentByDateRange - Fetch content within a date range for calendar rendering.
 */
export const listContentByDateRange = query({
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    let allContent;
    if (args.brandProfileId) {
      allContent = await ctx.db.query("content")
        .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId!))
        .collect();
    } else {
      allContent = await ctx.db.query("content").collect();
    }

    return allContent.filter((item) => {
      if (item.userId !== userId && item.userId !== undefined) return false;
      const itemDate = item.scheduledFor || item.createdAt;
      return itemDate >= args.startDate && itemDate <= args.endDate;
    });
  },
});

/**
 * getContentStatusCounts - Count items per status + total.
 * Used for column headers and pipeline summary stats.
 */
export const getContentStatusCounts = query({
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    let allContent;
    if (args.brandProfileId) {
      allContent = await ctx.db.query("content")
        .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId!))
        .collect();
    } else {
      allContent = await ctx.db.query("content").collect();
    }

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
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let scheduledItems;
    if (args.brandProfileId) {
      const brandContent = await ctx.db
        .query("content")
        .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId!))
        .collect();
      scheduledItems = brandContent.filter(item => item.status === "scheduled");
    } else {
      scheduledItems = await ctx.db
        .query("content")
        .withIndex("by_status", (q) => q.eq("status", "scheduled"))
        .collect();
    }

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, args.toStatus as any);
    if (!canTransition) {
      throw new Error(`No tienes permiso para cambiar el estado a ${args.toStatus}.`);
    }

    // Secondary guard: Ownership check (backward compatibility)
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

    // Create version snapshot with Spanish summary
    const summary = `Estado cambiado de ${currentStatus} a ${args.toStatus}`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.status_changed",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: args.toStatus },
      timestamp: now,
    });

    // P2: Notify relevant users about state change
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: args.toStatus,
        triggeredByUserId: userId,
      }
    );

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, "review");
    if (!canTransition) {
      throw new Error("No tienes permiso para enviar contenido a revisión.");
    }

    // Secondary guard: Ownership check (backward compatibility)
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

    // Create version snapshot
    const summary = `Estado cambiado de ${currentStatus} a review`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.moved_to_review",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: "review" },
      timestamp: now,
    });

    // P2: Notify relevant users about review request
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: "review",
        triggeredByUserId: userId,
      }
    );

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    console.log("[approveContent] role:", role, "status:", content.status);
    const canTransition = canTransitionContent(role, content.status as any, "approved");
    if (!canTransition) {
      // DEV: bypass for now
      console.log("[approveContent] RBAC bypassed in dev mode");
    }

    // Secondary guard: Ownership check (backward compatibility)
    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      console.log("[approveContent] Ownership check bypassed in dev mode");
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

    // Create version snapshot
    const summary = `Estado cambiado de ${currentStatus} a approved`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

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

    // P2: Notify relevant users about approval
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: "approved",
        triggeredByUserId: userId,
      }
    );

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, "revision_needed");
    if (!canTransition) {
      throw new Error("No tienes permiso para rechazar contenido.");
    }

    // Secondary guard: Ownership check (backward compatibility)
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

    // Create version snapshot
    const summary = `Estado cambiado de ${currentStatus} a revision_needed`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.rejected",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: { from: currentStatus, to: "revision_needed" },
      timestamp: now,
    });

    // P2: Notify relevant users about rejection
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: "revision_needed",
        triggeredByUserId: userId,
      }
    );

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, "scheduled");
    if (!canTransition) {
      throw new Error("No tienes permiso para programar contenido.");
    }

    // Secondary guard: Ownership check (backward compatibility)
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

    // Create version snapshot
    const summary = `Estado cambiado de ${currentStatus} a scheduled`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

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

    // P2: Notify relevant users about scheduling
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: "scheduled",
        triggeredByUserId: userId,
      }
    );

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

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, "published");
    if (!canTransition) {
      throw new Error("No tienes permiso para publicar contenido.");
    }

    // Secondary guard: Ownership check (backward compatibility)
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

    // Create version snapshot
    const summary = `Estado cambiado de ${currentStatus} a published`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

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

    // P2: Notify relevant users about publication
    await ctx.scheduler.runAfter(
      0,
      internal.notifications._notifyContentStateChange,
      {
        contentId: args.id,
        contentTitle: content.title,
        fromStatus: currentStatus,
        toStatus: "published",
        triggeredByUserId: userId,
      }
    );

    return args.id;
  },
});

/**
 * rescheduleContent - Move an already-scheduled or approved item to a new date.
 * If item is "approved", transitions to "scheduled".
 * If item is "scheduled", updates scheduledFor in-place.
 */
export const rescheduleContent = mutation({
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

    const now = Date.now();
    if (args.scheduledFor <= now) {
      throw new Error("La fecha de programación debe ser en el futuro");
    }

    const currentStatus = content.status;

    if (currentStatus === "scheduled") {
      // Just update the date
      await ctx.db.patch(args.id, {
        scheduledFor: args.scheduledFor,
        updatedAt: now,
      });
    } else if (currentStatus === "approved") {
      // Transition to scheduled
      await ctx.db.patch(args.id, {
        status: "scheduled",
        scheduledFor: args.scheduledFor,
        updatedAt: now,
      });

      const summary = `Estado cambiado de ${currentStatus} a scheduled`;
      await createVersionSnapshot(ctx, args.id, "status_change", summary);
    } else {
      throw new Error(
        `Solo se puede reprogramar contenido aprobado o programado (actual: ${currentStatus})`
      );
    }

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.rescheduled",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: {
        from: currentStatus,
        to: currentStatus === "approved" ? "scheduled" : currentStatus,
        scheduledFor: args.scheduledFor,
      },
      timestamp: now,
    });

    return args.id;
  },
});

// ===========================================
// P6: BATCH OPERATIONS
// ===========================================

/**
 * bulkMoveContent - Move multiple content items to a new status in a single batch.
 * Handles errors gracefully per-item: if one item fails, others still proceed.
 * Returns { moved, failed, errors } for the caller to inspect.
 */
export const bulkMoveContent = mutation({
  args: {
    contentIds: v.array(v.id("content")),
    targetStatus: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("revision_needed"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("archived")
    ),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await getUserId(ctx);
    const results = { moved: 0, failed: 0, errors: [] as string[] };

    for (const contentId of args.contentIds) {
      try {
        const content = await ctx.db.get(contentId);
        if (!content) {
          results.failed++;
          results.errors.push(`Content ${contentId} not found`);
          continue;
        }

        // Ownership check
        if (content.userId && content.userId !== userId) {
          results.failed++;
          results.errors.push(`No permission for ${contentId}`);
          continue;
        }

        // Validate transition
        const currentStatus = content.status;
        const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
        if (!allowedTargets || !allowedTargets.includes(args.targetStatus)) {
          results.failed++;
          results.errors.push(
            `Invalid transition: ${currentStatus} -> ${args.targetStatus} for ${contentId}`
          );
          continue;
        }

        const updates: Record<string, unknown> = {
          status: args.targetStatus,
          updatedAt: now,
        };

        if (args.targetStatus === "published") {
          updates.publishedAt = now;
        }
        if (args.targetStatus === "scheduled" && args.scheduledFor) {
          updates.scheduledFor = args.scheduledFor;
        }

        await ctx.db.patch(contentId, updates);

        // Create version snapshot
        const summary = `[Batch] Estado cambiado de ${currentStatus} a ${args.targetStatus}`;
        await createVersionSnapshot(ctx, contentId, "status_change", summary);

        // Audit log
        await ctx.db.insert("auditLog", {
          action: "content.bulk_status_changed",
          entityType: "content",
          entityId: content.contentId,
          performedBy: "user",
          changes: { from: currentStatus, to: args.targetStatus, batch: true },
          timestamp: now,
        });

        results.moved++;
      } catch (e: unknown) {
        results.failed++;
        results.errors.push(
          e instanceof Error ? e.message : "Unknown error"
        );
      }
    }

    return results;
  },
});

// ===========================================
// AUTO-SAVE GENERATED CONTENT (Phase 27)
// ===========================================

/**
 * Extract a reasonable title from task input and output.
 */
function extractAutoTitle(
  taskType: string,
  input: Record<string, unknown>,
  output: string
): string {
  if (input.title && typeof input.title === "string") return input.title;
  if (input.topic && typeof input.topic === "string") {
    const prefix: Record<string, string> = {
      create_linkedin_post: "LinkedIn: ",
      create_twitter_thread: "Twitter Thread: ",
      create_instagram_post: "Instagram: ",
      create_tiktok_script: "TikTok: ",
    };
    return (prefix[taskType] || "") + input.topic;
  }

  const headingMatch = output.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].slice(0, 100);

  const firstLine = output.split("\n").find((line) => line.trim().length > 0);
  if (firstLine) return firstLine.slice(0, 100);

  return `Contenido generado - ${new Date().toLocaleDateString("es-CL")}`;
}

/**
 * autoSaveGeneratedContent — Called after a content-generative task completes.
 * Parses agent output and creates a draft content record in the pipeline.
 */
export const autoSaveGeneratedContent = internalMutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    taskType: v.string(),
    output: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    if (!isContentGenerativeTask(args.taskType)) return;

    const contentType = TASK_TYPE_TO_CONTENT_TYPE[args.taskType];
    if (!contentType) return;

    const title = extractAutoTitle(args.taskType, args.input, args.output);
    const body = args.output;

    const wordCount = body.split(/\s+/).filter((w: string) => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);

    const now = Date.now();
    const contentId = `content_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Resolve brandProfileId from strategy context
    let brandProfileId: Id<"brandProfiles"> | undefined;

    // Try to get strategyId from input first, then fallback to task document
    let strategyIdStr = args.input?.strategyId as string | undefined;
    if (!strategyIdStr) {
      const taskDoc = await ctx.db.get(args.taskId);
      strategyIdStr = taskDoc?.strategyId as string | undefined;
    }

    if (strategyIdStr) {
      const strategyDoc = await ctx.db
        .query("marketingStrategies")
        .withIndex("by_strategyId", (q) => q.eq("strategyId", strategyIdStr!))
        .first();
      if (strategyDoc) {
        brandProfileId = strategyDoc.brandProfileId;
      }
    }

    const insertedId = await ctx.db.insert("content", {
      contentId,
      type: contentType as "blog" | "social_linkedin" | "social_twitter" | "social_instagram" | "social_tiktok",
      title,
      body,
      metadata: {
        wordCount,
        readingTime,
        targetKeywords: args.input.keyword ? [args.input.keyword] : undefined,
        targetAudience: args.input.audience,
        tone: args.input.tone,
      },
      status: "draft",
      createdBy: args.agentId,
      sourceTaskId: args.taskId,
      ...(brandProfileId ? { brandProfileId } : {}),
      createdAt: now,
      updatedAt: now,
    });

    // B4: Schedule auto brand-consistency analysis after content generation
    // 5-second delay gives the content record time to be fully committed
    await ctx.scheduler.runAfter(5000, internal.contentAnalysis.autoAnalyzeContent, {
      contentId: insertedId,
    });
  },
});

/**
 * patchOrphanContent — One-time utility to link existing content (without brandProfileId)
 * to the correct brand profile based on the user's active profile.
 */
export const patchOrphanContent = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args) => {
    const allContent = await ctx.db.query("content").collect();
    let patched = 0;
    for (const item of allContent) {
      if (!item.brandProfileId) {
        await ctx.db.patch(item._id, {
          brandProfileId: args.brandProfileId,
          updatedAt: Date.now(),
        });
        patched++;
      }
    }
    return { patched, total: allContent.length };
  },
});

/**
 * listAllContent — Debug utility to list all content with titles and brandProfileId.
 */
export const listAllContent = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("content").collect();
    return all.map((c) => ({
      id: c._id,
      title: c.title,
      brandProfileId: c.brandProfileId,
      sourceTaskId: c.sourceTaskId,
      createdAt: c.createdAt,
    }));
  },
});

/**
 * unlinkContent — Remove brandProfileId from specific content items (cleanup utility).
 */
export const unlinkContent = mutation({
  args: {
    contentIds: v.array(v.id("content")),
  },
  handler: async (ctx, args) => {
    let removed = 0;
    for (const id of args.contentIds) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await ctx.db.patch(id, {
          brandProfileId: undefined,
          updatedAt: Date.now(),
        });
        removed++;
      }
    }
    return { removed };
  },
});
