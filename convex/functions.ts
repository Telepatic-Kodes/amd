import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireAuth, getUserId } from "./lib/auth";
import { requireRole, getUserRole, canTransitionContent } from "./lib/permissions";
import { createVersionSnapshot, logContentAction } from "./contentVersions";

// ===========================================
// AGENT QUERIES
// ===========================================

export const getAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

export const getAgentById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listAgents = query({
  args: {
    department: v.optional(v.string()),
    status: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("agents");

    if (args.department) {
      q = q.withIndex("by_department", (q: any) => q.eq("department", args.department as any));
    } else if (args.status) {
      q = q.withIndex("by_status", (q: any) => q.eq("status", args.status as any));
    } else if (args.role) {
      q = q.withIndex("by_role", (q: any) => q.eq("role", args.role as any));
    }

    return await q.collect();
  },
});

export const getAgentHierarchy = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const subordinates = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("reportsTo"), args.agentId))
      .collect();

    const superior = agent.reportsTo ? await ctx.db.get(agent.reportsTo) : null;

    return {
      agent,
      superior,
      subordinates,
    };
  },
});

// ===========================================
// AGENT MUTATIONS
// ===========================================

export const createAgent = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    description: v.string(),
    department: v.union(
      v.literal("leadership"),
      v.literal("content"),
      v.literal("social"),
      v.literal("demandgen"),
      v.literal("seo"),
      v.literal("brand"),
      v.literal("ops")
    ),
    role: v.union(v.literal("cmo"), v.literal("director"), v.literal("specialist")),
    config: v.object({
      systemPrompt: v.string(),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
      tools: v.optional(v.array(v.string())),
    }),
    triggers: v.array(v.string()),
    reportsTo: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentId = await ctx.db.insert("agents", {
      ...args,
      triggers: args.triggers as any[],
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Log de auditoría
    await ctx.db.insert("auditLog", {
      action: "agent.created",
      entityType: "agent",
      entityId: args.agentId,
      performedBy: "system",
      metadata: { name: args.name, department: args.department },
      timestamp: now,
    });

    return agentId;
  },
});

export const updateAgentStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error"),
      v.literal("maintenance")
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    const previousStatus = agent.status;

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      action: "agent.status_changed",
      entityType: "agent",
      entityId: agent.agentId,
      performedBy: "system",
      changes: { from: previousStatus, to: args.status },
      timestamp: Date.now(),
    });
  },
});

export const updateAgentConfig = mutation({
  args: {
    id: v.id("agents"),
    config: v.object({
      systemPrompt: v.optional(v.string()),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      tools: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    const newConfig = { ...agent.config, ...args.config };

    await ctx.db.patch(args.id, {
      config: newConfig,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Actualizar el modelo de todos los agentes a la vez
 * Útil para cambiar todos a Max Plan (Opus 4.5)
 */
export const upgradeAllAgentsModel = mutation({
  args: {
    model: v.string(),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let agents;

    if (args.department) {
      agents = await ctx.db
        .query("agents")
        .withIndex("by_department", (q) => q.eq("department", args.department as any))
        .collect();
    } else {
      agents = await ctx.db.query("agents").collect();
    }

    const now = Date.now();
    let updated = 0;

    for (const agent of agents) {
      await ctx.db.patch(agent._id, {
        config: { ...agent.config, model: args.model },
        updatedAt: now,
      });
      updated++;
    }

    // Log de auditoría
    await ctx.db.insert("auditLog", {
      action: "agents.model_upgraded",
      entityType: "agents",
      entityId: args.department || "all",
      performedBy: "system",
      metadata: {
        model: args.model,
        agentsUpdated: updated,
        department: args.department || "all"
      },
      timestamp: now,
    });

    return {
      success: true,
      updated,
      model: args.model
    };
  },
});

// ===========================================
// TASK QUERIES
// ===========================================

export const getTask = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
  },
});

export const listTasks = query({
  args: {
    agentId: v.optional(v.id("agents")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let q: any = ctx.db.query("tasks");

    if (args.agentId) {
      q = q.withIndex("by_agent", (q: any) => q.eq("agentId", args.agentId!));
    } else if (args.status) {
      q = q.withIndex("by_status", (q: any) => q.eq("status", args.status as any));
    }

    q = q.order("desc");

    const results = args.limit ? await q.take(args.limit) : await q.collect();

    // Filter by userId - show user's tasks + legacy unassigned tasks
    return results.filter((item: any) => item.userId === userId || item.userId === undefined);
  },
});

export const getPendingTasks = query({
  args: { agentId: v.optional(v.id("agents")) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let results;
    if (args.agentId) {
      results = await ctx.db
        .query("tasks")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .filter((q) =>
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "queued"))
        )
        .collect();
    } else {
      results = await ctx.db
        .query("tasks")
        .filter((q) =>
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "queued"))
        )
        .collect();
    }

    // Filter by userId - show user's tasks + legacy unassigned tasks
    return results.filter(item => item.userId === userId || item.userId === undefined);
  },
});

// ===========================================
// TASK MUTATIONS
// ===========================================

export const createTask = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    agentId: v.id("agents"),
    assignedBy: v.optional(v.id("agents")),
    input: v.any(),
    parentTaskId: v.optional(v.id("tasks")),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    const taskId = `task_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const id = await ctx.db.insert("tasks", {
      taskId,
      title: args.title,
      type: args.type,
      priority: args.priority,
      status: args.scheduledFor ? "queued" : "pending",
      agentId: args.agentId,
      assignedBy: args.assignedBy,
      input: args.input,
      parentTaskId: args.parentTaskId,
      retryCount: 0,
      maxRetries: 3,
      scheduledFor: args.scheduledFor,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // Si hay tarea padre, actualizar sus childTaskIds
    if (args.parentTaskId) {
      const parentTask = await ctx.db.get(args.parentTaskId);
      if (parentTask) {
        const childIds = parentTask.childTaskIds || [];
        await ctx.db.patch(args.parentTaskId, {
          childTaskIds: [...childIds, id],
          updatedAt: now,
        });
      }
    }

    return { id, taskId };
  },
});

export const updateTaskStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("queued"),
      v.literal("running"),
      v.literal("waiting_review"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    output: v.optional(v.any()),
    error: v.optional(
      v.object({
        message: v.string(),
        code: v.optional(v.string()),
        stack: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "running" && !task.startedAt) {
      updates.startedAt = now;
    }

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = now;
    }

    if (args.output !== undefined) {
      updates.output = args.output;
    }

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    await ctx.db.patch(args.id, updates);

    // Dispatch webhook events for agent execution completion/failure
    if (args.status === "completed") {
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "agent.execution_completed",
        payload: JSON.stringify({
          taskId: args.id,
          agentId: task.agentId,
          type: task.type,
          completedAt: now,
        }),
      });
    } else if (args.status === "failed") {
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "agent.execution_failed",
        payload: JSON.stringify({
          taskId: args.id,
          agentId: task.agentId,
          type: task.type,
          error: args.error?.message,
          failedAt: now,
        }),
      });
    }
  },
});

export const retryTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    if (task.retryCount >= task.maxRetries) {
      throw new Error("Max retries exceeded");
    }

    await ctx.db.patch(args.id, {
      status: "pending",
      retryCount: task.retryCount + 1,
      error: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const getTaskById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const incrementRetry = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.id, {
      retryCount: task.retryCount + 1,
      status: "pending" as const,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// EXECUTION MUTATIONS
// ===========================================

export const logExecution = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    attempt: v.number(),
    status: v.union(v.literal("success"), v.literal("failure")),
    llmCalls: v.number(),
    tokensUsed: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    duration: v.number(),
    cost: v.number(),
    steps: v.optional(
      v.array(
        v.object({
          name: v.string(),
          duration: v.number(),
          tokensUsed: v.optional(v.number()),
        })
      )
    ),
    error: v.optional(v.string()),
    feedItemsUsed: v.optional(v.array(v.id("feedItems"))), // Feed items referenced during execution (Phase 3)
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("executions", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// ===========================================
// HANDOFF MUTATIONS
// ===========================================

export const createHandoff = mutation({
  args: {
    fromAgent: v.id("agents"),
    toAgent: v.id("agents"),
    taskId: v.id("tasks"),
    reason: v.string(),
    payload: v.any(),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("handoffs", {
      ...args,
      status: "pending",
      timestamp: Date.now(),
    });
  },
});

export const updateHandoffStatus = mutation({
  args: {
    id: v.id("handoffs"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: any = { status: args.status };

    if (args.status === "accepted") {
      updates.acceptedAt = now;
    } else if (args.status === "completed") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.id, updates);
  },
});

// ===========================================
// CONTENT QUERIES & MUTATIONS
// ===========================================

export const getContent = query({
  args: { contentId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("content")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .first();
  },
});

export const listContent = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    createdBy: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let q: any = ctx.db.query("content");

    // Always prefer brandProfileId index when available
    if (args.brandProfileId) {
      q = q.withIndex("by_brandProfileId", (q: any) =>
        q.eq("brandProfileId", args.brandProfileId)
      );
    } else if (args.type && args.status) {
      q = q.withIndex("by_type_status", (q: any) =>
        q.eq("type", args.type as any).eq("status", args.status as any)
      );
    } else if (args.type) {
      q = q.withIndex("by_type", (q: any) => q.eq("type", args.type as any));
    } else if (args.status) {
      q = q.withIndex("by_status", (q: any) => q.eq("status", args.status as any));
    } else if (args.createdBy) {
      q = q.withIndex("by_createdBy", (q: any) => q.eq("createdBy", args.createdBy!));
    }

    q = q.order("desc");

    let results = args.limit ? await q.take(args.limit) : await q.collect();

    // When using brandProfileId index, apply type/status filters in memory
    if (args.brandProfileId) {
      if (args.type) {
        results = results.filter((item: any) => item.type === args.type);
      }
      if (args.status) {
        results = results.filter((item: any) => item.status === args.status);
      }
    }

    // Filter by userId - show user's content + legacy unassigned content
    return results.filter((item: any) => item.userId === userId || item.userId === undefined);
  },
});

export const getContentById = query({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createContent = mutation({
  args: {
    type: v.union(
      v.literal("blog"),
      v.literal("social_linkedin"),
      v.literal("social_twitter"),
      v.literal("social_instagram"),
      v.literal("social_tiktok"),
      v.literal("email"),
      v.literal("newsletter"),
      v.literal("ad_copy"),
      v.literal("landing_page"),
      v.literal("whitepaper"),
      v.literal("case_study"),
      v.literal("video_script")
    ),
    title: v.string(),
    body: v.string(),
    summary: v.optional(v.string()),
    metadata: v.object({
      wordCount: v.optional(v.number()),
      readingTime: v.optional(v.number()),
      targetKeywords: v.optional(v.array(v.string())),
      targetAudience: v.optional(v.string()),
      tone: v.optional(v.string()),
      cta: v.optional(v.string()),
      hashtags: v.optional(v.array(v.string())),
    }),
    seo: v.optional(
      v.object({
        metaTitle: v.string(),
        metaDescription: v.string(),
        slug: v.string(),
        canonicalUrl: v.optional(v.string()),
      })
    ),
    createdBy: v.union(v.id("agents"), v.literal("system")),
    sourceTaskId: v.optional(v.id("tasks")),
    sourceTemplateId: v.optional(v.string()),
    parentContentId: v.optional(v.id("content")),
    brandProfileId: v.optional(v.id("brandProfiles")),
    // Framework metadata (Content Pyramid / RACE / TAYA / Hero-Hub-Hygiene)
    contentTier: v.optional(v.union(v.literal("hero"), v.literal("hub"), v.literal("hygiene"))),
    pillarId: v.optional(v.id("contentPillars")),
    funnelStage: v.optional(v.union(v.literal("reach"), v.literal("act"), v.literal("convert"), v.literal("engage"))),
    tayaCategory: v.optional(v.union(v.literal("cost"), v.literal("problems"), v.literal("comparisons"), v.literal("reviews"), v.literal("best"))),
  },
  handler: async (ctx, args) => {
    // RBAC Guard: Only editors and above can create content
    await requireRole(ctx, "content:create");

    const userId = await getUserId(ctx);
    const now = Date.now();
    const contentId = `content_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Auto-detect brandProfileId from user's active profile if not provided
    let resolvedBrandProfileId = args.brandProfileId;
    if (!resolvedBrandProfileId) {
      const profile = await ctx.db
        .query("brandProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (profile) {
        resolvedBrandProfileId = profile._id;
      }
    }

    const newContentId = await ctx.db.insert("content", {
      contentId,
      ...args,
      userId,
      ...(resolvedBrandProfileId ? { brandProfileId: resolvedBrandProfileId } : {}),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Create version snapshot and audit log
    await createVersionSnapshot(ctx, newContentId, "created", "Contenido creado");
    await logContentAction(ctx, newContentId, "created");

    return newContentId;
  },
});

export const updateContentStatus = mutation({
  args: {
    id: v.id("content"),
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("revision_needed"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("archived")
    ),
    reviewedBy: v.optional(v.id("agents")),
    approvedBy: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    publishedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) throw new Error("Contenido no encontrado");

    // RBAC Guard: Check role-based transition permission
    const role = await getUserRole(ctx);
    const canTransition = canTransitionContent(role, content.status as any, args.status as any);
    if (!canTransition) {
      throw new Error(`No tienes permiso para cambiar el estado a ${args.status}.`);
    }

    // Secondary guard: Ownership check (backward compatibility)
    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const now = Date.now();
    const oldStatus = content.status;
    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.reviewedBy) updates.reviewedBy = args.reviewedBy;
    if (args.approvedBy) updates.approvedBy = args.approvedBy;
    if (args.scheduledFor) updates.scheduledFor = args.scheduledFor;
    if (args.publishedUrl) updates.publishedUrl = args.publishedUrl;

    if (args.status === "published") {
      updates.publishedAt = now;
    }

    await ctx.db.patch(args.id, updates);

    // Create version snapshot with Spanish summary
    const summary = `Estado cambiado de ${oldStatus} a ${args.status}`;
    await createVersionSnapshot(ctx, args.id, "status_change", summary);

    // Dispatch webhook events
    if (args.status === "published") {
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "content.published",
        payload: JSON.stringify({
          contentId: args.id,
          title: content.title,
          type: content.type,
          publishedAt: now,
        }),
      });
    } else if (oldStatus !== args.status) {
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "content.status_changed",
        payload: JSON.stringify({
          contentId: args.id,
          title: content.title,
          from: oldStatus,
          to: args.status,
        }),
      });
    }

    // P2: Notify relevant users about state change
    if (oldStatus !== args.status) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications._notifyContentStateChange,
        {
          contentId: args.id,
          contentTitle: content.title,
          fromStatus: oldStatus,
          toStatus: args.status,
          triggeredByUserId: userId,
        }
      );
    }

    // Log audit trail with appropriate action
    const statusActionMap: Record<string, string> = {
      review: "sent_to_review",
      approved: "approved",
      published: "published",
      archived: "archived",
      scheduled: "scheduled",
      revision_needed: "rejected",
      draft: "reverted_to_draft",
    };
    const action = statusActionMap[args.status] || "status_changed";
    await logContentAction(ctx, args.id, action, { from: oldStatus, to: args.status });
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("content"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    summary: v.optional(v.string()),
    seo: v.optional(
      v.object({
        metaTitle: v.string(),
        metaDescription: v.string(),
        slug: v.string(),
        canonicalUrl: v.optional(v.string()),
      })
    ),
    metadata: v.optional(
      v.object({
        targetKeywords: v.optional(v.array(v.string())),
        tone: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
      })
    ),
    assets: v.optional(
      v.array(
        v.object({
          mediaId: v.optional(v.id("mediaAssets")),
          type: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("document"),
            v.literal("presentation")
          ),
          url: v.string(),
          alt: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // RBAC Guard: Only editors and above can edit content
    await requireRole(ctx, "content:edit");

    const { id, ...updates } = args;
    const content = await ctx.db.get(id);
    if (!content) throw new Error("Contenido no encontrado");

    // Secondary guard: Ownership check (backward compatibility)
    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    const finalUpdates: any = { updatedAt: Date.now() };

    if (updates.title) finalUpdates.title = updates.title;
    if (updates.summary !== undefined) finalUpdates.summary = updates.summary;

    if (updates.body) {
      finalUpdates.body = updates.body;
      // Recalculate wordCount and readingTime
      const wordCount = updates.body.split(/\s+/).filter((w: string) => w.length > 0).length;
      finalUpdates.metadata = {
        ...content.metadata,
        wordCount,
        readingTime: Math.ceil(wordCount / 200), // 200 words/min
      };
    }

    if (updates.seo) {
      finalUpdates.seo = { ...content.seo, ...updates.seo };
    }

    if (updates.metadata) {
      finalUpdates.metadata = {
        ...finalUpdates.metadata,
        ...updates.metadata,
      };
    }

    if (updates.assets !== undefined) {
      finalUpdates.assets = updates.assets;
    }

    await ctx.db.patch(id, finalUpdates);

    // Create version snapshot and audit log
    const fieldsChanged = Object.keys(updates).filter(k => k !== "updatedAt");
    await createVersionSnapshot(ctx, id, "edited", "Contenido editado");
    await logContentAction(ctx, id, "edited", { fields: fieldsChanged });
  },
});

// ===========================================
// METRICS QUERIES
// ===========================================

export const getAgentMetrics = query({
  args: {
    agentId: v.id("agents"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const executions = await ctx.db
      .query("executions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit || 100);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit || 100);

    // Calcular métricas
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.status === "success").length;
    const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed.total, 0);
    const totalCost = executions.reduce((sum, e) => sum + e.cost, 0);
    const avgDuration =
      executions.length > 0
        ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
        : 0;

    return {
      agent,
      metrics: {
        totalExecutions,
        successfulExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        totalTokens,
        totalCost,
        avgDuration,
        tasksCompleted: tasks.filter((t) => t.status === "completed").length,
        tasksFailed: tasks.filter((t) => t.status === "failed").length,
      },
      recentExecutions: executions.slice(0, 10),
    };
  },
});

export const getDashboardStats = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    const agents = await ctx.db.query("agents").collect();
    const allTasks = await ctx.db.query("tasks").collect();
    const allContent = await ctx.db.query("content").collect();

    // Filter by userId - show user's data + legacy unassigned data
    const tasks = allTasks.filter(t => t.userId === userId || t.userId === undefined);
    const content = allContent.filter(c => c.userId === userId || c.userId === undefined);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      agents: {
        total: agents.length,
        active: agents.filter((a) => a.status === "active").length,
        paused: agents.filter((a) => a.status === "paused").length,
        error: agents.filter((a) => a.status === "error").length,
        byDepartment: agents.reduce((acc, a) => {
          acc[a.department] = (acc[a.department] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending" || t.status === "queued").length,
        running: tasks.filter((t) => t.status === "running").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        failed: tasks.filter((t) => t.status === "failed").length,
        last24h: tasks.filter((t) => t.createdAt > oneDayAgo).length,
        lastWeek: tasks.filter((t) => t.createdAt > oneWeekAgo).length,
      },
      content: {
        total: content.length,
        draft: content.filter((c) => c.status === "draft").length,
        published: content.filter((c) => c.status === "published").length,
        byType: content.reduce((acc, c) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  },
});

// ===========================================
// CAMPAIGN QUERIES & MUTATIONS
// ===========================================

export const listCampaigns = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let q: any = ctx.db.query("campaigns");

    if (args.type) {
      q = q.withIndex("by_type", (q: any) => q.eq("type", args.type as any));
    } else if (args.status) {
      q = q.withIndex("by_status", (q: any) => q.eq("status", args.status as any));
    }

    q = q.order("desc");

    const results = args.limit ? await q.take(args.limit) : await q.collect();

    // Filter by userId - show user's campaigns + legacy unassigned campaigns
    return results.filter((item: any) => item.userId === userId || item.userId === undefined);
  },
});

export const getCampaign = query({
  args: { campaignId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("campaigns")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .first();
  },
});

// ===========================================
// SETTINGS QUERIES & MUTATIONS
// ===========================================

export const listSettings = query({
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        description: args.description,
        updatedAt: Date.now(),
      });
    }
  },
});

export const resetAllSettings = mutation({
  handler: async (ctx) => {
    const allSettings = await ctx.db.query("settings").collect();
    for (const setting of allSettings) {
      await ctx.db.delete(setting._id);
    }
    return { deleted: allSettings.length };
  },
});

/**
 * Nuclear reset: deletes ALL data from ALL tables.
 * Used for fresh client onboarding.
 */
export const clearAllData = mutation({
  handler: async (ctx) => {
    const tables = [
      "agents", "tasks", "executions", "handoffs", "content", "campaigns",
      "keywords", "prompts", "metrics", "settings", "auditLog",
      "feeds", "feedItems", "feedSyncLog", "alertDigests",
      "onboarding", "knowledgeBases", "kbDocuments", "kbSections",
      "linkedinConnections", "linkedinPublishLog", "linkedinEngagement",
      "twitterConnections", "twitterPublishLog",
      "instagramConnections", "instagramPublishLog",
      "userGuidance", "contentVersions", "users",
      "brandProfiles", "brandSources", "brandSuggestions",
      "contentAnalyses", "kbAgentAccess", "reports", "reportSettings",
      "topicSuggestions", "platformApprovals", "marketingStrategies",
    ] as const;

    let total = 0;
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      total += rows.length;
    }
    return { deleted: total };
  },
});

// ===========================================
// ANALYTICS QUERIES
// ===========================================

export const getAnalyticsOverview = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    const executions = await ctx.db.query("executions").order("desc").take(100);
    const allTasks = await ctx.db.query("tasks").order("desc").take(100);
    const agents = await ctx.db.query("agents").collect();

    // Filter tasks by userId
    const tasks = allTasks.filter(t => t.userId === userId || t.userId === undefined);

    // Calculate totals
    const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed.total, 0);
    const totalCost = executions.reduce((sum, e) => sum + e.cost, 0);
    const avgDuration = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
      : 0;
    const successRate = executions.length > 0
      ? (executions.filter((e) => e.status === "success").length / executions.length) * 100
      : 0;

    // Tasks by day (last 7 days)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentTasks = tasks.filter((t) => t.createdAt > sevenDaysAgo);

    const tasksByDay: Record<string, { completed: number; failed: number; total: number }> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      tasksByDay[dateStr] = { completed: 0, failed: 0, total: 0 };
    }

    recentTasks.forEach((task) => {
      const dateStr = new Date(task.createdAt).toISOString().split("T")[0];
      if (tasksByDay[dateStr]) {
        tasksByDay[dateStr].total++;
        if (task.status === "completed") tasksByDay[dateStr].completed++;
        if (task.status === "failed") tasksByDay[dateStr].failed++;
      }
    });

    // Top agents by executions
    const agentExecutions: Record<string, { count: number; success: number; tokens: number }> = {};
    executions.forEach((exec) => {
      const agentId = exec.agentId.toString();
      if (!agentExecutions[agentId]) {
        agentExecutions[agentId] = { count: 0, success: 0, tokens: 0 };
      }
      agentExecutions[agentId].count++;
      if (exec.status === "success") agentExecutions[agentId].success++;
      agentExecutions[agentId].tokens += exec.tokensUsed.total;
    });

    const topAgents = Object.entries(agentExecutions)
      .map(([agentId, stats]) => {
        const agent = agents.find((a) => a._id.toString() === agentId);
        return {
          agentId,
          name: agent?.name || "Unknown",
          ...stats,
          successRate: stats.count > 0 ? (stats.success / stats.count) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      overview: {
        totalExecutions: executions.length,
        totalTokens,
        totalCost,
        avgDuration,
        successRate,
      },
      tasksByDay,
      topAgents,
      recentExecutions: executions.slice(0, 10),
    };
  },
});
