/**
 * Enrichment Prompts and Schema
 *
 * Defines the JSON schema for Claude structured outputs and prompt templates
 * for AI enrichment of feed items.
 *
 * @module convex/enrichment/prompts
 */

/**
 * JSON Schema for structured outputs from Claude API
 *
 * Defines the exact structure expected for enrichment results.
 * Used with the structured-outputs beta header to guarantee valid JSON.
 */
export const ENRICHMENT_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: { type: "string" },
      description: "3-5 relevant topic tags (lowercase, no hashtags)",
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative"],
      description: "Overall sentiment of the content",
    },
    summary: {
      type: "string",
      description: "100-200 word summary capturing key points",
    },
    relevanceScore: {
      type: "integer",
      description: "0-100 score for marketing/business relevance",
    },
  },
  required: ["topics", "sentiment", "summary", "relevanceScore"],
  additionalProperties: false,
} as const;

/**
 * System prompt for enrichment classification
 *
 * Provides context and guidelines for the AI to analyze feed content
 * from a marketing perspective.
 */
export const ENRICHMENT_SYSTEM_PROMPT = `You are a marketing content analyst for a B2B SaaS company. Analyze feed content and provide structured metadata.

Guidelines:
- topics: Extract 3-5 relevant tags. Use lowercase, no hashtags. Focus on marketing, industry, and business topics.
- sentiment: Determine if the content is positive (good news, success), negative (problems, failures), or neutral (informational).
- summary: Write a concise 100-200 word summary. Focus on actionable insights for marketing teams.
- relevanceScore: Rate 0-100 for marketing relevance:
  - 80-100: Directly about marketing, content strategy, SEO, social media, or industry trends
  - 60-79: Business news, technology updates relevant to marketing
  - 40-59: General industry news with some marketing applicability
  - 20-39: Tangentially related content
  - 0-19: Off-topic or irrelevant

Be consistent and accurate. This data feeds into automated content systems.`;

/**
 * Builds the user message for enrichment prompts
 *
 * Truncates content to control token usage while preserving enough
 * context for accurate classification.
 *
 * @param title - Feed item title
 * @param content - Feed item content (will be truncated to 2000 chars)
 * @returns Formatted user message for Claude API
 */
export function buildEnrichmentPrompt(title: string, content: string): string {
  // Truncate content to control tokens (max 2000 chars)
  const truncatedContent = content.slice(0, 2000);

  return `Analyze this feed item:

Title: ${title}

Content:
${truncatedContent}

Provide the structured analysis.`;
}
