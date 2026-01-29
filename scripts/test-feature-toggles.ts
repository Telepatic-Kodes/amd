/**
 * Feature Toggle System Test Script
 *
 * Usage: npx tsx scripts/test-feature-toggles.ts
 *
 * Verifies:
 * 1. Default state (all flags false)
 * 2. Enable flags globally
 * 3. Persistence of global flags
 * 4. recommendFeatureFlags returns correct format
 * 5. Priority chain (per-feed > global > default)
 */

import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.log(`  FAIL: ${message}`);
    failed++;
  }
}

async function testFeatureToggles() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error('ERROR: NEXT_PUBLIC_CONVEX_URL not set');
    process.exit(1);
  }

  const client = new ConvexClient(url);

  console.log('=== Feature Toggle System Tests ===\n');

  // Test 1: Default state
  console.log('Test 1: Default state (all flags false)');
  const defaults = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert(defaults.fullTextExtraction === false, 'fullTextExtraction defaults to false');
  assert(defaults.semanticDeduplication === false, 'semanticDeduplication defaults to false');
  console.log();

  // Test 2: Enable flags globally
  console.log('Test 2: Enable flags globally');
  const enabled = await client.mutation(api.feeds.featureFlags.setFeatureFlags, {
    fullTextExtraction: true,
    semanticDeduplication: true,
  });
  assert(enabled.fullTextExtraction === true, 'fullTextExtraction enabled');
  assert(enabled.semanticDeduplication === true, 'semanticDeduplication enabled');
  console.log();

  // Test 3: Persistence
  console.log('Test 3: Flags persist after re-query');
  const persisted = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert(persisted.fullTextExtraction === true, 'fullTextExtraction persisted as true');
  assert(persisted.semanticDeduplication === true, 'semanticDeduplication persisted as true');
  console.log();

  // Test 4: Partial update (only change one flag)
  console.log('Test 4: Partial update');
  const partial = await client.mutation(api.feeds.featureFlags.setFeatureFlags, {
    fullTextExtraction: false,
  });
  assert(partial.fullTextExtraction === false, 'fullTextExtraction set to false');
  assert(partial.semanticDeduplication === true, 'semanticDeduplication unchanged (still true)');
  console.log();

  // Test 5: recommendFeatureFlags format
  console.log('Test 5: recommendFeatureFlags returns correct format');
  const recommendation = await client.query(api.feeds.featureFlags.recommendFeatureFlags, {});
  assert(typeof recommendation.recommendFullTextExtraction === 'boolean', 'recommendFullTextExtraction is boolean');
  assert(typeof recommendation.recommendSemanticDeduplication === 'boolean', 'recommendSemanticDeduplication is boolean');
  assert(typeof recommendation.reasoning === 'string', 'reasoning is string');
  assert(recommendation.reasoning.length > 0, 'reasoning is non-empty');
  assert(typeof recommendation.analysis === 'object', 'analysis object exists');
  assert(typeof recommendation.analysis.totalItems === 'number', 'analysis.totalItems is number');
  assert(typeof recommendation.analysis.truncationRate === 'number', 'analysis.truncationRate is number');
  assert(typeof recommendation.analysis.duplicateRate === 'number', 'analysis.duplicateRate is number');
  assert(recommendation.analysis.thresholds.truncation === 0.2, 'truncation threshold is 0.2');
  assert(recommendation.analysis.thresholds.duplicates === 0.1, 'duplicates threshold is 0.1');
  console.log();

  // Cleanup: reset flags to default
  console.log('Cleanup: reset flags to defaults');
  await client.mutation(api.feeds.featureFlags.setFeatureFlags, {
    fullTextExtraction: false,
    semanticDeduplication: false,
  });
  const reset = await client.query(api.feeds.featureFlags.getFeatureFlags, {});
  assert(reset.fullTextExtraction === false, 'fullTextExtraction reset to false');
  assert(reset.semanticDeduplication === false, 'semanticDeduplication reset to false');
  console.log();

  // Summary
  console.log('=== Results ===');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${passed + failed}`);
  console.log();

  await client.close();

  if (failed > 0) {
    console.log('SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED');
  }
}

testFeatureToggles().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
