# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**LLM & AI:**
- OpenAI API - Primary LLM for content generation and analysis
  - SDK/Client: Built-in fetch API with model mapping (claude-sonnet-4 → gpt-4o)
  - Auth: Environment variable `OPENAI_API_KEY`
  - Implementation: `convex/lib/llm.ts` - callLLM function abstracts Anthropic→OpenAI model translation
  - Models: gpt-4o (primary), gpt-4o-mini (haiku equivalent)
  - Rate Limiting: No explicit rate limiting at client (Convex Actions handle concurrency)

- Anthropic Claude API (Legacy/Fallback)
  - SDK/Client: @anthropic-ai/claude-code v2.1.19
  - Auth: Environment variable `ANTHROPIC_API_KEY`
  - Usage: Fallback for specific agent tasks, integration via Convex Actions

**Social Media & Content Publishing:**
- LinkedIn API v202601
  - Endpoint: `https://api.linkedin.com/rest/posts`
  - Auth: OAuth 2.0 token stored in Convex database (connections table)
  - Implementation: `convex/linkedin/actions.ts`
  - Features: Post text content, track engagement, daily rate limit (10 posts/day)
  - Connection status tracking: active, expired, revoked

- Twitter API v2
  - Endpoint: `https://api.twitter.com/2/tweets`
  - Auth: Bearer token (OAuth 2.0)
  - Implementation: `convex/twitter/actions.ts`
  - Features: Post tweets and threads
  - Managed via OAuth flow in `convex/oauthHelpers.ts`

- Instagram Graph API
  - Implementation: `convex/instagram/actions.ts`
  - Auth: Access token via OAuth
  - Features: Post content, track metrics (partial implementation)

**Email & Notifications:**
- Resend - Transactional email service
  - SDK/Client: resend v6.9.1
  - Auth: Environment variable `RESEND_API_KEY`
  - Implementation: `convex/reportsActions.ts`
  - Endpoints Used:
    - POST `https://api.resend.com/emails` - Send email reports
    - Optional: `https://api.resend.com/scopes` - Permission scoping
  - Features: Send automated marketing reports, notifications
  - Sender: AMD Reports <onboarding@resend.dev>
  - Conditional: Only sends if `settings.emailEnabled` and `settings.recipientEmail` configured

**Content Aggregation:**
- Web Scraping & Crawling
  - cheerio v1.0.0 - HTML/XML parsing (jQuery-like syntax)
  - Implementation: `convex/kb/scrapeUrl.ts`
  - Usage: Extract text from URLs for knowledge base
  - No auth required (public web scraping)

- RSS Feed Processing
  - feedsmith v2.9.0 - RSS/Atom feed parser
  - Usage: Ingest marketing content from industry feeds
  - No auth required

**File Processing (Knowledge Base Ingestion):**
- PDF Text Extraction
  - pdf-parse v2.4.5
  - Implementation: `convex/kb/processFile.ts`
  - Usage: Extract text from uploaded PDF files for knowledge base

- DOCX/Word Document Parsing
  - mammoth v1.11.0
  - Implementation: `convex/kb/processFile.ts`
  - Usage: Extract text from Word documents

- ZIP Archive Handling
  - jszip v3.10.1
  - Usage: Handle compressed file uploads

## Data Storage

**Databases:**
- Convex (Cloud Database)
  - Type: Real-time NoSQL database (managed)
  - Connection: Convex SDK via NEXT_PUBLIC_CONVEX_URL deployment URL
  - Client: Convex React bindings (useQuery, useMutation, useAction, usePaginatedQuery)
  - Features:
    - Real-time subscriptions via WebSocket
    - Automatic conflict resolution
    - ACID transactions (via mutations)
    - Full-text search on indexed fields
  - Schema: `convex/schema.ts` (11 tables)
    - agents (37 AI agents with configs)
    - tasks (execution history, status tracking)
    - content (created, drafted, published)
    - executions (agent run logs)
    - handoffs (agent delegation tracking)
    - connections (OAuth tokens for LinkedIn, Twitter, Instagram)
    - settings (user configuration)
    - analytics (metrics, costs, tokens used)
    - brandProfile (brand guidelines, audit data)
    - publishingSchedule (scheduled content)
    - strategySessions (CMO strategy planning)

**File Storage:**
- File uploads processed in-memory or stored as text in Convex
  - PDFs: Extracted text stored in content table
  - DOCX: Extracted text stored in content table
  - URLs: Scraped content stored in knowledge base
  - No separate blob storage (AWS S3, etc.) detected

**Caching:**
- None detected in codebase
- Real-time sync via Convex subscriptions provides cache-like behavior

## Authentication & Identity

**Auth Provider:**
- Clerk - Multi-tenant authentication
  - Implementation: `@clerk/nextjs` 6.37.3
  - Config: `convex/auth.config.ts`
    - JWT issuer domain via CLERK_JWT_ISSUER_DOMAIN environment variable
    - Application ID: "convex"
  - User Identity:
    - subject (Clerk user ID)
    - email, name, pictureUrl
    - tokenIdentifier (combined issuer + subject)
  - Dev Mode: `DEV_AUTH_BYPASS = true` in `convex/lib/auth.ts` for development (TODO: disable before production)
  - Mock dev identity: dev-user-001 with dev@amd.local email

**OAuth Flows:**
- Implemented in `convex/oauthHelpers.ts` and `convex/linkedin/actions.ts`
- Supports:
  - LinkedIn OAuth 2.0 for agent publishing
  - Twitter API 2.0 for thread posting
  - Instagram OAuth for content publishing
  - Token refresh and expiration handling

**API Authentication:**
- Public REST API (v1) - Token-based in `convex/http.ts`
  - Authorization: Bearer token header with `amd_live_*` prefix
  - Token validation: SHA-256 hash stored in Convex
  - Permissions system: granular per API key
  - Rate limiting: Per-key, 1-minute windows
  - Endpoints for:
    - POST /api/v1/tasks/create - Create agent task
    - GET /api/v1/agents/list - List agents
    - POST /api/v1/executions/stream - Stream execution logs

## Monitoring & Observability

**Error Tracking:**
- Not explicitly detected
- Errors logged via console/process.stderr in Convex Actions
- Error object stored in tasks table: `{ message, code, stack }`

**Logs:**
- Convex Cloud: Built-in logs via Convex dashboard
- Command: `npx convex logs` for CLI access
- Frontend: Browser console logs
- Backend: Node.js stderr via `console.error` and process logging
- Persistent logging: Task execution logs stored in executions table

**Performance & Analytics:**
- Vercel Analytics - Web vital metrics (Lighthouse metrics)
  - Package: @vercel/analytics v1.6.1
  - Tracks: CLS, FID, FCP, LCP, TTFB
  - No configuration required (automatic in Next.js)

- Vercel Speed Insights - Real User Monitoring (RUM)
  - Package: @vercel/speed-insights v1.3.1
  - Dashboard: Vercel Speed Insights console
  - Endpoint: https://vitals.vercel-insights.com
  - Browser support: Modern browsers with Web Vitals API

**Token/Cost Tracking:**
- Convex built-in: Token counting in actions
- Stored in analytics table: Usage tokens, API costs
- Queries in `convex/analytics.ts` for token/cost reporting

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (Next.js deployment)
- Backend: Convex Cloud (serverless database + functions)
- Deployment commands:
  - `npm run deploy` - Deploy Convex backend
  - Frontend auto-deploys from git push (Vercel)

**CI Pipeline:**
- GitHub Actions (configured in `.github/workflows/`)
- Pre-commit hooks: Husky v9.1.7 with lint-staged v16.2.7
  - Runs ESLint before commit
- Build: Next.js with TypeScript strict mode

**Version Control:**
- Git repository at `/home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/.git`
- Branch protection: main branch requires review (typical)

## Environment Configuration

**Required env vars:**
```
OPENAI_API_KEY                    # LLM API calls
CONVEX_DEPLOYMENT                # Convex project deployment ID
NEXT_PUBLIC_CONVEX_URL            # Frontend Convex endpoint
CLERK_JWT_ISSUER_DOMAIN          # Auth JWT issuer
CLERK_PUBLISHABLE_KEY             # Clerk frontend key (if not set via Clerk integration)
```

**Optional env vars:**
```
ANTHROPIC_API_KEY                # Fallback LLM (legacy)
RESEND_API_KEY                   # Email sending
LINKEDIN_ACCESS_TOKEN             # LinkedIn OAuth token
TWITTER_ACCESS_TOKEN              # Twitter OAuth token
INSTAGRAM_ACCESS_TOKEN            # Instagram OAuth token
N8N_WEBHOOK_BASE_URL             # n8n workflow orchestration webhooks
ANALYZE                           # Enable bundle size analysis (ANALYZE=true npm run build)
```

**Secrets location:**
- `.env.local` (root) - Primary secrets file (in .gitignore)
- `.env.example` (root) - Template for required variables
- Clerk: Environment variables in Clerk dashboard
- Vercel: Environment variables in Vercel project settings

## Webhooks & Callbacks

**Incoming:**
- Convex HTTP Router (`convex/http.ts`) exposes REST API
  - POST /api/v1/tasks/create - Create task for agent
  - POST /api/v1/executions/stream - Stream task execution
  - GET /api/v1/agents/list - List agents
- n8n workflow callbacks (optional) via `N8N_WEBHOOK_BASE_URL`
- Clerk authentication callbacks (automatic)

**Outgoing:**
- LinkedIn API callbacks (OAuth redirect to frontend)
- Twitter API callbacks (OAuth redirect to frontend)
- Instagram API callbacks (OAuth redirect to frontend)
- Resend email delivery status (optional webhooks)
- Vercel Analytics automatic HTTPS calls to vitals.vercel-insights.com
- No explicit webhook publishing to external services detected

## Rate Limiting & Quotas

**LinkedIn:**
- Daily post limit: 10 posts/day per connection
- Checked in `convex/linkedin/actions.ts` before publishing

**API Keys:**
- Token rate limiting: 1-minute window enforced in `convex/http.ts`
- Limits configurable per API key in Convex

**LLM Usage:**
- No per-call rate limiting (OpenAI plan determines limits)
- Token counting via `callLLM` result in `convex/lib/llm.ts`
- Tracked for cost analysis in analytics table

---

*Integration audit: 2026-02-14*
