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
import type * as agentConfig from "../agentConfig.js";
import type * as agentExecution from "../agentExecution.js";
import type * as agentSdk from "../agentSdk.js";
import type * as analysis_metrics from "../analysis/metrics.js";
import type * as analytics from "../analytics.js";
import type * as brandAudit from "../brandAudit.js";
import type * as brandAuditAction from "../brandAuditAction.js";
import type * as brandCompliance from "../brandCompliance.js";
import type * as brandExtractor from "../brandExtractor.js";
import type * as brandManualShares from "../brandManualShares.js";
import type * as brandMaturity from "../brandMaturity.js";
import type * as brandProfile from "../brandProfile.js";
import type * as brandSourceProcessor from "../brandSourceProcessor.js";
import type * as brandSources from "../brandSources.js";
import type * as brandSuggestions from "../brandSuggestions.js";
import type * as channelGroups from "../channelGroups.js";
import type * as cmoEngine from "../cmoEngine.js";
import type * as contentAnalysis from "../contentAnalysis.js";
import type * as contentPillars from "../contentPillars.js";
import type * as contentPipeline from "../contentPipeline.js";
import type * as contentRecycling from "../contentRecycling.js";
import type * as contentTemplates from "../contentTemplates.js";
import type * as contentVersions from "../contentVersions.js";
import type * as controlCenter from "../controlCenter.js";
import type * as copilot from "../copilot.js";
import type * as crons from "../crons.js";
import type * as crossPlatform_actions from "../crossPlatform/actions.js";
import type * as crossPlatform_queries from "../crossPlatform/queries.js";
import type * as dataExport from "../dataExport.js";
import type * as email_actions from "../email/actions.js";
import type * as email_internalQueries from "../email/internalQueries.js";
import type * as email_mutations from "../email/mutations.js";
import type * as email_queries from "../email/queries.js";
import type * as email_seed from "../email/seed.js";
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
import type * as guidance from "../guidance.js";
import type * as handoffEngine from "../handoffEngine.js";
import type * as http from "../http.js";
import type * as instagram_actions from "../instagram/actions.js";
import type * as instagram_internalQueries from "../instagram/internalQueries.js";
import type * as instagram_mutations from "../instagram/mutations.js";
import type * as instagram_queries from "../instagram/queries.js";
import type * as instagram_validation from "../instagram/validation.js";
import type * as kb_agentAction from "../kb/agentAction.js";
import type * as kb_agentQueries from "../kb/agentQueries.js";
import type * as kb_mutations from "../kb/mutations.js";
import type * as kb_processFile from "../kb/processFile.js";
import type * as kb_queries from "../kb/queries.js";
import type * as kb_scrapeUrl from "../kb/scrapeUrl.js";
import type * as kb_uploadFile from "../kb/uploadFile.js";
import type * as lib_agentHelpers from "../lib/agentHelpers.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as linkedin_actions from "../linkedin/actions.js";
import type * as linkedin_engagement from "../linkedin/engagement.js";
import type * as linkedin_internalQueries from "../linkedin/internalQueries.js";
import type * as linkedin_mutations from "../linkedin/mutations.js";
import type * as linkedin_queries from "../linkedin/queries.js";
import type * as marketingPhases from "../marketingPhases.js";
import type * as mediaLibrary from "../mediaLibrary.js";
import type * as migration from "../migration.js";
import type * as monitoring_actions from "../monitoring/actions.js";
import type * as monitoring_config from "../monitoring/config.js";
import type * as monitoring_index from "../monitoring/index.js";
import type * as monitoring_mutations from "../monitoring/mutations.js";
import type * as monitoring_queries from "../monitoring/queries.js";
import type * as multiChannelGenerate from "../multiChannelGenerate.js";
import type * as notifications from "../notifications.js";
import type * as oauthHelpers from "../oauthHelpers.js";
import type * as onboarding from "../onboarding.js";
import type * as orgChart from "../orgChart.js";
import type * as platformApprovals from "../platformApprovals.js";
import type * as publicApi from "../publicApi.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as reportsActions from "../reportsActions.js";
import type * as scheduledPublishing from "../scheduledPublishing.js";
import type * as seed from "../seed.js";
import type * as seedMonitoring from "../seedMonitoring.js";
import type * as seedNewsletter from "../seedNewsletter.js";
import type * as seedReports from "../seedReports.js";
import type * as seedTemplates from "../seedTemplates.js";
import type * as seedTikTok from "../seedTikTok.js";
import type * as seedUmoRecolector from "../seedUmoRecolector.js";
import type * as strategyReview from "../strategyReview.js";
import type * as topicSuggestions from "../topicSuggestions.js";
import type * as twitter_actions from "../twitter/actions.js";
import type * as twitter_internalQueries from "../twitter/internalQueries.js";
import type * as twitter_mutations from "../twitter/mutations.js";
import type * as twitter_queries from "../twitter/queries.js";
import type * as twitter_threadSplitter from "../twitter/threadSplitter.js";
import type * as users from "../users.js";
import type * as webhookEngine from "../webhookEngine.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  agentConfig: typeof agentConfig;
  agentExecution: typeof agentExecution;
  agentSdk: typeof agentSdk;
  "analysis/metrics": typeof analysis_metrics;
  analytics: typeof analytics;
  brandAudit: typeof brandAudit;
  brandAuditAction: typeof brandAuditAction;
  brandCompliance: typeof brandCompliance;
  brandExtractor: typeof brandExtractor;
  brandManualShares: typeof brandManualShares;
  brandMaturity: typeof brandMaturity;
  brandProfile: typeof brandProfile;
  brandSourceProcessor: typeof brandSourceProcessor;
  brandSources: typeof brandSources;
  brandSuggestions: typeof brandSuggestions;
  channelGroups: typeof channelGroups;
  cmoEngine: typeof cmoEngine;
  contentAnalysis: typeof contentAnalysis;
  contentPillars: typeof contentPillars;
  contentPipeline: typeof contentPipeline;
  contentRecycling: typeof contentRecycling;
  contentTemplates: typeof contentTemplates;
  contentVersions: typeof contentVersions;
  controlCenter: typeof controlCenter;
  copilot: typeof copilot;
  crons: typeof crons;
  "crossPlatform/actions": typeof crossPlatform_actions;
  "crossPlatform/queries": typeof crossPlatform_queries;
  dataExport: typeof dataExport;
  "email/actions": typeof email_actions;
  "email/internalQueries": typeof email_internalQueries;
  "email/mutations": typeof email_mutations;
  "email/queries": typeof email_queries;
  "email/seed": typeof email_seed;
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
  guidance: typeof guidance;
  handoffEngine: typeof handoffEngine;
  http: typeof http;
  "instagram/actions": typeof instagram_actions;
  "instagram/internalQueries": typeof instagram_internalQueries;
  "instagram/mutations": typeof instagram_mutations;
  "instagram/queries": typeof instagram_queries;
  "instagram/validation": typeof instagram_validation;
  "kb/agentAction": typeof kb_agentAction;
  "kb/agentQueries": typeof kb_agentQueries;
  "kb/mutations": typeof kb_mutations;
  "kb/processFile": typeof kb_processFile;
  "kb/queries": typeof kb_queries;
  "kb/scrapeUrl": typeof kb_scrapeUrl;
  "kb/uploadFile": typeof kb_uploadFile;
  "lib/agentHelpers": typeof lib_agentHelpers;
  "lib/auth": typeof lib_auth;
  "lib/llm": typeof lib_llm;
  "lib/permissions": typeof lib_permissions;
  "linkedin/actions": typeof linkedin_actions;
  "linkedin/engagement": typeof linkedin_engagement;
  "linkedin/internalQueries": typeof linkedin_internalQueries;
  "linkedin/mutations": typeof linkedin_mutations;
  "linkedin/queries": typeof linkedin_queries;
  marketingPhases: typeof marketingPhases;
  mediaLibrary: typeof mediaLibrary;
  migration: typeof migration;
  "monitoring/actions": typeof monitoring_actions;
  "monitoring/config": typeof monitoring_config;
  "monitoring/index": typeof monitoring_index;
  "monitoring/mutations": typeof monitoring_mutations;
  "monitoring/queries": typeof monitoring_queries;
  multiChannelGenerate: typeof multiChannelGenerate;
  notifications: typeof notifications;
  oauthHelpers: typeof oauthHelpers;
  onboarding: typeof onboarding;
  orgChart: typeof orgChart;
  platformApprovals: typeof platformApprovals;
  publicApi: typeof publicApi;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  reportsActions: typeof reportsActions;
  scheduledPublishing: typeof scheduledPublishing;
  seed: typeof seed;
  seedMonitoring: typeof seedMonitoring;
  seedNewsletter: typeof seedNewsletter;
  seedReports: typeof seedReports;
  seedTemplates: typeof seedTemplates;
  seedTikTok: typeof seedTikTok;
  seedUmoRecolector: typeof seedUmoRecolector;
  strategyReview: typeof strategyReview;
  topicSuggestions: typeof topicSuggestions;
  "twitter/actions": typeof twitter_actions;
  "twitter/internalQueries": typeof twitter_internalQueries;
  "twitter/mutations": typeof twitter_mutations;
  "twitter/queries": typeof twitter_queries;
  "twitter/threadSplitter": typeof twitter_threadSplitter;
  users: typeof users;
  webhookEngine: typeof webhookEngine;
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
