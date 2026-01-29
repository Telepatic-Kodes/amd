import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a single KB document by string documentId
 */
export const getDocumentByStringId = query({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kbDocuments")
      .filter((q) => q.eq(q.field("documentId"), args.documentId))
      .first();
  },
});

/**
 * Get a KB section by content hash for deduplication
 */
export const getSectionByHash = query({
  args: {
    kbId: v.id("knowledgeBases"),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kbSections")
      .withIndex("by_contentHash", (q) =>
        q.eq("contentHash", args.contentHash)
      )
      .filter((q) => q.eq(q.field("kbId"), args.kbId))
      .first();
  },
});

/**
 * Get all sections for a KB
 */
export const getSectionsByKB = query({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kbSections")
      .withIndex("by_kbId", (q) => q.eq("kbId", args.kbId))
      .collect();
  },
});

/**
 * Get knowledge base by ID
 */
export const getKnowledgeBase = query({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.kbId);
  },
});

/**
 * List all KBs (optionally filtered by status)
 */
export const listKnowledgeBases = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("knowledgeBases")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    }

    return await ctx.db.query("knowledgeBases").collect();
  },
});
