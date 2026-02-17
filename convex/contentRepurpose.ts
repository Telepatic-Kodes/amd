import { v } from "convex/values";
import { internalAction, query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ===========================================
// CONTENT REPURPOSING ENGINE
//
// Takes existing content and uses AI to generate adapted versions
// for different channels. Unlike recycleContent (naive copy),
// this leverages generateMultiChannelContent to produce
// platform-optimized variations with proper format/tone/length.
// ===========================================

// Channel display names for prompt context
const CHANNEL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  instagram: "Instagram",
  tiktok: "TikTok",
  blog: "Blog",
  email: "Email Newsletter",
  youtube: "YouTube",
};

/**
 * _getContentById — Internal query used by the repurpose action.
 */
export const _getContentById = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

/**
 * _linkRepurposedContent — Internal mutation to patch generated content
 * with parent linkage and framework metadata from the source.
 */
export const _linkRepurposedContent = internalMutation({
  args: {
    contentId: v.id("content"),
    parentContentId: v.id("content"),
    pillarId: v.optional(v.id("contentPillars")),
    contentTier: v.optional(v.union(v.literal("hero"), v.literal("hub"), v.literal("hygiene"))),
    funnelStage: v.optional(v.union(v.literal("reach"), v.literal("act"), v.literal("convert"), v.literal("engage"))),
    tayaCategory: v.optional(v.union(v.literal("cost"), v.literal("problems"), v.literal("comparisons"), v.literal("reviews"), v.literal("best"))),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      parentContentId: args.parentContentId,
      updatedAt: Date.now(),
    };
    if (args.pillarId) patch.pillarId = args.pillarId;
    if (args.contentTier) patch.contentTier = args.contentTier;
    if (args.funnelStage) patch.funnelStage = args.funnelStage;
    if (args.tayaCategory) patch.tayaCategory = args.tayaCategory;

    await ctx.db.patch(args.contentId, patch);
  },
});

/**
 * _markAsRepurposed — Internal mutation to increment recycleCount on source.
 */
export const _markAsRepurposed = internalMutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) return;
    await ctx.db.patch(args.contentId, {
      recycledAt: Date.now(),
      recycleCount: (content.recycleCount || 0) + 1,
      updatedAt: Date.now(),
    });
  },
});

/**
 * repurposeContent — AI-powered content repurposing action.
 * Fetches source content, builds repurposing instructions, and
 * delegates to generateMultiChannelContent for parallel generation.
 * Then patches each result with parentContentId + framework metadata.
 */
export const repurposeContent = internalAction({
  args: {
    sourceContentId: v.id("content"),
    targetChannels: v.array(v.string()),
    additionalInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    sourceContentId: Id<"content">;
    totalChannels: number;
    successful: number;
    failed: number;
    results: Array<{ channel: string; contentId: string | null; success: boolean; error?: string }>;
  }> => {
    // 1. Fetch source content
    const source = await ctx.runQuery(internal.contentRepurpose._getContentById, {
      contentId: args.sourceContentId,
    });
    if (!source) throw new Error("Source content not found");

    const sourceLabel = source.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // 2. Build custom instructions with full body as context
    const customInstructions = `REPURPOSE this existing ${sourceLabel} content for the target platform.
Adapt format, length, tone, and structure for the target platform's best practices.
Keep the core message but optimize for the platform.

=== SOURCE CONTENT ===
Title: ${source.title}
Type: ${sourceLabel}

${source.body}
=== END SOURCE ===

${args.additionalInstructions || ""}`;

    // 3. Generate via multi-channel engine
    const result: {
      topic: string;
      totalChannels: number;
      successful: number;
      failed: number;
      results: Array<{ channel: string; contentId: string | null; success: boolean; error?: string }>;
    } = await ctx.runAction(api.multiChannelGenerate.generateMultiChannelContent, {
      topic: source.title.replace(/^\[.*?\]\s*/, ""), // Strip channel prefix if present
      channels: args.targetChannels,
      customInstructions,
    });

    // 4. Patch generated content with parentContentId + framework metadata
    for (const r of result.results) {
      if (r.success && r.contentId) {
        try {
          await ctx.runMutation(internal.contentRepurpose._linkRepurposedContent, {
            contentId: r.contentId as Id<"content">,
            parentContentId: args.sourceContentId,
            pillarId: source.pillarId,
            contentTier: source.contentTier,
            funnelStage: source.funnelStage,
            tayaCategory: source.tayaCategory,
          });
        } catch {
          // Non-critical — content was created, linking failed
        }
      }
    }

    // 5. Increment recycleCount on source
    await ctx.runMutation(internal.contentRepurpose._markAsRepurposed, {
      contentId: args.sourceContentId,
    });

    return {
      sourceContentId: args.sourceContentId,
      totalChannels: args.targetChannels.length,
      successful: result.successful,
      failed: result.failed,
      results: result.results,
    };
  },
});

// ===========================================
// PUBLIC QUERIES & MUTATIONS — For the frontend
// ===========================================

/**
 * getRepurposedVersions — Returns all content derived from a given source.
 */
export const getRepurposedVersions = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("content").collect();
    return all
      .filter((c) => c.parentContentId === args.contentId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        type: c.type,
        status: c.status,
        createdAt: c.createdAt,
        body: c.body,
      }));
  },
});

/**
 * triggerRepurpose — Thin mutation wrapper that schedules the repurposeContent action.
 * In Convex, actions can't be called directly from the client —
 * mutations schedule them via ctx.scheduler.
 */
export const triggerRepurpose = mutation({
  args: {
    sourceContentId: v.id("content"),
    targetChannels: v.array(v.string()),
    additionalInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate source exists
    const source = await ctx.db.get(args.sourceContentId);
    if (!source) throw new Error("Source content not found");

    // Validate channels
    const validChannels = ["linkedin", "twitter", "instagram", "tiktok", "blog", "email", "youtube"];
    for (const ch of args.targetChannels) {
      if (!validChannels.includes(ch)) {
        throw new Error(`Invalid channel: ${ch}`);
      }
    }

    // Schedule the action
    await ctx.scheduler.runAfter(0, internal.contentRepurpose.repurposeContent, {
      sourceContentId: args.sourceContentId,
      targetChannels: args.targetChannels,
      additionalInstructions: args.additionalInstructions,
    });

    return { scheduled: true, channels: args.targetChannels.length };
  },
});
