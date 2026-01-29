/**
 * Feature Flag System
 *
 * Per-feed and global feature toggles for Phase 6.2 features
 * (full-text extraction, semantic deduplication).
 *
 * Priority chain: per-feed override > global setting > default (false)
 *
 * Public API:
 * - getFeatureFlags: Get current global flags
 * - setFeatureFlags: Update global flags
 * - recommendFeatureFlags: Analyze feed data and recommend flag settings
 *
 * Internal API:
 * - shouldExtractFullText: Check if feed should use full-text extraction
 * - shouldDeduplicateSemantically: Check if feed should use semantic dedup
 * - getGlobalFeatureFlags: Get global settings from DB
 * - updateGlobalFeatureFlags: Update global settings
 * - updateFeedFeatures: Set per-feed overrides
 * - resetFeedFeatures: Clear per-feed overrides
 *
 * @module convex/feeds/featureFlags
 */

import { v } from 'convex/values';
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from '../_generated/server';

// =============================================
// Constants
// =============================================

const SETTINGS_KEY = 'phase6_feature_flags';

/** Threshold: recommend full-text extraction if truncation rate exceeds this */
const TRUNCATION_THRESHOLD = 0.2; // 20%

/** Threshold: recommend semantic dedup if duplicate rate exceeds this */
const DUPLICATE_THRESHOLD = 0.1; // 10%

/** Content length below which an item is considered truncated */
const TRUNCATION_LENGTH = 500;

// =============================================
// Internal Queries
// =============================================

/**
 * Get global feature flags from settings table.
 * Returns defaults if no settings exist.
 */
export const getGlobalFeatureFlags = internalQuery({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    if (!setting) {
      return {
        fullTextExtraction: false,
        semanticDeduplication: false,
      };
    }

    const value = setting.value as Record<string, boolean>;
    return {
      fullTextExtraction: value.fullTextExtraction ?? false,
      semanticDeduplication: value.semanticDeduplication ?? false,
    };
  },
});

/**
 * Check if a specific feed should use full-text extraction.
 * Priority: per-feed > global > default (false)
 */
export const shouldExtractFullText = internalQuery({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args) => {
    // Check per-feed override first
    const feed = await ctx.db.get(args.feedId);
    if (feed?.features?.fullTextExtraction !== undefined) {
      return feed.features.fullTextExtraction;
    }

    // Fall back to global setting
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    if (setting) {
      const value = setting.value as Record<string, boolean>;
      if (value.fullTextExtraction !== undefined) {
        return value.fullTextExtraction;
      }
    }

    // Default
    return false;
  },
});

/**
 * Check if a specific feed should use semantic deduplication.
 * Priority: per-feed > global > default (false)
 */
export const shouldDeduplicateSemantically = internalQuery({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args) => {
    // Check per-feed override first
    const feed = await ctx.db.get(args.feedId);
    if (feed?.features?.semanticDeduplication !== undefined) {
      return feed.features.semanticDeduplication;
    }

    // Fall back to global setting
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    if (setting) {
      const value = setting.value as Record<string, boolean>;
      if (value.semanticDeduplication !== undefined) {
        return value.semanticDeduplication;
      }
    }

    // Default
    return false;
  },
});

// =============================================
// Internal Mutations
// =============================================

/**
 * Update global feature flags in settings table.
 * Creates the setting if it doesn't exist.
 */
export const updateGlobalFeatureFlags = internalMutation({
  args: {
    fullTextExtraction: v.optional(v.boolean()),
    semanticDeduplication: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const currentValue = existing
      ? (existing.value as Record<string, boolean>)
      : { fullTextExtraction: false, semanticDeduplication: false };

    const newValue = {
      fullTextExtraction: args.fullTextExtraction ?? currentValue.fullTextExtraction,
      semanticDeduplication: args.semanticDeduplication ?? currentValue.semanticDeduplication,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: newValue,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('settings', {
        key: SETTINGS_KEY,
        value: newValue,
        description: 'Phase 6.2 feature flags (full-text extraction, semantic deduplication)',
        updatedAt: now,
      });
    }

    return newValue;
  },
});

/**
 * Update per-feed feature overrides.
 */
export const updateFeedFeatures = internalMutation({
  args: {
    feedId: v.id('feeds'),
    fullTextExtraction: v.optional(v.boolean()),
    semanticDeduplication: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${args.feedId}`);
    }

    const currentFeatures = feed.features ?? {};
    const newFeatures = {
      ...currentFeatures,
      ...(args.fullTextExtraction !== undefined
        ? { fullTextExtraction: args.fullTextExtraction }
        : {}),
      ...(args.semanticDeduplication !== undefined
        ? { semanticDeduplication: args.semanticDeduplication }
        : {}),
    };

    await ctx.db.patch(args.feedId, {
      features: newFeatures,
      updatedAt: Date.now(),
    });

    return newFeatures;
  },
});

/**
 * Reset per-feed feature overrides (clears the features field).
 */
export const resetFeedFeatures = internalMutation({
  args: { feedId: v.id('feeds') },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${args.feedId}`);
    }

    await ctx.db.patch(args.feedId, {
      features: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// =============================================
// Public Queries
// =============================================

/**
 * Get current global feature flags.
 * Public query for dashboard/scripts.
 */
export const getFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    if (!setting) {
      return {
        fullTextExtraction: false,
        semanticDeduplication: false,
      };
    }

    const value = setting.value as Record<string, boolean>;
    return {
      fullTextExtraction: value.fullTextExtraction ?? false,
      semanticDeduplication: value.semanticDeduplication ?? false,
    };
  },
});

/**
 * Recommend feature flag settings based on feed data analysis.
 *
 * This is the Plan 04->05 connection. It:
 * 1. Analyzes all feed items for truncation (content < 500 chars)
 * 2. Analyzes duplicate content hashes across feeds
 * 3. Compares against thresholds (20% truncation, 10% duplicates)
 * 4. Returns recommendations with reasoning
 */
export const recommendFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    // Analyze truncation across all feed items
    const allItems = await ctx.db.query('feedItems').collect();
    const totalItems = allItems.length;

    if (totalItems === 0) {
      return {
        recommendFullTextExtraction: false,
        recommendSemanticDeduplication: false,
        reasoning: 'No feed items to analyze. Add feeds and sync before requesting recommendations.',
        analysis: {
          totalItems: 0,
          truncatedItems: 0,
          truncationRate: 0,
          duplicateItems: 0,
          duplicateRate: 0,
          thresholds: {
            truncation: TRUNCATION_THRESHOLD,
            duplicates: DUPLICATE_THRESHOLD,
          },
        },
      };
    }

    // Count truncated items (content shorter than threshold)
    let truncatedCount = 0;
    for (const item of allItems) {
      const content = item.content ?? item.summary ?? '';
      if (content.length < TRUNCATION_LENGTH) {
        truncatedCount++;
      }
    }

    // Count duplicate content hashes (items sharing same hash across different feeds)
    const hashMap = new Map<string, Set<string>>();
    for (const item of allItems) {
      const feedIdStr = item.feedId as unknown as string;
      if (!hashMap.has(item.contentHash)) {
        hashMap.set(item.contentHash, new Set());
      }
      hashMap.get(item.contentHash)!.add(feedIdStr);
    }

    // A duplicate is a hash that appears in more than one feed
    let duplicateCount = 0;
    for (const [, feeds] of hashMap) {
      if (feeds.size > 1) {
        duplicateCount++;
      }
    }

    const truncationRate = truncatedCount / totalItems;
    const duplicateRate = duplicateCount / totalItems;

    const recommendFullText = truncationRate > TRUNCATION_THRESHOLD;
    const recommendSemantic = duplicateRate > DUPLICATE_THRESHOLD;

    const reasons: string[] = [];
    if (recommendFullText) {
      reasons.push(
        `Truncation rate ${(truncationRate * 100).toFixed(1)}% exceeds ${TRUNCATION_THRESHOLD * 100}% threshold — full-text extraction recommended.`
      );
    } else {
      reasons.push(
        `Truncation rate ${(truncationRate * 100).toFixed(1)}% is within ${TRUNCATION_THRESHOLD * 100}% threshold — full-text extraction not needed.`
      );
    }

    if (recommendSemantic) {
      reasons.push(
        `Cross-feed duplicate rate ${(duplicateRate * 100).toFixed(1)}% exceeds ${DUPLICATE_THRESHOLD * 100}% threshold — semantic deduplication recommended.`
      );
    } else {
      reasons.push(
        `Cross-feed duplicate rate ${(duplicateRate * 100).toFixed(1)}% is within ${DUPLICATE_THRESHOLD * 100}% threshold — semantic deduplication not needed.`
      );
    }

    return {
      recommendFullTextExtraction: recommendFullText,
      recommendSemanticDeduplication: recommendSemantic,
      reasoning: reasons.join(' '),
      analysis: {
        totalItems,
        truncatedItems: truncatedCount,
        truncationRate: Math.round(truncationRate * 1000) / 1000,
        duplicateItems: duplicateCount,
        duplicateRate: Math.round(duplicateRate * 1000) / 1000,
        thresholds: {
          truncation: TRUNCATION_THRESHOLD,
          duplicates: DUPLICATE_THRESHOLD,
        },
      },
    };
  },
});

// =============================================
// Public Mutations
// =============================================

/**
 * Set global feature flags.
 * Public mutation for dashboard/scripts.
 */
export const setFeatureFlags = mutation({
  args: {
    fullTextExtraction: v.optional(v.boolean()),
    semanticDeduplication: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', SETTINGS_KEY))
      .first();

    const currentValue = existing
      ? (existing.value as Record<string, boolean>)
      : { fullTextExtraction: false, semanticDeduplication: false };

    const newValue = {
      fullTextExtraction: args.fullTextExtraction ?? currentValue.fullTextExtraction,
      semanticDeduplication: args.semanticDeduplication ?? currentValue.semanticDeduplication,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: newValue,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('settings', {
        key: SETTINGS_KEY,
        value: newValue,
        description: 'Phase 6.2 feature flags (full-text extraction, semantic deduplication)',
        updatedAt: now,
      });
    }

    return newValue;
  },
});
