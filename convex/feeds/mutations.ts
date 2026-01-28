/**
 * Feed CRUD Mutations
 *
 * Public mutations for feed management from the dashboard UI.
 * Supports FEED-01 (add), FEED-03 (pause/resume), FEED-04 (delete), FEED-05 (update).
 *
 * @module convex/feeds/mutations
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';

/**
 * Adds a new RSS/Atom feed to the system
 *
 * Validates URL format and checks for duplicates before inserting.
 *
 * @param url - Feed URL (must start with http:// or https://)
 * @param name - Human-readable name for the feed
 * @param category - Category: "industry", "competitor", "technical", etc.
 * @param syncFrequency - How often to sync: "hourly", "daily", "weekly"
 * @returns Created feed document
 * @throws Error if URL is invalid or already exists
 */
export const addFeed = mutation({
  args: {
    url: v.string(),
    name: v.string(),
    category: v.string(),
    syncFrequency: v.union(
      v.literal('hourly'),
      v.literal('daily'),
      v.literal('weekly')
    ),
  },
  handler: async (ctx, args) => {
    const { url, name, category, syncFrequency } = args;
    const now = Date.now();

    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Feed URL must start with http:// or https://');
    }

    // Check for duplicate URL using by_url index
    const existingFeed = await ctx.db
      .query('feeds')
      .withIndex('by_url', (q) => q.eq('url', url))
      .first();

    if (existingFeed) {
      throw new Error(`Feed with URL "${url}" already exists`);
    }

    // Generate UUID for feedId
    const feedId = crypto.randomUUID();

    // Insert new feed
    const id = await ctx.db.insert('feeds', {
      feedId,
      url,
      name,
      category,
      status: 'active',
      syncFrequency,
      consecutiveErrors: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Return created feed document
    return await ctx.db.get(id);
  },
});

/**
 * Updates feed metadata
 *
 * Only patches provided fields, preserving existing values.
 *
 * @param feedId - ID of the feed to update
 * @param name - New name (optional)
 * @param category - New category (optional)
 * @param syncFrequency - New sync frequency (optional)
 * @returns Updated feed document
 */
export const updateFeed = mutation({
  args: {
    feedId: v.id('feeds'),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    syncFrequency: v.optional(
      v.union(
        v.literal('hourly'),
        v.literal('daily'),
        v.literal('weekly')
      )
    ),
  },
  handler: async (ctx, args) => {
    const { feedId, name, category, syncFrequency } = args;
    const now = Date.now();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    // Build patch object with only provided fields
    const patch: Record<string, unknown> = { updatedAt: now };
    if (name !== undefined) patch.name = name;
    if (category !== undefined) patch.category = category;
    if (syncFrequency !== undefined) patch.syncFrequency = syncFrequency;

    await ctx.db.patch(feedId, patch);

    return await ctx.db.get(feedId);
  },
});

/**
 * Deletes a feed and all associated items and sync logs
 *
 * Cascading delete:
 * 1. Delete all feedItems with this feedId
 * 2. Delete all feedSyncLog entries with this feedId
 * 3. Delete the feed itself
 *
 * @param feedId - ID of the feed to delete
 * @returns Object with success status and count of deleted items
 */
export const deleteFeed = mutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const { feedId } = args;

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    // Delete all feedItems for this feed
    const feedItems = await ctx.db
      .query('feedItems')
      .withIndex('by_feedId', (q) => q.eq('feedId', feedId))
      .collect();

    for (const item of feedItems) {
      await ctx.db.delete(item._id);
    }

    // Delete all feedSyncLog entries for this feed
    const syncLogs = await ctx.db
      .query('feedSyncLog')
      .withIndex('by_feedId', (q) => q.eq('feedId', feedId))
      .collect();

    for (const log of syncLogs) {
      await ctx.db.delete(log._id);
    }

    // Delete the feed itself
    await ctx.db.delete(feedId);

    return {
      success: true,
      deletedItems: feedItems.length,
      deletedLogs: syncLogs.length,
    };
  },
});

/**
 * Pauses a feed (stops automatic syncing)
 *
 * @param feedId - ID of the feed to pause
 * @returns Updated feed document
 */
export const pauseFeed = mutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const { feedId } = args;
    const now = Date.now();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    await ctx.db.patch(feedId, {
      status: 'paused',
      updatedAt: now,
    });

    return await ctx.db.get(feedId);
  },
});

/**
 * Resumes a paused feed (re-enables automatic syncing)
 *
 * Also resets consecutiveErrors to 0, allowing recovery from error state.
 *
 * @param feedId - ID of the feed to resume
 * @returns Updated feed document
 */
export const resumeFeed = mutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const { feedId } = args;
    const now = Date.now();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    await ctx.db.patch(feedId, {
      status: 'active',
      consecutiveErrors: 0,
      updatedAt: now,
    });

    return await ctx.db.get(feedId);
  },
});
