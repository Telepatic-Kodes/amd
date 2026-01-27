# Codebase Concerns

**Analysis Date:** 2026-01-27

## Tech Debt

**Loose Type Safety with v.any():**
- Issue: Schema uses `v.any()` for multiple critical fields (8 occurrences), bypassing Convex's type validation layer
- Files: `convex/schema.ts`, `convex/functions.ts`, `convex/actions.ts`
- Impact: Runtime errors become harder to catch, data shape inconsistencies, difficult debugging when agents pass unexpected data structures
- Fix approach: Replace `v.any()` with explicit object schemas for:
  - `tasks.input` and `tasks.output` - define expected shape per task type
  - `handoffs.payload` - create HandoffPayload type
  - `content.metadata` - replace with explicit metadata object schema
  - `metrics.data` - create typed metric objects per metric type
  - `settings.value` - create union of expected setting value types

**Monolithic Seed File (1611 lines):**
- Issue: `convex/seed.ts` contains all 37 agent definitions in a single file, making it hard to maintain and review individual agents
- Files: `convex/seed.ts`
- Impact: Difficult to add/modify agents, large merge conflicts when multiple developers work on seeds, hard to test individual agents
- Fix approach: Break seed into modules:
  - `convex/seeds/leadership.ts`
  - `convex/seeds/content.ts`
  - `convex/seeds/social.ts`
  - `convex/seeds/demandgen.ts`
  - `convex/seeds/seo.ts`
  - `convex/seeds/brand.ts`
  - `convex/seeds/ops.ts`
  - Import and combine in `convex/seed.ts`

**No Rate Limiting on Claude API Calls:**
- Issue: Direct fetch calls to Claude API in `convex/actions.ts` have no rate limiting, throttling, or queue mechanism
- Files: `convex/actions.ts:24`, `convex/actions.ts:119`
- Impact: Potential cost explosion from concurrent agent executions, API rate limit hits could cause cascading failures
- Fix approach:
  - Implement queue system for Claude API calls (use Convex scheduler)
  - Add concurrency limiter (max N concurrent calls)
  - Add exponential backoff for 429 responses
  - Track token usage and cost in real-time with alerts

**Weak Input Validation:**
- Issue: Task input validation is minimal - `input: v.any()` allows any data structure without schema validation
- Files: `convex/functions.ts:createTask`, `convex/actions.ts:executeAgent`
- Impact: Malformed task data can cause agent failures, inconsistent output formats, debugging nightmares
- Fix approach: Create input validators per task type in `convex/validators/` directory

## Security Considerations

**API Keys in Frontend Settings:**
- Risk: Settings page allows storing API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) in client-side form state
- Files: `ai-marketing-department/ai-marketing-department/app/settings/page.tsx:146-200`
- Current mitigation: Keys stored in Convex settings table (server-side), but form temporarily holds raw keys in React state
- Recommendations:
  - Never accept API keys in frontend forms
  - Implement token-based auth instead (OAuth or service account keys)
  - Add CSP headers to prevent key leakage
  - Audit all network requests to ensure keys aren't logged
  - Consider key rotation mechanism

**Missing API Authentication:**
- Risk: n8n webhooks and external integrations have placeholder configuration without real auth
- Files: `.env.example:23-26`, `CLAUDE.md:354`
- Current mitigation: None - environment variables show optional auth but not enforced
- Recommendations:
  - Implement signature verification for all incoming webhooks (HMAC-SHA256)
  - Add authentication token validation for all API endpoints
  - Rotate N8N_API_KEY regularly
  - Document required security headers

**Unvalidated External Service Responses:**
- Risk: Claude API response handling doesn't validate response structure before accessing nested properties
- Files: `convex/actions.ts:50-53`
- Impact: Unexpected API response format could cause crashes; missing null checks on `data.content[0].text`
- Fix approach:
  ```typescript
  // Add validation
  if (!data?.content?.[0]?.text) {
    throw new Error("Invalid Claude API response structure");
  }
  ```

## Performance Bottlenecks

**No Pagination in List Queries:**
- Problem: `listAgents()`, `listTasks()`, `listContent()` in `convex/functions.ts` return all matching records without pagination
- Files: `convex/functions.ts:26-44` (listAgents), similar for other queries
- Impact: O(N) query times, memory explosion with 10k+ records, slow frontend UI with large datasets
- Improvement path:
  - Add cursor-based pagination to all list functions
  - Implement limit/offset parameters
  - Add indexes on frequently sorted fields (createdAt, updatedAt)

**Frontend Real-time Subscription Overhead:**
- Problem: Dashboard pages use `useQuery()` without pagination or filtering, subscripting to full collections
- Files: `ai-marketing-department/ai-marketing-department/app/agents/page.tsx:70-73`, similar across all pages
- Impact: Wasteful real-time sync, high bandwidth, slow page loads when agent count grows
- Improvement path:
  - Implement view-model queries (pre-aggregated data)
  - Add client-side caching and deduplication
  - Implement connection pooling for real-time updates

**No Query Result Caching:**
- Problem: Multiple components may query same data (agents, campaigns) without client-side cache
- Impact: Repeated network roundtrips, wasteful real-time subscriptions, high memory usage
- Fix approach: Implement React Query or Convex caching strategy

**Cost Tracking Not Real-time:**
- Problem: Claude API cost calculations in `convex/actions.ts:193-210` use hardcoded rates not updated for new models
- Files: `convex/actions.ts:193-210`
- Impact: Cost estimates become inaccurate as new Claude models are released
- Fix approach:
  - Store pricing in database settings
  - Add endpoint to update pricing without code changes
  - Implement cost alerts when spending exceeds budget

## Fragile Areas

**Handoff System Lacks Validation:**
- Files: `convex/functions.ts:createHandoff`, `convex/schema.ts:143-163`
- Why fragile:
  - No validation that `toAgent` can actually accept handoff from `fromAgent`
  - No checking if receiving agent is active/available
  - No timeout if handoff never accepted
  - Payload structure is `v.any()` - no shape guarantee
- Safe modification:
  - Add `canDelegateTo` validation before creating handoff
  - Implement timeout mechanism (fail handoff after 24h if not accepted)
  - Create typed handoff payloads per handoff type
- Test coverage: Handoff acceptance/rejection paths untested

**Agent Status Transitions Unrestricted:**
- Issue: `updateAgentStatus()` allows any status transition without validation
- Files: `convex/functions.ts:122-152`
- Why fragile: Invalid state transitions (e.g., error → paused → active) not prevented, no state machine
- Safe modification: Implement state machine with allowed transitions
- Test coverage: Missing - no tests for invalid transitions

**Task Retry Logic Incomplete:**
- Issue: `retryTask()` retries up to `maxRetries` but doesn't prevent infinite loops
- Files: `convex/functions.ts:retryCount >= task.maxRetries`
- Why fragile: No exponential backoff, same error likely occurs again, no DLQ for permanently failed tasks
- Safe modification:
  - Add exponential backoff logic
  - Implement dead letter queue for failed tasks after max retries
  - Add retry_reason tracking per attempt
- Test coverage: Retry scenarios untested

**Concurrency Issues in Task Updates:**
- Issue: Task status updates in `executeAgent()` use multiple mutations without atomic operation
- Files: `convex/actions.ts:98-161`
- Impact: Race conditions if same task executed twice, status updates can interleave
- Safe modification: Use single atomic mutation for task creation, status update, and execution logging

**Agent Hierarchy Cycles Possible:**
- Issue: `reportsTo` field allows circular reporting relationships
- Files: `convex/schema.ts:46`, `convex/functions.ts:updateAgentConfig`
- Impact: Delegation chains could loop infinitely (A→B→C→A)
- Safe modification: Add cycle detection before allowing reportsTo changes

## Test Coverage Gaps

**No Backend Unit Tests:**
- What's not tested:
  - Task creation and status transitions
  - Agent hierarchy operations
  - Handoff payload validation
  - Claude API cost calculations
  - Retry logic and exponential backoff
- Files: `convex/functions.ts`, `convex/actions.ts`, `convex/seed.ts`
- Risk: Breaking changes to agent execution flow go undetected; cost calculations become incorrect
- Priority: High - core business logic is untested

**No Integration Tests:**
- What's not tested:
  - End-to-end agent execution flow (task creation → Claude call → task completion)
  - Handoff chains (A delegates to B delegates to C)
  - Real Convex database interactions
  - Task failure and retry scenarios
- Risk: System could fail at scale; handoff chains might have hidden bugs
- Priority: High

**No Frontend Component Tests:**
- What's not tested:
  - Agent filtering and search (likely has bugs with empty results)
  - Campaign CRUD operations
  - Settings form validation and error handling
  - Real-time data binding edge cases
- Files: `ai-marketing-department/ai-marketing-department/app/**`
- Risk: UI regressions, broken user workflows, silent data loss
- Priority: Medium

**No E2E Tests:**
- Missing: Complete workflows like "create task → execute agent → publish content → post to social"
- Risk: Cross-system failures only caught in production
- Priority: Medium

## Known Bugs

**API Key Storage in Browser State:**
- Symptoms: Sensitive keys visible in browser devtools
- Files: `ai-marketing-department/ai-marketing-department/app/settings/page.tsx:41`
- Trigger: User loads settings page and edits API key field
- Workaround: Manually clear browser state after settings update

**Missing Error Messages in Mutations:**
- Symptoms: User sees generic error without context
- Files: `ai-marketing-department/ai-marketing-department/app/settings/page.tsx:49-52`
- Trigger: API call fails (network error, validation error, etc.)
- Workaround: Check browser console for actual error

**Empty Results Not Handled:**
- Symptoms: If no agents/campaigns match filters, page shows nothing with no feedback
- Files: `ai-marketing-department/ai-marketing-department/app/agents/page.tsx:75-90`
- Trigger: Filter agents with no results
- Workaround: Clear filters to see agents again

## Scaling Limits

**Database Row Count:**
- Current capacity: Convex handles ~1M documents per table efficiently
- Limit: Beyond 10M documents, pagination becomes critical
- Scaling path:
  - Implement cursor-based pagination (already mentioned)
  - Archive old tasks/content to separate tables
  - Implement data retention policies (delete tasks > 90 days old)

**Concurrent Claude API Calls:**
- Current capacity: Limited by Claude API tier (~100 req/min on free tier)
- Limit: Each agent execution = 1 Claude call; 37 agents × multiple daily triggers = potential overload
- Scaling path:
  - Queue-based execution (Convex scheduler)
  - Request batching where possible
  - Upgrade to higher Claude API tier with higher limits

**Real-time Subscription Connections:**
- Current capacity: Convex handles ~10k concurrent connections per deployment
- Limit: With 37 live agent dashboards × multiple users = connection explosion possible
- Scaling path:
  - Implement view aggregation (dashboard shows aggregated metrics, not individual updates)
  - Add client-side caching and update coalescing
  - Implement presence system to track active viewers

**Frontend Bundle Size:**
- Current: No indication of bundle analysis
- Risk: Charts, animations, icons could bloat JavaScript
- Scaling path: Add bundle size monitoring in CI/CD

## Dependencies at Risk

**n8n Integration Incomplete:**
- Risk: Project mentions n8n heavily but no actual n8n workflow code in repo
- Impact: Workflow orchestration features can't be deployed; handoff mechanism not integrated
- Migration plan: Either implement n8n integration properly or remove from documentation

**Anthropic API Hard Dependency:**
- Risk: All agent execution depends on Claude API; no fallback model support
- Impact: Service outage if Claude API fails
- Migration plan: Add support for fallback models (OpenAI mentioned in settings but not implemented)

---

*Concerns audit: 2026-01-27*
