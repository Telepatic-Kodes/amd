/**
 * Enrichment Orchestration
 *
 * Batch processing orchestrator for AI enrichment.
 * Processes unprocessed feed items in controlled batches,
 * called by cron jobs to enable hands-off background enrichment.
 *
 * @module convex/enrichment/orchestration
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Process a batch of unprocessed feed items through AI enrichment.
 *
 * Called by cron job to incrementally enrich feed items.
 * Processes items sequentially to avoid rate limits.
 *
 * @param batchSize - Number of items to process (default: 10)
 * @returns Counts of processed, failed items and total tokens used
 */
export const processBatch = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    processed: number;
    failed: number;
    totalTokens: number;
  }> => {
    const batchSize = args.batchSize ?? 10;

    // 1. Get unprocessed items (limit to batch size)
    // Query uses by_processed index with eq('processed', undefined)
    // so all items returned are guaranteed to be unprocessed
    const items = await ctx.runQuery(
      internal.enrichment.queries.getUnprocessedItems,
      { limit: batchSize }
    );

    if (items.length === 0) {
      console.log("[enrichment] No unprocessed items found");
      return { processed: 0, failed: 0, totalTokens: 0 };
    }

    console.log(`[enrichment] Processing batch of ${items.length} items`);

    let processed = 0;
    let failed = 0;
    let totalTokens = 0;

    // 2. Process items sequentially (avoid rate limits)
    for (const item of items) {
      try {
        const result = await ctx.runAction(
          internal.enrichment.processItems.enrichFeedItem,
          { itemId: item._id }
        );
        processed++;
        totalTokens += result.tokensUsed;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[enrichment] Failed to enrich item ${item._id}: ${errorMessage}`
        );

        // Mark as failed to prevent infinite retries
        await ctx.runMutation(internal.enrichment.mutations.markFailed, {
          itemId: item._id,
          error: errorMessage,
        });

        failed++;
      }
    }

    console.log(
      `[enrichment] Batch complete: ${processed} processed, ${failed} failed, ${totalTokens} tokens`
    );

    return { processed, failed, totalTokens };
  },
});

/**
 * Manually trigger enrichment processing (for testing/admin).
 *
 * Same as processBatch but exposed for manual invocation.
 * Can be called from Convex dashboard for debugging/testing.
 */
export const triggerEnrichment = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    processed: number;
    failed: number;
    totalTokens: number;
  }> => {
    const batchSize = args.batchSize ?? 10;

    // 1. Get unprocessed items (limit to batch size)
    const items = await ctx.runQuery(
      internal.enrichment.queries.getUnprocessedItems,
      { limit: batchSize }
    );

    if (items.length === 0) {
      console.log("[enrichment] No unprocessed items found");
      return { processed: 0, failed: 0, totalTokens: 0 };
    }

    console.log(
      `[enrichment] Manual trigger: Processing batch of ${items.length} items`
    );

    let processed = 0;
    let failed = 0;
    let totalTokens = 0;

    // 2. Process items sequentially (avoid rate limits)
    for (const item of items) {
      try {
        const result = await ctx.runAction(
          internal.enrichment.processItems.enrichFeedItem,
          { itemId: item._id }
        );
        processed++;
        totalTokens += result.tokensUsed;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[enrichment] Failed to enrich item ${item._id}: ${errorMessage}`
        );

        // Mark as failed to prevent infinite retries
        await ctx.runMutation(internal.enrichment.mutations.markFailed, {
          itemId: item._id,
          error: errorMessage,
        });

        failed++;
      }
    }

    console.log(
      `[enrichment] Manual batch complete: ${processed} processed, ${failed} failed, ${totalTokens} tokens`
    );

    return { processed, failed, totalTokens };
  },
});
