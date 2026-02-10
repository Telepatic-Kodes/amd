import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ===========================================
// QUERIES
// ===========================================

export const listSources = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandSources")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();
  },
});

export const getSourceStats = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("brandSources")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    return {
      total: sources.length,
      active: sources.filter((s) => s.status === "active").length,
      pending: sources.filter((s) => s.status === "pending" || s.status === "processing").length,
      error: sources.filter((s) => s.status === "error").length,
    };
  },
});

// ===========================================
// INTERNAL QUERIES
// ===========================================

export const _getSource = internalQuery({
  args: { sourceId: v.id("brandSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const addUrlSource = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    url: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("brandSources", {
      brandProfileId: args.brandProfileId,
      name: args.name,
      sourceType: "url",
      url: args.url,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addFeedSource = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    url: v.string(),
    name: v.string(),
    syncFrequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("brandSources", {
      brandProfileId: args.brandProfileId,
      name: args.name,
      sourceType: "feed",
      url: args.url,
      syncFrequency: args.syncFrequency,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addNoteSource = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("brandSources", {
      brandProfileId: args.brandProfileId,
      name: args.name,
      sourceType: "note",
      content: args.content,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addUploadSource = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("brandSources", {
      brandProfileId: args.brandProfileId,
      name: args.name,
      sourceType: "upload",
      storageId: args.storageId,
      fileType: args.fileType,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteSource = mutation({
  args: { sourceId: v.id("brandSources") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    // Delete linked KB document and its sections if present
    if (source.kbDocumentId) {
      const doc = await ctx.db.get(source.kbDocumentId);
      if (doc) {
        const sections = await ctx.db
          .query("kbSections")
          .withIndex("by_documentId", (q) => q.eq("documentId", source.kbDocumentId!))
          .collect();
        for (const section of sections) {
          await ctx.db.delete(section._id);
        }
        await ctx.db.delete(source.kbDocumentId);
      }
    }

    await ctx.db.delete(args.sourceId);
  },
});

export const toggleSourceStatus = mutation({
  args: {
    sourceId: v.id("brandSources"),
    status: v.union(v.literal("paused"), v.literal("active")),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    await ctx.db.patch(args.sourceId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// INTERNAL MUTATIONS
// ===========================================

export const _updateStatus = internalMutation({
  args: {
    sourceId: v.id("brandSources"),
    status: v.union(
      v.literal("pending"), v.literal("processing"),
      v.literal("active"), v.literal("error"), v.literal("paused")
    ),
    kbDocumentId: v.optional(v.id("kbDocuments")),
    sectionsCreated: v.optional(v.number()),
    processingError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.kbDocumentId !== undefined) patch.kbDocumentId = args.kbDocumentId;
    if (args.sectionsCreated !== undefined) patch.sectionsCreated = args.sectionsCreated;
    if (args.processingError !== undefined) patch.processingError = args.processingError;

    await ctx.db.patch(args.sourceId, patch);
  },
});
