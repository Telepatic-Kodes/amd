# External Integrations

**Analysis Date:** 2026-01-27

## APIs & External Services

**LLM/AI:**
- Claude API (Anthropic) - Core AI engine for all agent tasks
  - SDK/Client: Direct HTTPS calls, no SDK package required
  - Auth: Environment variable `ANTHROPIC_API_KEY` (required in `.env.local`)
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Pricing integration: Costs tracked per execution with model-specific pricing

**Claude Code CLI (Alternative Execution):**
- Tool: `claude` command-line interface
  - Method: `execFileSync("claude", ["--print", "-p", prompt])`
  - Used in: `/scripts/run-agent.js`, `/scripts/run-agent-sdk.ts`
  - Plan: Max plan with zero API costs
  - Implementation: `scripts/run-agent.js` lines 40-52

**Planned/Optional Integrations (documented but not actively configured):**
- Meta (Facebook/Instagram) Ads API
  - Env var: `META_ACCESS_TOKEN`
  - Use case: `demandgen-002` agent for Meta Ads management
- Google Ads API
  - Env var: `GOOGLE_ADS_CLIENT_ID`
  - Use case: `demandgen-003` agent for Google Ads optimization
- LinkedIn API
  - Env var: `LINKEDIN_ACCESS_TOKEN`
  - Use case: `demandgen-004` agent for B2B targeting
- n8n (Workflow Orchestration)
  - Env var: `N8N_WEBHOOK_BASE_URL`
  - Purpose: Cross-agent coordination and workflow triggers
- SendGrid (Email Delivery)
  - Env var: `SENDGRID_API_KEY`
  - Use case: `ops-002` and `ops-003` agents for email campaigns

## Data Storage

**Databases:**
- Convex (primary database)
  - Type: NoSQL document database with real-time sync
  - Connection: Deployed cloud service via `CONVEX_DEPLOYMENT` credential
  - Client: Convex SDK (`convex` package)
  - URL: `https://{deployment-name}.convex.cloud` from `NEXT_PUBLIC_CONVEX_URL`
  - Tables: 11 tables defined in `convex/schema.ts`
    - `agents` - Agent definitions and configuration
    - `tasks` - Task assignments and execution queue
    - `executions` - Task execution logs with token usage and cost tracking
    - `handoffs` - Agent-to-agent task transfers
    - `content` - Generated marketing content
    - `campaigns` - Campaign definitions and metrics
    - `keywords` - SEO keyword tracking
    - `prompts` - Reusable prompt library
    - `metrics` - Aggregated performance metrics
    - `settings` - System configuration
    - `auditLog` - Complete audit trail

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Remotion video outputs to `out/demo.mp4` and `out/preview.mp4`

**Caching:**
- None detected in primary stack
- Real-time sync via Convex WebSocket connections

## Authentication & Identity

**Auth Provider:**
- Custom Convex backend (no external auth provider)
- Authentication method: Not implemented in codebase
- Dashboard access: Assumed to be public or protected by deployment environment

**API Key Management:**
- `ANTHROPIC_API_KEY` - Passed via environment variables to Convex actions
- Location: `.env.local` (git-ignored, not committed)
- Usage: Loaded via `process.env.ANTHROPIC_API_KEY` in `convex/actions.ts` line 19

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar integration

**Logs:**
- Convex console logs via `npx convex logs`
- Execution logs stored in `executions` table with:
  - `status` (success/failure)
  - `error` (message and code if failed)
  - `tokensUsed` (input, output, total)
  - `duration` (execution time in ms)
  - `cost` (USD equivalent)
  - `timestamp`
- Audit trail in `auditLog` table for all state changes

**Metrics Collection:**
- Metrics table tracks:
  - Agent performance (by agentId, period)
  - Content performance (engagement, reach)
  - Campaign performance (impressions, clicks, conversions, revenue)
  - Cost tracking (by agent, period)
  - Data: Custom JSON per metric type

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (recommended for Next.js, via GitHub/Git integration)
- Backend: Convex cloud (auto-deployed via `npx convex deploy`)

**CI Pipeline:**
- Not detected in current setup
- Manual deployments required:
  - Backend: `npm run deploy` calls `convex deploy`
  - Frontend: `npm run build` then deploy to Vercel

**Environment Configuration:**
- Next.js: Via Vercel dashboard or `.env.local` file
- Convex: Auto-injected from `.env.local` created by `npx convex login`
- Secrets: Handled by Vercel and Convex dashboard (no `.env.local` in git)

## Webhooks & Callbacks

**Incoming (Agent Triggers):**
- Webhook trigger type defined in schema: `v.literal("webhook")`
- Implementation: Not yet implemented in codebase
- Intended use: Trigger agents from external services (n8n, etc.)
- Endpoint pattern: Not defined (needs implementation)

**Outgoing (Agent Handoffs):**
- Internal handoff system in `handoffs` table
- `createHandoff` mutation: Transfers tasks between agents
- Example: `convex/actions.ts` lines 85-87 shows query pattern
- Handoff types in schema: `pending`, `accepted`, `rejected`, `completed`

**Scheduled Execution (Crons):**
- Hourly trigger: 00:00 UTC every hour (`cron:hourly`)
- Daily trigger: 06:00 UTC daily (`cron:daily`)
- Weekly trigger: Monday 07:00 UTC (`cron:weekly`)
- Implementation: `convex/crons.ts` registers with Convex cronJobs API
- Handler: `api.actions.runScheduledAgents` executes all agents matching trigger

## Detailed Integration Points

**Convex Backend Service (`convex/`)**

- Real-time database sync via WebSocket
- Serverless function execution
- Cron job scheduling

**Convex Actions (LLM Integration):**

Location: `convex/actions.ts`

1. **callClaude action (lines 10-63):**
   - Direct Claude API call via HTTPS fetch
   - Args: systemPrompt, userMessage, model (optional), temperature (optional), maxTokens (optional)
   - Response: { content, usage.inputTokens, usage.outputTokens, model, stopReason }
   - Error handling: Throws on HTTP error or missing ANTHROPIC_API_KEY

2. **executeAgent action (lines 68-187):**
   - Orchestrates: Query agent config → Create task → Call Claude → Log execution → Update task status
   - Cost calculation per model (lines 193-211):
     - Claude Opus 4.5: $15/$75 per 1M tokens (input/output)
     - Claude Sonnet 4: $3/$15 per 1M tokens (default)
     - Claude Haiku 3: $0.25/$1.25 per 1M tokens
   - Retry logic: Configured per agent in database
   - Task tracking: All executions logged with metrics

3. **runScheduledAgents action (lines 298-353):**
   - Triggered by Convex crons
   - Filters agents by trigger type (cron:hourly, cron:daily, cron:weekly)
   - Executes each agent sequentially, collects results

**Frontend (Next.js) Integration with Convex:**

Location: `/ai-marketing-department/ai-marketing-department/`

- ConvexClientProvider: `app/ConvexClientProvider.tsx` wraps app with Convex React context
- useQuery hook: Real-time queries subscribed to database changes
- useMutation hook: Client-side mutations to backend
- usePaginatedQuery: Paginated data loading
- Example usage: `app/page.tsx` lines 6-9 shows `useQuery(api.functions.listAgents)`

**Video Rendering Integration (Remotion):**

- Configuration: `remotion.config.ts`
- Library: `@remotion/cli` and `@remotion/player`
- Purpose: Generate marketing video content (product demos, explainers)
- CLI commands: `remotion:preview`, `remotion:render`
- Output: MP4 videos to `out/` directory

**Scripts & External Execution:**

Location: `/scripts/`

- `run-agent.js` (lines 20-52): Wraps Claude Code CLI, calls Convex API
- `run-agent-sdk.ts`: Alternative SDK-based execution
- Workflow scripts: `workflow-*.js` files orchestrate multi-agent sequences
- Convex API calls: POST to `{CONVEX_URL}/api/query|mutation` endpoints

## Environment Variable Reference

**Required (.env.local):**
```
CONVEX_DEPLOYMENT=dev:accurate-panther-884
CONVEX_URL=https://accurate-panther-884.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://accurate-panther-884.convex.cloud
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional (planned features):**
```
N8N_WEBHOOK_BASE_URL=https://your-n8n.com
META_ACCESS_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
LINKEDIN_ACCESS_TOKEN=...
SENDGRID_API_KEY=...
```

## Integration Health Checks

**Critical Checks:**
- Convex deployment active: Test with `npx convex logs`
- Claude API key valid: Test with `convex/actions.ts` callClaude function
- Environment variables loaded: Check `.env.local` exists

**Recommended Additions:**
- Add error tracking (Sentry, LogRocket)
- Implement webhook endpoints for external triggers
- Add rate limiting for API calls
- Configure webhooks to n8n for workflow coordination

---

*Integration audit: 2026-01-27*
