# Technology Stack — Production Readiness

**Project:** AI Marketing Department (AMD)
**Researched:** 2026-02-09
**Focus:** Production deployment, CI/CD, monitoring, performance, and testing infrastructure

---

## Executive Summary

AMD is a Next.js 16 + Convex + Clerk marketing SaaS with 37 AI agents. Currently runs on localhost with `npm run dev`. This research identifies the minimal stack additions needed to make it production-ready for real paying users.

**Key Principle:** Add only what's essential. No over-engineering. Use free tiers where possible.

**Total Monthly Cost:** $0-20 (free tier until growth requires Vercel Pro)

---

## Current Stack (Do Not Change)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Frontend Framework | Next.js | 16.1.4 | React framework with Turbopack |
| React | React | 19.2.3 | UI library |
| Backend/Database | Convex | 1.31.6 | Real-time serverless backend |
| Authentication | Clerk | 6.37.3 | Multi-user auth with RBAC |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Icons | Lucide React | 0.563.0 | Icon library |
| Animation | Framer Motion | 12.29.2 | Animations |
| Charts | Recharts | 3.7.0 | Data visualization |
| Rich Text | TipTap | 3.18.0 | Content editor |
| Language | TypeScript | 5.x | Type safety |

---

## Production Additions — Deployment

### Vercel (Recommended)

| Technology | Purpose | Cost | Why |
|------------|---------|------|-----|
| **Vercel** | Hosting & CDN | Free → $20/mo | Official Next.js platform, zero-config, automatic preview deployments, edge network, seamless Convex integration |
| **Vercel CLI** | Deployment CLI | Free | Command-line deployment tool |

**Why Vercel:**
- Zero-config deployment for Next.js 16
- Automatic CDN edge caching
- Preview deployments for every PR
- Built-in environment variable management
- Free tier sufficient for 100-500 users
- Official platform (built by Vercel who built Next.js)

**Free Tier:**
- 100GB bandwidth/month
- 100 build hours/month
- Unlimited preview deployments
- 1 concurrent build

**Installation:**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Link project (interactive)
vercel link

# Deploy to production
vercel --prod
```

**Environment Variables Setup (Vercel Dashboard):**
```bash
# Production only
CONVEX_DEPLOY_KEY=prod:xxx

# Production + Preview
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
ANTHROPIC_API_KEY=sk-ant-xxx          # Mark as Sensitive
CLERK_SECRET_KEY=sk_xxx                # Mark as Sensitive
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx

# Optional (if using Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx
SENTRY_AUTH_TOKEN=xxx                  # Mark as Sensitive, Production only
```

**Convex Deployment (Separate):**
```bash
# Deploy Convex backend separately
npx convex deploy

# Set Convex environment variables (Convex Dashboard or CLI)
npx convex env set ANTHROPIC_API_KEY sk-ant-xxx
```

**Integration Points:**
- Vercel detects Next.js 16 automatically
- Build command: `next build` (automatic)
- Output directory: `.next` (automatic)
- Node.js version: 20.x (automatic)
- Preview deployments created for every PR (automatic)

**Sources:**
- [Vercel Deployment Configuration (2026)](https://oneuptime.com/blog/post/2026-01-24-configure-vercel-deployment/view)
- [Next.js 16 Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Convex + Vercel Integration](https://docs.convex.dev/production/hosting/vercel)

---

## Production Additions — CI/CD

### GitHub Actions (Recommended)

| Technology | Purpose | Cost | Why |
|------------|---------|------|-----|
| **GitHub Actions** | CI/CD automation | Free: 2,000 min/mo | Native GitHub integration, runs lint/test/build on every PR, blocks broken code from merging |

**Why GitHub Actions:**
- Built into GitHub (no external service)
- Runs on every PR and push to main
- Can enforce passing CI before merge
- Integrates with Vercel preview deployments
- Free tier sufficient (2,000 minutes/month)

**Configuration:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 10

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
        working-directory: ./ai-marketing-department/ai-marketing-department

      - name: Run TypeScript check
        run: npm run typecheck
        working-directory: ./ai-marketing-department/ai-marketing-department

      - name: Run ESLint
        run: npm run lint
        working-directory: ./ai-marketing-department/ai-marketing-department

      - name: Run tests
        run: npm test
        working-directory: ./ai-marketing-department/ai-marketing-department

      - name: Build Next.js app
        run: npm run build
        working-directory: ./ai-marketing-department/ai-marketing-department
        env:
          SKIP_ENV_VALIDATION: true
```

**What It Does:**
1. Runs on every PR and push to main
2. Type checks TypeScript code
3. Lints with ESLint
4. Runs tests (once added)
5. Verifies Next.js builds successfully
6. Blocks PR merge if any step fails

**Integration with Vercel:**
- Vercel deployments happen automatically (separate from CI)
- Can add Convex schema validation: `npx convex deploy --dry-run --admin-key ${{ secrets.CONVEX_DEPLOY_KEY }}`

**Sources:**
- [GitHub Actions CI/CD for Next.js](https://arnab-k.medium.com/setting-up-ci-cd-pipelines-for-next-js-projects-354d500f7461)
- [Next.js CI/CD Guide 2024](https://nextjsstarter.com/blog/nextjs-cicd-deployment-guide-2024/)

---

## Production Additions — Error Monitoring

### Sentry (Recommended)

| Technology | Purpose | Cost | Why |
|------------|---------|------|-----|
| **@sentry/nextjs** | Error tracking & performance | Free: 5K errors/mo, 10K transactions/mo | Industry standard, excellent Next.js 16 + React 19 support, source maps, release tracking, user context, performance monitoring |

**Why Sentry:**
- Industry-standard error monitoring
- Official Next.js SDK (automatically instruments client + server)
- React 19 error boundary support
- Source map uploads (debug minified production code)
- Performance monitoring (track slow API routes)
- User context (see which user encountered error)
- Free tier sufficient for MVP (5,000 errors/month)

**Installation:**
```bash
cd ai-marketing-department/ai-marketing-department
npx @sentry/wizard@latest -i nextjs
```

The wizard automatically:
- Installs `@sentry/nextjs`
- Creates `sentry.client.config.ts`
- Creates `sentry.server.config.ts`
- Creates `sentry.edge.config.ts`
- Updates `next.config.ts` with Sentry integration
- Configures source map uploads

**Configuration:**

The wizard creates these files, customize as needed:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rates for performance monitoring
  tracesSampleRate: 0.1, // 10% of requests

  // Session replay (captures user sessions on errors)
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  replaysSessionSampleRate: 0.1, // 10% of normal sessions

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't report errors in development
  enabled: process.env.NODE_ENV === 'production',
});
```

**Environment Variables:**
```bash
# Add to Vercel (Sensitive)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx  # For source map uploads
SENTRY_ORG=your-org
SENTRY_PROJECT=amd
```

**What Gets Tracked:**
- **Frontend errors:** Unhandled exceptions, promise rejections, React component errors
- **Backend errors:** Next.js API route errors, server-side rendering errors
- **Performance:** Page load times, API route latency
- **User context:** Email from Clerk, user ID
- **Breadcrumbs:** User actions before error (clicks, navigation)
- **Release tracking:** Git commit SHA for each deployment

**Convex Error Monitoring:**

Sentry for Convex requires Convex Pro plan. Alternative for MVP:

1. **Use Convex built-in logs** (free):
   - Dashboard → Logs page
   - Full stack traces
   - Filter by function/error type

2. **Upgrade to Convex Pro** ($25/month) to enable Sentry integration:
   - Dashboard → Deployment Settings → Integrations → Sentry
   - Paste Sentry DSN
   - Automatically tags errors with function name, type, runtime

**Recommendation for MVP:** Use Sentry for Next.js errors, Convex logs for backend. Upgrade to Convex Pro + Sentry integration post-MVP.

**Free Tier:**
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 session replays/month
- 1 team member
- 30-day retention

**Sources:**
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Convex Exception Reporting](https://docs.convex.dev/production/integrations/exception-reporting)
- [Convex + Sentry Integration](https://sentry.io/integrations/convex/)
- [Convex Observability](https://stack.convex.dev/observability-in-production)

---

## Production Additions — Performance Monitoring

### Vercel Analytics + Speed Insights (Recommended)

| Technology | Purpose | Cost | Why |
|------------|---------|------|-----|
| **@vercel/analytics** | User analytics | Free | Native Vercel integration, zero-config, privacy-friendly, no cookies |
| **@vercel/speed-insights** | Core Web Vitals | Free | Real User Monitoring, Core Web Vitals tracking, Next.js optimized |

**Why Vercel Analytics:**
- Zero configuration (just add components)
- Privacy-first (no cookies, GDPR compliant)
- Free tier included with Vercel
- Tracks real user metrics (not synthetic tests)
- Dashboard included in Vercel UI

**Installation:**
```bash
cd ai-marketing-department/ai-marketing-department
npm install @vercel/analytics @vercel/speed-insights
```

**Integration:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**What It Tracks:**

**Analytics:**
- Page views
- User sessions
- Top pages
- Traffic sources (referrers)
- Real-time visitors
- Geographic distribution

**Speed Insights (Core Web Vitals):**
- **LCP** (Largest Contentful Paint) - Target: < 2.5s
- **INP** (Interaction to Next Paint) - Target: < 200ms *(replaced FID in 2024)*
- **CLS** (Cumulative Layout Shift) - Target: < 0.1
- **TTFB** (Time to First Byte)
- **FCP** (First Contentful Paint)

**Performance Optimization Already in Place:**
- Next.js 16 uses Turbopack (2-5x faster builds)
- Server Components reduce client-side JS
- `next/image` optimizes images automatically
- Static generation for marketing pages

**Sources:**
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Core Web Vitals Optimization 2024](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024)
- [Next.js Performance Guide](https://nextjs.org/learn/seo/web-performance)
- [Optimizing Next.js App Router 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)

---

## Production Additions — Testing Infrastructure

### Vitest + React Testing Library (Recommended)

| Technology | Version | Purpose | Cost | Why |
|------------|---------|---------|------|-----|
| **vitest** | ^2.2.0 | Test runner | Free | 10-20x faster than Jest, native ESM, TypeScript out-of-box, modern DX |
| **@testing-library/react** | ^16.1.0 | Component testing | Free | Industry standard for React, works with React 19, user-centric testing |
| **@vitejs/plugin-react** | ^4.3.4 | React support | Free | Required for React 19 + Vitest |
| **jsdom** | ^25.0.1 | Browser environment | Free | DOM simulation for component tests |

**Why Vitest over Jest:**
- **10-20x faster** in watch mode
- **Native ESM support** (Jest only has experimental ESM)
- **Zero-config TypeScript** (no ts-jest needed)
- **Hot Module Reloading** (tests reload instantly)
- **Modern developer experience** (better error messages)
- **Vite ecosystem** (Next.js 16 uses Vite-compatible Turbopack)

**Installation:**
```bash
cd ai-marketing-department/ai-marketing-department
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Configuration:**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Example Test:**
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

**Testing Strategy for MVP:**
1. **Component tests:** UI components (buttons, forms, modals) - Priority: HIGH
2. **Integration tests:** Page-level flows (create content, publish) - Priority: MEDIUM
3. **E2E tests:** Skip for MVP (add Playwright post-MVP) - Priority: LOW

**Coverage Goals:**
- MVP (Phase 1): 60% coverage
- Post-MVP (Phase 2): 80% coverage
- Focus on critical user flows first

**Sources:**
- [Vitest vs Jest Comparison](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
- [Vitest for Next.js Apps](https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app)
- [Testing in 2026: Full Stack Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)

---

## Production Additions — Code Quality

### ESLint + Prettier + Husky + lint-staged

| Technology | Version | Purpose | Cost | Why |
|------------|---------|---------|------|-----|
| **eslint** | 9.x | TypeScript linting | Free | Already installed, catches bugs, enforces best practices |
| **prettier** | ^3.4.2 | Code formatting | Free | Consistent code style, auto-format |
| **husky** | ^9.2.0 | Git hooks | Free | Enforce quality before commit |
| **lint-staged** | ^15.4.0 | Lint staged files | Free | Only lint changed files (fast) |

**Why This Combo:**
- ESLint catches logic errors and enforces best practices
- Prettier handles formatting (no more style debates)
- Husky runs checks before git commit (prevents broken commits)
- lint-staged only checks changed files (fast feedback)

**Installation:**
```bash
cd ai-marketing-department/ai-marketing-department
npm install -D prettier husky lint-staged
```

**Configuration:**

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

Create `.prettierignore`:
```
node_modules
.next
out
build
dist
coverage
.convex
```

Update `package.json`:
```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

**Setup Husky:**
```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**What It Does:**
- **Before every commit:** Automatically formats and lints staged files
- **Fast:** Only checks changed files (not entire codebase)
- **Blocks bad commits:** If linting fails, commit is rejected
- **Consistent:** Entire team uses same formatting

**ESLint Config (Already in place):**

Next.js 16 uses flat config format (`eslint.config.mjs`):

```typescript
// eslint.config.mjs (already exists)
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

**Sources:**
- [Prettier + ESLint Configuration (2026)](https://medium.com/@osmion/prettier-eslint-configuration-that-actually-works-without-the-headaches-a8506b710d21)
- [Automating Code Quality with Husky (2026)](https://victorbruce82.medium.com/bulletproof-react-automating-code-quality-with-eslint-prettier-and-husky-2026-2f28b23cec99)
- [ESLint v10.0.0 Release](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/)

---

## Production Additions — Security

### Dependency Scanning: npm audit + Dependabot

| Technology | Purpose | Cost | Why |
|------------|---------|------|-----|
| **npm audit** | Vulnerability scanning | Free | Built into npm, scans dependencies for CVEs |
| **Dependabot** | Automated security PRs | Free | Auto-creates PRs to fix vulnerabilities |

**Why This Combo:**
- npm audit identifies vulnerable packages
- Dependabot automatically proposes fixes via PRs
- Combined approach: identify + remediate
- GitHub-native (no external tool)

**Setup npm audit:**

Add to `package.json`:
```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

Add to GitHub Actions CI:
```yaml
- name: Audit dependencies
  run: npm audit --audit-level=moderate
  working-directory: ./ai-marketing-department/ai-marketing-department
```

**Setup Dependabot:**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/ai-marketing-department/ai-marketing-department"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    ignore:
      # Ignore major version updates for stable packages
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "next"
        update-types: ["version-update:semver-major"]

  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
```

**What It Does:**
- **npm audit:** Scans on every `npm install`, identifies vulnerabilities
- **Dependabot:** Creates PRs every Monday for vulnerable packages
- **Combined flow:** Audit identifies → Dependabot proposes → You review + merge

**Security Best Practices:**
- Run `npm audit` before every deployment
- Review Dependabot PRs weekly
- Prioritize high/critical vulnerabilities
- Test thoroughly before merging dependency updates

**Sources:**
- [npm Audit Guide](https://blog.cyberdesserts.com/npm-security-vulnerabilities/)
- [npm Audit Official Docs](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

---

## What NOT to Add (Avoid Over-Engineering)

| Tool | Why Skip for MVP | Add When |
|------|------------------|----------|
| **Playwright E2E tests** | Slow setup, complex, team is small | Post-MVP when critical flows stabilize |
| **Docker** | Vercel handles deployment, no need | If migrating off Vercel or self-hosting |
| **Kubernetes** | Overkill for serverless Next.js + Convex | Never (stay serverless) |
| **Redux** | React Context + Convex real-time sufficient | If state management becomes complex (50+ components) |
| **@next/bundle-analyzer** | Not needed until bundle size problem | If bundle > 500KB |
| **Lighthouse CI** | Manual audits sufficient for now | When Core Web Vitals < 90 consistently |
| **Datadog** | Too expensive ($15/host/month) | If Sentry free tier insufficient (> 5K errors/month) |
| **New Relic** | Overkill for MVP | If need APM beyond Sentry |
| **Storybook** | Team small, not building design system | If building reusable component library |
| **Cypress** | Superseded by Playwright, slower | Use Playwright if adding E2E tests |

---

## Environment Variables Strategy

### Vercel Environment Variables

**Management:** Vercel Dashboard (not CLI for production)

**Why Dashboard:**
- All variables encrypted by default
- "Sensitive" variables cannot be decrypted
- UI makes it easy to set per-environment
- Team members can't accidentally leak secrets

**How to Set:**
1. Go to Vercel project → Settings → Environment Variables
2. Add variable name + value
3. Select environments (Production, Preview, Development)
4. Mark sensitive variables (API keys, secrets)

**Critical Variables:**
```
CONVEX_DEPLOY_KEY                          # Production only
NEXT_PUBLIC_CONVEX_URL                     # Production + Preview
ANTHROPIC_API_KEY                          # Sensitive, Production + Preview
CLERK_SECRET_KEY                           # Sensitive, Production + Preview
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY          # Production + Preview
NEXT_PUBLIC_SENTRY_DSN                     # Production + Preview
SENTRY_AUTH_TOKEN                          # Sensitive, Production only
```

### Convex Environment Variables

**Management:** Convex Dashboard or CLI

**How to Set:**
```bash
# Via CLI
npx convex env set ANTHROPIC_API_KEY sk-ant-xxx

# Via Dashboard
# Dashboard → Deployment Settings → Environment Variables
```

**Constraints:**
- Max 100 variables
- Names: max 40 chars, letters/numbers/underscores only
- Values: max 8KB
- Different values for dev vs prod deployments

**Critical Variables:**
```
ANTHROPIC_API_KEY=sk-ant-xxx
META_ACCESS_TOKEN=xxx          # If using Instagram
LINKEDIN_ACCESS_TOKEN=xxx       # If using LinkedIn
```

**Sources:**
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Sensitive Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)

---

## Deployment Workflow

### Development → Staging → Production

**Development:**
```bash
# Local development
npm run dev  # Next.js on localhost:3000
npx convex dev  # Convex dev deployment
```

**Staging (Preview Deployments):**
```bash
# Automatic on every PR
git checkout -b feature/new-feature
git push origin feature/new-feature
# → GitHub Actions runs CI
# → Vercel creates preview deployment
# → Preview URL: https://amd-feature-new-feature-username.vercel.app
```

**Production:**
```bash
# Merge PR to main
git checkout main
git merge feature/new-feature
git push origin main
# → GitHub Actions runs CI
# → Vercel deploys to production
# → Production URL: https://amd.vercel.app (or custom domain)
```

**Convex Deployment:**
```bash
# Deploy Convex separately (after merging to main)
npx convex deploy --prod

# Or use Convex deploy key in CI
# (Add CONVEX_DEPLOY_KEY to GitHub Secrets)
```

**Rollback:**
```bash
# Rollback Next.js (Vercel Dashboard)
# Deployments → Previous deployment → Promote to Production

# Rollback Convex (Dashboard)
# Dashboard → Deployment History → Restore previous version
```

**Sources:**
- [Vercel Git Integration](https://vercel.com/docs/git)
- [Vercel Preview Deployments](https://vercel.com/docs/deployments/environments)
- [Convex Production Deployment](https://docs.convex.dev/production)

---

## Summary: Production Stack Additions

### Must-Have (Phase 1 - Pre-Launch)

| Category | Tool | Cost/Month | Priority |
|----------|------|------------|----------|
| **Deployment** | Vercel | $0 (free tier) | CRITICAL |
| **CI/CD** | GitHub Actions | $0 (free tier) | CRITICAL |
| **Error Monitoring** | Sentry | $0 (5K errors/mo) | CRITICAL |
| **Performance** | Vercel Analytics + Speed Insights | $0 (free tier) | HIGH |
| **Testing** | Vitest + React Testing Library | $0 | HIGH |
| **Code Quality** | ESLint + Prettier + Husky | $0 | HIGH |
| **Security** | npm audit + Dependabot | $0 | HIGH |

**Total Cost:** $0/month (stays free until growth)

### Nice-to-Have (Phase 2 - Post-Launch)

| Category | Tool | When to Add |
|----------|------|-------------|
| E2E Testing | Playwright | When critical user flows stabilize |
| Bundle Analysis | @next/bundle-analyzer | If bundle > 500KB |
| Performance Budget | Lighthouse CI | If Core Web Vitals < 90 |
| Convex + Sentry | Convex Pro + Sentry | If backend errors become frequent |

---

## Installation Checklist

### 1. Backend (Convex)

```bash
cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd

# Deploy to production
npx convex deploy

# Set environment variables (Convex Dashboard)
# Dashboard → Deployment Settings → Environment Variables
# - ANTHROPIC_API_KEY
# - META_ACCESS_TOKEN (if using)
# - LINKEDIN_ACCESS_TOKEN (if using)
```

### 2. Frontend (Next.js)

```bash
cd ai-marketing-department/ai-marketing-department

# 1. Error monitoring
npx @sentry/wizard@latest -i nextjs

# 2. Performance monitoring
npm install @vercel/analytics @vercel/speed-insights

# 3. Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom

# 4. Code quality
npm install -D prettier husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# 5. Verify build
npm run build
```

### 3. GitHub

```bash
# Create CI workflow
mkdir -p .github/workflows
# Copy ci.yml from STACK.md recommendations

# Create Dependabot config
# Copy dependabot.yml from STACK.md recommendations

# Commit and push
git add .
git commit -m "feat: add production tooling (CI/CD, error monitoring, testing)"
git push origin main
```

### 4. Vercel

```bash
# Install CLI
npm install -g vercel

# Link project
vercel link

# Deploy to production
vercel --prod
```

**Then set environment variables in Vercel Dashboard:**
1. Go to project → Settings → Environment Variables
2. Add all variables (see "Environment Variables Strategy" section)
3. Mark sensitive variables (API keys, secrets)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Deployment** | HIGH | Vercel is official Next.js platform, proven at scale, extensive docs |
| **CI/CD** | HIGH | GitHub Actions is industry standard, many Next.js examples |
| **Error Monitoring** | HIGH | Sentry Next.js SDK mature, React 19 support confirmed, Convex integration documented |
| **Performance** | MEDIUM | Vercel Analytics well-documented, free tier limits not fully specified in 2026 docs |
| **Testing** | HIGH | Vitest proven faster than Jest, strong TypeScript + React 19 support, growing community |
| **Code Quality** | HIGH | ESLint + Prettier + Husky industry standard, well-established patterns |
| **Security** | HIGH | npm audit + Dependabot built into GitHub, proven for dependency management |

**Overall Confidence:** HIGH for production readiness with this stack.

---

## Open Questions for Phase-Specific Research

1. **Vercel Pro upgrade trigger:** At what monthly bandwidth (GB) should we upgrade from free to Pro?
2. **Sentry alert thresholds:** What error rate should trigger alerts? (e.g., > 10 errors/hour)
3. **Test coverage enforcement:** Should CI block merge if coverage drops below threshold?
4. **Performance budget:** What Core Web Vitals scores should trigger alerts?
5. **Dependabot merge strategy:** Auto-merge patch updates, manual review for minor/major?

**Recommendation:** Start with defaults, adjust based on first month of production data.

---

## Sources

### Deployment & Hosting
- [Vercel Deployment Configuration (2026)](https://oneuptime.com/blog/post/2026-01-24-configure-vercel-deployment/view)
- [Next.js 16 Release Features](https://www.infoq.com/news/2025/12/nextjs-16-release/)
- [Next.js 16 Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Convex Production Deployment](https://docs.convex.dev/production)
- [Convex + Vercel Integration](https://docs.convex.dev/production/hosting/vercel)

### CI/CD
- [Setting Up CI/CD for Next.js](https://arnab-k.medium.com/setting-up-ci-cd-pipelines-for-next-js-projects-354d500f7461)
- [Next.js CI/CD Deployment Guide](https://nextjsstarter.com/blog/nextjs-cicd-deployment-guide-2024/)

### Error Monitoring
- [Convex Exception Reporting](https://docs.convex.dev/production/integrations/exception-reporting)
- [Convex + Sentry Integration](https://sentry.io/integrations/convex/)
- [Convex Observability](https://stack.convex.dev/observability-in-production)

### Authentication Security
- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk Security Best Practices](https://clerk.com/docs/guides/secure/best-practices/fixation-protection)
- [Convex + Clerk + Next.js Authentication](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs)

### Performance
- [Optimizing Core Web Vitals 2024](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024)
- [Next.js Web Performance](https://nextjs.org/learn/seo/web-performance)
- [Improve Core Web Vitals Next.js](https://nextjs.org/learn/seo/improve)
- [Optimize Core Web Vitals Next.js App Router 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)

### Testing
- [Vitest vs Jest](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
- [Vitest vs Jest for Next.js](https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app)
- [Testing in 2026: Full Stack Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [Jest vs Vitest 2025](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)

### Code Quality
- [Prettier + ESLint Configuration (2026)](https://medium.com/@osmion/prettier-eslint-configuration-that-actually-works-without-the-headaches-a8506b710d21)
- [Automating Code Quality with Husky (2026)](https://victorbruce82.medium.com/bulletproof-react-automating-code-quality-with-eslint-prettier-and-husky-2026-2f28b23cec99)
- [ESLint v10.0.0 Release](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/)
- [Improving Code Quality in React](https://medium.com/globant/improving-code-quality-in-react-with-eslint-prettier-and-typescript-86635033d803)

### Security
- [npm Audit Tutorial](https://spectralops.io/blog/a-developers-tutorial-to-using-npm-audit-for-dependency-scanning/)
- [npm Security Guide](https://blog.cyberdesserts.com/npm-security-vulnerabilities/)
- [npm Audit Official Docs](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)
- [Dependabot Troubleshooting](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/troubleshooting-the-detection-of-vulnerable-dependencies)

### Environment Variables
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
- [Convex CLI](https://docs.convex.dev/cli)

### Deployment Workflow
- [Vercel Preview Deployments](https://vercel.com/docs/deployments/environments)
- [Deploying GitHub Projects with Vercel](https://vercel.com/docs/git/vercel-for-github)
- [Vercel Git Integration](https://vercel.com/docs/git)

---

**Research completed:** 2026-02-09
**Confidence:** HIGH (deployment, CI/CD, error monitoring, testing, code quality)
**Ready for roadmap creation.**
