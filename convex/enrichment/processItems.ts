/**
 * Enrichment Processing Actions
 *
 * Internal actions for AI-powered feed item enrichment using Claude API.
 * Uses Claude Haiku 3.5 with structured outputs for maximum cost efficiency
 * ($0.25/$1.25 per MTok - 4x cheaper than Haiku 4.5) and reliable JSON responses.
 *
 * @module convex/enrichment/processItems
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  ENRICHMENT_SCHEMA,
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentPrompt,
} from "./prompts";

/**
 * Enriches a single feed item using Claude Haiku 3.5
 *
 * Fetches the feed item, constructs a prompt from its content, calls Claude
 * with structured outputs to extract topics, sentiment, summary, and relevance
 * score, then stores the results.
 *
 * Uses structured outputs beta header to guarantee valid JSON responses,
 * eliminating parsing failures.
 *
 * Cost: ~$0.07/day for 100 items (Haiku 3.5: $0.25/$1.25 per MTok)
 *
 * @param itemId - ID of the feedItem to enrich
 * @returns Success status, item ID, and tokens used for cost tracking
 * @throws Error if API key missing, item not found, or Claude API fails
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

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
    const userMessage = buildEnrichmentPrompt(item.title, content);

    // 3. Call Claude with structured outputs
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "structured-outputs-2025-11-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022", // Haiku 3.5: 4x cheaper than 4.5
        max_tokens: 512,
        temperature: 0.3, // Lower temp for consistent classification
        system: ENRICHMENT_SYSTEM_PROMPT,
        output_format: {
          type: "json_schema",
          schema: ENRICHMENT_SCHEMA,
        },
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Mark as failed to prevent infinite retries
      await ctx.runMutation(internal.enrichment.mutations.markFailed, {
        itemId: args.itemId,
        error: `Claude API error: ${response.status} - ${errorText.slice(0, 500)}`,
      });
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

    // 4. Parse structured output (guaranteed valid by structured outputs)
    const enrichment = JSON.parse(data.content[0].text);

    // 5. Store enrichment data
    await ctx.runMutation(internal.enrichment.mutations.storeEnrichment, {
      itemId: args.itemId,
      topics: enrichment.topics,
      sentiment: enrichment.sentiment,
      aiSummary: enrichment.summary,
      relevanceScore: enrichment.relevanceScore,
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
