# Technology Stack

**Analysis Date:** 2026-01-27

## Languages

**Primary:**
- TypeScript 5.3+ - Backend (Convex) and frontend (Next.js) code, strict mode enabled
- JavaScript - Runtime scripts for agent execution and workflows
- React/JSX 19.2 - Frontend UI components

**Secondary:**
- HTML/CSS - Rendered output, styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js 18.0.0+ (required by package.json)
- Browser runtime (Chrome/Chromium for frontend)

**Package Manager:**
- npm - Primary package manager
- Lockfile: package-lock.json (present in both root and frontend)

## Frameworks

**Core:**
- Next.js 16.1.4 - Frontend framework with App Router
- React 19.2.3 - UI library
- Convex 1.17.0 (root), 1.31.6 (frontend) - Backend-as-a-Service, serverless functions, database, real-time sync
- Remotion 4.0.409 - Video rendering framework for marketing content generation

**Testing:**
- Not detected in primary dependencies

**Build/Dev:**
- Turbopack - Next.js build optimization engine
- ESLint 8.55.0+ - Code linting
- TypeScript compiler - Type checking with `tsc --noEmit`
- ts-node 10.9.2 - TypeScript execution for scripts

## Key Dependencies

**Critical:**
- `@anthropic-ai/claude-code` 2.1.19 - Claude API integration via Code CLI (`claude --print`)
- `convex` - Database, backend functions, real-time sync, cron jobs
- `convex-helpers` 0.1.111 - Convex utilities

**UI/Visualization:**
- `lucide-react` 0.563.0 - Icon library
- `framer-motion` 12.29.0 - Animation and motion primitives
- `recharts` 3.7.0 - Data visualization (charts, donuts, sparklines)
- `react-markdown` 10.1.0 - Markdown rendering for content preview
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind CSS class merging

**Date/Time:**
- `date-fns` 4.1.0 - Date utilities

**CSS/Styling:**
- Tailwind CSS 4 - Utility-first CSS framework via `@tailwindcss/postcss` 4
- PostCSS 4 (via tailwindcss/postcss) - CSS processing

**Remotion Video:**
- `@remotion/cli` 4.0.409 - CLI for video rendering
- `@remotion/player` 4.0.409 - Embedded video player

**Environment:**
- `dotenv` 17.2.3 - Environment variable loading

**Dev Dependencies:**
- `@types/node` 20+ - Node.js type definitions
- `@types/react`, `@types/react-dom` 19+ - React type definitions
- `eslint-config-next` 16.1.4 - Next.js ESLint configuration
- `eslint` 9+ - Code quality

## Configuration

**Environment:**
- `.env.local` required with Convex deployment credentials and Next.js public URLs
- Key variables: `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL`
- Optional: `ANTHROPIC_API_KEY` for direct API calls (passed via environment to actions)
- Optional: External service tokens (N8N_WEBHOOK_BASE_URL, META_ACCESS_TOKEN, GOOGLE_ADS_CLIENT_ID, LINKEDIN_ACCESS_TOKEN, SENDGRID_API_KEY)

**Build:**
- `next.config.ts` - Next.js configuration with experimental features and Turbopack
- `tsconfig.json` - TypeScript configuration with strict mode, module resolution bundler, path aliases (`@/*`)
- `postcss.config.mjs` - PostCSS config for Tailwind CSS 4
- `eslint.config.mjs` - ESLint flat config extending Next.js core and TypeScript rules
- `remotion.config.ts` - Video rendering config (JPEG output, overwrite enabled)
- `convex/tsconfig.json` - Convex-specific TypeScript configuration
- `convex/_generated/` - Auto-generated Convex types and API client (committed to repo)

## Platform Requirements

**Development:**
- Node.js 18.0.0 or higher
- npm package manager
- Convex account and CLI (`npx convex login`)
- Anthropic API key for Claude API access
- Terminal/bash environment for running scripts

**Production:**
- Vercel (recommended for Next.js deployment)
- Convex cloud deployment (included in Convex service)
- Supports environment variable injection via hosting platform

## Scripts

**Backend/Convex:**
- `npm run dev` - Start Convex development server (hot reload, watches schema)
- `npx convex deploy` - Deploy to production Convex backend
- `npx convex run seed:seedAgents` - Seed 37 agents into database

**Frontend:**
- `npm run dev` - Start Next.js dev server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

**Type Checking:**
- `npm run typecheck` - Run TypeScript compiler without emitting (finds type errors)

**Remotion Video:**
- `npm run remotion:preview` - Open Remotion Studio for video preview
- `npm run remotion:render` - Render demo video to `out/demo.mp4`
- `npm run remotion:render:preview` - Render preview video

**Agent Execution:**
- `npm run agent` - Execute agent with Claude Code CLI
- `npm run agent:blog` - Content agent: write blog post
- `npm run agent:linkedin` - Social agent: create LinkedIn post
- `npm run agent:twitter` - Social agent: create Twitter thread

**Workflows:**
- `npm run workflow:content` - Run content department workflow
- `npm run workflow:social` - Run social media workflow
- `npm run workflow:seo` - Run SEO workflow
- `npm run workflow:email` - Run email operations workflow
- `npm run workflow:ads` - Run demand generation workflow
- `npm run workflow:brand` - Run brand/creative workflow
- `npm run workflow:full` - Execute complete system workflow

## API Communication

**Convex API:**
- HTTP-based queries/mutations via `CONVEX_URL/api/query|mutation`
- WebSocket for real-time sync via `useQuery()` React hook
- Auto-generated client via `@convex/_generated/api`

**Claude API:**
- Direct HTTPS calls to `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- Models supported: claude-opus-4.5, claude-sonnet-4, claude-haiku-3
- Execution path: Script → Claude Code CLI OR Convex action → Fetch Claude API

## External Service Configuration

**Claude Code CLI:**
- Binary: `claude` command (must be in PATH)
- Usage: `execFileSync("claude", ["--print", "-p", prompt])`
- Integration: Used in `/scripts/run-agent.js` for agent execution
- Plan: Max plan used (zero API costs, included in subscription)

**Optional (planned integrations):**
- n8n webhooks for workflow orchestration
- Meta (Facebook/Instagram) API for paid ads
- Google Ads API for campaign management
- LinkedIn API for B2B targeting
- SendGrid API for email delivery

---

*Stack analysis: 2026-01-27*
