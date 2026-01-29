/**
 * Feed Health Analysis Script
 *
 * Usage: npx tsx scripts/analyze-feed-health.ts
 *
 * Runs all analysis metrics and outputs a human-readable report.
 * Use to decide whether Phase 6.2 features are needed.
 */

import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function analyzeFeedHealth() {
  const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  console.log('=== AMD Feed Health Analysis ===\n');
  console.log('Running analysis via public query...\n');

  const metrics = await client.query(api.analysis.metrics.getFeedHealthMetrics, {
    sampleSize: 200,
  });

  console.log('--- Truncation Analysis ---');
  console.log(`  Sample size: ${metrics.truncation.sampleSize}`);
  console.log(`  Truncated: ${metrics.truncation.truncatedCount}`);
  console.log(`  Full content: ${metrics.truncation.fullContentCount}`);
  console.log(`  No content: ${metrics.truncation.noContentCount}`);
  console.log(`  Truncation rate: ${metrics.truncation.truncationRate}%`);
  console.log(`  Recommendation: ${metrics.truncation.recommendation}`);

  console.log('\n--- Duplicate Analysis ---');
  console.log(`  Sample size: ${metrics.duplicates.sampleSize}`);
  console.log(`  Unique titles: ${metrics.duplicates.uniqueTitles}`);
  console.log(`  Cross-feed duplicates: ${metrics.duplicates.titleDuplicates}`);
  console.log(`  Duplicate rate: ${metrics.duplicates.duplicateRate}%`);
  console.log(`  Recommendation: ${metrics.duplicates.recommendation}`);

  console.log('\n--- Staleness Analysis ---');
  console.log(`  Total feeds: ${metrics.staleness.totalFeeds}`);
  console.log(`  Stale (>7 consecutive 304s): ${metrics.staleness.staleCount}`);
  console.log(`  Dead (>30 consecutive 304s): ${metrics.staleness.deadCount}`);
  console.log(`  Recommendation: ${metrics.staleness.recommendation}`);

  console.log('\n--- Decision Thresholds ---');
  console.log(`  Truncation > 20%: ${metrics.truncation.truncationRate > 20 ? 'YES => Enable full-text extraction' : 'No'}`);
  console.log(`  Duplicates > 10%: ${metrics.duplicates.duplicateRate > 10 ? 'YES => Enable semantic dedup' : 'No'}`);
  console.log(`  Dead feeds: ${metrics.staleness.deadCount > 0 ? `YES => Remove ${metrics.staleness.deadCount} feeds` : 'None'}`);

  await client.close();
}

analyzeFeedHealth().catch(console.error);
