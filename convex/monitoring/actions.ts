/**
 * Brand Monitoring Actions
 *
 * Cron-triggered alert digest generation
 */

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { ALERT_THRESHOLDS } from "./config";

/**
 * INTERNAL: Generate daily alert digest
 * Called by cron at 8:00 AM UTC
 */
export const generateAlertDigest = internalAction({
  args: {
    since: v.optional(v.number()),  // If provided, process items since this timestamp
    until: v.optional(v.number()),  // If provided, process items until this timestamp
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Calculate time window (default: last 24 hours)
      const now = Date.now();
      const until = args.until || now;
      const since = args.since || (until - 24 * 60 * 60 * 1000);

      console.log(`[Alert Digest] Generating digest for ${new Date(since).toISOString()} to ${new Date(until).toISOString()}`);

      // Get feed items with brand/competitor mentions
      const candidates: any[] = await ctx.runQuery(internal.monitoring.queries.getAlertCandidates, {
        since,
        until,
        minRelevance: ALERT_THRESHOLDS.minRelevanceScore,
      });

      console.log(`[Alert Digest] Found ${candidates.length} items with mentions`);

      if (candidates.length === 0) {
        console.log("[Alert Digest] No items to digest, skipping");
        return { skipped: true, reason: "no_items" as const };
      }

      // Sort by relevance score (descending)
      const sorted: any[] = candidates.sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      // Limit to max digest items
      const items: any[] = sorted.slice(0, ALERT_THRESHOLDS.maxDigestItems).map((item: any) => ({
        feedItemId: item._id,
        title: item.title,
        relevanceScore: item.relevanceScore || 0,
        brandMentions: item.brandMentions || [],
        competitorMentions: item.competitorMentions || [],
        sentiment: item.sentiment || "neutral",
      }));

      // Calculate statistics
      const stats = {
        totalItems: items.length,
        highRelevance: items.filter((i: any) => i.relevanceScore >= ALERT_THRESHOLDS.highRelevanceThreshold).length,
        brandMentionCount: items.reduce((sum: number, i: any) => sum + i.brandMentions.length, 0),
        competitorMentionCount: items.reduce((sum: number, i: any) => sum + i.competitorMentions.length, 0),
      };

      console.log(`[Alert Digest] Stats: ${JSON.stringify(stats)}`);

      // Store digest
      const digestId: any = await ctx.runMutation(internal.monitoring.mutations.storeAlertDigest, {
        period: { start: since, end: until },
        items,
        stats,
        summary: undefined, // Could add AI summary here in future
      });

      console.log(`[Alert Digest] Digest ${digestId} created successfully`);

      return {
        success: true,
        digestId,
        itemsProcessed: items.length,
        stats,
      };
    } catch (error) {
      console.error("[Alert Digest] Error generating digest:", error);
      throw error;
    }
  },
});

/**
 * PUBLIC: Manually trigger alert digest generation (for testing)
 */
export const triggerAlertDigest = action({
  args: {
    since: v.optional(v.number()),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runAction(internal.monitoring.actions.generateAlertDigest, {
      since: args.since,
      until: args.until,
    });
  },
});
