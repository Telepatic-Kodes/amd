import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get KBs visible to an agent's department
 */
export const getKBForAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return [];
    }

    // Get active KBs visible to this department or all
    const kbs = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return kbs.filter(
      (kb) =>
        kb.visibility.includes("all") || kb.visibility.includes(agent.department)
    );
  },
});

/**
 * Search KB sections by keywords with token efficiency
 * Returns max 5 sections to control token usage, enriched with KB metadata
 */
export const searchKBSections = query({
  args: {
    kbIds: v.array(v.id("knowledgeBases")),
    keywords: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    if (!args.keywords || args.kbIds.length === 0) {
      return [];
    }

    // Use full-text search index
    const searchResults = await ctx.db
      .query("kbSections")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.keywords!)
      )
      .take(limit * 2); // Get more candidates for filtering

    // Filter by KB IDs
    const filtered = searchResults.filter((section) =>
      args.kbIds.includes(section.kbId)
    );

    // Sort by relevance score if available, then by processed status
    const sorted = filtered.sort((a, b) => {
      const aScore = a.relevanceScore || 0;
      const bScore = b.relevanceScore || 0;
      if (aScore !== bScore) return bScore - aScore;

      // Prefer processed sections
      if (a.processed && !b.processed) return -1;
      if (!a.processed && b.processed) return 1;

      return 0;
    });

    // Enrich with KB metadata
    const limited = sorted.slice(0, limit);
    return await Promise.all(
      limited.map(async (section) => {
        const kb = await ctx.db.get(section.kbId);
        return {
          _id: section._id,
          title: section.title,
          content: section.content,
          kbName: kb?.name || "Unknown KB",
          kbCategory: kb?.category || "unknown",
        };
      })
    );
  },
});

/**
 * Get all sections for a KB with metadata enrichment
 */
export const getKBSectionsWithMetadata = query({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.kbId);
    if (!kb) {
      return [];
    }

    const sections = await ctx.db
      .query("kbSections")
      .withIndex("by_kbId", (q) => q.eq("kbId", args.kbId))
      .collect();

    // Enrich with KB metadata
    return sections.map((section) => ({
      ...section,
      kbName: kb.name,
      kbCategory: kb.category,
      kbDescription: kb.description,
    }));
  },
});

/**
 * Get unprocessed sections for enrichment
 */
export const getUnprocessedSections = query({
  args: {
    kbId: v.optional(v.id("knowledgeBases")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let query = ctx.db
      .query("kbSections")
      .withIndex("by_processed", (q) => q.eq("processed", false));

    if (args.kbId) {
      // Further filter by KB
      query = query.filter((q) => q.eq(q.field("kbId"), args.kbId));
    }

    return await query.take(limit);
  },
});

/**
 * Get KB access statistics for audit trail
 */
export const getKBAccessStats = query({
  args: {
    kbId: v.optional(v.id("knowledgeBases")),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    let results = [];

    if (args.kbId) {
      results = await ctx.db
        .query("kbAgentAccess")
        .withIndex("by_kb", (q) => q.eq("kbId", args.kbId!))
        .collect();
    } else if (args.agentId) {
      results = await ctx.db
        .query("kbAgentAccess")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId!))
        .collect();
    } else {
      results = await ctx.db.query("kbAgentAccess").collect();
    }

    return {
      totalAccesses: results.length,
      uniqueAgents: new Set(results.map((r) => r.agentId.toString())).size,
      uniqueKBs: new Set(results.map((r) => r.kbId.toString())).size,
      mostRecentAccess: Math.max(...results.map((r) => r.accessedAt), 0),
      results,
    };
  },
});
