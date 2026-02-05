/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as agentSdk from "../agentSdk.js";
import type * as analysis_metrics from "../analysis/metrics.js";
import type * as controlCenter from "../controlCenter.js";
import type * as crons from "../crons.js";
import type * as enrichment_index from "../enrichment/index.js";
import type * as enrichment_mutations from "../enrichment/mutations.js";
import type * as enrichment_orchestration from "../enrichment/orchestration.js";
import type * as enrichment_processItems from "../enrichment/processItems.js";
import type * as enrichment_prompts from "../enrichment/prompts.js";
import type * as enrichment_queries from "../enrichment/queries.js";
import type * as feeds_agentQueries from "../feeds/agentQueries.js";
import type * as feeds_featureFlags from "../feeds/featureFlags.js";
import type * as feeds_fetchFeed from "../feeds/fetchFeed.js";
import type * as feeds_index from "../feeds/index.js";
import type * as feeds_mutations from "../feeds/mutations.js";
import type * as feeds_opmlExport from "../feeds/opmlExport.js";
import type * as feeds_opmlImport from "../feeds/opmlImport.js";
import type * as feeds_publicQueries from "../feeds/publicQueries.js";
import type * as feeds_queries from "../feeds/queries.js";
import type * as feeds_scheduleFeedSync from "../feeds/scheduleFeedSync.js";
import type * as feeds_storeFeedItems from "../feeds/storeFeedItems.js";
import type * as feeds_syncAllFeeds from "../feeds/syncAllFeeds.js";
import type * as feeds_templates from "../feeds/templates.js";
import type * as feeds_utils_hash from "../feeds/utils/hash.js";
import type * as feeds_utils_index from "../feeds/utils/index.js";
import type * as feeds_utils_opmlGenerator from "../feeds/utils/opmlGenerator.js";
import type * as feeds_utils_opmlParser from "../feeds/utils/opmlParser.js";
import type * as feeds_utils_rateLimit from "../feeds/utils/rateLimit.js";
import type * as feeds_utils_validation from "../feeds/utils/validation.js";
import type * as functions from "../functions.js";
import type * as kb_agentAction from "../kb/agentAction.js";
import type * as kb_agentQueries from "../kb/agentQueries.js";
import type * as kb_mutations from "../kb/mutations.js";
import type * as kb_processFile from "../kb/processFile.js";
import type * as kb_queries from "../kb/queries.js";
import type * as kb_scrapeUrl from "../kb/scrapeUrl.js";
import type * as kb_uploadFile from "../kb/uploadFile.js";
import type * as monitoring_actions from "../monitoring/actions.js";
import type * as monitoring_config from "../monitoring/config.js";
import type * as monitoring_index from "../monitoring/index.js";
import type * as monitoring_mutations from "../monitoring/mutations.js";
import type * as monitoring_queries from "../monitoring/queries.js";
import type * as onboarding from "../onboarding.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  agentSdk: typeof agentSdk;
  "analysis/metrics": typeof analysis_metrics;
  controlCenter: typeof controlCenter;
  crons: typeof crons;
  "enrichment/index": typeof enrichment_index;
  "enrichment/mutations": typeof enrichment_mutations;
  "enrichment/orchestration": typeof enrichment_orchestration;
  "enrichment/processItems": typeof enrichment_processItems;
  "enrichment/prompts": typeof enrichment_prompts;
  "enrichment/queries": typeof enrichment_queries;
  "feeds/agentQueries": typeof feeds_agentQueries;
  "feeds/featureFlags": typeof feeds_featureFlags;
  "feeds/fetchFeed": typeof feeds_fetchFeed;
  "feeds/index": typeof feeds_index;
  "feeds/mutations": typeof feeds_mutations;
  "feeds/opmlExport": typeof feeds_opmlExport;
  "feeds/opmlImport": typeof feeds_opmlImport;
  "feeds/publicQueries": typeof feeds_publicQueries;
  "feeds/queries": typeof feeds_queries;
  "feeds/scheduleFeedSync": typeof feeds_scheduleFeedSync;
  "feeds/storeFeedItems": typeof feeds_storeFeedItems;
  "feeds/syncAllFeeds": typeof feeds_syncAllFeeds;
  "feeds/templates": typeof feeds_templates;
  "feeds/utils/hash": typeof feeds_utils_hash;
  "feeds/utils/index": typeof feeds_utils_index;
  "feeds/utils/opmlGenerator": typeof feeds_utils_opmlGenerator;
  "feeds/utils/opmlParser": typeof feeds_utils_opmlParser;
  "feeds/utils/rateLimit": typeof feeds_utils_rateLimit;
  "feeds/utils/validation": typeof feeds_utils_validation;
  functions: typeof functions;
  "kb/agentAction": typeof kb_agentAction;
  "kb/agentQueries": typeof kb_agentQueries;
  "kb/mutations": typeof kb_mutations;
  "kb/processFile": typeof kb_processFile;
  "kb/queries": typeof kb_queries;
  "kb/scrapeUrl": typeof kb_scrapeUrl;
  "kb/uploadFile": typeof kb_uploadFile;
  "monitoring/actions": typeof monitoring_actions;
  "monitoring/config": typeof monitoring_config;
  "monitoring/index": typeof monitoring_index;
  "monitoring/mutations": typeof monitoring_mutations;
  "monitoring/queries": typeof monitoring_queries;
  onboarding: typeof onboarding;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
