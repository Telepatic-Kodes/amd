/**
 * Feed Storage Mutations
 *
 * Provides mutations for storing feed items with deduplication,
 * updating feed health, and logging sync operations.
 *
 * @module convex/feeds/storeFeedItems
 * @see SYNC-02 requirement for composite key deduplication
 * @see SYNC-06 requirement for health tracking
 * @see STOR-03 requirement for sync logging
 * @see STOR-05 requirement for deduplication lookups
 */

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

/**
 * Maximum consecutive errors before feed status becomes "error"
 */
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Stores feed items with content hash deduplication
 *
 * For each item:
 * 1. Check if contentHash already exists in feedItems table
 * 2. If not exists, insert the item
 * 3. Track counts for added vs skipped items
 *
 * @param feedId - ID of the parent feed
 * @param items - Array of normalized items with contentHash
 * @returns Object with itemsAdded and itemsSkipped counts
 */
export const storeFeedItems = internalMutation({
  args: {
    feedId: v.id('feeds'),
    items: v.array(
      v.object({
        title: v.string(),
        link: v.string(),
        guid: v.union(v.string(), v.null()),
        content: v.union(v.string(), v.null()),
        summary: v.union(v.string(), v.null()),
        author: v.union(v.string(), v.null()),
        publishedAt: v.union(v.number(), v.null()),
        categories: v.array(v.string()),
        contentHash: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { feedId, items } = args;
    const now = Date.now();

    let itemsAdded = 0;
    let itemsSkipped = 0;

    for (const item of items) {
      // Check for existing item by contentHash (STOR-05)
      const existing = await ctx.db
        .query('feedItems')
        .withIndex('by_contentHash', (q) => q.eq('contentHash', item.contentHash))
        .first();

      if (existing) {
        itemsSkipped++;
        continue;
      }

      // Insert new item (STOR-04)
      await ctx.db.insert('feedItems', {
        feedId,
        contentHash: item.contentHash,
        guid: item.guid ?? undefined,
        title: item.title,
        link: item.link,
        content: item.content ?? undefined,
        summary: item.summary ?? undefined,
        author: item.author ?? undefined,
        publishedAt: item.publishedAt ?? undefined,
        categories: item.categories,
        createdAt: now,
        updatedAt: now,
      });

      itemsAdded++;
    }

    return { itemsAdded, itemsSkipped };
  },
});

/**
 * Updates feed health status after sync attempt
 *
 * On success:
 * - Updates lastSyncAt to current time
 * - Resets consecutiveErrors to 0
 * - Clears lastErrorMessage
 *
 * On failure:
 * - Increments consecutiveErrors
 * - Sets lastErrorMessage
 * - Changes status to "error" after MAX_CONSECUTIVE_ERRORS
 *
 * @param feedId - ID of the feed to update
 * @param success - Whether the sync was successful
 * @param errorMessage - Error message if sync failed
 */
export const updateFeedHealth = internalMutation({
  args: {
    feedId: v.id('feeds'),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { feedId, success, errorMessage } = args;
    const now = Date.now();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      return;
    }

    if (success) {
      await ctx.db.patch(feedId, {
        lastSyncAt: now,
        consecutiveErrors: 0,
        lastErrorMessage: undefined,
        updatedAt: now,
      });
    } else {
      const newErrorCount = feed.consecutiveErrors + 1;
      const newStatus =
        newErrorCount >= MAX_CONSECUTIVE_ERRORS ? 'error' : feed.status;

      await ctx.db.patch(feedId, {
        consecutiveErrors: newErrorCount,
        lastErrorMessage: errorMessage,
        status: newStatus,
        updatedAt: now,
      });
    }
  },
});

/**
 * Logs a sync execution to feedSyncLog table
 *
 * Records sync metrics for debugging and monitoring:
 * - Items found, added, skipped
 * - Duration
 * - Status (success/partial/failed)
 * - Error message if failed
 *
 * @param feedId - ID of the synced feed
 * @param status - Sync outcome
 * @param itemsFound - Total items in feed
 * @param itemsAdded - New items stored
 * @param itemsSkipped - Duplicates skipped
 * @param duration - Sync duration in ms
 * @param errorMessage - Error details if failed
 */
/**
 * Updates HTTP cache headers for conditional GET optimization
 */
export const updateHttpCacheHeaders = internalMutation({
  args: {
    feedId: v.id('feeds'),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    incrementNotModified: v.optional(v.boolean()),
    resetNotModified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { feedId, etag, lastModified, incrementNotModified, resetNotModified } = args;
    const feed = await ctx.db.get(feedId);
    if (!feed) return;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (etag !== undefined) patch.lastETag = etag;
    if (lastModified !== undefined) patch.lastModified = lastModified;

    if (incrementNotModified) {
      patch.consecutiveNotModified = (feed.consecutiveNotModified ?? 0) + 1;
    }
    if (resetNotModified) {
      patch.consecutiveNotModified = 0;
    }

    await ctx.db.patch(feedId, patch);
  },
});

export const logSync = internalMutation({
  args: {
    feedId: v.id('feeds'),
    status: v.union(
      v.literal('success'),
      v.literal('partial'),
      v.literal('failed')
    ),
    itemsFound: v.number(),
    itemsAdded: v.number(),
    itemsSkipped: v.number(),
    duration: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('feedSyncLog', {
      feedId: args.feedId,
      syncedAt: Date.now(),
      status: args.status,
      itemsFound: args.itemsFound,
      itemsAdded: args.itemsAdded,
      itemsSkipped: args.itemsSkipped,
      duration: args.duration,
      errorMessage: args.errorMessage,
    });
  },
});
