---
wave: 1
depends_on:
  - 05-PLAN-01-Schema-Configuration
files_modified:
  - convex/enrichment/prompts.ts
  - convex/enrichment/mutations.ts
  - convex/enrichment/processItems.ts
autonomous: true
---

## Objective

Extend the existing enrichment pipeline to detect brand mentions and competitor mentions during AI analysis. No new system -- just add two fields to the existing Claude call.

## Why This First

The enrichment pipeline already processes every feed item through Claude. Adding brand/competitor detection here costs ~100 extra tokens per item and reuses the entire existing infrastructure (crons, batching, error handling).

## Step-by-step

### 1. Update ENRICHMENT_SCHEMA in convex/enrichment/prompts.ts

Add two new properties to the schema object. Insert after `relevanceScore` (line ~36), before the closing brace:

```typescript
    brandMentions: {
      type: "array",
      items: { type: "string" },
      description:
        "Brand names from the monitored list that are mentioned in the content. Empty array if none.",
    },
    competitorMentions: {
      type: "array",
      items: { type: "string" },
      description:
        "Competitor names from the monitored list that are mentioned in the content. Empty array if none.",
    },
```

Update the `required` array to include the new fields:

```typescript
  required: ["topics", "sentiment", "summary", "relevanceScore", "brandMentions", "competitorMentions"],
```

### 2. Update ENRICHMENT_SYSTEM_PROMPT in convex/enrichment/prompts.ts

Replace the entire `ENRICHMENT_SYSTEM_PROMPT` with:

```typescript
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
- brandMentions: Identify any mentions of the BRAND TERMS listed below. Return the canonical brand name for each mention found. Return empty array if none.
- competitorMentions: Identify any mentions of the COMPETITORS listed below. Return the canonical competitor name for each mention found. Return empty array if none.

Be consistent and accurate. This data feeds into automated content systems.`;
```

### 3. Update buildEnrichmentPrompt in convex/enrichment/prompts.ts

Change the function signature to accept brand terms and competitors, and inject them into the prompt:

```typescript
/**
 * Builds the user message for enrichment prompts
 *
 * @param title - Feed item title
 * @param content - Feed item content (will be truncated to 2000 chars)
 * @param brandTerms - Brand terms to detect (Phase 5)
 * @param competitors - Competitor names to detect (Phase 5)
 * @returns Formatted user message for Claude API
 */
export function buildEnrichmentPrompt(
  title: string,
  content: string,
  brandTerms: string[] = [],
  competitors: string[] = []
): string {
  // Truncate content to control tokens (max 2000 chars)
  const truncatedContent = content.slice(0, 2000);

  // Build monitoring context (only if terms are provided)
  let monitoringContext = "";
  if (brandTerms.length > 0 || competitors.length > 0) {
    monitoringContext = "\n\n--- MONITORING CONTEXT ---";
    if (brandTerms.length > 0) {
      monitoringContext += `\nBRAND TERMS: ${brandTerms.join(", ")}`;
    }
    if (competitors.length > 0) {
      monitoringContext += `\nCOMPETITORS: ${competitors.join(", ")}`;
    }
  }

  return `Analyze this feed item:

Title: ${title}

Content:
${truncatedContent}${monitoringContext}

Provide the structured analysis.`;
}
```

**Important:** Default parameters `= []` ensure backward compatibility. Existing callers without brand/competitor args still work.

### 4. Update storeEnrichment mutation in convex/enrichment/mutations.ts

Add the two new fields to the args and the patch call. Modify `storeEnrichment`:

Add to `args` (after `relevanceScore`):
```typescript
    brandMentions: v.array(v.string()),
    competitorMentions: v.array(v.string()),
```

Update the destructuring (line ~41):
```typescript
    const { itemId, topics, sentiment, aiSummary, relevanceScore, brandMentions, competitorMentions } = args;
```

Add to the `ctx.db.patch` call (after `relevanceScore,`):
```typescript
      brandMentions,
      competitorMentions,
```

Update the log line to include mention counts:
```typescript
    console.log(
      `[enrichment] Stored enrichment for item ${itemId}: ` +
        `topics=${topics.length}, sentiment=${sentiment}, relevance=${relevanceScore}, ` +
        `brands=${brandMentions.length}, competitors=${competitorMentions.length}`
    );
```

### 5. Update enrichFeedItem action in convex/enrichment/processItems.ts

Add import for monitoring config at the top (after existing imports):
```typescript
import { getCompetitorNames, MONITORED_BRAND_TERMS } from "../monitoring/config";
```

Update the prompt building section (around line ~66). Replace:
```typescript
    const userMessage = buildEnrichmentPrompt(item.title, content);
```
With:
```typescript
    const brandTerms = [...MONITORED_BRAND_TERMS];
    const competitors = getCompetitorNames();
    const userMessage = buildEnrichmentPrompt(item.title, content, brandTerms, competitors);
```

Update the storeEnrichment call (around line ~112) to pass new fields:
```typescript
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
```

Update the log line (around line ~121):
```typescript
    console.log(
      `[enrichment] Enriched ${args.itemId}: score=${enrichment.relevanceScore}, ` +
        `topics=${enrichment.topics.join(",")}, ` +
        `brands=${(enrichment.brandMentions || []).length}, ` +
        `competitors=${(enrichment.competitorMentions || []).length}`
    );
```

### 6. Verify

```bash
cd /home/tomas/Escritorio/amd && npx convex dev --once
```

Ensure no TypeScript errors. Then manually test with an existing unprocessed item:
```bash
npx convex run enrichment:orchestration:processBatch '{"batchSize": 1}'
```

Check Convex dashboard that the processed item now has `brandMentions` and `competitorMentions` fields (likely empty arrays for most items, which is correct).

## Verification

- [ ] ENRICHMENT_SCHEMA has brandMentions and competitorMentions properties
- [ ] ENRICHMENT_SCHEMA required array includes both new fields
- [ ] System prompt includes brand and competitor detection guidelines
- [ ] buildEnrichmentPrompt accepts optional brandTerms and competitors params
- [ ] buildEnrichmentPrompt injects monitoring context into user message
- [ ] storeEnrichment mutation accepts and saves brandMentions and competitorMentions
- [ ] enrichFeedItem imports monitoring config and passes terms to prompt
- [ ] enrichFeedItem passes brandMentions/competitorMentions to storeEnrichment
- [ ] Schema compiles without errors
- [ ] Test enrichment of 1 item succeeds with new fields

## must_haves

- ENRICHMENT_SCHEMA includes brandMentions and competitorMentions as required array fields
- System prompt instructs Claude to detect brand terms and competitors
- buildEnrichmentPrompt injects BRAND TERMS and COMPETITORS into the user message
- buildEnrichmentPrompt has backward-compatible default parameters
- storeEnrichment mutation saves brandMentions and competitorMentions to feedItems
- enrichFeedItem imports from monitoring/config and passes terms through the pipeline
- Fallback to empty arrays (|| []) for robustness
- Compiles and runs without errors
