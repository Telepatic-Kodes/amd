import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===========================================
// MUTATIONS
// ===========================================

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createAsset = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("document"),
      v.literal("presentation")
    ),
    mimeType: v.string(),
    fileSize: v.number(),
    tags: v.optional(v.array(v.string())),
    folder: v.optional(v.string()),
    alt: v.optional(v.string()),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get storage URL");

    return await ctx.db.insert("mediaAssets", {
      name: args.name,
      storageId: args.storageId,
      url,
      type: args.type,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      tags: args.tags,
      folder: args.folder,
      alt: args.alt,
      uploadedBy: args.uploadedBy ?? "user",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAsset = mutation({
  args: {
    id: v.id("mediaAssets"),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    folder: v.optional(v.string()),
    alt: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const asset = await ctx.db.get(id);
    if (!asset) throw new Error("Asset not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.folder !== undefined) patch.folder = updates.folder;
    if (updates.alt !== undefined) patch.alt = updates.alt;
    if (updates.description !== undefined) patch.description = updates.description;

    await ctx.db.patch(id, patch);
  },
});

export const deleteAsset = mutation({
  args: { id: v.id("mediaAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");

    if (asset.usedIn && asset.usedIn.length > 0) {
      throw new Error(
        `Cannot delete: asset is used in ${asset.usedIn.length} content item(s)`
      );
    }

    await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(args.id);
  },
});

export const bulkDelete = mutation({
  args: { ids: v.array(v.id("mediaAssets")) },
  handler: async (ctx, args) => {
    let deleted = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const asset = await ctx.db.get(id);
      if (!asset) { skipped++; continue; }
      if (asset.usedIn && asset.usedIn.length > 0) { skipped++; continue; }

      await ctx.storage.delete(asset.storageId);
      await ctx.db.delete(id);
      deleted++;
    }

    return { deleted, skipped };
  },
});

// ===========================================
// USAGE TRACKING
// ===========================================

export const addUsage = mutation({
  args: {
    mediaId: v.id("mediaAssets"),
    contentId: v.id("content"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.mediaId);
    if (!asset) return;
    const usedIn = asset.usedIn ?? [];
    if (!usedIn.includes(args.contentId)) {
      await ctx.db.patch(args.mediaId, {
        usedIn: [...usedIn, args.contentId],
        updatedAt: Date.now(),
      });
    }
  },
});

export const removeUsage = mutation({
  args: {
    mediaId: v.id("mediaAssets"),
    contentId: v.id("content"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.mediaId);
    if (!asset) return;
    const usedIn = (asset.usedIn ?? []).filter((id) => id !== args.contentId);
    await ctx.db.patch(args.mediaId, { usedIn, updatedAt: Date.now() });
  },
});

// ===========================================
// QUERIES
// ===========================================

export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("audio"),
        v.literal("document"),
        v.literal("presentation")
      )
    ),
    folder: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.limit ?? 50;

    if (args.search && args.search.trim()) {
      const searchQuery = ctx.db
        .query("mediaAssets")
        .withSearchIndex("search_name", (q) => {
          let s = q.search("name", args.search!);
          if (args.type) s = s.eq("type", args.type);
          if (args.folder) s = s.eq("folder", args.folder);
          return s;
        });

      return await searchQuery.take(pageSize);
    }

    if (args.type) {
      return await ctx.db
        .query("mediaAssets")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(pageSize);
    }

    if (args.folder) {
      return await ctx.db
        .query("mediaAssets")
        .withIndex("by_folder", (q) => q.eq("folder", args.folder!))
        .order("desc")
        .take(pageSize);
    }

    return await ctx.db
      .query("mediaAssets")
      .withIndex("by_createdAt")
      .order("desc")
      .take(pageSize);
  },
});

export const getById = query({
  args: { id: v.id("mediaAssets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getFolders = query({
  handler: async (ctx) => {
    const assets = await ctx.db.query("mediaAssets").collect();
    const folders = new Set<string>();
    for (const asset of assets) {
      if (asset.folder) folders.add(asset.folder);
    }
    return Array.from(folders).sort();
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const assets = await ctx.db.query("mediaAssets").collect();

    const byType: Record<string, number> = {
      image: 0, video: 0, audio: 0, document: 0, presentation: 0,
    };
    let totalSize = 0;

    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
      totalSize += asset.fileSize;
    }

    return {
      total: assets.length,
      byType,
      totalSize,
    };
  },
});
