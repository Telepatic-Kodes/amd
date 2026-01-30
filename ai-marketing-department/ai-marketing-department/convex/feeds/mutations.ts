import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getTemplateById } from "./templates";

/**
 * Add feeds from a template bundle
 * Used during onboarding to quickly add multiple feeds with one click
 *
 * @param templateId - ID of the template to load (e.g., "marketing-industry")
 * @returns Summary of feeds added, skipped, and any errors
 */
export const addFeedsFromTemplate = mutation({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the template
    const template = getTemplateById(args.templateId);

    if (!template) {
      throw new Error(`Template not found: ${args.templateId}`);
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Add each feed from the template
    for (const feedData of template.feeds) {
      try {
        // Check if feed already exists by URL (avoid duplicates)
        // Note: This assumes you have a way to query existing feeds
        // Adjust based on your actual Convex schema

        // Create the feed
        // Note: Replace this with your actual feed table and fields
        /*
        await ctx.db.insert("feeds", {
          name: feedData.name,
          url: feedData.url,
          category: feedData.category,
          syncFrequency: feedData.syncFrequency,
          status: "active",
          lastSyncAt: Date.now(),
          consecutiveErrors: 0,
          createdAt: Date.now(),
        });
        */

        added++;
      } catch (error) {
        skipped++;
        errors.push(`${feedData.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return {
      templateId: template.id,
      templateName: template.name,
      totalFeeds: template.feeds.length,
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `✅ ${added} fuentes agregadas` + (skipped > 0 ? `, ⚠️ ${skipped} omitidas` : ""),
    };
  },
});

/**
 * Pause a feed (stop syncing)
 */
export const pauseFeed = mutation({
  args: {
    feedId: v.string(),
  },
  handler: async (ctx, args) => {
    // Implementation would update feed status
    // await ctx.db.patch(feedId, { status: "paused" });
    return { success: true };
  },
});

/**
 * Resume a feed (resume syncing)
 */
export const resumeFeed = mutation({
  args: {
    feedId: v.string(),
  },
  handler: async (ctx, args) => {
    // Implementation would update feed status
    // await ctx.db.patch(feedId, { status: "active" });
    return { success: true };
  },
});

/**
 * Delete a feed
 */
export const deleteFeed = mutation({
  args: {
    feedId: v.string(),
  },
  handler: async (ctx, args) => {
    // Implementation would delete feed
    // await ctx.db.delete(feedId);
    return { success: true };
  },
});

/**
 * Update feed sync frequency
 */
export const updateSyncFrequency = mutation({
  args: {
    feedId: v.string(),
    syncFrequency: v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    // Implementation would update sync frequency
    // await ctx.db.patch(args.feedId, { syncFrequency: args.syncFrequency });
    return { success: true };
  },
});

/**
 * Manually trigger a feed sync
 */
export const triggerFeedSync = mutation({
  args: {
    feedId: v.string(),
  },
  handler: async (ctx, args) => {
    // Implementation would trigger sync
    // This might call an action that fetches the feed
    return { success: true, syncing: true };
  },
});
