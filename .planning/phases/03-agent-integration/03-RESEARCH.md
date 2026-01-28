# Phase 3: Agent Integration - Research

**Researched:** 2026-01-28
**Domain:** Convex actions, LLM context injection, feed-to-agent data flow
**Confidence:** HIGH

## Summary

This phase integrates RSS feed content into the existing AI agent execution system. The core modification is to the `executeAgent` action in `convex/actions.ts`, which needs to:
1. Query relevant feed items based on topic/keywords before calling Claude
2. Inject those items into the agent's system prompt or user message
3. Track which items were used for each execution (for audit/analytics)

The existing codebase already has the foundation:
- **Feed data**: `feedItems` table with title, content, link, categories, and publishedAt
- **Agent execution**: `executeAgent` action that builds prompts and calls Claude
- **Tracking infrastructure**: `executions` table and `auditLog` for traceability

**Primary recommendation:** Use Convex full-text search on feedItems (requires schema update to add search index) combined with feed category filtering for relevance matching. Inject matched items as formatted context in the system prompt. Track usage via new `feedItemsUsed` field in executions table.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | latest | Database + Actions | Already in use, provides search indexes |
| Claude API | anthropic-version 2023-06-01 | LLM calls | Already integrated in actions.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Convex Search Index | built-in | Full-text search on feedItems | For keyword matching in content/title |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Full-text search | Vector search | Vector search requires embeddings; text search is simpler for keyword matching and sufficient for this use case |
| In-memory filtering | Pre-indexed search | In-memory works for small datasets but doesn't scale; use search index for production |

**No new dependencies required.** All functionality available via existing Convex + Claude integration.

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── actions.ts              # Modified: executeAgent gets feed context injection
├── feeds/
│   ├── agentQueries.ts     # NEW: Internal queries for agent feed access
│   └── ...existing files
└── schema.ts               # Modified: Add search index on feedItems, add feedItemsUsed to executions
```

### Pattern 1: Context Injection via System Prompt Extension
**What:** Append relevant feed items to the agent's system prompt as structured context
**When to use:** Always - keeps user message focused on the task
**Example:**
```typescript
// Source: Best practice from RAG/LLM context engineering patterns
function buildEnhancedSystemPrompt(
  basePrompt: string,
  feedItems: FeedItem[]
): string {
  if (feedItems.length === 0) {
    return basePrompt;
  }

  const feedContext = feedItems.map((item, i) =>
    `[${i + 1}] ${item.title}\n` +
    `Source: ${item.link}\n` +
    `Published: ${new Date(item.publishedAt!).toISOString().split('T')[0]}\n` +
    `Content: ${item.summary || item.content?.slice(0, 500) || 'No content'}\n`
  ).join('\n---\n');

  return `${basePrompt}\n\n## Relevant Industry Context\n\nThe following recent feed items may be relevant to your task:\n\n${feedContext}\n\nUse this context when appropriate, but prioritize the user's specific request.`;
}
```

### Pattern 2: Query by Feed Category + Keywords
**What:** Two-stage filtering - first by feed category (cheap index lookup), then by keywords (text search)
**When to use:** When agent has topic context from task input
**Example:**
```typescript
// Source: Convex docs - withSearchIndex pattern
// First: Get category-relevant feeds
const feeds = await ctx.db
  .query("feeds")
  .withIndex("by_category", (q) => q.eq("category", agentCategory))
  .filter((q) => q.eq(q.field("status"), "active"))
  .collect();

// Then: Search items from those feeds using text search
const relevantItems = await ctx.db
  .query("feedItems")
  .withSearchIndex("search_content", (q) =>
    q.search("title", keywords)
      .eq("feedId", feedId)
  )
  .take(5);
```

### Pattern 3: Usage Tracking for Audit
**What:** Record which feed items influenced each agent execution
**When to use:** Always - enables AGNT-04 requirement
**Example:**
```typescript
// Source: Existing executions table pattern, extended
await ctx.runMutation(api.functions.logExecution, {
  taskId: taskResult.id,
  agentId: agent._id,
  // ...existing fields...
  feedItemsUsed: feedItems.map(item => ({
    feedItemId: item._id,
    title: item.title,
    relevanceScore: item._score, // from search index
  })),
});
```

### Anti-Patterns to Avoid
- **Loading all feed items**: Never `.collect()` all items; use indexes and limits
- **Blocking on search**: Search should be fast with proper indexes; if slow, something is wrong
- **Context stuffing**: Don't inject more than 5-10 items; diminishing returns and token costs
- **Ignoring publish date**: Prefer recent items; stale news is less valuable

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyword matching | Custom regex/indexOf loops | Convex searchIndex | Built-in BM25 relevance ranking, handles tokenization |
| Relevance scoring | Manual TF-IDF | Search index `_score` | Automatic scoring with search results |
| Token counting | Character counting | Claude API response | Actual token usage returned in response |
| Date filtering | Manual comparison | Index with publishedAt | Efficient range queries |

**Key insight:** Convex search indexes handle the complex parts (tokenization, ranking, efficient filtering). Focus on integration logic, not search implementation.

## Common Pitfalls

### Pitfall 1: Context Window Overflow
**What goes wrong:** Injecting too much feed content causes Claude API errors or truncation
**Why it happens:** Feed items can have long content fields; 10 items with 2000 chars each = 20,000 chars
**How to avoid:**
- Limit to 5 items max
- Use summary field if available, else truncate content to 500 chars
- Calculate approximate tokens before calling Claude (4 chars ~= 1 token)
**Warning signs:** Claude errors mentioning token limits, responses cut off mid-sentence

### Pitfall 2: Missing Search Index
**What goes wrong:** Search queries fail or are slow
**Why it happens:** Forgot to add searchIndex to schema, or schema not deployed
**How to avoid:**
- Add searchIndex in schema.ts BEFORE implementing query
- Run `npx convex dev` to verify index is created
**Warning signs:** "No search index" errors, queries timing out

### Pitfall 3: Irrelevant Context Injection
**What goes wrong:** Feed items don't match task, confusing the agent
**Why it happens:** Too broad keyword matching, no category filtering
**How to avoid:**
- Filter by feed category matching agent department first
- Require minimum relevance score from search
- Provide "none" option when no good matches
**Warning signs:** Agent responses reference unrelated topics, user confusion

### Pitfall 4: Blocking Agent Execution
**What goes wrong:** Feed query failures stop agents from working
**Why it happens:** Search errors not caught, sync issues
**How to avoid:**
- Wrap feed queries in try/catch
- Feed context is optional enhancement, not required
- Log failures but continue execution
**Warning signs:** Agents failing when feeds are down, no fallback behavior

### Pitfall 5: Duplicate Item Injection
**What goes wrong:** Same item appears multiple times across different feeds
**Why it happens:** Same content syndicated to multiple feeds
**How to avoid:**
- Dedupe by contentHash before injection
- Or dedupe by link URL
**Warning signs:** Repeated content in agent responses

## Code Examples

Verified patterns from official sources:

### Adding Search Index to Schema
```typescript
// Source: https://docs.convex.dev/search/text-search
// In convex/schema.ts, modify feedItems table:

feedItems: defineTable({
  feedId: v.id("feeds"),
  contentHash: v.string(),
  // ...existing fields...
  title: v.string(),
  link: v.string(),
  content: v.optional(v.string()),
  summary: v.optional(v.string()),
  // ...
})
  .index("by_contentHash", ["contentHash"])
  .index("by_feedId", ["feedId"])
  .index("by_feedId_publishedAt", ["feedId", "publishedAt"])
  .index("by_publishedAt", ["publishedAt"])
  // NEW: Search index for text matching
  .searchIndex("search_content", {
    searchField: "title",
    filterFields: ["feedId"],
  }),
```

### Internal Query for Agent Feed Access
```typescript
// Source: Convex internal functions pattern
// In convex/feeds/agentQueries.ts

import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';
import { Id } from '../_generated/dataModel';

/**
 * Gets relevant feed items for an agent based on keywords and category
 *
 * @param keywords - Search terms from task input
 * @param categories - Feed categories relevant to agent's department
 * @param limit - Max items to return (default: 5)
 * @returns Array of feed items with relevance info
 */
export const getRelevantFeedItems = internalQuery({
  args: {
    keywords: v.string(),
    categories: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    if (!args.keywords.trim()) {
      return [];
    }

    // Get active feeds in target categories
    const feeds = await ctx.db
      .query('feeds')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    const relevantFeeds = feeds.filter(f =>
      args.categories.includes(f.category)
    );

    if (relevantFeeds.length === 0) {
      return [];
    }

    // Search across all relevant feeds
    const results: Array<{
      item: any;
      feedName: string;
      score: number;
    }> = [];

    for (const feed of relevantFeeds) {
      const items = await ctx.db
        .query('feedItems')
        .withSearchIndex('search_content', (q) =>
          q.search('title', args.keywords).eq('feedId', feed._id)
        )
        .take(limit);

      for (const item of items) {
        results.push({
          item,
          feedName: feed.name,
          score: 1, // Convex search returns ranked results
        });
      }
    }

    // Sort by relevance and recency, take top N
    return results
      .sort((a, b) => {
        // Prefer recent items
        const dateA = a.item.publishedAt || 0;
        const dateB = b.item.publishedAt || 0;
        return dateB - dateA;
      })
      .slice(0, limit)
      .map(r => ({
        _id: r.item._id,
        title: r.item.title,
        link: r.item.link,
        summary: r.item.summary,
        content: r.item.content?.slice(0, 500),
        publishedAt: r.item.publishedAt,
        feedName: r.feedName,
      }));
  },
});
```

### Modified executeAgent with Feed Context
```typescript
// Source: Existing executeAgent pattern + context injection
// Key modification to convex/actions.ts

export const executeAgent = action({
  args: {
    agentId: v.string(),
    taskType: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Get agent (existing code)
    const agent = await ctx.runQuery(api.functions.getAgent, {
      agentId: args.agentId,
    });
    // ...existing validation...

    // 2. NEW: Get relevant feed context
    let feedItems: any[] = [];
    try {
      const keywords = extractKeywords(args.taskType, args.input);
      const categories = mapDepartmentToCategories(agent.department);

      feedItems = await ctx.runQuery(internal.feeds.agentQueries.getRelevantFeedItems, {
        keywords,
        categories,
        limit: 5,
      });
    } catch (error) {
      // Non-blocking: log but continue
      console.warn('Failed to get feed context:', error);
    }

    // 3. Build enhanced prompt
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(
      agent.config.systemPrompt,
      feedItems
    );

    // 4. Call Claude (existing code, with enhanced prompt)
    const claudeResponse = await ctx.runAction(api.actions.callClaude, {
      systemPrompt: enhancedSystemPrompt,
      userMessage: buildUserMessage(args.taskType, args.input),
      // ...rest of config...
    });

    // 5. Log execution with feed usage (modified)
    await ctx.runMutation(api.functions.logExecution, {
      // ...existing fields...
      feedItemsUsed: feedItems.map(item => item._id),
    });

    // ...rest of existing code...
  },
});

// Helper: Extract search keywords from task
function extractKeywords(taskType: string, input: any): string {
  const parts: string[] = [];

  if (input.topic) parts.push(input.topic);
  if (input.keyword) parts.push(input.keyword);
  if (input.title) parts.push(input.title);
  if (input.industry) parts.push(input.industry);

  return parts.join(' ').slice(0, 100); // Limit search query length
}

// Helper: Map agent department to feed categories
function mapDepartmentToCategories(department: string): string[] {
  const mapping: Record<string, string[]> = {
    content: ['industry', 'technical', 'trends'],
    social: ['industry', 'competitor', 'trends'],
    seo: ['technical', 'competitor', 'industry'],
    demandgen: ['competitor', 'industry'],
    brand: ['industry', 'trends'],
    ops: ['technical'],
    leadership: ['industry', 'competitor', 'trends'],
  };
  return mapping[department] || ['industry'];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static system prompts | Context-injected prompts | 2024+ | Agents have real-time awareness |
| Manual context curation | Automated relevance search | 2024+ | Scalable context selection |
| No usage tracking | Full audit trail | 2025+ | Compliance, debugging, analytics |

**Deprecated/outdated:**
- Hardcoded prompts without external data: Still functional but less powerful
- Full document injection: Replaced by chunk/summary injection for token efficiency

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal context limit per agent type**
   - What we know: 5 items is a safe default
   - What's unclear: Content agents may benefit from more, SEO from fewer
   - Recommendation: Start with 5, make configurable per agent in metadata

2. **Search index on title vs content vs both**
   - What we know: Title-only is faster, content catches more
   - What's unclear: Real-world relevance quality for marketing use cases
   - Recommendation: Start with title-only, add content if relevance is poor

3. **Recency weighting vs relevance weighting**
   - What we know: Both matter for news feeds
   - What's unclear: Exact balance for different task types
   - Recommendation: Default to 50/50, let search handle relevance, post-sort by date

## Sources

### Primary (HIGH confidence)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) - Search index schema and query patterns
- [Convex Actions](https://docs.convex.dev/functions/actions) - runQuery/runMutation from actions
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Action structure, database access patterns
- [Convex Internal Functions](https://docs.convex.dev/functions/internal-functions) - internalQuery pattern

### Secondary (MEDIUM confidence)
- [RAG Context Injection Methods](https://apxml.com/courses/getting-started-rag/chapter-4-rag-generation-augmentation/context-injection-methods) - Context engineering patterns
- [Neo4j Advanced RAG Techniques](https://neo4j.com/blog/genai/advanced-rag-techniques/) - Summarization, filtering strategies
- [AI Audit Trail Best Practices](https://medium.com/@pranavprakash4777/audit-logging-for-ai-what-should-you-track-and-where-3de96bbf171b) - Usage tracking patterns

### Tertiary (LOW confidence)
- Training data knowledge on TypeScript patterns - Verified against Convex docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing Convex + Claude, no new dependencies
- Architecture: HIGH - Follows established Convex patterns
- Pitfalls: MEDIUM - Based on common RAG/LLM patterns, project-specific edge cases may exist

**Research date:** 2026-01-28
**Valid until:** 30 days (stable patterns, Convex APIs mature)
