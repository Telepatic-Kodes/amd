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
import type * as crons from "../crons.js";
import type * as feeds_agentQueries from "../feeds/agentQueries.js";
import type * as feeds_fetchFeed from "../feeds/fetchFeed.js";
import type * as feeds_index from "../feeds/index.js";
import type * as feeds_mutations from "../feeds/mutations.js";
import type * as feeds_publicQueries from "../feeds/publicQueries.js";
import type * as feeds_queries from "../feeds/queries.js";
import type * as feeds_scheduleFeedSync from "../feeds/scheduleFeedSync.js";
import type * as feeds_storeFeedItems from "../feeds/storeFeedItems.js";
import type * as feeds_syncAllFeeds from "../feeds/syncAllFeeds.js";
import type * as feeds_utils_hash from "../feeds/utils/hash.js";
import type * as feeds_utils_index from "../feeds/utils/index.js";
import type * as feeds_utils_rateLimit from "../feeds/utils/rateLimit.js";
import type * as feeds_utils_validation from "../feeds/utils/validation.js";
import type * as functions from "../functions.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  agentSdk: typeof agentSdk;
  crons: typeof crons;
  "feeds/agentQueries": typeof feeds_agentQueries;
  "feeds/fetchFeed": typeof feeds_fetchFeed;
  "feeds/index": typeof feeds_index;
  "feeds/mutations": typeof feeds_mutations;
  "feeds/publicQueries": typeof feeds_publicQueries;
  "feeds/queries": typeof feeds_queries;
  "feeds/scheduleFeedSync": typeof feeds_scheduleFeedSync;
  "feeds/storeFeedItems": typeof feeds_storeFeedItems;
  "feeds/syncAllFeeds": typeof feeds_syncAllFeeds;
  "feeds/utils/hash": typeof feeds_utils_hash;
  "feeds/utils/index": typeof feeds_utils_index;
  "feeds/utils/rateLimit": typeof feeds_utils_rateLimit;
  "feeds/utils/validation": typeof feeds_utils_validation;
  functions: typeof functions;
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
