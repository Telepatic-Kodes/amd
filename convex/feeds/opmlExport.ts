/**
 * OPML Export Action
 *
 * Queries all feeds and generates OPML 2.0 XML for download.
 *
 * @module convex/feeds/opmlExport
 */

import { v } from 'convex/values';
import { internalAction, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { generateOPML } from './utils/opmlGenerator';

/**
 * Export all feeds as OPML 2.0 XML string.
 * Visibility: internalAction — called by public wrapper exportOPML.
 */
export const exportAsOPML = internalAction({
  args: {
    title: v.optional(v.string()),
    categoryFilter: v.optional(v.string()),
    statusFilter: v.optional(
      v.union(v.literal('active'), v.literal('paused'), v.literal('error'))
    ),
  },
  handler: async (ctx, args): Promise<{
    xml: string;
    feedCount: number;
    categories: string[];
  }> => {
    // 1. Query all feeds
    let feeds = await ctx.runQuery(internal.feeds.queries.listFeedsForExport, {});

    // 2. Apply optional filters
    if (args.categoryFilter) {
      feeds = feeds.filter((f: any) => f.category === args.categoryFilter);
    }
    if (args.statusFilter) {
      feeds = feeds.filter((f: any) => f.status === args.statusFilter);
    }

    // 3. Generate OPML XML
    const title = args.title || `AMD Feed Export - ${new Date().toISOString().split('T')[0]}`;
    const opmlXml = generateOPML(feeds, title);

    console.log(`[opmlExport] Exported ${feeds.length} feeds as OPML`);

    return {
      xml: opmlXml,
      feedCount: feeds.length,
      categories: [...new Set(feeds.map((f: any) => f.category))] as string[],
    };
  },
});

/**
 * Public wrapper for OPML export — callable from dashboard/UI.
 */
export const exportOPML = action({
  args: {
    title: v.optional(v.string()),
    categoryFilter: v.optional(v.string()),
    statusFilter: v.optional(
      v.union(v.literal('active'), v.literal('paused'), v.literal('error'))
    ),
  },
  handler: async (ctx, args): Promise<{
    xml: string;
    feedCount: number;
    categories: string[];
  }> => {
    return await ctx.runAction(internal.feeds.opmlExport.exportAsOPML, args);
  },
});
