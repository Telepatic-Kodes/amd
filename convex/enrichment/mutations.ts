/**
 * Enrichment Mutations
 *
 * Internal mutations for storing AI enrichment results on feed items.
 * Called by enrichment actions after Claude processing completes.
 *
 * @module convex/enrichment/mutations
 */

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

/**
 * Stores enrichment data for a feed item
 *
 * Updates the feedItem with AI-generated topics, sentiment, summary,
 * and relevance score. Sets processed: true and records processedAt timestamp.
 * Clears any previous processingError.
 *
 * @param itemId - ID of the feedItem to update
 * @param topics - Array of topic tags extracted by AI
 * @param sentiment - Content sentiment (positive/neutral/negative)
 * @param aiSummary - AI-generated summary
 * @param relevanceScore - 0-100 marketing relevance score
 * @param tokensUsed - Number of tokens consumed (for tracking)
 */
export const storeEnrichment = internalMutation({
  args: {
    itemId: v.id('feedItems'),
    topics: v.array(v.string()),
    sentiment: v.union(
      v.literal('positive'),
      v.literal('neutral'),
      v.literal('negative')
    ),
    aiSummary: v.string(),
    relevanceScore: v.number(),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const { itemId, topics, sentiment, aiSummary, relevanceScore } = args;
    const now = Date.now();

    // Verify item exists
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error(`Feed item not found: ${itemId}`);
    }

    // Update item with enrichment data
    await ctx.db.patch(itemId, {
      topics,
      sentiment,
      aiSummary,
      relevanceScore,
      processed: true,
      processedAt: now,
      processingError: undefined, // Clear any previous error
      updatedAt: now,
    });

    console.log(
      `[enrichment] Stored enrichment for item ${itemId}: ` +
        `topics=${topics.length}, sentiment=${sentiment}, relevance=${relevanceScore}`
    );

    return { success: true, itemId };
  },
});

/**
 * Marks a feed item as failed enrichment
 *
 * Sets processed: false to distinguish from successful processing
 * (processed: true) and unprocessed items (processed: undefined).
 * This prevents infinite retry loops on items that consistently fail.
 *
 * @param itemId - ID of the feedItem that failed
 * @param error - Error message describing the failure
 */
export const markFailed = internalMutation({
  args: {
    itemId: v.id('feedItems'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const { itemId, error } = args;
    const now = Date.now();

    // Verify item exists
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error(`Feed item not found: ${itemId}`);
    }

    // Mark as failed - processed: false distinguishes from success (true) and unprocessed (undefined)
    await ctx.db.patch(itemId, {
      processed: false,
      processedAt: now,
      processingError: error,
      updatedAt: now,
    });

    console.log(`[enrichment] Marked item ${itemId} as failed: ${error}`);

    return { success: true, itemId };
  },
});
