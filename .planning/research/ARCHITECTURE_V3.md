# Architecture Integration: Multi-User Auth + Multi-Platform + Analytics

**Project:** AMD v3.0 Intelligence & Scale
**Researched:** 2026-02-05
**Confidence:** HIGH

---

## Executive Summary

AMD v3.0 adds multi-user authentication, multi-platform publishing (Twitter/X, Instagram), and analytics to an existing **single-user, global-data Convex architecture**. The core challenge is retrofitting user ownership across 17+ existing tables while maintaining the existing agent execution patterns.

**Key findings:**
1. **Auth integration** is straightforward with Convex + Clerk using `getUserIdentity()` middleware
2. **Multi-tenancy** requires adding `userId` to all existing tables and migrating current data
3. **Social platform APIs** follow existing LinkedIn OAuth pattern but require platform-specific adaptations
4. **Analytics aggregation** should use Convex's Aggregate component for O(log n) performance
5. **Build order is critical**: Auth → Migration → Multi-platform → Analytics (strict dependency chain)

---

## Current Architecture State

### Existing Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                    │
│  ConvexProvider → useQuery/useMutation hooks                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONVEX BACKEND (Serverless)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Functions Layer                                       │  │
│  │  • queries.ts (read operations)                      │  │
│  │  • mutations.ts (write operations)                   │  │
│  │  • actions.ts (external API calls - Claude)         │  │
│  │  • http.ts (LinkedIn OAuth, webhooks)               │  │
│  │  • crons.ts (scheduled agent execution)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Schema (17 tables)                                    │  │
│  │  Core: agents, tasks, executions, handoffs          │  │
│  │  Content: content, campaigns, prompts               │  │
│  │  SEO: keywords                                       │  │
│  │  Feeds: feeds, feedItems, feedSyncLog               │  │
│  │  LinkedIn: linkedinConnections, linkedinPublishLog  │  │
│  │  KB: knowledgeBases, kbDocuments, kbSections        │  │
│  │  System: settings, auditLog, userGuidance           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  • Claude API (LLM)                                         │
│  • LinkedIn API (OAuth + Publishing)                        │
│  • n8n (Workflow orchestration - optional)                  │
└─────────────────────────────────────────────────────────────┘
```

### Current Data Flow (Single-User)

```
User → Dashboard → Convex Query/Mutation → Global Data (No user context)
                                          ↓
                              Returns ALL agents/tasks/content
```

**Problem:** No user isolation. All data is globally accessible.

---

## Target Architecture (v3.0)

### New Components

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 16)                      │
│  ClerkProvider → ConvexProviderWithClerk                    │
│                  ↓                                           │
│              JWT Token (userId in claims)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               CONVEX BACKEND (Multi-Tenant)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Auth Middleware (NEW)                                 │  │
│  │  • auth.config.ts (Clerk JWT validation)            │  │
│  │  • getUserIdentity() in all functions               │  │
│  │  • User-aware query/mutation wrappers               │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Functions Layer (MODIFIED)                           │  │
│  │  • All queries filter by userId                      │  │
│  │  • All mutations inject userId                       │  │
│  │  • Actions pass userId to external APIs             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Schema (17 tables + userId field + 3 NEW tables)     │  │
│  │  MODIFIED (add userId):                              │  │
│  │   • agents, tasks, executions, handoffs              │  │
│  │   • content, campaigns, keywords                     │  │
│  │   • feeds, feedItems (optional - shared?)            │  │
│  │   • knowledgeBases, kbDocuments, kbSections          │  │
│  │   • linkedinConnections, linkedinPublishLog          │  │
│  │   • settings (per-user settings)                     │  │
│  │                                                       │  │
│  │  NEW TABLES:                                          │  │
│  │   • users (Clerk user sync)                          │  │
│  │   • twitterConnections, twitterPublishLog            │  │
│  │   • instagramConnections, instagramPublishLog        │  │
│  │   • platformAnalytics (social media metrics)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ HTTP Routes (NEW)                                     │  │
│  │  • /twitter/auth, /twitter/callback                  │  │
│  │  • /instagram/auth, /instagram/callback              │  │
│  │  • /webhooks/twitter (for webhook notifications)     │  │
│  │  • /webhooks/instagram (for webhook notifications)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  • Claude API (LLM)                                         │
│  • LinkedIn API (OAuth + Publishing)                        │
│  • Twitter/X API (OAuth 2.0 + v2 endpoints)                 │
│  • Instagram Graph API (OAuth + business accounts only)     │
└─────────────────────────────────────────────────────────────┘
```

### New Data Flow (Multi-User)

```
User → Clerk Auth → JWT Token
                    ↓
        Dashboard → ConvexProviderWithClerk
                    ↓
        Convex Query/Mutation → getUserIdentity() → Extract userId
                                                    ↓
                                        Filter/Inject userId in queries
                                                    ↓
                                        Return ONLY user's data
```

---

## Integration Point 1: Authentication with Clerk

### Convex + Clerk Integration Pattern

Based on [official Convex documentation](https://docs.convex.dev/auth/clerk) and [Clerk integration guide](https://clerk.com/docs/guides/development/integrations/databases/convex):

**Frontend Setup:**
```tsx
// app/providers.tsx
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**Backend Setup:**
```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

**Accessing User Context:**
```typescript
// convex/auth.ts - Helper functions
export async function getAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject; // Clerk user ID
}
```

---

## Integration Point 2: Multi-Tenant Data Model

### Schema Migration Strategy

Based on [Convex migrations documentation](https://stack.convex.dev/migrating-data-with-mutations):

**3-Step Process:**

1. **Make userId optional**
2. **Migrate existing data**
3. **Make userId required**

**Tables Requiring userId:**
- ✅ agents, tasks, executions, handoffs
- ✅ content, campaigns, keywords
- ✅ knowledgeBases, kbDocuments, kbSections
- ✅ linkedinConnections, linkedinPublishLog
- ✅ settings, onboarding, userGuidance
- ⚠️ feeds (user-specific recommended)

**Migration Timeline:** Week 2 (5 days)

---

## Integration Point 3: Twitter/X API Integration

### API Overview

Based on [X API 2026 guide](https://getlate.dev/blog/x-api):

**API Tier:** Basic ($200/mo) - 10K tweets/month, OAuth 2.0 supported

**Schema:**
```typescript
twitterConnections: defineTable({
  userId: v.string(),
  twitterUserId: v.string(),
  username: v.string(),
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  scopes: v.array(v.string()),
  dailyPostCount: v.number(), // 500/day rate limit
  status: v.union("connected", "expired", "disconnected", "revoked"),
  // ...
})
```

**Key Differences from LinkedIn:**
- Requires PKCE (Proof Key for Code Exchange)
- 280 character limit
- 500 tweets/day rate limit

---

## Integration Point 4: Instagram Graph API Integration

### API Overview

Based on [Instagram API 2026 guide](https://getlate.dev/blog/instagram-api) and [Basic Display API EOL](https://storrito.com/resources/Instagram-API-2026/):

**Critical Constraint:** Only Business/Creator accounts supported (Basic Display API ended Dec 2024)

**OAuth Flow:** Facebook Login required (Meta ownership)

**Schema:**
```typescript
instagramConnections: defineTable({
  userId: v.string(),
  instagramBusinessAccountId: v.string(),
  facebookPageId: v.string(), // Required
  facebookPageAccessToken: v.string(),
  dailyPostCount: v.number(), // 25/day rate limit
  // ...
})
```

**Key Differences:**
- 2-step publishing: create container → publish container
- Requires hosted image URL
- 60-day token expiry (refresh required)

---

## Integration Point 5: Analytics Data Storage

### Recommended Architecture

Based on [Aggregate component](https://stack.convex.dev/efficient-count-sum-max-with-the-aggregate-component):

**Extend existing metrics table:**
```typescript
metrics: defineTable({
  userId: v.string(), // ADD
  type: v.union(
    "agent_performance",
    "linkedin_engagement", // ADD
    "twitter_engagement", // ADD
    "instagram_engagement", // ADD
  ),
  data: v.any(),
  // ...
})
```

**Scheduled cron jobs:**
```typescript
crons.daily("fetch linkedin analytics", { hourUTC: 2 }, ...);
crons.daily("fetch twitter analytics", { hourUTC: 2, minuteUTC: 30 }, ...);
crons.daily("fetch instagram analytics", { hourUTC: 3 }, ...);
```

---

## Build Order and Dependencies

### Critical Path

```
PHASE 1: Auth Foundation (Week 1)
  ✓ Clerk setup
  ✓ JWT config
  ✓ users table
  ↓
PHASE 2: Schema Migration (Week 2)
  ✓ Add userId to 15 tables
  ✓ Run migrations
  ✓ Update queries/mutations
  ↓
PHASE 3A: Twitter (Week 3)    PHASE 3B: Instagram (Week 4)
  ✓ OAuth + PKCE                ✓ Facebook OAuth
  ✓ Publishing action            ✓ 2-step publishing
  ↓
PHASE 4: Analytics (Weeks 5-6)
  ✓ Extend metrics table
  ✓ Cron jobs
  ✓ Aggregate component
```

### Dependency Matrix

| Feature | Depends On | Blocks |
|---------|-----------|--------|
| **Auth Foundation** | None | All |
| **Schema Migration** | Auth Foundation | Multi-platform, Analytics |
| **Twitter Integration** | Schema Migration | Twitter Analytics |
| **Instagram Integration** | Schema Migration | Instagram Analytics |
| **Analytics** | Schema Migration + Platform Integration | Dashboard |

---

## Data Migration Strategy

### 5-Step Process

1. **Backup** (Day 1)
   ```bash
   npx convex export --path ./backup-$(date +%Y%m%d).jsonl
   ```

2. **Make Optional** (Day 1)
   ```typescript
   userId: v.optional(v.string())
   ```

3. **Run Migrations** (Days 2-3)
   ```typescript
   const DEFAULT_USER_ID = "migration_default_user";
   // Assign to all existing records
   ```

4. **Update Functions** (Days 3-4)
   ```typescript
   // Filter/inject userId in all queries/mutations
   ```

5. **Make Required** (Day 5)
   ```typescript
   userId: v.string()
   ```

---

## Architecture Patterns

### Pattern 1: Auth Middleware Wrapper

```typescript
export async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}
```

### Pattern 2: OAuth Token Refresh

```typescript
if (connection.accessTokenExpiresAt < Date.now() + 5 * 60 * 1000) {
  // Refresh before expiry
  const newTokens = await refreshOAuthToken(...);
}
```

### Pattern 3: Aggregate for Analytics

```typescript
import { Aggregate } from "@convex-dev/aggregate";

const aggregate = new Aggregate(components.aggregate, {
  namespace: `user_${userId}_linkedin`,
});

const totalImpressions = await aggregate.sum(ctx, "impressions");
```

---

## Anti-Patterns to Avoid

### 1. Global Data Leakage

**DON'T:**
```typescript
return await ctx.db.query("agents").collect(); // Returns ALL users' data
```

**DO:**
```typescript
const userId = await getAuthenticatedUserId(ctx);
return await ctx.db
  .query("agents")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .collect();
```

### 2. Ignoring Token Expiry

**DON'T:**
```typescript
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${connection.accessToken}` } // May be expired
});
```

**DO:**
```typescript
const validToken = await getValidAccessToken(ctx, connection, "linkedin");
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${validToken}` }
});
```

---

## Sources

### Convex Official Documentation
- [Convex & Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Clerk Integration Guide](https://clerk.com/docs/guides/development/integrations/databases/convex)
- [Auth in Functions](https://docs.convex.dev/auth/functions-auth)
- [Storing Users in Database](https://docs.convex.dev/auth/database-auth)
- [HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Schema Migrations](https://stack.convex.dev/migrating-data-with-mutations)
- [Aggregate Component](https://www.convex.dev/components/aggregate)

### Social Media APIs
- [X/Twitter API 2026 Guide](https://getlate.dev/blog/x-api)
- [Twitter API Pricing 2026](https://getlate.dev/blog/twitter-api-pricing)
- [Instagram API 2026 Complete Guide](https://getlate.dev/blog/instagram-api)
- [Instagram Basic Display API EOL](https://storrito.com/resources/Instagram-API-2026/)

### Multi-Tenancy Patterns
- [Multi-Tenant Architecture Guide 2026](https://www.future-processing.com/blog/multi-tenant-architecture/)
- [Data Isolation and Sharding](https://medium.com/@justhamade/data-isolation-and-sharding-architectures-for-multi-tenant-systems-20584ae2bc31)

---

**Last Updated:** 2026-02-05
**Confidence:** HIGH (Auth, Schema, Build Order), MEDIUM (Twitter/Instagram APIs)
**Next Steps:** Begin Phase 1 (Auth Foundation) implementation
