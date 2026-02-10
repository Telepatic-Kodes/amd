import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ===========================================
// HELPERS
// ===========================================

type Platform = "linkedin" | "twitter" | "instagram";

/**
 * Determine which platforms need per-platform approval based on content type.
 * Social-specific types get only their platform; blog/generic gets all 3.
 * Email/newsletter/video_script get none (no per-platform approval).
 */
export function determinePlatforms(contentType: string): Platform[] {
  switch (contentType) {
    case "social_linkedin":
      return ["linkedin"];
    case "social_twitter":
      return ["twitter"];
    case "social_instagram":
      return ["instagram"];
    case "blog":
    case "ad_copy":
    case "landing_page":
    case "whitepaper":
    case "case_study":
      return ["linkedin", "twitter", "instagram"];
    case "email":
    case "newsletter":
    case "video_script":
    case "social_tiktok":
      return [];
    default:
      return ["linkedin", "twitter", "instagram"];
  }
}

// ===========================================
// QUERIES
// ===========================================

export const getApprovals = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("platformApprovals")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const createPlatformApprovals = mutation({
  args: {
    contentId: v.id("content"),
    platforms: v.array(v.union(
      v.literal("linkedin"),
      v.literal("twitter"),
      v.literal("instagram")
    )),
  },
  handler: async (ctx, args) => {
    if (args.platforms.length === 0) return;

    // Check if approvals already exist for this content
    const existing = await ctx.db
      .query("platformApprovals")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    const existingPlatforms = new Set(existing.map((a) => a.platform));
    const now = Date.now();

    for (const platform of args.platforms) {
      if (!existingPlatforms.has(platform)) {
        await ctx.db.insert("platformApprovals", {
          contentId: args.contentId,
          platform,
          status: "pending_review",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const updatePlatformApproval = mutation({
  args: {
    contentId: v.id("content"),
    platform: v.union(
      v.literal("linkedin"),
      v.literal("twitter"),
      v.literal("instagram")
    ),
    status: v.union(
      v.literal("approved"),
      v.literal("revision_needed")
    ),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("platformApprovals")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    const approval = approvals.find((a) => a.platform === args.platform);
    if (!approval) throw new Error(`No approval found for platform ${args.platform}`);

    const now = Date.now();
    await ctx.db.patch(approval._id, {
      status: args.status,
      reviewNote: args.reviewNote,
      reviewedAt: now,
      updatedAt: now,
    });

    // Check if ALL platforms are now approved → auto-transition content to "approved"
    if (args.status === "approved") {
      const updatedApprovals = approvals.map((a) =>
        a.platform === args.platform ? { ...a, status: "approved" as const } : a
      );

      const allApproved = updatedApprovals.every((a) => a.status === "approved");

      if (allApproved) {
        const content = await ctx.db.get(args.contentId);
        if (content && content.status === "review") {
          await ctx.db.patch(args.contentId, {
            status: "approved",
            updatedAt: now,
          });
        }
      }
    }
  },
});

export const approveAllPlatforms = mutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("platformApprovals")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    const now = Date.now();
    for (const approval of approvals) {
      if (approval.status !== "approved") {
        await ctx.db.patch(approval._id, {
          status: "approved",
          reviewedAt: now,
          updatedAt: now,
        });
      }
    }

    // Auto-transition content to approved
    const content = await ctx.db.get(args.contentId);
    if (content && content.status === "review") {
      await ctx.db.patch(args.contentId, {
        status: "approved",
        updatedAt: now,
      });
    }
  },
});

export const resetPlatformApprovals = mutation({
  args: {
    contentId: v.id("content"),
    onlyRevisionNeeded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("platformApprovals")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    const now = Date.now();
    for (const approval of approvals) {
      if (args.onlyRevisionNeeded && approval.status !== "revision_needed") {
        continue;
      }
      await ctx.db.patch(approval._id, {
        status: "pending_review",
        reviewNote: undefined,
        reviewedAt: undefined,
        updatedAt: now,
      });
    }
  },
});
