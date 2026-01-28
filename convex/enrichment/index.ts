/**
 * Enrichment Module Barrel Export
 *
 * Phase 4 (AI Enrichment):
 * - getUnprocessedItems, getItem: Internal queries for enrichment processing
 * - storeEnrichment, markFailed: Internal mutations for storing results
 * - enrichFeedItem: Internal action for Claude-powered enrichment
 * - processBatch, triggerEnrichment: Orchestration for batch processing
 * - ENRICHMENT_SCHEMA, buildEnrichmentPrompt: Prompt templates
 *
 * @module convex/enrichment
 */

// Queries (Plan 01)
export { getUnprocessedItems, getItem } from './queries';

// Mutations (Plan 01)
export { storeEnrichment, markFailed } from './mutations';

// Actions (Plan 02)
export { enrichFeedItem } from './processItems';

// Orchestration (Plan 03)
export { processBatch, triggerEnrichment } from './orchestration';

// Prompts (Plan 02)
export {
  ENRICHMENT_SCHEMA,
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentPrompt,
} from './prompts';
