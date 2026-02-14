/**
 * Enrichment Processing Actions
 *
 * Internal actions for AI-powered feed item enrichment using OpenAI API.
 * Uses gpt-4o-mini with JSON mode for maximum cost efficiency
 * ($0.15/$0.60 per MTok) and reliable JSON responses.
 *
 * @module convex/enrichment/processItems
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  buildEnrichmentPrompt,
  buildSystemPrompt,
} from "./prompts";
import { getCompetitorNames } from "../monitoring/config";
import { callLLM } from "../lib/llm";

/**
 * Enriches a single feed item using gpt-4o-mini (via shared LLM helper)
 *
 * Fetches the feed item, constructs a prompt from its content, calls OpenAI
 * with JSON mode to extract topics, sentiment, summary, and relevance
 * score, then stores the results.
 *
 * Cost: ~$0.03/day for 100 items (gpt-4o-mini: $0.15/$0.60 per MTok)
 *
 * @param itemId - ID of the feedItem to enrich
 * @returns Success status, item ID, and tokens used for cost tracking
 * @throws Error if API key missing, item not found, or API call fails
 */
export const enrichFeedItem = internalAction({
  args: {
    itemId: v.id("feedItems"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    itemId: Id<"feedItems">;
    tokensUsed: number;
  }> => {
    // 1. Get item to enrich
    const item = await ctx.runQuery(internal.enrichment.queries.getItem, {
      itemId: args.itemId,
    });

    if (!item) {
      throw new Error(`Feed item not found: ${args.itemId}`);
    }

    // 2. Build prompt from item content
    // Prefer content, fall back to summary, then title only
    const content = item.content || item.summary || item.title;
    const competitors = getCompetitorNames();
    const userMessage = buildEnrichmentPrompt(item.title, content, competitors);
    const systemPrompt = buildSystemPrompt(competitors);

    // 3. Call OpenAI with JSON mode (gpt-4o-mini for cost efficiency)
    let result;
    try {
      result = await callLLM({
        system: systemPrompt,
        user: userMessage,
        model: "claude-3-5-haiku-20241022", // maps to gpt-4o-mini
        maxTokens: 512,
        temperature: 0.3,
        jsonMode: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // Mark as failed to prevent infinite retries
      await ctx.runMutation(internal.enrichment.mutations.markFailed, {
        itemId: args.itemId,
        error: `LLM API error: ${message.slice(0, 500)}`,
      });
      throw error;
    }

    const tokensUsed = result.usage.totalTokens;

    // 4. Parse structured output
    const enrichment = JSON.parse(result.content);

    // 5. Store enrichment data
    await ctx.runMutation(internal.enrichment.mutations.storeEnrichment, {
      itemId: args.itemId,
      topics: enrichment.topics,
      sentiment: enrichment.sentiment,
      aiSummary: enrichment.summary,
      relevanceScore: enrichment.relevanceScore,
      brandMentions: enrichment.brandMentions || [],
      competitorMentions: enrichment.competitorMentions || [],
      tokensUsed,
    });

    console.log(
      `[enrichment] Enriched ${args.itemId}: score=${enrichment.relevanceScore}, topics=${enrichment.topics.join(",")}`
    );

    return {
      success: true,
      itemId: args.itemId,
      tokensUsed,
    };
  },
});
