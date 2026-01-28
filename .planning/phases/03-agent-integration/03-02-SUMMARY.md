---
phase: 03-agent-integration
plan: 02
subsystem: feeds-agent-integration
tags: [convex, actions, feed-context, agent-execution, prompt-injection]

dependency-graph:
  requires:
    - 03-01 (Search Infrastructure & Agent Feed Query)
  provides:
    - Feed context injection in executeAgent action
    - Helper functions for keyword extraction and category mapping
    - OPT-IN feed access via agent.config.tools
    - Usage tracking via feedItemsUsed in execution logs
  affects:
    - 04-XX (AI Enrichment phases)
    - All agent execution flows

tech-stack:
  added: []
  patterns:
    - "OPT-IN feed access gating via tools array"
    - "Non-blocking feed queries with try/catch"
    - "System prompt extension for context injection"
    - "Department-to-category mapping for relevance"

key-files:
  created: []
  modified:
    - convex/actions.ts
    - convex/seed.ts

decisions:
  - id: AGT-05
    decision: "OPT-IN feed access via tools: ['feeds'] in agent config"
    rationale: "Safe default - prevents unintended feed injection for agents not configured for it"
  - id: AGT-06
    decision: "Non-blocking feed queries with try/catch"
    rationale: "Feed failures should never block agent execution - feeds are enhancement, not requirement"
  - id: AGT-07
    decision: "5 items max with 7-day lookback"
    rationale: "Balance between context richness and token budget (~2000 tokens)"
  - id: AGT-08
    decision: "Leadership agents (cmo, directors) also get feeds"
    rationale: "Strategic context valuable for coordination and decision-making"

metrics:
  duration: 266s
  completed: 2026-01-28
---

# Phase 3 Plan 02: Agent Context Injection Summary

**Feed context injection into executeAgent action with OPT-IN gating, keyword extraction, and usage tracking.**

## One-liner

executeAgent queries relevant feed items, injects into system prompt, and tracks usage - enabled for content/SEO/social agents via tools: ["feeds"].

## Performance

- **Duration:** 4 min 26s
- **Started:** 2026-01-28T12:28:44Z
- **Completed:** 2026-01-28T12:33:10Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added 3 helper functions for feed context handling (extractKeywords, mapDepartmentToCategories, buildEnhancedSystemPrompt)
- Modified executeAgent to fetch and inject feed context before Claude API call
- Implemented OPT-IN gating: feeds only enabled if agent.config.tools includes "feeds"
- Added feedItemsUsed tracking in execution logs
- Enabled feeds for 22 agents across content, SEO, social, and leadership departments

## Task Commits

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Add feed context helper functions | c843e71 | convex/actions.ts |
| 2 | Modify executeAgent for feed context injection | f8167dd | convex/actions.ts |
| 3 | Enable feeds tool for relevant agents | c3e3244 | convex/seed.ts |

## Files Created/Modified

- `convex/actions.ts` - Added 3 helper functions (extractKeywords, mapDepartmentToCategories, buildEnhancedSystemPrompt), modified executeAgent to fetch feed context, inject into prompt, and track usage
- `convex/seed.ts` - Added tools: ["feeds"] to 22 agents in content, SEO, social, and leadership departments

## What Was Built

### 1. Helper Functions

**extractKeywords(taskType, input):** Extracts search keywords from common input fields (topic, keyword, title, industry, subject, query, searchTerms). Special handling for SEO tasks to include targetKeyword and keywords array.

**mapDepartmentToCategories(department):** Maps agent department to relevant feed categories:
- content: ["industry", "technical", "trends"]
- social: ["industry", "competitor", "trends"]
- seo: ["technical", "competitor", "industry"]
- demandgen: ["competitor", "industry"]
- brand: ["industry", "trends"]
- ops: ["technical"]
- leadership: ["industry", "competitor", "trends"]

**buildEnhancedSystemPrompt(basePrompt, feedItems):** Formats feed items and appends to system prompt with "Relevant Industry Context" section.

### 2. executeAgent Feed Integration

Modified handler flow:
1. Get agent configuration
2. **NEW: Fetch feed context (non-blocking)**
   - Check if feeds enabled via tools array
   - Extract keywords from task input
   - Map department to categories
   - Call getRelevantFeedItems internal query
   - Handle errors gracefully (console.warn, continue)
3. Create task
4. Update status to running
5. Build user message
6. **NEW: Build enhanced system prompt with feed context**
7. Call Claude with enhanced prompt
8. Calculate cost
9. **MODIFIED: Log execution with feedItemsUsed**
10. Update task as completed

### 3. Agents with Feeds Enabled

| Department | Agents | Count |
|------------|--------|-------|
| Leadership | cmo-001 | 1 |
| Content | content-director, content-001 to content-005 | 6 |
| Social | social-manager, social-001 to social-007 | 8 |
| SEO | seo-manager, seo-001 to seo-004 | 5 |
| Demand Gen | demandgen-director | 1 |
| Brand | brand-director | 1 |
| **Total** | | **22** |

Agents NOT enabled: ops-* (technical focus), brand-001 to brand-003 (creative focus), demandgen-001 to demandgen-006 (operational focus)

## Decisions Made

1. **OPT-IN feed access** - Feeds are enabled ONLY if agent.config.tools explicitly includes "feeds". Safe default prevents unintended injection.

2. **Non-blocking feed queries** - Wrapped in try/catch with console.warn. Feed failures never block agent execution.

3. **Leadership agents get feeds** - CMO and directors benefit from strategic industry context for coordination and decision-making.

4. **Department-to-category mapping** - Each department maps to 1-3 relevant feed categories for targeted context.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles without errors
- [x] executeAgent calls internal.feeds.agentQueries.getRelevantFeedItems
- [x] System prompt includes "Relevant Industry Context" section when feeds match
- [x] logExecution receives feedItemsUsed parameter
- [x] Feeds are OPT-IN via tools: ["feeds"] check
- [x] Content, SEO, and Social agents have feeds enabled
- [x] Feed failures handled gracefully (non-blocking)

## How to Test

Execute an agent WITH feeds enabled and topic input:
```bash
npx convex run actions:executeAgent '{"agentId": "content-001", "taskType": "test", "input": {"topic": "AI marketing"}}'
```

Expected:
- Feed context fetched (if matching feeds exist)
- System prompt enhanced with "Relevant Industry Context" section
- Execution log includes feedItemsUsed array (if items matched)

Execute an agent WITHOUT feeds enabled:
```bash
npx convex run actions:executeAgent '{"agentId": "ops-001", "taskType": "test", "input": {"topic": "email automation"}}'
```

Expected:
- No feed context fetching (feedsEnabled = false)
- Standard system prompt used
- No feedItemsUsed in execution log

## Next Phase Readiness

**Phase 3 Complete!**

All requirements covered:
- AGNT-01: Search index on feedItems.title (03-01)
- AGNT-02: Feed category filtering via feedId filterField (03-01)
- AGNT-03: Execution tracking with feedItemsUsed field (03-01 + 03-02)
- AGNT-04: Internal query for agent feed access (03-01)
- AGNT-05: Content agents receive relevant feed items (03-02)
- AGNT-06: SEO agents monitor competitor content (03-02)
- AGNT-07: Social agents curate from feeds (03-02)

**Ready for Phase 4:** AI Enrichment
- Topic extraction
- Sentiment analysis
- Summary generation
- Relevance scoring

**No blockers identified.**

---
*Phase: 03-agent-integration*
*Completed: 2026-01-28*
