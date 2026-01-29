import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new KB section
 */
export const createKBSection = mutation({
  args: {
    sectionId: v.string(),
    kbId: v.id("knowledgeBases"),
    documentId: v.id("kbDocuments"),
    title: v.string(),
    content: v.string(),
    contentHash: v.string(),
    order: v.number(),
    metadata: v.object({
      wordCount: v.number(),
      pageNumbers: v.optional(v.array(v.number())),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kbSections", {
      sectionId: args.sectionId,
      kbId: args.kbId,
      documentId: args.documentId,
      title: args.title,
      content: args.content,
      contentHash: args.contentHash,
      order: args.order,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

/**
 * Log KB access by agent
 */
export const logKBAccess = mutation({
  args: {
    agentId: v.id("agents"),
    kbId: v.id("knowledgeBases"),
    taskId: v.optional(v.id("tasks")),
    sectionsUsed: v.array(v.id("kbSections")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kbAgentAccess", {
      agentId: args.agentId,
      kbId: args.kbId,
      taskId: args.taskId,
      sectionsUsed: args.sectionsUsed,
      accessedAt: Date.now(),
    });
  },
});

/**
 * Create a new knowledge base
 */
export const createKnowledgeBase = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("brand"),
      v.literal("products"),
      v.literal("personas"),
      v.literal("guidelines")
    ),
    visibility: v.array(
      v.union(
        v.literal("all"),
        v.literal("content"),
        v.literal("social"),
        v.literal("seo"),
        v.literal("demandgen"),
        v.literal("brand"),
        v.literal("ops"),
        v.literal("leadership")
      )
    ),
  },
  handler: async (ctx, args) => {
    const kbId = `kb-${args.category}-${uuidv4().slice(0, 8)}`;

    return await ctx.db.insert("knowledgeBases", {
      kbId,
      name: args.name,
      description: args.description,
      category: args.category,
      status: "draft",
      visibility: args.visibility,
      metadata: {
        documentCount: 0,
        totalSizeBytes: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update KB metadata after processing
 */
export const updateKBMetadata = mutation({
  args: {
    kbId: v.id("knowledgeBases"),
    documentCount: v.optional(v.number()),
    totalSizeBytes: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("processing"),
        v.literal("active"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.kbId);
    if (!kb) {
      throw new Error(`KB ${args.kbId} not found`);
    }

    await ctx.db.patch(args.kbId, {
      metadata: {
        documentCount:
          args.documentCount ?? kb.metadata.documentCount,
        totalSizeBytes:
          args.totalSizeBytes ?? kb.metadata.totalSizeBytes,
        lastProcessedAt: Date.now(),
      },
      status: args.status ?? kb.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Activate a KB (make it available to agents)
 */
export const activateKB = mutation({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.kbId);
    if (!kb) {
      throw new Error(`KB ${args.kbId} not found`);
    }

    // Count processed sections
    const sections = await ctx.db
      .query("kbSections")
      .withIndex("by_kbId", (q) => q.eq("kbId", args.kbId))
      .collect();

    const processedSections = sections.filter((s) => s.processed);

    if (processedSections.length === 0) {
      throw new Error("No processed sections available for activation");
    }

    await ctx.db.patch(args.kbId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return kb;
  },
});

/**
 * Archive a KB
 */
export const archiveKB = mutation({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.kbId);
    if (!kb) {
      throw new Error(`KB ${args.kbId} not found`);
    }

    await ctx.db.patch(args.kbId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return kb;
  },
});
