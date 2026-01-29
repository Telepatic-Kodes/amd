/**
 * Feed Health Analysis Metrics
 *
 * Read-only queries that analyze feed item data to determine
 * whether Phase 6.2 features are justified.
 *
 * Thresholds:
 * - Truncation > 20% => recommend full-text extraction
 * - Cross-feed duplicates > 10% => recommend semantic dedup
 *
 * @module convex/analysis/metrics
 */

import { v } from 'convex/values';
import { internalQuery, query } from '../_generated/server';

// ============================================
// Pure analysis helpers (shared by internal + public queries)
// ============================================

interface TruncationResult {
  sampleSize: number;
  truncatedCount: number;
  fullContentCount: number;
  noContentCount: number;
  truncationRate: number;
  truncationReasons: Record<string, number>;
  recommendation: string;
}

interface DuplicateResult {
  sampleSize: number;
  uniqueTitles: number;
  titleDuplicates: number;
  linkDuplicates: number;
  duplicateRate: number;
  sampleDuplicateTitles: string[];
  recommendation: string;
}

interface StalenessResult {
  totalFeeds: number;
  activeCount: number;
  staleCount: number;
  deadCount: number;
  errorCount: number;
  staleFeeds: Array<{ name: string; url: string; consecutive304s: number }>;
  recommendation: string;
}

function computeTruncation(
  items: Array<{ content?: string | null; summary?: string | null }>
): TruncationResult {
  let truncatedCount = 0;
  let noContentCount = 0;
  let fullContentCount = 0;
  const truncationReasons: Record<string, number> = {};

  for (const item of items) {
    const content = item.content || '';
    const summary = item.summary || '';

    if (!content && !summary) {
      noContentCount++;
      continue;
    }

    const textToCheck = content || summary;
    let isTruncated = false;
    const reasons: string[] = [];

    // Check 1: Very short content (< 200 chars)
    if (textToCheck.length < 200) {
      isTruncated = true;
      reasons.push('short_content');
    }

    // Check 2: Ends with truncation markers
    const trimmed = textToCheck.trim();
    if (
      trimmed.endsWith('...') ||
      trimmed.endsWith('[...]') ||
      trimmed.endsWith('Read more') ||
      trimmed.endsWith('Continue reading') ||
      trimmed.match(/\[&hellip;\]$/) ||
      trimmed.match(/&#8230;$/)
    ) {
      isTruncated = true;
      reasons.push('truncation_marker');
    }

    // Check 3: Content identical to summary (feed only provides excerpt)
    if (content && summary && content.trim() === summary.trim()) {
      isTruncated = true;
      reasons.push('content_equals_summary');
    }

    // Check 4: Word count below threshold (< 50 words)
    const wordCount = textToCheck.split(/\s+/).length;
    if (wordCount < 50) {
      isTruncated = true;
      reasons.push('low_word_count');
    }

    if (isTruncated) {
      truncatedCount++;
      for (const r of reasons) {
        truncationReasons[r] = (truncationReasons[r] || 0) + 1;
      }
    } else {
      fullContentCount++;
    }
  }

  const truncationRate =
    items.length > 0 ? Math.round((truncatedCount / items.length) * 100) : 0;

  return {
    sampleSize: items.length,
    truncatedCount,
    fullContentCount,
    noContentCount,
    truncationRate,
    truncationReasons,
    recommendation:
      truncationRate > 20
        ? 'ENABLE full-text extraction'
        : 'NOT NEEDED',
  };
}

function computeDuplicates(
  items: Array<{ title: string; link: string; feedId: string }>
): DuplicateResult {
  const titleMap = new Map<string, Set<string>>();
  const linkMap = new Map<string, Set<string>>();

  for (const item of items) {
    const normTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!titleMap.has(normTitle)) titleMap.set(normTitle, new Set());
    titleMap.get(normTitle)!.add(item.feedId);

    const normLink = item.link.toLowerCase().replace(/\/+$/, '');
    if (!linkMap.has(normLink)) linkMap.set(normLink, new Set());
    linkMap.get(normLink)!.add(item.feedId);
  }

  let titleDuplicates = 0;
  let linkDuplicates = 0;
  const duplicateTitles: string[] = [];

  for (const [title, feedIds] of titleMap) {
    if (feedIds.size > 1) {
      titleDuplicates++;
      if (duplicateTitles.length < 10) {
        duplicateTitles.push(title);
      }
    }
  }

  for (const [, feedIds] of linkMap) {
    if (feedIds.size > 1) {
      linkDuplicates++;
    }
  }

  const uniqueTitles = titleMap.size;
  const duplicateRate =
    uniqueTitles > 0 ? Math.round((titleDuplicates / uniqueTitles) * 100) : 0;

  return {
    sampleSize: items.length,
    uniqueTitles,
    titleDuplicates,
    linkDuplicates,
    duplicateRate,
    sampleDuplicateTitles: duplicateTitles,
    recommendation:
      duplicateRate > 10
        ? 'ENABLE semantic deduplication'
        : 'NOT NEEDED',
  };
}

function computeStaleness(
  feeds: Array<{ name: string; url: string; status: string; consecutiveNotModified?: number }>
): StalenessResult {
  let activeCount = 0;
  let staleCount = 0;
  let deadCount = 0;
  let errorCount = 0;
  const staleFeeds: Array<{ name: string; url: string; consecutive304s: number }> = [];

  for (const feed of feeds) {
    if (feed.status === 'error') {
      errorCount++;
      continue;
    }

    const notModified = feed.consecutiveNotModified ?? 0;

    if (notModified > 30) {
      deadCount++;
      staleFeeds.push({ name: feed.name, url: feed.url, consecutive304s: notModified });
    } else if (notModified > 7) {
      staleCount++;
      staleFeeds.push({ name: feed.name, url: feed.url, consecutive304s: notModified });
    } else {
      activeCount++;
    }
  }

  return {
    totalFeeds: feeds.length,
    activeCount,
    staleCount,
    deadCount,
    errorCount,
    staleFeeds: staleFeeds.slice(0, 20),
    recommendation:
      deadCount > 0
        ? `Remove ${deadCount} dead feeds`
        : 'All feeds active',
  };
}

// ============================================
// Internal Queries
// ============================================

/**
 * Analyze content truncation across feed items.
 * Heuristics: short content <200 chars, truncation markers,
 * content=summary, word count <50.
 */
export const analyzeContentTruncation = internalQuery({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    return computeTruncation(items);
  },
});

/**
 * Analyze cross-feed duplicate rate by normalized title and link.
 */
export const analyzeCrossFeedDuplicates = internalQuery({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    return computeDuplicates(
      items.map((i) => ({ title: i.title, link: i.link, feedId: i.feedId as string }))
    );
  },
});

/**
 * Analyze feed staleness using consecutiveNotModified from Plan 01.
 */
export const analyzeFeedStaleness = internalQuery({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db.query('feeds').collect();
    return computeStaleness(
      feeds.map((f) => ({
        name: f.name,
        url: f.url,
        status: f.status,
        consecutiveNotModified: (f as any).consecutiveNotModified ?? 0,
      }))
    );
  },
});

// ============================================
// Public Query
// ============================================

/**
 * Combined feed health metrics report.
 * Callable via api.analysis.metrics.getFeedHealthMetrics
 */
export const getFeedHealthMetrics = query({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 200;

    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(sampleSize);

    const truncation = computeTruncation(items);

    const duplicates = computeDuplicates(
      items.map((i) => ({ title: i.title, link: i.link, feedId: i.feedId as string }))
    );

    const feeds = await ctx.db.query('feeds').collect();
    const staleness = computeStaleness(
      feeds.map((f) => ({
        name: f.name,
        url: f.url,
        status: f.status,
        consecutiveNotModified: (f as any).consecutiveNotModified ?? 0,
      }))
    );

    return { truncation, duplicates, staleness };
  },
});
