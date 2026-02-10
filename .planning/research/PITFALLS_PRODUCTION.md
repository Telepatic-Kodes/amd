# Production Deployment Pitfalls

**Domain:** Next.js 16 + Convex + Clerk Marketing SaaS
**Context:** 223k LOC, 37 AI agents, OAuth integrations (LinkedIn, Twitter, Instagram), Resend email
**Researched:** 2026-02-09
**Focus:** Dev-to-production transition mistakes that work perfectly in dev but break in production

## Executive Summary

This document catalogs the most common and painful mistakes when deploying a Next.js + Convex + Clerk application from localhost to production. Each pitfall includes severity rating, warning signs, prevention strategy, and which deployment phase should address it.

**CRITICAL pitfalls** will break production completely.
**HIGH pitfalls** will cause significant issues affecting users.
**MEDIUM pitfalls** will cause quality or performance concerns.

---

## CRITICAL PITFALLS

### Pitfall 1: Clerk API Keys in Wrong Environment

**Severity:** CRITICAL (will break authentication entirely)

**What goes wrong:**
Production keys (`pk_live_`, `sk_live_`) only work with configured production domains. Using development keys (`pk_test_`, `sk_test_`) in production or production keys with localhost URLs causes complete authentication failure. All login attempts fail silently or with cryptic errors.

**Why it happens:**
Developers copy `.env.local` to production without updating keys, or forget that Clerk has separate dev/prod instances with different keys and domain restrictions.

**Consequences:**
- No users can sign in or sign up
- Existing sessions break immediately
- OAuth flows fail with redirect errors
- API calls return 401/403 errors
- Complete application downtime from auth perspective

**Warning signs:**
- "Invalid publishable key" errors in browser console
- Clerk components render but clicking sign-in does nothing
- OAuth redirects to localhost instead of production domain
- Webhook deliveries fail with signature verification errors

**Prevention:**
1. Use Vercel environment variables interface, never copy `.env.local`
2. Create separate Clerk applications for dev/staging/prod
3. Document key format requirements: `pk_test_*` for dev, `pk_live_*` for prod
4. Implement startup validation that checks key format matches environment
5. Use Clerk's deployment checklist before going live

**Detection in production:**
```typescript
// Add to app startup
if (process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
  throw new Error('Production must use pk_live_ keys');
}
```

**Deployment phase:** Phase 1 - Environment Configuration
**Confidence:** HIGH (verified by [Clerk documentation](https://clerk.com/docs/guides/development/deployment/production))

---

### Pitfall 2: OAuth Callback URLs Point to Localhost

**Severity:** CRITICAL (breaks all OAuth flows)

**What goes wrong:**
LinkedIn, Twitter, and Instagram OAuth callback URLs configured as `http://localhost:3000/api/auth/callback/*` in production. After users authenticate with OAuth provider, they're redirected to localhost instead of production domain, causing "connection refused" errors.

**Why it happens:**
OAuth providers require registering exact callback URLs during app setup. Developers register localhost URLs for development but forget to add production URLs or forget to switch which URLs are active.

**Consequences:**
- All social login attempts fail after provider authentication
- Users see "This site can't be reached" after clicking "Authorize"
- OAuth tokens never reach your application
- No way to link social accounts to user profiles
- Support tickets flood in about "broken login"

**Warning signs:**
- Users report getting kicked out after clicking "Allow" on LinkedIn/Twitter/Instagram
- OAuth state tokens never arrive at your callback endpoint
- Browser shows `http://localhost:3000` in URL bar after OAuth redirect
- Analytics show high OAuth initiation but zero OAuth completion

**Prevention:**
1. **LinkedIn:** Add production HTTPS redirect URI in LinkedIn Developer Portal → App Settings → OAuth 2.0 settings
2. **Twitter:** Add production callback URL in Twitter Developer Portal → App Settings → Callback URLs (URLs must match exactly including trailing slashes)
3. **Instagram:** Configure production redirect URI in Facebook App Dashboard → Products → Instagram → Basic Display (requires HTTPS even for localhost in dev)
4. Use environment variables for all OAuth callback URLs:
   ```typescript
   const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/linkedin`;
   ```
5. Create OAuth app setup checklist documenting all three providers
6. Test OAuth flow on staging environment with production-like URLs first

**Instagram-specific gotcha:**
Facebook requires HTTPS even for localhost during development. You must use a tool like ngrok or Cloudflare Tunnel for local Instagram OAuth testing.

**Deployment phase:** Phase 1 - Environment Configuration
**Confidence:** MEDIUM (verified by [LinkedIn OAuth docs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow), [Twitter callback docs](https://developer.twitter.com/en/docs/apps/callback-urls), multiple sources)

---

### Pitfall 3: Convex Deployment URL Not Set in Next.js

**Severity:** CRITICAL (app cannot connect to database)

**What goes wrong:**
Next.js app uses development Convex deployment URL (`https://your-project-dev.convex.cloud`) in production, or forgets to set `NEXT_PUBLIC_CONVEX_URL` entirely. All database queries fail, real-time subscriptions never connect, app shows loading states forever.

**Why it happens:**
Convex uses different deployment URLs for dev vs prod. Developers run `npx convex dev` locally but forget that `npx convex deploy --prod` creates a separate production deployment with different URL. Environment variable isn't set or points to wrong deployment.

**Consequences:**
- All Convex queries return errors or hang indefinitely
- No data loads in UI
- Real-time subscriptions fail to establish
- Mutations silently fail
- Cron jobs don't run (they're on wrong deployment)
- Users see infinite loading spinners

**Warning signs:**
- Browser console shows "Failed to connect to Convex"
- Network tab shows connection attempts to `*-dev.convex.cloud` from production
- Convex dashboard shows zero traffic on production deployment
- All traffic goes to dev deployment even from prod domain

**Prevention:**
1. Run `npx convex deploy --prod` to create production deployment
2. Copy production URL from Convex dashboard → Settings → Deployment URL
3. Set `NEXT_PUBLIC_CONVEX_URL` in Vercel environment variables to production URL
4. Set `CONVEX_DEPLOYMENT` to production deployment name (for server-side usage)
5. Verify environment variables are set for "Production" environment in Vercel (not just "Preview")
6. Document deployment URLs in `.env.example`:
   ```bash
   # Development
   NEXT_PUBLIC_CONVEX_URL=https://your-project-dev.convex.cloud

   # Production
   NEXT_PUBLIC_CONVEX_URL=https://your-project-prod.convex.cloud
   ```

**Deployment phase:** Phase 1 - Environment Configuration
**Confidence:** HIGH (verified by [Convex production docs](https://docs.convex.dev/production))

---

### Pitfall 4: Environment Variables with `NEXT_PUBLIC_` Leak Secrets

**Severity:** CRITICAL (security vulnerability)

**What goes wrong:**
Developer prefixes sensitive variables like API keys or database URLs with `NEXT_PUBLIC_` thinking it's just a naming convention. Next.js bakes these into the client-side JavaScript bundle, exposing secrets to anyone viewing page source or network tab.

**Why it happens:**
Next.js requires `NEXT_PUBLIC_` prefix for client-accessible variables, but developers don't realize this makes them **publicly visible in browser**. Easy to add prefix to secrets "just to make them work" during debugging.

**Consequences:**
- API keys exposed in JavaScript bundle (view source shows them)
- Attackers can use leaked keys to make requests on your behalf
- Database credentials exposed to public internet
- OAuth secrets compromised, enabling account takeover
- Massive unexpected API bills from key abuse
- Compliance violations (GDPR, PCI-DSS) if customer data accessible

**Warning signs:**
- Search browser DevTools → Sources tab for API keys, find them in JS files
- Check `https://your-site.com/_next/static/chunks/*.js` for secrets
- Environment variables work in client components without Convex/API route
- Vercel build logs show "NEXT_PUBLIC_" variables with sensitive-looking values

**Prevention:**
1. **NEVER** prefix secrets with `NEXT_PUBLIC_`:
   ```bash
   # ❌ WRONG - exposes to browser
   NEXT_PUBLIC_RESEND_API_KEY=re_xxx
   NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxx
   NEXT_PUBLIC_DATABASE_URL=postgres://xxx

   # ✅ CORRECT - server-only
   RESEND_API_KEY=re_xxx
   ANTHROPIC_API_KEY=sk-ant-xxx
   DATABASE_URL=postgres://xxx
   ```

2. Only use `NEXT_PUBLIC_` for truly public values:
   ```bash
   # Safe to expose
   NEXT_PUBLIC_APP_URL=https://yourapp.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx  # Designed to be public
   NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud  # Public by design
   ```

3. Use Server Actions or API routes for sensitive operations:
   ```typescript
   // ❌ WRONG - leaks key
   const response = await fetch('https://api.anthropic.com', {
     headers: { 'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_KEY }
   });

   // ✅ CORRECT - key stays on server
   // app/actions/ai.ts
   'use server';
   export async function callClaude(prompt: string) {
     const response = await fetch('https://api.anthropic.com', {
       headers: { 'x-api-key': process.env.ANTHROPIC_KEY }
     });
     return response.json();
   }
   ```

4. Implement automated scanning:
   ```bash
   # Add to CI/CD
   if grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET" .env.production; then
     echo "❌ NEXT_PUBLIC_ prefix on secrets detected"
     exit 1
   fi
   ```

5. Audit before launch:
   - Build production bundle: `npm run build`
   - Search `.next/` directory for API keys: `grep -r "sk-ant\|re_\|sk_live_" .next/`
   - Check Vercel environment variables UI for accidental `NEXT_PUBLIC_` prefixes

**Deployment phase:** Phase 1 - Environment Configuration
**Confidence:** HIGH (verified by [Next.js environment variables docs](https://thelinuxcode.com/nextjs-environment-variables-2026-build-time-vs-runtime-security-and-production-patterns/), [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security))

---

### Pitfall 5: Convex Schema Changes Break Prod Without Migration

**Severity:** CRITICAL (data corruption/loss)

**What goes wrong:**
Developer changes Convex schema (e.g., makes field required, changes type), deploys to production without migration. Convex rejects deployment or existing data becomes invalid. Queries fail, app breaks, no graceful degradation.

**Why it happens:**
In development, running `npx convex dev --clear` resets database, making schema changes painless. Production has real data. Convex prevents breaking changes but without migration plan, deployment fails or app can't read existing documents.

**Consequences:**
- Deployment fails with schema validation errors
- Can't deploy new code until data is migrated
- Chicken-and-egg: can't run migration without deploying, can't deploy without migration
- If deployment succeeds, queries return `null` or errors for old documents
- Existing user data becomes inaccessible
- Potential data loss if field removal attempted

**Why this is painful:**
Convex won't allow you to:
- Change field types if existing data doesn't conform (must use union types as transition)
- Remove fields that still have data in database
- Add required fields without migration to populate them first

**Warning signs:**
- `npx convex deploy --prod` fails with "Schema validation error"
- Deployment succeeds but queries return undefined for new fields
- Dashboard shows documents but app can't read them
- Error: "Field X is required but missing from document"

**Prevention:**

**For adding required fields** (requires two deploys):
1. **First deploy:** Add field as optional
   ```typescript
   // Before
   users: defineTable({ name: v.string() })

   // Deploy 1: Optional
   users: defineTable({
     name: v.string(),
     email: v.optional(v.string())  // Optional first
   })
   ```

2. **Run migration** to populate field:
   ```typescript
   // convex/migrations/addEmail.ts
   export default internalMutation(async ({ db }) => {
     const users = await db.query("users").collect();
     for (const user of users) {
       if (!user.email) {
         await db.patch(user._id, {
           email: `${user._id}@example.com`
         });
       }
     }
   });
   ```

3. **Second deploy:** Make field required
   ```typescript
   // Deploy 2: Required (after all data has field)
   users: defineTable({
     name: v.string(),
     email: v.string()  // Now required
   })
   ```

**For changing field types** (use union types):
```typescript
// Old schema
status: v.string()

// Transition schema (allows both)
status: v.union(v.string(), v.object({
  state: v.string(),
  timestamp: v.number()
}))

// Run migration to convert all old values to new type
// Then remove v.string() from union in next deploy
```

**For removing fields:**
1. Stop writing to field in code
2. Deploy code changes
3. Run migration to delete field from all documents
4. Remove field from schema in next deploy

**Best practice workflow:**
1. Never change schema directly in production
2. Create migration script in `convex/migrations/`
3. Test migration on staging with production data copy
4. Follow two-deploy pattern for additive/breaking changes
5. Monitor Convex dashboard during migration for errors

**Deployment phase:** Phase 3 - Data Migration Strategy
**Confidence:** HIGH (verified by [Convex migrations docs](https://stack.convex.dev/intro-to-migrations), [Convex production guide](https://docs.convex.dev/production))

---

### Pitfall 6: Clerk Webhook Signature Verification Disabled

**Severity:** CRITICAL (security vulnerability)

**What goes wrong:**
Developer implements Clerk webhook endpoint (`/api/webhooks/clerk`) but skips signature verification with Svix. Attackers can forge webhook payloads to inject malicious user data, delete users, or corrupt database.

**Why it happens:**
Webhook signature verification adds complexity. During development, turning off verification makes testing easier. Developers forget to re-enable before production or don't understand security implications.

**Consequences:**
- Attackers can send fake `user.created` events to inject admin accounts
- Fake `user.deleted` events can wipe legitimate users from database
- Data corruption from malicious user metadata
- No audit trail of real vs fake webhook events
- Compliance violations from unauthorized data modifications

**Warning signs:**
- Webhook endpoint doesn't import `@clerk/nextjs` or `svix` libraries
- No `verifyWebhook` call in webhook handler
- Webhook works without `WEBHOOK_SECRET` environment variable
- Code comments like "TODO: add verification" or "skipping for now"

**Prevention:**

1. **Always verify webhook signatures:**
   ```typescript
   // ❌ WRONG - no verification
   export async function POST(req: Request) {
     const payload = await req.json();
     // Directly trust payload - DANGEROUS!
     await db.insert('users', payload.data);
   }

   // ✅ CORRECT - verify signature
   import { Webhook } from 'svix';

   export async function POST(req: Request) {
     const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
     if (!webhookSecret) {
       throw new Error('CLERK_WEBHOOK_SECRET not set');
     }

     const svix_id = req.headers.get('svix-id');
     const svix_timestamp = req.headers.get('svix-timestamp');
     const svix_signature = req.headers.get('svix-signature');

     const payload = await req.text();
     const wh = new Webhook(webhookSecret);

     try {
       const evt = wh.verify(payload, {
         'svix-id': svix_id,
         'svix-timestamp': svix_timestamp,
         'svix-signature': svix_signature,
       });

       // Now safe to trust evt.data
       await db.insert('users', evt.data);
     } catch (err) {
       console.error('Webhook verification failed:', err);
       return new Response('Forbidden', { status: 403 });
     }
   }
   ```

2. **Get webhook secret from Clerk dashboard:**
   - Go to Clerk Dashboard → Webhooks → Add Endpoint
   - Enter production URL: `https://yourapp.com/api/webhooks/clerk`
   - Select events (user.created, user.updated, user.deleted)
   - Copy "Signing Secret" (starts with `whsec_`)
   - Add to Vercel: `CLERK_WEBHOOK_SECRET=whsec_xxx`

3. **Additional security layers:**
   - Restrict webhook endpoint to Svix IP addresses
   - Apply event filters in Clerk dashboard (only selected events)
   - Log all webhook events for audit trail
   - Implement idempotency to handle retries safely

4. **Test verification in staging:**
   ```bash
   # Should fail with 403
   curl -X POST https://staging.yourapp.com/api/webhooks/clerk \
     -H "Content-Type: application/json" \
     -d '{"type":"user.created","data":{"id":"fake"}}'

   # Should succeed with valid signature (get from Clerk dashboard)
   ```

**Deployment phase:** Phase 2 - Security Hardening
**Confidence:** HIGH (verified by [Clerk webhooks docs](https://clerk.com/docs/guides/development/webhooks/overview), [Svix verification guide](https://docs.svix.com/receiving/verifying-payloads/how))

---

## HIGH SEVERITY PITFALLS

### Pitfall 7: Claude API Rate Limits Hit in Production

**Severity:** HIGH (service degradation for users)

**What goes wrong:**
37 AI agents making Claude API calls with no rate limiting, exponential backoff, or queue system. During production traffic spikes, app hits Anthropic rate limits (RPM, ITPM, OTPM), causing 429 errors. All AI features break simultaneously for all users.

**Why it happens:**
Development traffic is low, rate limits never hit. Production has many concurrent users triggering AI agents. Anthropic's tier-based rate limits (Tier 1: 50 RPM, Tier 4: 4000 RPM) are insufficient for burst traffic.

**Consequences:**
- All AI agent calls fail with 429 errors
- Users see "AI unavailable" errors
- No graceful degradation or retry logic
- Lost user actions (content generation, analysis)
- Poor user experience during peak hours
- Wasted API calls from failed requests

**Rate limit tiers:**
| Tier | Deposit | RPM | ITPM (Sonnet) | OTPM | Monthly Spend |
|------|---------|-----|---------------|------|---------------|
| 1 | $5 | 50 | 40,000 | 8,000 | $100 |
| 2 | $40 | 1,000 | 400,000 | 80,000 | $500 |
| 3 | $200 | 2,000 | 800,000 | 160,000 | $1,000 |
| 4 | $400 | 4,000 | 2,000,000 | 400,000 | $2,000 |

**Warning signs:**
- Logs show "Rate limit exceeded" errors from Claude API
- API responses include `retry-after` headers
- Multiple 429 status codes in monitoring
- All AI features fail at once during traffic spikes
- Users report "AI stopped working" at specific times

**Prevention:**

1. **Implement exponential backoff with jitter:**
   ```typescript
   async function callClaudeWithRetry(prompt: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await anthropic.messages.create({
           model: "claude-opus-4.6",
           messages: [{ role: "user", content: prompt }]
         });
       } catch (error) {
         if (error.status === 429) {
           const retryAfter = error.headers?.['retry-after'];
           const delay = retryAfter
             ? parseInt(retryAfter) * 1000
             : Math.min(1000 * Math.pow(2, i) + Math.random() * 1000, 10000);

           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. **Use queue system for background agents:**
   ```typescript
   // Use Inngest, BullMQ, or similar
   import { inngest } from './inngest';

   inngest.createFunction(
     { id: "ai-content-generation", concurrency: 10 },  // Max 10 concurrent
     { event: "content.generate" },
     async ({ event }) => {
       return await callClaudeWithRetry(event.data.prompt);
     }
   );
   ```

3. **Implement request pooling:**
   - Batch similar requests when possible
   - Use caching for repeated prompts
   - Deduplicate in-flight requests

4. **Monitor and alert:**
   ```typescript
   // Track rate limit usage
   if (remainingRequests < 10) {
     await sendAlert('Claude API rate limit approaching');
   }
   ```

5. **Upgrade tier before launch:**
   - Make $400 deposit to reach Tier 4 (4000 RPM)
   - Calculate expected RPM: 37 agents × average requests/min × concurrent users
   - Add 50% buffer for spikes

6. **Graceful degradation:**
   ```typescript
   try {
     return await callClaude(prompt);
   } catch (error) {
     if (error.status === 429) {
       // Show cached result or simplified version
       return getCachedResult(prompt) || "AI temporarily unavailable";
     }
   }
   ```

**Deployment phase:** Phase 2 - API Integration Hardening
**Confidence:** HIGH (verified by [Claude API rate limits](https://platform.claude.com/docs/en/api/rate-limits), [production scaling guide](https://www.hashbuilds.com/articles/claude-api-rate-limits-production-scaling-guide-for-saas))

---

### Pitfall 8: Resend Email Rate Limits Exceeded

**Severity:** HIGH (emails fail to send)

**What goes wrong:**
Resend's default rate limit is 2 requests per second. During production email bursts (password resets, welcome emails, notifications), app exceeds limit and gets 429 errors. Emails fail silently or error messages shown to users.

**Why it happens:**
Development sends few emails, never hits limits. Production has concurrent user signups, bulk email triggers, webhook-driven notifications. No queue or rate limiting on application side.

**Consequences:**
- Welcome emails never arrive for new users
- Password reset emails fail
- Users think app is broken
- Support tickets about "didn't receive email"
- Quota errors: `daily_quota_exceeded` or `monthly_quota_exceeded`

**Rate limits:**
- Default: 2 requests/second per team
- Can request increase for trusted senders
- Daily quota: plan-dependent
- Monthly quota: plan-dependent

**Warning signs:**
- Resend API returns 429 status codes
- Resend Logs page shows 429 responses
- Emails work in bursts then stop
- Some emails send, others fail with no pattern

**Prevention:**

1. **Implement queue with rate limiting:**
   ```typescript
   // Use queue like BullMQ or Inngest
   import { Queue } from 'bullmq';

   const emailQueue = new Queue('emails', {
     limiter: {
       max: 2,        // 2 requests
       duration: 1000 // per 1 second
     }
   });

   // Queue email instead of sending directly
   await emailQueue.add('send', {
     to: user.email,
     subject: 'Welcome',
     html: welcomeTemplate
   });
   ```

2. **Add retry logic:**
   ```typescript
   async function sendEmailWithRetry(emailData: EmailData) {
     const maxRetries = 3;
     let lastError;

     for (let i = 0; i < maxRetries; i++) {
       try {
         return await resend.emails.send(emailData);
       } catch (error) {
         lastError = error;
         if (error.statusCode === 429) {
           // Wait before retry
           await new Promise(r => setTimeout(r, 1000 * (i + 1)));
           continue;
         }
         throw error;
       }
     }

     // Log failure for manual intervention
     await logEmailFailure(emailData, lastError);
     throw lastError;
   }
   ```

3. **Batch email operations:**
   ```typescript
   // Instead of sending 50 emails immediately
   // Spread over time
   for (const user of users) {
     await emailQueue.add('send', { to: user.email }, {
       delay: index * 500  // 500ms between each
     });
   }
   ```

4. **Request rate limit increase:**
   - Contact Resend support before launch
   - Provide expected email volume
   - Request trusted sender status for higher limits

5. **Monitor quota usage:**
   ```typescript
   // Check quota before sending large batches
   const { remaining } = await resend.emails.quota();
   if (remaining < emailsToSend.length) {
     await scheduleForTomorrow(emailsToSend);
   }
   ```

6. **Implement fallback:**
   ```typescript
   // If quota exceeded, queue for later
   try {
     await resend.emails.send(email);
   } catch (error) {
     if (error.statusCode === 429 && error.message.includes('quota_exceeded')) {
       await queueForLater(email, 24); // Retry in 24 hours
       notifyAdmin('Daily quota exceeded');
     }
   }
   ```

**Deployment phase:** Phase 2 - Email Infrastructure
**Confidence:** MEDIUM (verified by [Resend rate limits docs](https://resend.com/docs/api-reference/rate-limit), [rate limit debugging guide](https://dalenguyen.me/blog/2025-09-07-mastering-email-rate-limits-resend-api-cloud-run-debugging))

---

### Pitfall 9: Vercel Serverless Function Timeouts

**Severity:** HIGH (requests fail for users)

**What goes wrong:**
Long-running operations (AI agent workflows, data exports, complex reports) exceed Vercel's serverless function timeout limits. Functions are killed mid-execution, users see 504 errors, partial data written to database.

**Why it happens:**
Hobby plan: 10s timeout, Pro: 60s timeout. AI agent chains can take minutes. Developer doesn't realize functions have hard time limits or doesn't configure `maxDuration`.

**Timeout limits by plan:**
| Plan | Default Timeout | Fluid Compute |
|------|----------------|---------------|
| Hobby | 10 seconds | 60 seconds |
| Pro | 60 seconds | 800 seconds (13 min) |
| Enterprise | 300 seconds | 900 seconds (15 min) |

**Consequences:**
- Users see "504 Gateway Timeout" errors
- Long AI agent workflows never complete
- Data exports fail halfway through
- Partial database writes leave inconsistent state
- No feedback to user about what went wrong

**Warning signs:**
- Logs show "Function execution timeout"
- 504 status codes in monitoring
- Users report "loading forever then error"
- Long operations work in dev (`npm run dev` has no timeout) but fail in production

**Prevention:**

1. **Configure maxDuration for long routes:**
   ```typescript
   // app/api/generate-report/route.ts
   export const maxDuration = 300; // 5 minutes (requires Pro/Enterprise)

   export async function POST(req: Request) {
     // Long operation
   }
   ```

2. **Use background jobs for long tasks:**
   ```typescript
   // Don't block request
   export async function POST(req: Request) {
     const taskId = generateId();

     // Queue background job
     await inngest.send({
       name: "ai-agent-workflow",
       data: { taskId, ...req.body }
     });

     // Return immediately
     return Response.json({ taskId, status: 'processing' });
   }
   ```

3. **Poll for results:**
   ```typescript
   // Client polls status endpoint
   const startTask = async () => {
     const { taskId } = await fetch('/api/start-task').then(r => r.json());

     // Poll for completion
     const interval = setInterval(async () => {
       const { status, result } = await fetch(`/api/task/${taskId}`)
         .then(r => r.json());

       if (status === 'complete') {
         clearInterval(interval);
         displayResult(result);
       }
     }, 2000);
   };
   ```

4. **Use Vercel Fluid Compute:**
   - Automatically available on Pro/Enterprise
   - Up to 800s for network-intensive operations
   - No additional configuration needed
   - Better for API calls, less for CPU-intensive tasks

5. **Break up long operations:**
   ```typescript
   // Instead of one long function
   async function processAll(items: Item[]) {
     for (const item of items) {
       await processItem(item); // May timeout
     }
   }

   // Use chunking + queue
   async function queueProcessing(items: Item[]) {
     const chunks = chunkArray(items, 10);
     for (const chunk of chunks) {
       await queue.add('process-chunk', { chunk });
     }
   }
   ```

6. **Monitor and alert:**
   ```typescript
   // Track execution time
   const start = Date.now();
   await longOperation();
   const duration = Date.now() - start;

   if (duration > 50000) { // 50s on 60s limit
     await sendAlert('Operation approaching timeout');
   }
   ```

**Deployment phase:** Phase 2 - Async Job Infrastructure
**Confidence:** HIGH (verified by [Vercel timeout docs](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out), [Vercel limits](https://vercel.com/docs/limits))

---

### Pitfall 10: Next.js Server Actions Encryption Key Mismatch

**Severity:** HIGH (random failures in multi-server deployments)

**What goes wrong:**
In self-hosted or edge deployments, each server instance generates different encryption keys for Server Actions. Action IDs become invalid when routed to different server, causing "Failed to find Server Action" errors.

**Why it happens:**
Next.js creates encrypted, non-deterministic keys for Server Actions that change between builds and across server instances. Default behavior assumes single-server deployment.

**Consequences:**
- Intermittent "Failed to find Server Action" errors
- Actions work sometimes, fail other times (depending on routing)
- Errors increase with more server instances
- No clear error message indicating key mismatch
- Form submissions randomly fail

**Warning signs:**
- "Failed to find Server Action" errors in production logs
- Errors mention "This request might be from an older or newer deployment"
- Load balancer or multi-region setup
- Errors appear randomly without code changes
- Higher error rate with more traffic (more server instances)

**Prevention:**

1. **Set persistent encryption key (self-hosting):**
   ```bash
   # Generate key
   openssl rand -base64 32

   # Set in environment (all servers must use same key)
   NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<generated-key>
   ```

2. **On Vercel (handled automatically):**
   - Vercel manages encryption keys automatically
   - No action needed for Vercel deployments
   - Issue only affects self-hosted or multi-server setups

3. **For CI/CD with self-hosting:**
   ```yaml
   # .github/workflows/deploy.yml
   env:
     NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: ${{ secrets.SERVER_ACTIONS_KEY }}
   ```

4. **Ensure consistent build artifacts:**
   - Use same build output for all server instances
   - Don't rebuild separately for each server
   - Share `.next` directory or Docker image

5. **Monitor for this issue:**
   ```typescript
   // Add error boundary
   if (error.message.includes('Failed to find Server Action')) {
     await sendAlert('Server Action key mismatch detected');
   }
   ```

**Deployment phase:** Phase 1 - Environment Configuration (if self-hosting)
**Confidence:** MEDIUM (verified by [Next.js Server Actions encryption](https://github.com/vercel/next.js/issues/75448), [Server Action failures](https://github.com/vercel/next.js/discussions/58431))

---

## MEDIUM SEVERITY PITFALLS

### Pitfall 11: Convex Environment Variables Not Conditioned

**Severity:** MEDIUM (confusing errors, not immediate breakage)

**What goes wrong:**
Developer conditions Convex function exports on environment variables:
```typescript
if (process.env.FEATURE_FLAG === 'true') {
  export const newFunction = mutation({ ... });
}
```
Changing environment variable doesn't expose function because function set is determined at deployment time, not runtime.

**Why it happens:**
Intuitive to think environment variables work like they do in other frameworks. Convex has unique behavior: function exports are evaluated once during deployment.

**Consequences:**
- Functions don't appear/disappear when changing environment variables
- Confusing "function not found" errors
- Must redeploy to change available functions (can't toggle features with env vars)
- Environment variable changes don't take effect as expected

**Warning signs:**
- Function exists in code but Convex dashboard doesn't show it
- Changing environment variable doesn't change function availability
- Error: "Could not find public function" even though function is exported
- Function appears in dev deployment but not prod (due to different env vars)

**Prevention:**

1. **Never condition function exports:**
   ```typescript
   // ❌ WRONG
   if (process.env.ENABLE_FEATURE === 'true') {
     export const myFunction = mutation({ ... });
   }

   // ✅ CORRECT - condition behavior, not export
   export const myFunction = mutation({
     handler: async (ctx) => {
       if (process.env.ENABLE_FEATURE !== 'true') {
         throw new Error('Feature disabled');
       }
       // ... function logic
     }
   });
   ```

2. **Use feature flags in function body:**
   ```typescript
   export const experimentalFeature = mutation({
     handler: async (ctx, args) => {
       // Check at runtime
       const isEnabled = process.env.EXPERIMENTAL_FEATURES === 'true';

       if (!isEnabled) {
         return { error: 'Feature not available' };
       }

       // Feature logic
     }
   });
   ```

3. **Document this constraint:**
   ```typescript
   // convex/functions.ts

   /**
    * NOTE: Changing environment variables does NOT add/remove functions.
    * Function exports are determined at deployment time.
    * To enable/disable features, check env vars inside function handler.
    */
   ```

4. **Use deployment-based feature toggles:**
   - Dev deployment has all experimental functions
   - Prod deployment only has stable functions
   - Use separate code paths, not env vars

**Deployment phase:** Phase 1 - Environment Configuration
**Confidence:** HIGH (verified by [Convex environment variables docs](https://docs.convex.dev/production/environment-variables))

---

### Pitfall 12: Convex Cron Jobs in Wrong Timezone

**Severity:** MEDIUM (jobs run at wrong times)

**What goes wrong:**
Developer defines cron job thinking times are in local timezone. Convex uses UTC. Job scheduled for "9am" runs at 9am UTC (1am PST, 4am EST), sending notifications at wrong times.

**Why it happens:**
Cron syntax doesn't specify timezone. Developers assume local time. Convex documentation states UTC but easy to miss.

**Consequences:**
- Nightly jobs run during business hours (or vice versa)
- Reports generated at wrong times
- Email notifications sent when users are asleep
- Time-sensitive jobs miss their window
- Confusing for team: "Why did this run at 1am?"

**Warning signs:**
- Cron jobs trigger at unexpected hours
- Scheduled reports arrive at odd times
- Users report receiving emails at night
- Logs show job execution times don't match schedule
- Time in Convex dashboard doesn't match expectation

**Prevention:**

1. **Always use UTC in cron definitions:**
   ```typescript
   // ❌ WRONG - unclear what timezone
   crons.daily("send-reports", { hourUTC: 9 }, async (ctx) => {
     // When does this run?
   });

   // ✅ CORRECT - explicit UTC
   // Run at 9am UTC = 1am PST / 4am EST
   crons.daily("send-reports", { hourUTC: 9 }, async (ctx) => {
     await sendReports();
   });
   ```

2. **Document timezone conversions:**
   ```typescript
   // convex/crons.ts

   /**
    * IMPORTANT: All cron times are in UTC.
    * UTC 9:00 = PST 1:00 / EST 4:00
    * UTC 17:00 = PST 9:00 / EST 12:00
    */

   crons.daily("morning-reports",
     { hourUTC: 17 },  // 9am PST / 12pm EST
     async (ctx) => { ... }
   );
   ```

3. **Test in production timezone:**
   ```typescript
   // Temporarily set to run soon to verify timing
   crons.cron("test-timing",
     "*/5 * * * *",  // Every 5 minutes
     async (ctx) => {
       console.log(`Job ran at: ${new Date().toISOString()}`);
     }
   );
   ```

4. **Use timezone-aware scheduling if needed:**
   ```typescript
   // For user-specific timezones, schedule dynamically
   crons.hourly("check-scheduled-posts", async (ctx) => {
     const now = new Date();
     const posts = await ctx.db
       .query("scheduled_posts")
       .filter(q => q.lte(q.field("scheduledTime"), now))
       .collect();

     for (const post of posts) {
       await publishPost(ctx, post);
     }
   });
   ```

**Deployment phase:** Phase 1 - Cron Job Setup
**Confidence:** HIGH (verified by [Convex cron jobs docs](https://docs.convex.dev/scheduling/cron-jobs))

---

### Pitfall 13: Next.js Build Cache Invalidation Issues

**Severity:** MEDIUM (stale deployments)

**What goes wrong:**
Vercel deploys succeed but site doesn't reflect latest changes. Cached `.next` directory from previous build is reused. Users see old UI, old data fetching logic, old API routes.

**Why it happens:**
Vercel caches build artifacts to speed up deployments. Changes outside project directory or certain file types don't trigger cache invalidation. Cache persists stale assets.

**Consequences:**
- Deployments show success but changes not visible
- Confusing: "I just deployed but it's still showing old code"
- Users see inconsistent versions (some assets updated, others cached)
- Hot fixes don't take effect
- Rollbacks don't work as expected

**Warning signs:**
- Deployment succeeds but UI unchanged
- Git commit shows in Vercel but code behavior is old
- `console.log` statements from previous version still appear
- Build logs show "Using build cache from previous deployment"
- Only fix is manually clearing cache or force rebuild

**Prevention:**

1. **Force rebuild when needed:**
   ```bash
   # Via environment variable
   VERCEL_FORCE_NO_BUILD_CACHE=1 vercel deploy

   # Via Vercel UI
   # Deployments → ... menu → Redeploy → "Force clear cache"
   ```

2. **Understand cache invalidation triggers:**
   - Changes to files in project root invalidate cache
   - Changes outside project (monorepo siblings) may not
   - Package.json changes invalidate cache
   - Changing package manager (npm → pnpm) invalidates cache

3. **For critical deployments:**
   ```yaml
   # .github/workflows/deploy-production.yml
   - name: Deploy to Production
     env:
       VERCEL_FORCE_NO_BUILD_CACHE: 1
     run: vercel deploy --prod
   ```

4. **Use revalidation for data cache:**
   ```typescript
   // API route to clear data cache
   export async function POST(req: Request) {
     const path = req.nextUrl.searchParams.get('path');

     // Revalidate specific path
     revalidatePath(path);

     // Or revalidate by tag
     revalidateTag('posts');

     return Response.json({ revalidated: true });
   }
   ```

5. **Monitor for stale deployments:**
   - Add build timestamp to footer
   - Check git commit SHA in production
   - Compare deployed version to expected version

6. **2026 best practice:**
   Default to dynamic rendering, add caching selectively. Makes cache issues less impactful.

**Deployment phase:** Phase 4 - CI/CD Pipeline
**Confidence:** MEDIUM (verified by [Vercel cache issues](https://github.com/vercel/next.js/issues/35555), [cache invalidation](https://imidef.com/en/2026-02-08-vercel-deploy-not-reflected-checklist))

---

### Pitfall 14: Clerk Redirect Handshake Differs Dev vs Prod

**Severity:** MEDIUM (confusing auth flows)

**What goes wrong:**
Clerk's redirect handshake works differently in dev vs prod. Development uses URL-encoded redirect, production uses cookie. Custom redirect handling breaks when moving to production.

**Why it happens:**
Subtle implementation difference between Clerk's dev and prod modes. Developers test redirects in dev, assume same behavior in prod.

**Consequences:**
- Login redirects to wrong page in production
- Users redirected to `/` instead of intended destination
- Custom redirect logic works in dev, broken in prod
- "After login" flows don't execute
- Confusing user experience

**Warning signs:**
- Redirects work perfectly in `npm run dev` but not in production
- `returnUrl` or `redirect_url` parameters ignored in production
- All users redirect to homepage regardless of where they clicked sign-in
- Cookie-based state not found in production

**Prevention:**

1. **Use Clerk's built-in redirect props:**
   ```typescript
   // ❌ RISKY - custom handling may break
   <SignIn
     afterSignInUrl={customRedirect()}
   />

   // ✅ BETTER - use Clerk's environment variables
   // .env.production
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding

   // Component
   <SignIn />
   ```

2. **Test on Vercel preview deployments:**
   - Preview deployments use production-mode Clerk
   - Catch redirect issues before production launch
   - Don't rely solely on `localhost` testing

3. **Use environment-based redirect URLs:**
   ```typescript
   import { useAuth } from '@clerk/nextjs';

   function LoginButton() {
     const { signIn } = useAuth();

     // Works in both dev and prod
     const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

     return (
       <button onClick={() => signIn({ redirectUrl })}>
         Sign In
       </button>
     );
   }
   ```

4. **Handle both redirect methods:**
   ```typescript
   // In callback page
   export default function AuthCallback() {
     const router = useRouter();
     const { isLoaded, isSignedIn } = useAuth();

     useEffect(() => {
       if (isLoaded && isSignedIn) {
         // Check URL param (dev)
         const redirectUrl = new URLSearchParams(window.location.search)
           .get('redirect_url');

         // Check cookie (prod) or use fallback
         const finalRedirect = redirectUrl ||
           getCookie('clerk_redirect') ||
           '/dashboard';

         router.push(finalRedirect);
       }
     }, [isLoaded, isSignedIn]);
   }
   ```

**Deployment phase:** Phase 1 - Clerk Configuration
**Confidence:** MEDIUM (verified by [Clerk production deployment](https://clerk.com/docs/guides/development/deployment/production))

---

### Pitfall 15: Instagram OAuth HTTPS Requirement Overlooked

**Severity:** MEDIUM (Instagram OAuth broken in production)

**What goes wrong:**
Instagram OAuth configured without HTTPS in callback URL. Facebook requires HTTPS for all OAuth redirects, even localhost during development. Production deploy with HTTP callback URL fails all Instagram auth attempts.

**Why it happens:**
Developer doesn't realize Instagram (via Facebook) has stricter requirements than LinkedIn/Twitter. Sets up callback URL as `http://yourapp.com/api/auth/callback/instagram`, which Facebook rejects.

**Consequences:**
- Instagram OAuth completely broken
- Error: "URL Blocked: This redirect failed because the redirect URI is not whitelisted"
- Users can't connect Instagram accounts
- Instagram integration appears broken
- Other OAuth providers (LinkedIn, Twitter) work fine, making Instagram issue confusing

**Warning signs:**
- Instagram OAuth redirect blocked by Facebook
- Facebook Developer Console shows "Invalid OAuth redirect URI"
- Error in logs: "redirect_uri is not allowed"
- LinkedIn and Twitter OAuth work, but Instagram doesn't
- Can't test Instagram OAuth on localhost without tunnel

**Prevention:**

1. **Always use HTTPS for Instagram callbacks:**
   ```typescript
   // ❌ WRONG - Facebook rejects HTTP
   const instagramCallback = 'http://yourapp.com/api/auth/callback/instagram';

   // ✅ CORRECT - HTTPS required
   const instagramCallback = 'https://yourapp.com/api/auth/callback/instagram';
   ```

2. **Local development requires HTTPS:**
   ```bash
   # Use ngrok or Cloudflare Tunnel
   cloudflared tunnel --url http://localhost:3000
   # Provides: https://xxx.trycloudflare.com

   # Configure in Facebook Developer Console:
   https://xxx.trycloudflare.com/api/auth/callback/instagram
   ```

3. **Update Facebook App Dashboard:**
   - App Dashboard → Products → Instagram → Basic Display
   - Valid OAuth Redirect URIs: `https://yourapp.com/api/auth/callback/instagram`
   - Can't use HTTP, even for testing

4. **Verify HTTPS in environment variables:**
   ```bash
   # .env.production
   NEXT_PUBLIC_APP_URL=https://yourapp.com  # Must be HTTPS

   # .env.local (with tunnel)
   NEXT_PUBLIC_APP_URL=https://xxx.trycloudflare.com
   ```

5. **Validate at startup:**
   ```typescript
   // In Instagram OAuth setup
   const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/instagram`;

   if (!callbackUrl.startsWith('https://')) {
     throw new Error('Instagram OAuth requires HTTPS callback URL');
   }
   ```

**Deployment phase:** Phase 1 - OAuth Configuration
**Confidence:** MEDIUM (verified by [Instagram OAuth guide](https://gist.github.com/PrenSJ2/0213e60e834e66b7e09f7f93999163fc))

---

## Phase Assignment Summary

| Phase | Focus | Critical Pitfalls | High Pitfalls | Medium Pitfalls |
|-------|-------|-------------------|---------------|-----------------|
| **Phase 1: Environment & Auth Setup** | Configure all environment variables, API keys, OAuth | #1 (Clerk keys), #2 (OAuth URLs), #3 (Convex URL), #4 (Secret leaks), #10 (Encryption key) | - | #11 (Convex env vars), #12 (Cron timezone), #14 (Clerk redirects), #15 (Instagram HTTPS) |
| **Phase 2: Security & Infrastructure** | Implement security measures, async jobs, rate limiting | #6 (Webhook verification) | #7 (Claude rate limits), #8 (Resend limits), #9 (Function timeouts) | - |
| **Phase 3: Data & Migration** | Set up production database, migration strategy | #5 (Schema changes) | - | - |
| **Phase 4: CI/CD & Monitoring** | Build pipeline, deployment automation, monitoring | - | - | #13 (Build cache) |

**Priority order for roadmap creation:**
1. Phase 1 must happen first (nothing works without correct environment setup)
2. Phase 2 can happen in parallel with Phase 3
3. Phase 4 happens last (after app is deployed and functional)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|-----------|--------|
| Clerk deployment | HIGH | Official Clerk documentation, multiple sources on OAuth configuration |
| Convex production | HIGH | Official Convex docs, Stack Overflow, migration guides |
| Next.js 16 deployment | MEDIUM | Recent framework, some sources conflicting on new features |
| OAuth callbacks | MEDIUM | Official provider docs but dated in some cases |
| Rate limiting | HIGH | Official API documentation from Anthropic and Resend |
| Vercel infrastructure | HIGH | Official Vercel documentation and community discussion |

---

## Research Gaps

**Areas requiring phase-specific research:**

1. **Monitoring setup:** Which monitoring tools best integrate with Vercel + Convex + Clerk?
2. **Load testing:** What traffic volumes trigger rate limits with 37 concurrent agents?
3. **Disaster recovery:** Backup/restore procedures for Convex production data
4. **Security audit:** Are there additional security considerations for OAuth token storage?
5. **Performance optimization:** Bundle size analysis for Next.js 16 production builds

**These gaps should be researched during Phase 4 (Monitoring & Optimization).**

---

## Sources

### Clerk Documentation
- [Deploy your Clerk app to production](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Webhooks overview](https://clerk.com/docs/guides/development/webhooks/overview)
- [How to take your Clerk application to production](https://clerk.com/blog/how-to-take-your-clerk-app-to-prod)

### Convex Documentation
- [Deploying Your App to Production](https://docs.convex.dev/production)
- [Environment Variables](https://docs.convex.dev/production/environment-variables)
- [Intro to Migrations](https://stack.convex.dev/intro-to-migrations)
- [Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)

### Next.js Documentation
- [Next.js Environment Variables (2026): Build-Time vs Runtime, Security, and Production Patterns](https://thelinuxcode.com/nextjs-environment-variables-2026-build-time-vs-runtime-security-and-production-patterns/)
- [Common mistakes with the Next.js App Router and how to fix them](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Upgrading: Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)

### API & Rate Limiting
- [Claude API Rate Limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Claude API Quota Tiers and Limits Explained: Complete Guide 2026](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits)
- [Resend API Rate Limit](https://resend.com/docs/api-reference/rate-limit)
- [Mastering Email Rate Limits - A Deep Dive into Resend API](https://dalenguyen.me/blog/2025-09-07-mastering-email-rate-limits-resend-api-cloud-run-debugging)

### Vercel Infrastructure
- [What can I do about Vercel Functions timing out?](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Vercel Limits](https://vercel.com/docs/limits)
- [Vercel deploy finished but the site didn't update? Use this checklist](https://imidef.com/en/2026-02-08-vercel-deploy-not-reflected-checklist)

### OAuth Configuration
- [LinkedIn 3-Legged OAuth Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Twitter Callback URLs](https://developer.twitter.com/en/docs/apps/callback-urls)
- [Instagram Platform API implementation guide](https://gist.github.com/PrenSJ2/0213e60e834e66b7e09f7f93999163fc)

### Security
- [How to Verify Webhooks with the Svix Libraries](https://docs.svix.com/receiving/verifying-payloads/how)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Next.js Server Actions Security: 5 Vulnerabilities You Must Fix](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions)
