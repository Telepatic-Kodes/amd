# Production Deployment Architecture

**Project:** AMD (AI Marketing Department)
**Stack:** Next.js 16 + Convex + Clerk + OAuth (LinkedIn, Twitter, Instagram)
**Researched:** 2026-02-09
**Overall Confidence:** HIGH

---

## Executive Summary

AMD is a Next.js 16 application with Convex serverless backend, Clerk authentication, and three OAuth integrations (LinkedIn, Twitter/X, Instagram). Currently running on development deployments only. This document provides the complete architecture for deploying to production on Vercel with proper environment separation (dev/staging/prod), OAuth callback URL management, and CI/CD automation.

**Key architectural decisions:**
1. **Three-tier environment strategy:** Development (local + Convex dev), Staging (preview + Convex preview), Production (Vercel prod + Convex prod)
2. **Separate Convex deployments per environment** using deploy keys
3. **Separate Clerk instances** (Development vs Production) with domain configuration
4. **Environment-specific OAuth apps** for each platform (LinkedIn, Twitter, Instagram)
5. **GitHub Actions CI/CD** for automated deployments with environment gates

---

## Current vs Target Architecture

### Current State (Development Only)

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                                      │
├─────────────────────────────────────────────────────────┤
│  Next.js Dev (localhost:3000)                          │
│  └─> Convex Dev Deployment                             │
│       └─> Clerk Development Instance                   │
│            └─> OAuth Dev Apps (shared/localhost URLs)  │
└─────────────────────────────────────────────────────────┘
```

**Issues:**
- No production deployment
- Using Clerk development instance (500 user limit)
- Using development OAuth apps (localhost callbacks)
- No staging/preview environment
- No CI/CD pipeline
- Manual deployment process

### Target Architecture (Full Production Setup)

```
┌────────────────────────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT                                            │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Vercel Production (app.amd.com)                             │ │
│  │  └─> Convex Production Deployment (prod-xxx.convex.cloud)   │ │
│  │       └─> Clerk Production Instance (amd.clerk.accounts.dev) │ │
│  │            └─> LinkedIn Prod OAuth App                       │ │
│  │            └─> Twitter Prod OAuth App                        │ │
│  │            └─> Instagram Prod OAuth App (Meta)               │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              ↑
                    GitHub Actions CI/CD
                              ↑
┌────────────────────────────────────────────────────────────────────┐
│  STAGING ENVIRONMENT (Preview Deployments)                         │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Vercel Preview (pr-123.vercel.app)                         │ │
│  │  └─> Convex Preview Deployment (preview-xxx.convex.cloud)   │ │
│  │       └─> Clerk Development Instance (shared)                │ │
│  │            └─> LinkedIn Staging OAuth App                    │ │
│  │            └─> Twitter Staging OAuth App                     │ │
│  │            └─> Instagram Staging OAuth App                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              ↑
                    GitHub PR Trigger
                              ↑
┌────────────────────────────────────────────────────────────────────┐
│  DEVELOPMENT ENVIRONMENT                                           │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Local Dev (localhost:3000)                                  │ │
│  │  └─> Convex Dev Deployment (dev-xxx.convex.cloud)           │ │
│  │       └─> Clerk Development Instance                         │ │
│  │            └─> OAuth Dev Apps (localhost:3000)               │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Environment Separation Strategy

### 1. Development Environment

**Purpose:** Local development and testing

**Infrastructure:**
- **Frontend:** `localhost:3000` (Next.js dev server)
- **Backend:** Convex dev deployment (one per developer)
- **Auth:** Clerk Development Instance
- **OAuth:** Development apps with `http://localhost:3000/...` callbacks

**Configuration:**
```bash
# .env.local (local development only, not committed)
CONVEX_DEPLOYMENT=dev:your-dev-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud

# Clerk Development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-dev.clerk.accounts.dev

# OAuth Development Apps
LINKEDIN_CLIENT_ID=dev_client_id
LINKEDIN_CLIENT_SECRET=dev_client_secret
TWITTER_CLIENT_ID=dev_client_id
TWITTER_CLIENT_SECRET=dev_client_secret
META_APP_ID=dev_app_id
META_APP_SECRET=dev_app_secret

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000

# Anthropic API (shared across environments)
ANTHROPIC_API_KEY=sk-ant-...
```

**Convex Deployment:**
```bash
# Start local development with Convex dev
npx convex dev
```

**OAuth Callback URLs (Development):**
- LinkedIn: `http://localhost:3000/linkedin/callback`
- Twitter: `http://localhost:3000/twitter/callback`
- Instagram: `http://localhost:3000/instagram/callback`

### 2. Staging Environment (Preview Deployments)

**Purpose:** Test pull requests before merging to production

**Infrastructure:**
- **Frontend:** Vercel Preview Deployment (`amd-git-{branch}-{team}.vercel.app`)
- **Backend:** Convex Preview Deployment (one per PR/branch)
- **Auth:** Clerk Development Instance (shared with dev)
- **OAuth:** Staging OAuth apps with Vercel preview URLs

**Configuration (Vercel Environment Variables - Preview scope):**
```bash
# Convex Preview (managed by Vercel integration)
CONVEX_DEPLOY_KEY={staging_deploy_key}
NEXT_PUBLIC_CONVEX_URL={auto-generated by Convex}

# Clerk Development (same as dev)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-dev.clerk.accounts.dev

# OAuth Staging Apps
LINKEDIN_CLIENT_ID=staging_client_id
LINKEDIN_CLIENT_SECRET=staging_client_secret
TWITTER_CLIENT_ID=staging_client_id
TWITTER_CLIENT_SECRET=staging_client_secret
META_APP_ID=staging_app_id
META_APP_SECRET=staging_app_secret

# Frontend URL (Vercel auto-injects as VERCEL_URL)
FRONTEND_URL=https://${VERCEL_URL}

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...
```

**Convex Preview Deployment:**
- Automatically created by Vercel build process
- Uses `CONVEX_DEPLOY_KEY` environment variable
- Each Git branch gets its own Convex deployment
- Separate data, functions, and cron jobs from production

**OAuth Callback URLs (Staging):**
Must register multiple preview URLs in OAuth app settings:
- LinkedIn: `https://amd-git-*.vercel.app/linkedin/callback`
- Twitter: `https://amd-git-*.vercel.app/twitter/callback`
- Instagram: `https://amd-git-*.vercel.app/instagram/callback`

**Note:** Some OAuth providers (LinkedIn, Meta) require explicit URL whitelisting. You may need to:
1. Use a staging subdomain instead: `https://staging.amd.com/*`
2. Or manually add each preview URL to OAuth app settings
3. Or use separate staging OAuth apps per PR (not recommended)

### 3. Production Environment

**Purpose:** Live production application serving end users

**Infrastructure:**
- **Frontend:** Vercel Production (`app.amd.com` or custom domain)
- **Backend:** Convex Production Deployment
- **Auth:** Clerk Production Instance (with custom domain)
- **OAuth:** Production OAuth apps with production domain

**Configuration (Vercel Environment Variables - Production scope):**
```bash
# Convex Production
CONVEX_DEPLOY_KEY={production_deploy_key}
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Clerk Production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://clerk.amd.com

# OAuth Production Apps
LINKEDIN_CLIENT_ID=prod_client_id
LINKEDIN_CLIENT_SECRET=prod_client_secret
TWITTER_CLIENT_ID=prod_client_id
TWITTER_CLIENT_SECRET=prod_client_secret
META_APP_ID=prod_app_id
META_APP_SECRET=prod_app_secret

# Frontend URL (production domain)
FRONTEND_URL=https://app.amd.com

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...
```

**OAuth Callback URLs (Production):**
- LinkedIn: `https://app.amd.com/linkedin/callback`
- Twitter: `https://app.amd.com/twitter/callback`
- Instagram: `https://app.amd.com/instagram/callback`

**Convex Production Deployment:**
```bash
# Manual deploy (if not using CI/CD)
npx convex deploy --prod

# With CI/CD (GitHub Actions)
CONVEX_DEPLOY_KEY={prod_key} npx convex deploy
```

---

## Step-by-Step Deployment Guide

### Phase 1: Convex Production Setup

**Step 1.1: Create Production Deployment**

```bash
# Option A: Via Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Create new deployment (or promote existing)
3. Name it "AMD Production"
4. Note the deployment URL

# Option B: Via CLI (if already initialized)
npx convex deploy --prod
```

**Step 1.2: Generate Production Deploy Key**

```bash
# Via Convex Dashboard
1. Go to Settings > Deploy Keys
2. Create new deploy key
3. Name: "GitHub Actions Production"
4. Type: Production
5. Copy the key (starts with prod:...)
6. Store in GitHub Secrets as CONVEX_DEPLOY_KEY_PROD
```

**Step 1.3: Configure Production Environment Variables**

```bash
# Via Convex Dashboard or CLI
npx convex env set ANTHROPIC_API_KEY "sk-ant-..." --prod
npx convex env set LINKEDIN_CLIENT_ID "prod_client_id" --prod
npx convex env set LINKEDIN_CLIENT_SECRET "prod_secret" --prod
npx convex env set TWITTER_CLIENT_ID "prod_client_id" --prod
npx convex env set TWITTER_CLIENT_SECRET "prod_secret" --prod
npx convex env set META_APP_ID "prod_app_id" --prod
npx convex env set META_APP_SECRET "prod_secret" --prod
npx convex env set FRONTEND_URL "https://app.amd.com" --prod
```

**Step 1.4: Deploy Convex Functions to Production**

```bash
# Push functions to production
npx convex deploy --prod

# Verify deployment
npx convex logs --prod
```

**Confidence:** HIGH - Convex deployment process is well-documented and battle-tested.

### Phase 2: Clerk Production Instance Setup

**Step 2.1: Create Production Instance**

```bash
1. Go to https://dashboard.clerk.com
2. Create new application
3. Name: "AMD Production"
4. Select authentication methods:
   - Email (for internal users)
   - Google OAuth (optional)
5. Note the Production API keys (pk_live_..., sk_live_...)
```

**Step 2.2: Configure Custom Domain (REQUIRED for Production)**

```bash
# In Clerk Dashboard > Domains
1. Add custom domain: clerk.amd.com
2. Add DNS records to your domain provider:
   - CNAME: clerk.amd.com → clerk.accounts.dev
3. Wait for DNS propagation (can take up to 48 hours)
4. Verify domain in Clerk Dashboard
```

**Why custom domain is required:**
- Clerk production uses first-party cookies (more secure)
- Requires DNS CNAME record for session management
- Development mode uses third-party cookies (less secure, not suitable for production)

**Step 2.3: Update Environment Variables**

```bash
# Production keys (pk_live, sk_live)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://clerk.amd.com
```

**Step 2.4: Update Clerk Configuration in Convex**

```typescript
// convex/auth.config.ts (update for production)
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

**Confidence:** HIGH - Clerk production setup is well-documented. Main gotcha: DNS propagation time.

### Phase 3: OAuth Production Apps Setup

#### LinkedIn Production OAuth App

**Step 3.1: Create LinkedIn App**

```bash
1. Go to https://www.linkedin.com/developers/apps
2. Create new app
3. Name: "AMD Production"
4. Company: [Your LinkedIn Company Page]
5. Privacy Policy URL: https://app.amd.com/privacy
6. Logo: Upload AMD logo
```

**Step 3.2: Configure OAuth Settings**

```bash
# In LinkedIn App Settings > Auth
1. Add Redirect URLs:
   - https://app.amd.com/linkedin/callback
   - https://{convex-deployment}.convex.site/linkedin/callback
2. Request OAuth 2.0 scopes:
   - openid
   - profile
   - email
   - w_member_social (for posting)
3. Copy Client ID and Client Secret
```

**Step 3.3: Verify App**

```bash
# LinkedIn requires app verification for production use
1. Submit app for verification (can take 2-3 days)
2. Provide:
   - Use case description
   - Screenshots of integration
   - Privacy policy
3. Wait for LinkedIn approval
```

#### Twitter/X Production OAuth App

**Step 3.1: Create Twitter App**

```bash
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new project + app
3. Name: "AMD Production"
4. Environment: Production
5. App permissions: Read and Write
```

**Step 3.2: Configure OAuth 2.0 Settings**

```bash
# In App Settings > User authentication settings
1. Enable OAuth 2.0
2. Type of App: Web App
3. Callback URLs:
   - https://app.amd.com/twitter/callback
   - https://{convex-deployment}.convex.site/twitter/callback
4. Website URL: https://app.amd.com
5. Copy Client ID and Client Secret
```

**Step 3.3: Request Elevated Access (if needed)**

```bash
# For posting tweets, you may need Elevated access
1. Apply for Elevated access in Developer Portal
2. Explain use case (AI-generated social media content)
3. Wait for Twitter approval (typically 1-2 days)
```

#### Instagram Production OAuth App (via Meta)

**Step 3.1: Create Meta App**

```bash
1. Go to https://developers.facebook.com/apps
2. Create new app
3. Type: Business
4. Name: "AMD Production"
5. Contact email: [your email]
```

**Step 3.2: Add Instagram Product**

```bash
# In App Dashboard
1. Add Product: Instagram Basic Display
2. Configure Instagram Basic Display:
   - Valid OAuth Redirect URIs:
     * https://app.amd.com/instagram/callback
     * https://{convex-deployment}.convex.site/instagram/callback
   - Deauthorize Callback URL: https://app.amd.com/auth/deauthorize
   - Data Deletion Request URL: https://app.amd.com/auth/delete
```

**Step 3.3: Request Advanced Access**

```bash
# Instagram requires app review for production features
1. Add permissions:
   - instagram_basic
   - instagram_content_publish
   - pages_show_list
   - pages_read_engagement
2. Submit for App Review (can take 1-2 weeks)
3. Provide:
   - Screencast of OAuth flow
   - Privacy Policy URL
   - Use case explanation
```

**Step 3.4: Move to Production Mode**

```bash
# In App Settings
1. Switch from Development to Live mode
2. Provide:
   - Business verification
   - Privacy Policy
   - Terms of Service
3. Copy Production App ID and App Secret
```

**Confidence:** MEDIUM - OAuth app approval processes can be unpredictable and slow (1-2 weeks for Meta).

### Phase 4: Vercel Production Deployment

**Step 4.1: Connect GitHub Repository**

```bash
1. Go to https://vercel.com/new
2. Import Git Repository: amd
3. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: ./ai-marketing-department/ai-marketing-department
   - Build Command: (override below)
   - Output Directory: .next
```

**Step 4.2: Configure Build Settings**

```bash
# Override Build Command to deploy Convex first
Build Command: npx convex deploy && npm run build

# Why this order?
# - Convex must deploy first to generate _generated files
# - Next.js build imports from convex/_generated
# - Running them sequentially ensures proper order
```

**Step 4.3: Configure Environment Variables**

```bash
# In Vercel Project Settings > Environment Variables

# Production scope (only for production deployments)
CONVEX_DEPLOY_KEY={prod_deploy_key} [Production]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... [Production]
CLERK_SECRET_KEY=sk_live_... [Production]
CLERK_JWT_ISSUER_DOMAIN=https://clerk.amd.com [Production]
LINKEDIN_CLIENT_ID={prod_id} [Production]
LINKEDIN_CLIENT_SECRET={prod_secret} [Production]
TWITTER_CLIENT_ID={prod_id} [Production]
TWITTER_CLIENT_SECRET={prod_secret} [Production]
META_APP_ID={prod_id} [Production]
META_APP_SECRET={prod_secret} [Production]
FRONTEND_URL=https://app.amd.com [Production]
ANTHROPIC_API_KEY=sk-ant-... [Production]

# Preview scope (for all preview deployments)
CONVEX_DEPLOY_KEY={staging_deploy_key} [Preview]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... [Preview]
CLERK_SECRET_KEY=sk_test_... [Preview]
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-dev.clerk.accounts.dev [Preview]
LINKEDIN_CLIENT_ID={staging_id} [Preview]
LINKEDIN_CLIENT_SECRET={staging_secret} [Preview]
TWITTER_CLIENT_ID={staging_id} [Preview]
TWITTER_CLIENT_SECRET={staging_secret} [Preview]
META_APP_ID={staging_id} [Preview]
META_APP_SECRET={staging_secret} [Preview]
FRONTEND_URL=https://${VERCEL_URL} [Preview]
ANTHROPIC_API_KEY=sk-ant-... [Preview]
```

**Step 4.4: Configure Custom Domain**

```bash
# In Vercel Project Settings > Domains
1. Add domain: app.amd.com
2. Add DNS records:
   - CNAME: app.amd.com → cname.vercel-dns.com
3. Wait for DNS propagation
4. Verify domain in Vercel
5. Enable automatic HTTPS
```

**Step 4.5: Deploy to Production**

```bash
# Option A: Via Vercel Dashboard
1. Click "Deploy" button
2. Wait for build to complete
3. Visit https://app.amd.com

# Option B: Via CLI
npm install -g vercel
vercel --prod

# Option C: Via GitHub push to main
git push origin main
# Vercel auto-deploys main branch to production
```

**Confidence:** HIGH - Vercel deployment is straightforward with good documentation.

### Phase 5: CI/CD Pipeline Setup (GitHub Actions)

**Step 5.1: Create GitHub Secrets**

```bash
# In GitHub Repo > Settings > Secrets and variables > Actions

# Convex Deploy Keys
CONVEX_DEPLOY_KEY_PROD={production_deploy_key}
CONVEX_DEPLOY_KEY_STAGING={staging_deploy_key}

# Vercel Tokens (for manual deployments if needed)
VERCEL_TOKEN={vercel_token}
VERCEL_ORG_ID={org_id}
VERCEL_PROJECT_ID={project_id}
```

**Step 5.2: Create GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  # Job 1: Lint and Test
  test:
    name: Lint and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            ai-marketing-department/ai-marketing-department/package-lock.json

      - name: Install backend dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: |
          cd ai-marketing-department/ai-marketing-department
          npm ci

      - name: Lint backend
        run: npm run lint

      - name: Lint frontend
        run: |
          cd ai-marketing-department/ai-marketing-department
          npm run lint

      - name: Type check backend
        run: npm run typecheck

      - name: Type check frontend
        run: |
          cd ai-marketing-department/ai-marketing-department
          npx tsc --noEmit

  # Job 2: Deploy Convex (Production on main, Preview on PR)
  deploy-convex:
    name: Deploy Convex Backend
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Convex Production (main branch)
        if: github.ref == 'refs/heads/main'
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY_PROD }}
        run: npx convex deploy --cmd 'echo "Production deployment"'

      - name: Deploy to Convex Preview (PR)
        if: github.event_name == 'pull_request'
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY_STAGING }}
        run: npx convex deploy --cmd 'echo "Preview deployment"'

  # Job 3: Deploy to Vercel (automatic via Vercel GitHub integration)
  # Note: Vercel GitHub App handles this automatically
  # This job is optional - only needed if you want custom control

  notify:
    name: Deployment Notification
    runs-on: ubuntu-latest
    needs: [test, deploy-convex]
    if: always()
    steps:
      - name: Notify Success (Production)
        if: github.ref == 'refs/heads/main' && needs.deploy-convex.result == 'success'
        run: |
          echo "✅ Production deployment successful"
          # Add Slack/Discord notification here if needed

      - name: Notify Success (Preview)
        if: github.event_name == 'pull_request' && needs.deploy-convex.result == 'success'
        run: |
          echo "✅ Preview deployment successful"
          # Add GitHub PR comment here if needed

      - name: Notify Failure
        if: needs.deploy-convex.result == 'failure'
        run: |
          echo "❌ Deployment failed"
          # Add failure notification here
```

**Step 5.3: Configure Branch Protection Rules**

```bash
# In GitHub Repo > Settings > Branches > Branch protection rules

# For main branch:
1. Require pull request reviews before merging
2. Require status checks to pass before merging:
   - test
   - deploy-convex
3. Require branches to be up to date before merging
4. Include administrators (optional)
```

**Step 5.4: Test CI/CD Pipeline**

```bash
# Create test PR
git checkout -b test/ci-cd-pipeline
git commit --allow-empty -m "test: CI/CD pipeline"
git push origin test/ci-cd-pipeline

# Create PR in GitHub
# Verify:
# 1. GitHub Actions runs test job
# 2. Convex preview deployment created
# 3. Vercel preview deployment created
# 4. All checks pass

# Merge to main
# Verify:
# 1. GitHub Actions runs test job
# 2. Convex production deployment updated
# 3. Vercel production deployment updated
```

**Confidence:** HIGH - GitHub Actions workflow is battle-tested pattern.

---

## Environment Variable Management Matrix

| Variable | Development | Staging/Preview | Production | Where to Store |
|----------|-------------|-----------------|------------|----------------|
| `CONVEX_DEPLOYMENT` | `dev:your-deployment` | Auto-generated | `prod:deployment` | .env.local (dev), Vercel (prod) |
| `NEXT_PUBLIC_CONVEX_URL` | Dev URL | Preview URL | Prod URL | Auto-generated by Convex |
| `CONVEX_DEPLOY_KEY` | N/A | Staging key | Production key | GitHub Secrets |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_test_...` | `pk_live_...` | Vercel Env Vars |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` | Vercel Env Vars (sensitive) |
| `CLERK_JWT_ISSUER_DOMAIN` | Dev domain | Dev domain | `clerk.amd.com` | Vercel Env Vars |
| `LINKEDIN_CLIENT_ID` | Dev app | Staging app | Prod app | Vercel Env Vars |
| `LINKEDIN_CLIENT_SECRET` | Dev secret | Staging secret | Prod secret | Vercel Env Vars (sensitive) |
| `TWITTER_CLIENT_ID` | Dev app | Staging app | Prod app | Vercel Env Vars |
| `TWITTER_CLIENT_SECRET` | Dev secret | Staging secret | Prod secret | Vercel Env Vars (sensitive) |
| `META_APP_ID` | Dev app | Staging app | Prod app | Vercel Env Vars |
| `META_APP_SECRET` | Dev secret | Staging secret | Prod secret | Vercel Env Vars (sensitive) |
| `FRONTEND_URL` | `http://localhost:3000` | `https://${VERCEL_URL}` | `https://app.amd.com` | Vercel Env Vars |
| `ANTHROPIC_API_KEY` | Same for all | Same for all | Same for all | Vercel Env Vars (sensitive) |

**Security Notes:**
1. NEVER commit `.env.local` to Git (already in `.gitignore`)
2. Use Vercel's "Sensitive" flag for secrets (encrypted at rest)
3. Rotate OAuth secrets if exposed
4. Use separate API keys per environment for third-party services

---

## OAuth Callback URL Management Strategy

### Problem

OAuth providers require exact callback URL matching. With 3 environments × 3 OAuth platforms = 9 different callback URLs to manage.

### Solution: Environment-Specific OAuth Apps

| Platform | Development | Staging | Production |
|----------|-------------|---------|------------|
| **LinkedIn** | Dev App (`localhost:3000`) | Staging App (`staging.amd.com`) | Prod App (`app.amd.com`) |
| **Twitter** | Dev App (`localhost:3000`) | Staging App (`staging.amd.com`) | Prod App (`app.amd.com`) |
| **Instagram** | Dev App (`localhost:3000`) | Staging App (`staging.amd.com`) | Prod App (`app.amd.com`) |

### Callback URL Registration

**Development URLs:**
```
http://localhost:3000/linkedin/callback
http://localhost:3000/twitter/callback
http://localhost:3000/instagram/callback
```

**Staging URLs (two options):**

**Option A: Subdomain (Recommended)**
```
https://staging.amd.com/linkedin/callback
https://staging.amd.com/twitter/callback
https://staging.amd.com/instagram/callback
```

**Option B: Vercel Preview URLs (Less Reliable)**
```
https://amd-git-*.vercel.app/linkedin/callback
https://amd-git-*.vercel.app/twitter/callback
https://amd-git-*.vercel.app/instagram/callback
```

**Note:** Option A requires separate staging subdomain deployment. Option B requires wildcard support (not all OAuth providers allow this).

**Production URLs:**
```
https://app.amd.com/linkedin/callback
https://app.amd.com/twitter/callback
https://app.amd.com/instagram/callback
```

### Convex HTTP Routes

AMD uses Convex HTTP routes for OAuth callbacks. These also need separate URLs:

**Development:**
```
https://dev-deployment.convex.site/linkedin/callback
https://dev-deployment.convex.site/twitter/callback
https://dev-deployment.convex.site/instagram/callback
```

**Staging:**
```
https://staging-deployment.convex.site/linkedin/callback
https://staging-deployment.convex.site/twitter/callback
https://staging-deployment.convex.site/instagram/callback
```

**Production:**
```
https://prod-deployment.convex.site/linkedin/callback
https://prod-deployment.convex.site/twitter/callback
https://prod-deployment.convex.site/instagram/callback
```

**Important:** Each OAuth app must register BOTH the Next.js frontend URL AND the Convex .site URL.

### Dynamic Callback URL Construction

AMD already implements dynamic callback URLs:

```typescript
// convex/http.ts (existing code)
http.route({
  path: "/linkedin/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/linkedin/callback`;
    // redirectUri will be: https://{convex-deployment}.convex.site/linkedin/callback
    // ...
  }),
});
```

This pattern automatically uses the correct Convex deployment URL, so no code changes needed for multi-environment support.

### OAuth Provider Configuration Checklist

For each OAuth app (dev/staging/prod):

**LinkedIn:**
- [ ] Add Next.js callback URL
- [ ] Add Convex .site callback URL
- [ ] Verify scopes: `openid profile email w_member_social`
- [ ] Submit for app review (production only)

**Twitter:**
- [ ] Add Next.js callback URL
- [ ] Add Convex .site callback URL
- [ ] Enable OAuth 2.0 with PKCE
- [ ] Set permissions: Read and Write
- [ ] Apply for Elevated access (production only)

**Instagram (Meta):**
- [ ] Add Next.js callback URL
- [ ] Add Convex .site callback URL
- [ ] Add Deauthorize callback URL
- [ ] Add Data Deletion Request URL
- [ ] Request permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
- [ ] Submit for App Review (production only)

**Confidence:** MEDIUM - OAuth callback URL management is complex but well-understood. Main risk: app review delays.

---

## Deployment Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│  DEPLOYMENT ORDER (What Must Happen First)                      │
└─────────────────────────────────────────────────────────────────┘

1. CREATE PRODUCTION CONVEX DEPLOYMENT
   ├─> Generate production deploy key
   └─> Set environment variables in Convex

2. CREATE PRODUCTION CLERK INSTANCE
   ├─> Configure custom domain (clerk.amd.com)
   ├─> Wait for DNS propagation (24-48 hours)
   └─> Get production API keys (pk_live, sk_live)

3. CREATE PRODUCTION OAUTH APPS
   ├─> LinkedIn
   │   ├─> Create app
   │   ├─> Configure callback URLs
   │   └─> Submit for verification (2-3 days)
   ├─> Twitter
   │   ├─> Create app
   │   ├─> Enable OAuth 2.0
   │   └─> Apply for Elevated access (1-2 days)
   └─> Instagram (Meta)
       ├─> Create Meta app
       ├─> Add Instagram product
       ├─> Submit for App Review (1-2 weeks)
       └─> Switch to Live mode

4. CONFIGURE VERCEL PROJECT
   ├─> Connect GitHub repository
   ├─> Set environment variables (Production + Preview scopes)
   └─> Configure custom domain (app.amd.com)

5. CONFIGURE GITHUB ACTIONS
   ├─> Add secrets (CONVEX_DEPLOY_KEY_PROD, CONVEX_DEPLOY_KEY_STAGING)
   ├─> Create workflow file (.github/workflows/deploy.yml)
   └─> Set branch protection rules

6. FIRST PRODUCTION DEPLOYMENT
   ├─> Push to main branch
   ├─> Verify Convex production deployment
   ├─> Verify Vercel production deployment
   └─> Test OAuth flows (LinkedIn, Twitter, Instagram)

7. TEST PREVIEW DEPLOYMENTS
   ├─> Create test PR
   ├─> Verify Convex preview deployment created
   ├─> Verify Vercel preview deployment created
   └─> Test OAuth flows with staging apps
```

**Critical Path Items (Blockers):**
1. **Clerk DNS propagation** (24-48 hours) - Must complete before production auth works
2. **OAuth app reviews** (1-2 weeks for Meta) - Must complete before production OAuth works
3. **Custom domain DNS** (1-48 hours) - Must complete before production domain works

**Estimated Total Time to Production:** 2-3 weeks (mostly waiting for OAuth approvals)

---

## CI/CD Pipeline Architecture

### Pipeline Stages

```
┌────────────────────────────────────────────────────────────────┐
│  PULL REQUEST FLOW                                             │
└────────────────────────────────────────────────────────────────┘

PR Opened/Updated
    ↓
┌─────────────────┐
│  1. Lint        │ → ESLint (backend + frontend)
│  2. Type Check  │ → TypeScript (backend + frontend)
│  3. Test        │ → Unit tests (if added)
└─────────────────┘
    ↓ (if passed)
┌─────────────────┐
│  4. Deploy      │ → Convex Preview Deployment (staging key)
│     Convex      │ → Generates CONVEX_URL for preview
└─────────────────┘
    ↓
┌─────────────────┐
│  5. Deploy      │ → Vercel Preview Deployment (automatic)
│     Vercel      │ → Uses preview CONVEX_URL + staging OAuth apps
└─────────────────┘
    ↓
┌─────────────────┐
│  6. Preview URL │ → Comment on PR with preview URLs
│     Comment     │ → Frontend: https://amd-git-{branch}.vercel.app
│                 │ → Backend: https://preview-{hash}.convex.cloud
└─────────────────┘
    ↓
Manual Review + Approval
    ↓
Merge to main


┌────────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT FLOW                                    │
└────────────────────────────────────────────────────────────────┘

Merge to main
    ↓
┌─────────────────┐
│  1. Lint        │ → ESLint (backend + frontend)
│  2. Type Check  │ → TypeScript (backend + frontend)
│  3. Test        │ → Unit tests
└─────────────────┘
    ↓ (if passed)
┌─────────────────┐
│  4. Deploy      │ → Convex Production Deployment (prod key)
│     Convex      │ → npx convex deploy --prod
└─────────────────┘
    ↓
┌─────────────────┐
│  5. Deploy      │ → Vercel Production Deployment (automatic)
│     Vercel      │ → Uses prod CONVEX_URL + prod OAuth apps
└─────────────────┘
    ↓
┌─────────────────┐
│  6. Health      │ → Smoke tests (optional)
│     Check       │ → Verify https://app.amd.com loads
│                 │ → Verify Convex connection works
└─────────────────┘
    ↓
┌─────────────────┐
│  7. Notify      │ → Slack/Discord notification (optional)
│                 │ → GitHub deployment status
└─────────────────┘
```

### Pipeline Configuration

**Triggers:**
- Pull Request: `opened`, `synchronize`, `reopened`
- Push to main: Production deployment

**Jobs:**
1. **test** (lint + type check) - ~2 minutes
2. **deploy-convex** (backend deployment) - ~1 minute
3. **deploy-vercel** (automatic via GitHub App) - ~3 minutes
4. **notify** (optional) - ~10 seconds

**Total Pipeline Time:**
- Preview: ~6 minutes
- Production: ~6 minutes

**Parallelization:**
- Lint and type check can run in parallel
- Convex deployment must complete before Vercel build (generates types)

**Failure Handling:**
- If lint fails → Block deployment
- If type check fails → Block deployment
- If Convex deployment fails → Block Vercel deployment
- If Vercel deployment fails → Rollback Convex? (needs discussion)

**Confidence:** HIGH - GitHub Actions workflow is standard pattern for Convex + Vercel.

---

## Known Pitfalls and Gotchas

### 1. Convex Type Generation Race Condition

**Problem:** Next.js build imports from `convex/_generated`, but those files don't exist until Convex deploys.

**Solution:** Use sequential build command:
```bash
npx convex deploy && npm run build
```

NOT:
```bash
npx convex deploy --cmd 'npm run build'
```

The `--cmd` flag runs the command DURING Convex deployment, which can cause race conditions.

**Confidence:** HIGH - This is a documented issue with workaround.

### 2. Clerk DNS Propagation Delay

**Problem:** Custom domain for Clerk production requires DNS CNAME, which can take 24-48 hours to propagate.

**Solution:**
- Set up DNS early (Phase 2 of deployment)
- Test with Clerk's temporary domain first
- Use `dig clerk.amd.com` to verify DNS propagation

**Confidence:** HIGH - Standard DNS behavior.

### 3. OAuth Callback URL Exact Matching

**Problem:** OAuth providers require exact URL matching. Even trailing slashes matter.

**Solution:**
- Register URLs without trailing slash: `https://app.amd.com/linkedin/callback`
- Verify callback URLs match exactly in OAuth provider settings
- Test each OAuth flow in staging before production

**Confidence:** HIGH - Common OAuth gotcha.

### 4. Meta App Review Delays

**Problem:** Instagram OAuth requires Meta App Review, which can take 1-2 weeks and may be rejected.

**Solution:**
- Submit detailed use case explanation
- Provide screencast of OAuth flow
- Have privacy policy and terms of service ready
- Be prepared to iterate on submission

**Confidence:** MEDIUM - App review processes are unpredictable.

### 5. Convex Preview Deployment Cleanup

**Problem:** Preview deployments accumulate over time (one per PR), consuming resources.

**Solution:**
- Preview deployments auto-delete after 7 days of inactivity (Convex Pro)
- Manually delete old previews in Convex Dashboard
- Set up cleanup script in GitHub Actions (optional)

**Confidence:** HIGH - Convex handles this automatically with Pro tier.

### 6. Environment Variable Typos

**Problem:** Typos in environment variable names cause silent failures (undefined values).

**Solution:**
- Use TypeScript to validate required env vars at build time:
```typescript
// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const;

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

**Confidence:** HIGH - Standard validation pattern.

### 7. OAuth Token Expiration

**Problem:** OAuth tokens expire, causing API calls to fail.

**Solution (already implemented):**
- LinkedIn: Refresh token support in `convex/linkedin/actions.ts`
- Twitter: Access tokens last 2 hours, need refresh logic
- Instagram: Long-lived tokens (60 days), need refresh before expiry

**Action Required:** Add cron job to refresh tokens before expiration.

**Confidence:** MEDIUM - Token refresh logic partially implemented.

---

## Recommended Deployment Order (Executive Summary)

### Week 1: Infrastructure Setup

**Day 1-2: Convex + Clerk**
1. Create Convex production deployment
2. Generate production deploy keys
3. Create Clerk production instance
4. Configure Clerk custom domain (start DNS propagation)

**Day 3-5: OAuth Apps**
1. Create production OAuth apps (LinkedIn, Twitter, Instagram)
2. Configure callback URLs
3. Submit for app reviews (start approval process)

**Weekend:** Wait for DNS propagation and OAuth approvals

### Week 2: Deployment + Testing

**Day 1-2: Vercel Setup**
1. Configure Vercel project
2. Set all environment variables (production + preview scopes)
3. Configure custom domain
4. First production deployment (manual test)

**Day 3-4: CI/CD Setup**
1. Create GitHub Actions workflow
2. Add GitHub secrets
3. Test preview deployments with PRs
4. Test production deployment via main branch

**Day 5: Verification**
1. Run post-deployment checklist
2. Test all OAuth flows
3. Test content creation and publishing
4. Monitor for errors

### Week 3: Production Launch

**Day 1-3:** Wait for OAuth approvals (if not yet approved)

**Day 4:** Launch to production (if approvals complete)

**Day 5:** Monitor production, fix any issues

---

## Sources

**Convex Documentation:**
- [Deploying Your App to Production | Convex Developer Hub](https://docs.convex.dev/production)
- [Using Convex with Vercel | Convex Developer Hub](https://docs.convex.dev/production/hosting/vercel)
- [Preview Deployments | Convex Developer Hub](https://docs.convex.dev/production/hosting/preview-deployments)
- [Environment Variables | Convex Developer Hub](https://docs.convex.dev/production/environment-variables)

**Clerk Documentation:**
- [Deploy your Clerk app to production - Deployment | Clerk Docs](https://clerk.com/docs/guides/development/deployment/production)
- [Instances / Environments - Development | Clerk Docs](https://clerk.com/docs/guides/development/managing-environments)
- [Deployments & Migrations: Set up a staging environment with Clerk](https://clerk.com/docs/deployments/set-up-staging)
- [How to take your Clerk application to production](https://clerk.com/blog/how-to-take-your-clerk-app-to-prod)

**Vercel Documentation:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Environments](https://vercel.com/docs/deployments/environments)

**OAuth & CI/CD:**
- [How To Deploy a Next.js App To Vercel With GitHub Actions](https://www.freecodecamp.org/news/deploy-to-vercel-with-github-actions/)
- [Solving for Dynamic OAuth 2.0 Callbacks with Environment Handles | Release](https://release.com/blog/solving-for-dynamic-oauth-2-0-callbacks-with-environment-handles)
- [How to Fix "Invalid Redirect URI" OAuth2 Errors](https://oneuptime.com/blog/post/2026-01-24-fix-invalid-redirect-uri-oauth2/view)

---

**End of Document**
