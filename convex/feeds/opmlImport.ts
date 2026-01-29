/**
 * OPML Import Action
 *
 * Accepts OPML XML content, parses it, validates feeds,
 * and batch-inserts them using existing feed schema.
 *
 * @module convex/feeds/opmlImport
 */

import { v } from 'convex/values';
import { internalAction, internalMutation, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { parseOPML, validateOPMLFeeds } from './utils/opmlParser';

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  feedsAdded: number;
  feedsSkipped: number;
  feedsInvalid: number;
  duplicatesInFile: number;
  errors: string[];
  addedFeeds: Array<{ name: string; url: string }>;
}

/**
 * Import feeds from OPML XML content
 */
export const importFromOPML = internalAction({
  args: {
    opmlContent: v.string(),
    defaultCategory: v.optional(v.string()),
    defaultSyncFrequency: v.optional(
      v.union(v.literal('hourly'), v.literal('daily'), v.literal('weekly'))
    ),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    const { opmlContent, defaultCategory, defaultSyncFrequency } = args;
    const errors: string[] = [];
    const addedFeeds: Array<{ name: string; url: string }> = [];

    // 1. Parse OPML
    const parsed = parseOPML(opmlContent);
    errors.push(...parsed.errors);

    if (parsed.feeds.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        feedsAdded: 0,
        feedsSkipped: 0,
        feedsInvalid: 0,
        duplicatesInFile: 0,
        errors: ['No feeds found in OPML content'],
        addedFeeds: [],
      };
    }

    // 2. Validate
    const validation = validateOPMLFeeds(parsed.feeds);
    const feedsInvalid = validation.invalid.length;
    const duplicatesInFile = validation.duplicateUrls.length;

    for (const inv of validation.invalid) {
      errors.push(`Invalid: ${inv.feed.xmlUrl} - ${inv.reason}`);
    }

    // 3. Batch insert valid feeds (batches of 10 for Convex transaction limits)
    let feedsAdded = 0;
    let feedsSkipped = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < validation.valid.length; i += BATCH_SIZE) {
      const batch = validation.valid.slice(i, i + BATCH_SIZE);

      const result = await ctx.runMutation(internal.feeds.opmlImport.batchInsertFeeds, {
        feeds: batch.map((f) => ({
          url: f.xmlUrl,
          name: f.title,
          category: f.category || defaultCategory || 'imported',
          syncFrequency: defaultSyncFrequency || 'daily',
        })),
      });

      feedsAdded += result.added;
      feedsSkipped += result.skipped;
      errors.push(...result.errors);

      for (const name of result.addedNames) {
        const feed = batch.find((f) => f.title === name);
        if (feed) addedFeeds.push({ name: feed.title, url: feed.xmlUrl });
      }
    }

    console.log(
      `[opmlImport] Imported ${feedsAdded} feeds, skipped ${feedsSkipped}, ` +
      `invalid ${feedsInvalid}, duplicates ${duplicatesInFile}`
    );

    return {
      success: feedsAdded > 0,
      totalParsed: parsed.feeds.length,
      feedsAdded,
      feedsSkipped,
      feedsInvalid,
      duplicatesInFile,
      errors,
      addedFeeds,
    };
  },
});

/**
 * Batch insert feeds (mutation for transactional safety)
 */
export const batchInsertFeeds = internalMutation({
  args: {
    feeds: v.array(
      v.object({
        url: v.string(),
        name: v.string(),
        category: v.string(),
        syncFrequency: v.union(
          v.literal('hourly'),
          v.literal('daily'),
          v.literal('weekly')
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];
    const addedNames: string[] = [];

    for (const feed of args.feeds) {
      try {
        const existing = await ctx.db
          .query('feeds')
          .withIndex('by_url', (q) => q.eq('url', feed.url))
          .first();

        if (existing) {
          skipped++;
          continue;
        }

        await ctx.db.insert('feeds', {
          feedId: crypto.randomUUID(),
          url: feed.url,
          name: feed.name,
          category: feed.category,
          status: 'active',
          syncFrequency: feed.syncFrequency,
          consecutiveErrors: 0,
          createdAt: now,
          updatedAt: now,
        });

        added++;
        addedNames.push(feed.name);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to add ${feed.url}: ${msg}`);
      }
    }

    return { added, skipped, errors, addedNames };
  },
});

/**
 * Public wrapper for OPML import — callable from dashboard/UI.
 * Delegates to internalAction importFromOPML.
 */
export const importOPML = action({
  args: {
    opmlContent: v.string(),
    defaultCategory: v.optional(v.string()),
    defaultSyncFrequency: v.optional(
      v.union(v.literal('hourly'), v.literal('daily'), v.literal('weekly'))
    ),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    return await ctx.runAction(internal.feeds.opmlImport.importFromOPML, args);
  },
});
