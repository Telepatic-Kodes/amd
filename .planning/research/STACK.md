# Technology Stack: v3.0 Additions

**Project:** AMD (AI Marketing Department)
**Researched:** 2026-02-05
**Focus:** Stack additions for Analytics, Multi-Platform Publishing, and Multi-User Authentication

---

## Executive Summary

v3.0 adds three major capability areas to AMD. The recommended stack leverages:

1. **Clerk** for production-ready authentication with Convex (not Convex Auth which is still beta)
2. **Native social platform APIs** accessed via Convex actions (no wrapper SDKs needed for most)
3. **Recharts** for analytics visualization (already in use, needs expansion)
4. **Convex Aggregate component** for efficient analytics data aggregation

**Key principle:** Minimize new dependencies. Use Convex actions for external API calls rather than adding client-side SDKs where possible.

---

## Recommended Stack Additions

### 1. Authentication: Clerk

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|----------------|
| `@clerk/nextjs` | `^6.37.1` | Multi-user authentication, user management, organizations | **Production-ready** with official Convex integration. Convex Auth is still beta. Free tier: 10,000 MAU + 100 organizations. |
| `@clerk/backend` | `^1.x` | Server-side auth verification in Convex actions | Required for validating JWT tokens in Convex backend |

**Why Clerk over alternatives:**

- **Convex Auth (NOT recommended):** Still in beta as of Feb 2026. Documentation states "isn't complete and may change in backward-incompatible ways." Not suitable for production multi-user app.
- **Auth.js/NextAuth (NOT recommended):** Requires Next.js server; adds state sync complexity between Next.js and Convex. Convex Auth solves this by running on Convex backend directly, but Convex Auth is beta.
- **Clerk (RECOMMENDED):** Production-ready since 2023. Official Convex integration via `ConvexProviderWithClerk`. Handles user sync to Convex database automatically. Free tier sufficient for MVP (10K MAU, 100 orgs).

**Integration approach:**
- Frontend: Wrap app with `<ClerkProvider>` and `<ConvexProviderWithClerk>`
- Backend: Use `ctx.auth.getUserIdentity()` in Convex queries/mutations
- User data stored in Convex `users` table (auto-synced by Clerk webhook)

**Pricing considerations:**
- **Free tier:** 10,000 MAU, 100 organizations (5 members each)
- **Pro tier:** $25/month + $0.02/MAU after 10K + $1/org after 100
- **Organizations add-on:** $1/MAO (monthly active org), unlimited members per org
- **Enhanced B2B add-on:** $100/month (custom roles, domain restrictions)

For MVP with <10K users and <100 orgs, Clerk is free.

---

### 2. Social Platform APIs

#### 2.1 Twitter/X API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `twitter-api-v2` | `^1.18.x` | Post tweets, threads, get analytics | Official community library, strongly typed TypeScript, OAuth 2.0 support |

**API Requirements:**
- **Free tier:** 1,500 tweets/month write limit (sufficient for MVP testing)
- **Basic tier:** $200/month → 50,000 tweets/month write, 15,000 read
- **Pro tier:** $5,000/month → 300,000 tweets/month write, 1M read
- **Authentication:** OAuth 2.0 (user-context) for publishing, OAuth 2.0 App-Only for analytics

**Implementation pattern:**
```typescript
// In Convex action (server-side)
import { TwitterApi } from 'twitter-api-v2';

export const publishTweet = action({
  args: { text: v.string(), userId: v.id('users') },
  handler: async (ctx, args) => {
    const credentials = await getTwitterCredentials(ctx, args.userId);
    const client = new TwitterApi(credentials);
    const tweet = await client.v2.tweet(args.text);
    // Store tweet ID in Convex for analytics tracking
    await ctx.runMutation(internal.content.storeTweetId, {
      contentId: args.contentId,
      tweetId: tweet.data.id,
    });
  }
});
```

**Why twitter-api-v2:**
- Recommended by X Developer Platform official docs
- Full TypeScript support (type-safe API calls)
- Supports OAuth 2.0 (modern standard)
- Active maintenance (latest update Jan 2026)

---

#### 2.2 Instagram Business API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `facebook-nodejs-business-sdk` | `^24.0.1` | Publish to Instagram, get analytics | Official Meta SDK, supports Instagram Graph API |

**API Requirements:**
- **Account type:** Instagram Business or Creator account only (linked to Facebook Page)
- **Publishing limits:** 25 posts per 24-hour rolling window
- **Supported formats:** JPEG images only (PNG not supported)
- **Supported content types:** Feed posts, Reels (since 2022), Stories (since 2023)

**Publishing workflow:**
1. Create media container: `POST /{ig-user-id}/media`
2. Wait for `FINISHED` status
3. Publish: `POST /{ig-user-id}/media_publish`

**Implementation pattern:**
```typescript
// In Convex action
import { FacebookAdsApi, IGUser } from 'facebook-nodejs-business-sdk';

export const publishInstagramPost = action({
  args: {
    imageUrl: v.string(),
    caption: v.string(),
    userId: v.id('users')
  },
  handler: async (ctx, args) => {
    const credentials = await getInstagramCredentials(ctx, args.userId);
    const api = FacebookAdsApi.init(credentials.access_token);

    // Create container
    const container = await new IGUser(credentials.ig_user_id).createMedia({
      image_url: args.imageUrl,
      caption: args.caption,
    });

    // Wait for processing (poll status or use webhook)
    // Then publish
    const published = await new IGUser(credentials.ig_user_id).createMediaPublish({
      creation_id: container.id,
    });

    await ctx.runMutation(internal.content.storeInstagramPostId, {
      contentId: args.contentId,
      igPostId: published.id,
    });
  }
});
```

**Why facebook-nodejs-business-sdk:**
- Official Meta library (maintained by Facebook)
- Supports Instagram Graph API v24.0+
- Handles pagination, cursors, batch operations
- Latest version (24.0.1) published Dec 2025

**Limitations to communicate to users:**
- JPEG only (no PNG, no GIF)
- 25 posts/day hard limit
- Business/Creator accounts only (not personal)
- Requires Facebook Page connection

---

#### 2.3 LinkedIn Analytics API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `linkedin-api-js-client` | `^0.3.0` (beta) | Get post analytics, engagement metrics | Official LinkedIn library |
| **Alternative:** Direct REST API calls | N/A | More stable than beta library | Avoid beta dependency |

**API Capabilities (2026 updates):**
- **Member Post Analytics API:** Free access to post-level engagement (impressions, reach, reactions, comments, reposts)
- **Video Insights:** Watch time, total views, unique viewers
- **Follower Growth:** Track follower count over time
- **Aggregated Analytics:** Multi-post performance rollups

**RECOMMENDATION: Use direct REST API calls instead of library**

The official `linkedin-api-js-client` is still in beta (v0.3.0, last updated 3 years ago). For production stability, call LinkedIn REST API directly from Convex actions using `fetch`.

**Implementation pattern:**
```typescript
// In Convex action (NO additional library needed)
export const getLinkedInPostAnalytics = action({
  args: { postId: v.string(), userId: v.id('users') },
  handler: async (ctx, args) => {
    const credentials = await getLinkedInCredentials(ctx, args.userId);

    // Direct REST API call
    const response = await fetch(
      `https://api.linkedin.com/rest/memberCreatorPostAnalytics?posts=${args.postId}`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'LinkedIn-Version': '202501', // Use current version
          'X-Restli-Protocol-Version': '2.0.0',
        }
      }
    );

    const analytics = await response.json();

    // Store in Convex for dashboard aggregation
    await ctx.runMutation(internal.analytics.storeLinkedInMetrics, {
      postId: args.postId,
      impressions: analytics.impressions,
      engagement: analytics.engagement,
      reactions: analytics.reactions,
    });
  }
});
```

**Why direct API over library:**
- Official library is beta (unstable, 3 years since last update)
- REST API is stable and well-documented
- No additional dependency to maintain
- Full control over API versioning

**LinkedIn API integration points:**
- Already have OAuth 2.0 working (v2.0 implementation)
- Extend to request `r_organization_social_analytics` scope for analytics
- Use existing token refresh logic

---

### 3. Analytics & Visualization

#### 3.1 Charting Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `recharts` | `^3.7.0` | Dashboard charts (line, bar, pie, area) | **Already in use.** React-native, composable, SVG-based. No change needed. |

**Current usage:**
- Already installed: `recharts@3.7.0`
- Already used in `/analytics` page for trend charts
- Component-based API matches React 19 patterns

**Expand usage for v3.0:**
- Line charts: Engagement trends over time (LinkedIn, Twitter, Instagram)
- Bar charts: Post performance comparison (impressions, clicks)
- Area charts: Token usage, cost trends
- Pie charts: Content distribution by platform

**Why NOT switch to alternatives:**
- Chart.js: Requires wrapper for React, not React-native
- Victory: Heavier bundle size, overkill for needs
- ApexCharts: Commercial license considerations

**Recharts strengths for AMD:**
- Composable components (`<LineChart>`, `<Line>`, `<XAxis>`)
- Built-in animations and interactions
- TypeScript support
- 200KB bundle size (reasonable)

**No new dependency needed.** Expand existing Recharts usage.

---

#### 3.2 Data Aggregation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@convex-dev/aggregate` | Latest | Efficient COUNT, SUM, MAX for analytics | Handles high-frequency updates without full table scans |

**Why aggregation component:**
- AMD has 37 agents generating tasks/executions constantly
- Analytics queries like "total tokens used today" would scan entire table
- Aggregate component maintains reactive counters/sums

**Implementation pattern:**
```typescript
// In Convex schema
import { Aggregate } from '@convex-dev/aggregate';

export const tokenUsageAggregate = new Aggregate(schema.executions, {
  count: true, // Total executions
  sum: ['tokensUsed', 'costUSD'], // Sum tokens and cost
  groupBy: ['agentId', 'date'], // Daily per-agent rollups
});

// In query
export const getDailyTokenUsage = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    return await tokenUsageAggregate.getSum(ctx, {
      groupBy: { date: today },
      field: 'tokensUsed',
    });
  }
});
```

**Benefits:**
- Reactive: UI auto-updates when new execution completes
- Transactional: Aggregates update atomically with data
- Performant: No full table scans, O(1) reads

**Use cases for v3.0:**
1. **Internal metrics:** Token usage, costs, execution counts per agent/day
2. **Social metrics:** Aggregate engagement across platforms (total impressions, reactions)
3. **Content performance:** Top posts by engagement, conversion rates

---

### 4. Supporting Libraries

#### 4.1 Date Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `date-fns` | `^4.1.0` | Date manipulation, formatting, timezones | **Already in use.** Lightweight (20KB), tree-shakeable. No change needed. |

**Current usage:**
- Already installed: `date-fns@4.1.0`
- Used for formatting dates in UI

**Expand for v3.0:**
- Parse social platform timestamps (ISO 8601)
- Calculate time ranges for analytics ("last 7 days", "last 30 days")
- Format dates for chart axes (localized to Spanish)

**No new dependency needed.**

---

#### 4.2 Environment Variables & Secrets

**Pattern: Convex environment variables (NO new library needed)**

Social platform credentials must be stored securely. Convex provides environment variables for this.

**Setup:**
```bash
npx convex env set TWITTER_API_KEY "..."
npx convex env set TWITTER_API_SECRET "..."
npx convex env set INSTAGRAM_ACCESS_TOKEN "..."
npx convex env set LINKEDIN_ACCESS_TOKEN "..."
```

**Access in actions:**
```typescript
export const publishTweet = action({
  handler: async (ctx, args) => {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    // Use credentials
  }
});
```

**Per-user tokens:**
Store user-specific OAuth tokens in Convex database (encrypted at rest by Convex):

```typescript
// Schema addition
export default defineSchema({
  socialConnections: defineTable({
    userId: v.id('users'),
    platform: v.union(v.literal('twitter'), v.literal('instagram'), v.literal('linkedin')),
    accessToken: v.string(), // Encrypted by Convex
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
  }).index('by_user_platform', ['userId', 'platform']),
});
```

---

## What NOT to Add

### ❌ Supabase / Firebase Auth
**Why not:** Convex has native auth support via Clerk integration. Adding another auth provider creates state sync complexity.

### ❌ Prisma / TypeORM
**Why not:** Convex is the database. No ORM needed. Convex schema is TypeScript-native.

### ❌ Redis / Upstash for rate limiting
**Why not:** Social platform APIs have their own rate limits. Use Convex database to track rate limit state. For Next.js API routes (webhooks), rate limiting can be implemented with Convex queries if needed. Don't add Redis unless rate limiting becomes bottleneck.

### ❌ Bull / BullMQ for job queues
**Why not:** Convex has scheduled functions (cron) and actions. No separate job queue needed.

### ❌ Axios for HTTP requests
**Why not:** Native `fetch` is sufficient for API calls in Convex actions. Modern Node.js (18+) has built-in `fetch`.

### ❌ Socket.io for real-time
**Why not:** Convex provides real-time subscriptions out of the box. No separate WebSocket layer needed.

### ❌ Lodash / Underscore
**Why not:** Modern JavaScript/TypeScript has most utilities built-in (Array.map, Object.entries, etc.). Keep bundle small.

---

## Integration Architecture

### Data Flow: Social Publishing

```
User clicks "Publish to Twitter"
    ↓
Next.js frontend calls Convex mutation
    ↓
Convex mutation validates content, checks permissions (Clerk auth)
    ↓
Convex mutation schedules action
    ↓
Convex action calls Twitter API (twitter-api-v2)
    ↓
Twitter API returns tweet ID
    ↓
Convex action stores tweet ID, updates content status
    ↓
Convex mutation triggers (reactive)
    ↓
Frontend UI updates automatically (Convex subscription)
```

**Key insight:** All external API calls happen in Convex actions (server-side). Frontend never directly calls Twitter/Instagram/LinkedIn APIs. This keeps API keys secure and enables retry logic.

---

### Data Flow: Analytics Aggregation

```
Convex action publishes post to LinkedIn
    ↓
Store post ID in Convex content table
    ↓
Scheduled cron (daily): Fetch analytics for all published posts
    ↓
Convex action calls LinkedIn Analytics API
    ↓
Parse engagement metrics (impressions, reactions, etc.)
    ↓
Store in analytics table with timestamp
    ↓
Aggregate component updates sums/counts
    ↓
Frontend query reads aggregated data (O(1) lookup)
    ↓
Recharts renders charts
```

**Key insight:** Use Convex scheduled functions (cron) to poll analytics APIs daily. Store raw metrics in `analytics` table, use Aggregate component for efficient rollups.

---

### Data Flow: Authentication

```
User clicks "Sign up with Google"
    ↓
Clerk handles OAuth flow
    ↓
Clerk creates user in Clerk database
    ↓
Clerk webhook fires to Convex
    ↓
Convex mutation creates user in users table
    ↓
User data synced between Clerk ↔ Convex
    ↓
Frontend queries Convex with ctx.auth.getUserIdentity()
    ↓
Convex enforces permissions (user can only see their own data)
```

**Key insight:** Clerk handles auth UI/UX. Convex stores user data for queries. Webhook keeps them in sync.

---

## Database Schema Additions

### New Tables for v3.0

```typescript
// convex/schema.ts additions

export default defineSchema({
  // Existing tables: agents, tasks, executions, content, handoffs...

  // NEW: User management (synced from Clerk)
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal('admin'), v.literal('editor'), v.literal('viewer')),
    organizationId: v.optional(v.id('organizations')),
    createdAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_organization', ['organizationId']),

  // NEW: Organizations (Clerk orgs)
  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
    createdAt: v.number(),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  // NEW: Social platform connections (per-user OAuth tokens)
  socialConnections: defineTable({
    userId: v.id('users'),
    platform: v.union(v.literal('twitter'), v.literal('instagram'), v.literal('linkedin')),
    platformUserId: v.string(), // Twitter user ID, IG user ID, etc.
    platformUsername: v.string(),
    accessToken: v.string(), // Encrypted by Convex
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scopes: v.array(v.string()),
    connectedAt: v.number(),
  })
    .index('by_user_platform', ['userId', 'platform'])
    .index('by_expiration', ['expiresAt']),

  // NEW: Social analytics (raw metrics from APIs)
  socialAnalytics: defineTable({
    contentId: v.id('content'),
    platform: v.union(v.literal('twitter'), v.literal('instagram'), v.literal('linkedin')),
    platformPostId: v.string(), // Tweet ID, IG post ID, LinkedIn URN
    impressions: v.number(),
    reach: v.optional(v.number()),
    engagement: v.number(), // Total engagement (likes + comments + shares)
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    clicks: v.optional(v.number()),
    fetchedAt: v.number(), // When we fetched this data
  })
    .index('by_content', ['contentId'])
    .index('by_platform_post', ['platform', 'platformPostId'])
    .index('by_fetched_at', ['fetchedAt']),

  // NEW: Internal analytics (agent activity, token usage)
  internalAnalytics: defineTable({
    date: v.string(), // YYYY-MM-DD
    agentId: v.string(),
    executionCount: v.number(),
    tokensUsed: v.number(),
    costUSD: v.number(),
    successRate: v.number(), // 0.0 to 1.0
    avgExecutionTime: v.number(), // milliseconds
  })
    .index('by_date', ['date'])
    .index('by_agent_date', ['agentId', 'date']),

  // EXISTING: Extend content table with new fields
  content: defineTable({
    // ... existing fields (type, title, body, status, metadata, seo, createdBy, createdAt) ...

    // NEW FIELDS:
    publishedPlatforms: v.optional(v.array(v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('linkedin')
    ))),
    platformPostIds: v.optional(v.object({
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })),
    scheduledPublishAt: v.optional(v.number()), // Unix timestamp
    lastAnalyticsFetch: v.optional(v.number()), // When we last fetched analytics
  })
    .index('by_scheduled_publish', ['scheduledPublishAt'])
    .index('by_status', ['status']),
});
```

---

## Installation Commands

### New Dependencies to Install

```bash
# Navigate to project root
cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd

# Install backend dependencies (Convex)
npm install @convex-dev/aggregate

# Navigate to frontend
cd ai-marketing-department/ai-marketing-department

# Install Clerk for authentication
npm install @clerk/nextjs@^6.37.1

# Install social platform SDKs
npm install twitter-api-v2@^1.18.0
npm install facebook-nodejs-business-sdk@^24.0.1

# NO need to install:
# - recharts (already installed: 3.7.0)
# - date-fns (already installed: 4.1.0)
# - convex (already installed: 1.31.6)
```

### Environment Variables Setup

```bash
# In Convex dashboard or via CLI:
npx convex env set CLERK_WEBHOOK_SECRET "whsec_..."

# Social platform API keys (app-level)
npx convex env set TWITTER_API_KEY "..."
npx convex env set TWITTER_API_SECRET "..."
npx convex env set META_APP_ID "..."
npx convex env set META_APP_SECRET "..."

# In Next.js frontend (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## Migration Path from Single-User to Multi-User

### Phase 1: Add Authentication (Week 1)

1. Install Clerk: `npm install @clerk/nextjs`
2. Set up Clerk app in dashboard (clerk.com)
3. Wrap Next.js app with `<ClerkProvider>`
4. Add Clerk webhook to Convex for user sync
5. Migrate existing content to have `createdBy: userId`

**Backward compatibility:**
- Existing content without `createdBy`: Assign to first admin user
- Existing agents: Remain system-level (not user-specific)

### Phase 2: Add Social Connections (Week 2)

1. Create OAuth apps on Twitter, Meta, LinkedIn developer portals
2. Install SDKs: `npm install twitter-api-v2 facebook-nodejs-business-sdk`
3. Build OAuth flow UI (connect/disconnect buttons)
4. Store tokens in `socialConnections` table
5. Build publishing actions (one per platform)

**Test with personal accounts first**, then invite beta users.

### Phase 3: Add Analytics (Week 3-4)

1. Install aggregation: `npm install @convex-dev/aggregate`
2. Create `socialAnalytics` and `internalAnalytics` tables
3. Build scheduled cron to fetch analytics daily
4. Build aggregation queries (total impressions, top posts)
5. Expand Recharts usage for multi-platform charts

**Start with LinkedIn analytics** (already have OAuth), then Twitter, then Instagram.

---

## Convex-Specific Patterns

### Pattern 1: External API Calls in Actions

**Rule:** All calls to Twitter, Instagram, LinkedIn APIs must happen in Convex actions, not mutations.

**Why:** Actions can call external APIs (non-deterministic). Mutations cannot.

```typescript
// ❌ WRONG: Calling external API in mutation
export const publishTweet = mutation({
  handler: async (ctx, args) => {
    const tweet = await twitterClient.post(...); // ERROR: mutation can't call external API
  }
});

// ✅ CORRECT: Call external API in action
export const publishTweet = action({
  handler: async (ctx, args) => {
    const tweet = await twitterClient.post(...); // OK
    await ctx.runMutation(internal.content.storeTweetId, { id: tweet.id });
  }
});
```

### Pattern 2: Token Refresh in Actions

OAuth tokens expire. Refresh them in actions before API calls.

```typescript
export const publishTweet = action({
  handler: async (ctx, args) => {
    let connection = await getTwitterConnection(ctx, args.userId);

    // Check if token expired
    if (connection.expiresAt < Date.now()) {
      // Refresh token
      const refreshed = await twitterClient.refreshToken(connection.refreshToken);

      // Update in database
      await ctx.runMutation(internal.social.updateToken, {
        connectionId: connection._id,
        accessToken: refreshed.access_token,
        expiresAt: Date.now() + refreshed.expires_in * 1000,
      });

      connection = refreshed;
    }

    // Now use fresh token
    const tweet = await twitterClient.post(connection.accessToken, args.text);
  }
});
```

### Pattern 3: Rate Limit Tracking in Database

Social platforms have rate limits. Track usage in Convex to avoid hitting limits.

```typescript
// Schema
rateLimits: defineTable({
  userId: v.id('users'),
  platform: v.string(),
  endpoint: v.string(), // e.g., "POST /tweets"
  requestCount: v.number(),
  windowStart: v.number(), // Unix timestamp
  windowEnd: v.number(),
}).index('by_user_platform_window', ['userId', 'platform', 'windowEnd']),

// Before API call, check rate limit
export const publishTweet = action({
  handler: async (ctx, args) => {
    const canPublish = await ctx.runQuery(internal.rateLimits.checkLimit, {
      userId: args.userId,
      platform: 'twitter',
      endpoint: 'POST /tweets',
      limit: 50, // Free tier: 50 tweets/day
    });

    if (!canPublish) {
      throw new Error('Rate limit exceeded. Try again tomorrow.');
    }

    // Proceed with API call...
  }
});
```

### Pattern 4: Scheduled Analytics Fetching

Use Convex cron to fetch analytics daily, not on-demand.

```typescript
// convex/crons.ts
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.daily(
  'fetch-linkedin-analytics',
  { hourUTC: 6 }, // 6 AM UTC
  internal.analytics.fetchAllLinkedInAnalytics
);

crons.daily(
  'fetch-twitter-analytics',
  { hourUTC: 7 },
  internal.analytics.fetchAllTwitterAnalytics
);

export default crons;
```

**Why cron instead of real-time:**
- Social APIs have rate limits (e.g., LinkedIn: 100 calls/day)
- Analytics data doesn't need real-time updates
- Reduces API costs

---

## Performance Considerations

### 1. Recharts Rendering with Large Datasets

**Problem:** Rendering 10,000 data points causes lag.

**Solution:** Aggregate data before passing to chart.

```typescript
// ❌ BAD: Pass all executions to chart
const executions = useQuery(api.executions.list); // 10,000 rows
<LineChart data={executions} />

// ✅ GOOD: Aggregate by day first
const dailyStats = useQuery(api.analytics.getDailyStats); // 30 rows
<LineChart data={dailyStats} />
```

Use Convex Aggregate component for pre-aggregation.

### 2. Social API Rate Limits

| Platform | Free Tier Limit | Recommended Strategy |
|----------|----------------|----------------------|
| Twitter | 1,500 tweets/month | Batch analytics fetching (daily cron) |
| Instagram | 25 posts/day | Show warning at 20 posts, block at 25 |
| LinkedIn | 100 API calls/day | Fetch analytics for top 100 posts only |

**Implementation:** Track usage in `rateLimits` table, show warnings in UI.

### 3. Convex Action Timeouts

Actions timeout after 10 minutes. For bulk operations (fetch analytics for 1000 posts), use pagination.

```typescript
export const fetchAllLinkedInAnalytics = action({
  handler: async (ctx) => {
    const posts = await ctx.runQuery(internal.content.getPublishedLinkedInPosts, {
      limit: 100, // Process 100 at a time
    });

    for (const post of posts) {
      await fetchLinkedInAnalyticsForPost(ctx, post);
      // Store analytics incrementally
    }

    // If more posts exist, schedule another action
    if (posts.length === 100) {
      await ctx.scheduler.runAfter(0, internal.analytics.fetchAllLinkedInAnalytics);
    }
  }
});
```

---

## Security Considerations

### 1. OAuth Token Storage

**Never store tokens in localStorage or client-side state.** Always store in Convex database (encrypted at rest).

```typescript
// ✅ CORRECT: Store in Convex
await ctx.runMutation(internal.social.storeToken, {
  userId: ctx.auth.getUserIdentity()!.subject,
  platform: 'twitter',
  accessToken: tokens.access_token, // Convex encrypts at rest
});

// ❌ WRONG: Store in localStorage
localStorage.setItem('twitter_token', tokens.access_token); // NEVER do this
```

### 2. User Isolation

**Enforce userId checks in all queries/mutations.**

```typescript
export const getMyContent = query({
  handler: async (ctx) => {
    const userId = ctx.auth.getUserIdentity()?.subject;
    if (!userId) throw new Error('Unauthorized');

    return await ctx.db
      .query('content')
      .withIndex('by_user', (q) => q.eq('createdBy', userId))
      .collect();
  }
});
```

**Never allow:**
```typescript
// ❌ WRONG: Returns all users' content
export const getAllContent = query({
  handler: async (ctx) => {
    return await ctx.db.query('content').collect();
  }
});
```

### 3. Webhook Verification

**Verify all webhook signatures** (Clerk, Twitter, Instagram).

```typescript
// Example: Clerk webhook
import { Webhook } from 'svix';

export const clerkWebhook = httpAction(async (ctx, request) => {
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  const payload = await webhook.verify(await request.text(), {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  });

  // Process verified webhook
});
```

---

## Testing Strategy

### 1. Social API Mocking

Use Twitter/Instagram/LinkedIn sandbox accounts for testing. **Do not use production accounts.**

**Setup:**
1. Twitter: Create developer account, use "Elevated" access for testing
2. Instagram: Create test Instagram Business account via Meta Business Suite
3. LinkedIn: Use personal account in "development mode" (not visible to public)

### 2. Clerk Testing

Clerk provides test mode with unlimited users. Use `pk_test_...` and `sk_test_...` keys.

**Test scenarios:**
- User signs up → User created in Convex
- User connects Twitter → Token stored in `socialConnections`
- User publishes tweet → Tweet posted, ID stored

### 3. Analytics Accuracy

**Validation:** Compare AMD analytics with platform-native analytics.

- Fetch LinkedIn analytics via API
- Manually check LinkedIn.com analytics page
- Verify numbers match (allow 5% variance due to timing)

---

## Rollback Plan

If v3.0 stack additions fail, rollback is clean:

### Clerk Rollback
1. Remove `<ClerkProvider>` wrapper from `app/layout.tsx`
2. Uninstall: `npm uninstall @clerk/nextjs`
3. Remove `users` and `organizations` tables from schema
4. Revert auth checks (`ctx.auth.getUserIdentity()`) to single-user mode

**Impact:** App returns to single-user mode. No data loss (Convex tables persist).

### Social API Rollback
1. Remove social publishing actions from Convex
2. Uninstall: `npm uninstall twitter-api-v2 facebook-nodejs-business-sdk`
3. Remove `socialConnections` and `socialAnalytics` tables
4. LinkedIn OAuth remains (already working in v2.0)

**Impact:** Only LinkedIn publishing works. Twitter/Instagram removed.

### Analytics Rollback
1. Remove aggregation: `npm uninstall @convex-dev/aggregate`
2. Remove analytics queries
3. Revert to existing analytics page (basic metrics only)

**Impact:** Dashboard shows basic metrics (executions, tokens). No social engagement data.

---

## Confidence Assessment

| Area | Confidence | Justification |
|------|------------|---------------|
| **Clerk for Auth** | HIGH | Production-ready since 2023. Official Convex integration. Free tier sufficient for MVP. Alternative (Convex Auth) is beta. |
| **twitter-api-v2** | HIGH | Official community library. Active maintenance (Jan 2026 update). Strongly typed. OAuth 2.0 support. |
| **Instagram API** | MEDIUM | Official Meta SDK (v24.0.1). **BUT** complex publishing workflow (2-step process). JPEG-only limitation. 25 posts/day hard limit. |
| **LinkedIn Analytics API** | MEDIUM | New API (2026 launch). Free access. **BUT** official library is beta. Recommend direct REST API calls instead. |
| **Recharts** | HIGH | Already in use. Proven for AMD use case. No issues found. |
| **Convex Aggregate** | HIGH | Official Convex component. Handles high-frequency updates efficiently. Reactive and transactional. |

**Overall confidence:** HIGH for auth and Twitter. MEDIUM for Instagram/LinkedIn due to API complexity and beta libraries.

---

## Open Questions for Phase-Specific Research

1. **Instagram Reels vs Feed Posts:** Which should MVP support first? Reels have higher engagement but more complex API.
2. **LinkedIn organization pages vs personal profiles:** Should MVP support company page publishing? Requires different OAuth scopes.
3. **Twitter threads vs single tweets:** Should v3.0 support thread publishing (multi-tweet sequences)? Adds complexity.
4. **Analytics retention:** How long to keep raw analytics data in `socialAnalytics` table? 90 days? 1 year? Impacts database size.
5. **Rate limit handling UX:** When user hits rate limit, should we queue posts for tomorrow or show error? Queue adds complexity.

**Recommendation:** Start with simplest case (single tweet, LinkedIn personal profile, Instagram feed post). Add complexity in v3.1+.

---

## Sources

**Authentication Research:**
- [Convex & Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Clerk Pricing](https://clerk.com/pricing)
- [Convex Auth Status (Beta)](https://docs.convex.dev/auth/convex-auth)
- [Clerk vs Auth.js Comparison](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs)

**Twitter/X API Research:**
- [X API Guide 2026](https://getlate.dev/blog/x-api)
- [X API Pricing 2026](https://getlate.dev/blog/twitter-api-pricing)
- [twitter-api-v2 Library](https://www.npmjs.com/package/twitter-api-v2)
- [twitter-api-v2 GitHub](https://github.com/PLhery/node-twitter-api-v2)

**Instagram API Research:**
- [Instagram Graph API Guide 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Instagram API Business Requirements](https://tagembed.com/blog/instagram-api/)
- [facebook-nodejs-business-sdk](https://www.npmjs.com/package/facebook-nodejs-business-sdk)
- [Instagram Content Publishing API](https://mattercall.com/instagram-graph-api)

**LinkedIn API Research:**
- [LinkedIn Member Post Analytics API](https://www.contentgrip.com/linkedin-new-post-analytics-api/)
- [LinkedIn Analytics API Official Docs](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)
- [linkedin-api-js-client (Beta)](https://github.com/linkedin-developers/linkedin-api-js-client)
- [LinkedIn API Clients Overview](https://learn.microsoft.com/en-us/linkedin/shared/development-resources/api-clients)

**Analytics & Charting Research:**
- [Best React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [Recharts vs Chart.js vs Victory](https://npm-compare.com/chart.js,react-vis,recharts,victory-chart)
- [Convex Aggregate Component](https://stack.convex.dev/efficient-count-sum-max-with-the-aggregate-component)
- [Convex Aggregation Patterns](https://www.convex.dev/components/aggregate)

**Next.js & Integration Patterns:**
- [Next.js 16 Route Handlers](https://strapi.io/blog/nextjs-16-route-handlers-explained-3-advanced-usecases)
- [Rate Limiting Next.js API Routes](https://upstash.com/blog/nextjs-ratelimiting)
- [@clerk/nextjs Latest Version](https://www.npmjs.com/package/@clerk/nextjs)

---

*Research completed: 2026-02-05*
*Confidence: HIGH (auth, Twitter, charting), MEDIUM (Instagram, LinkedIn)*
*Ready for roadmap creation.*
