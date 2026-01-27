# Codebase Structure

**Analysis Date:** 2026-01-27

## Directory Layout

```
/home/tomas/Escritorio/amd/
├── convex/                           # Convex backend (queries, mutations, actions, crons)
│   ├── schema.ts                     # Database schema definition (11 tables)
│   ├── functions.ts                  # Queries and mutations for CRUD
│   ├── actions.ts                    # Server actions for Claude API calls
│   ├── crons.ts                      # Scheduled job definitions
│   ├── seed.ts                       # Initial data for 37 agents
│   ├── agentSdk.ts                   # Agent SDK utilities
│   ├── tsconfig.json                 # TypeScript config for Convex
│   ├── README.md                     # Convex setup instructions
│   └── _generated/                   # Auto-generated Convex types
├── ai-marketing-department/
│   └── ai-marketing-department/      # Next.js frontend application
│       ├── app/                      # Next.js App Router pages
│       │   ├── page.tsx              # Dashboard (/)
│       │   ├── layout.tsx            # Root layout wrapper
│       │   ├── ConvexClientProvider.tsx  # Convex context setup
│       │   ├── template.tsx          # Layout template
│       │   ├── not-found.tsx         # 404 page
│       │   ├── agents/
│       │   │   └── page.tsx          # Agents listing and management (/agents)
│       │   ├── org/
│       │   │   └── page.tsx          # Organization chart (/org)
│       │   ├── campaigns/
│       │   │   └── page.tsx          # Campaign management (/campaigns)
│       │   ├── content/
│       │   │   └── page.tsx          # Content review and publishing (/content)
│       │   ├── analytics/
│       │   │   └── page.tsx          # Analytics dashboard (/analytics)
│       │   ├── settings/
│       │   │   └── page.tsx          # System settings (/settings)
│       │   └── generated/
│       │       └── page.tsx          # Generated content viewer (/generated)
│       ├── components/               # Reusable React components
│       │   ├── layout/
│       │   │   └── Sidebar.tsx       # Navigation sidebar (fixed left)
│       │   ├── ui/                   # Base UI components
│       │   │   ├── Card.tsx          # Card container with variants
│       │   │   ├── Badge.tsx         # Status and role badges
│       │   │   ├── AnimatedCounter.tsx  # Animated number counters
│       │   │   ├── TrendIndicator.tsx   # Trend up/down indicators
│       │   │   ├── Skeleton.tsx      # Loading skeletons
│       │   │   ├── Toast.tsx         # Toast notifications
│       │   │   ├── EmptyState.tsx    # Empty state placeholders
│       │   │   ├── FilterTabs.tsx    # Tab filters
│       │   │   └── ActivityFeed.tsx  # Activity list component
│       │   ├── charts/               # Data visualization
│       │   │   ├── BarChart.tsx      # Bar chart wrapper
│       │   │   ├── LineChart.tsx     # Line chart wrapper
│       │   │   ├── DonutChart.tsx    # Donut/pie chart
│       │   │   ├── AreaChart.tsx     # Area chart
│       │   │   ├── Sparkline.tsx     # Mini sparkline
│       │   │   ├── ChartTooltip.tsx  # Shared tooltip
│       │   │   ├── theme.ts          # Chart color constants
│       │   │   └── index.ts          # Chart exports
│       │   └── org/                  # Organization components
│       │       ├── OrgChart.tsx      # Agent hierarchy visualization
│       │       └── AgentNode.tsx     # Individual agent node
│       ├── lib/                      # Utility functions
│       │   └── utils.ts              # Shared utilities (cn, date formatting)
│       ├── public/                   # Static assets
│       ├── globals.css               # Global Tailwind styles
│       ├── package.json              # Frontend dependencies
│       ├── tsconfig.json             # Frontend TypeScript config
│       ├── next.config.js            # Next.js configuration
│       ├── tailwind.config.ts        # Tailwind CSS configuration
│       └── .eslintrc.json            # ESLint rules
├── n8n-workflows/                    # n8n workflow definitions
│   ├── agents/
│   │   └── content/
│   │       └── blog-writer.json      # Blog writer workflow
│   └── orchestration/
│       └── task-dispatcher.json      # Task routing workflow
├── scripts/                          # Node.js utility scripts
│   ├── run-agent.js                  # CLI for running agents
│   ├── workflow-*.js                 # Workflow execution scripts
│   └── seed.js                       # Database seeding
├── docs/
│   └── BLUEPRINT.md                  # Technical documentation
├── .env.example                      # Environment variables template
├── .env.local                        # Actual env vars (gitignored)
├── package.json                      # Root dependencies (Convex, Claude SDK)
├── tsconfig.json                     # Root TypeScript config
├── CLAUDE.md                         # Project overview (Spanish)
└── .gitignore                        # Git exclusions
```

## Directory Purposes

**convex/:**
- Purpose: Entire backend including database schema, queries, mutations, actions, scheduling
- Contains: TypeScript files defining Convex functions, database schema, seed data
- Key files: `schema.ts` (database), `functions.ts` (queries/mutations), `actions.ts` (external APIs), `crons.ts` (scheduling)

**ai-marketing-department/ai-marketing-department/app/:**
- Purpose: Next.js App Router page components that define routes and page UI
- Contains: `.tsx` files using client and server components, one per route
- Key files: `page.tsx` files for each route, `layout.tsx` for wrapper

**ai-marketing-department/ai-marketing-department/components/:**
- Purpose: Reusable React components organized by category
- Contains: UI primitives (Card, Badge), charts (BarChart, DonutChart), page sections (Sidebar)
- Key files: `Card.tsx` (container), `AnimatedCounter.tsx` (numbers), chart components, layout shells

**ai-marketing-department/ai-marketing-department/lib/:**
- Purpose: Utility functions and helpers
- Contains: Shared utilities used across components
- Key files: `utils.ts` (cn for classname merging, date utilities)

**n8n-workflows/:**
- Purpose: Workflow definitions for external orchestration
- Contains: JSON-based n8n workflow exports
- Key files: Agent-specific workflows, task dispatcher orchestration

**scripts/:**
- Purpose: Command-line utilities for development and deployment
- Contains: Node.js scripts for running agents, workflows, seeding
- Key files: `run-agent.js` (CLI), `workflow-*.js` (workflow runners)

## Key File Locations

**Entry Points:**
- `convex/schema.ts`: Database schema definition (11 tables)
- `convex/functions.ts`: All Convex queries and mutations
- `convex/actions.ts`: Server actions for Claude API integration
- `convex/crons.ts`: Scheduled job definitions
- `ai-marketing-department/ai-marketing-department/app/layout.tsx`: Root layout, ConvexProvider setup
- `ai-marketing-department/ai-marketing-department/app/page.tsx`: Dashboard homepage

**Configuration:**
- `.env.example`: Environment variables template (ANTHROPIC_API_KEY, CONVEX_DEPLOYMENT, etc.)
- `.env.local`: Actual secrets (gitignored)
- `package.json`: Root project dependencies
- `ai-marketing-department/ai-marketing-department/package.json`: Frontend dependencies
- `ai-marketing-department/ai-marketing-department/tsconfig.json`: Frontend TypeScript config
- `convex/tsconfig.json`: Backend TypeScript config
- `ai-marketing-department/ai-marketing-department/tailwind.config.ts`: Tailwind CSS settings
- `ai-marketing-department/ai-marketing-department/next.config.js`: Next.js configuration

**Core Logic:**
- `convex/functions.ts`: Agent CRUD, task management, content operations
- `convex/actions.ts`: `callClaude` action (Claude API calls), `executeAgent` action
- `convex/seed.ts`: 37 agent definitions with system prompts
- `ai-marketing-department/ai-marketing-department/app/agents/page.tsx`: Agent listing with filters
- `ai-marketing-department/ai-marketing-department/components/org/OrgChart.tsx`: Hierarchy visualization

**Testing:**
- Not configured in codebase (no test files detected)

**Styling:**
- `ai-marketing-department/ai-marketing-department/globals.css`: Tailwind directives
- `ai-marketing-department/ai-marketing-department/components/charts/theme.ts`: Chart color palette
- `ai-marketing-department/ai-marketing-department/tailwind.config.ts`: Tailwind theme configuration

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `Card.tsx`, `AgentNode.tsx`)
- Page files: `page.tsx` for App Router pages
- Utility files: camelCase (e.g., `utils.ts`, `agentSdk.ts`)
- Convex tables: camelCase singular (e.g., `agents`, `tasks`)

**Directories:**
- Feature directories: kebab-case (e.g., `ui/`, `org/`, `charts/`)
- Next.js routes: kebab-case (e.g., `/agents`, `/content`, `/org`)

**TypeScript/JavaScript Conventions:**
- Types/Interfaces: PascalCase (e.g., `CardProps`, `Agent`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEPARTMENTS`, `STATUSES`)
- Functions: camelCase (e.g., `createTask`, `generateSparklineData`)
- Variables: camelCase (e.g., `agentId`, `isActive`)

**Agent IDs:**
- Pattern: `{department}-{number}` or `{department}-{role}`
- Examples: `content-001`, `content-002`, `cmo-001`, `social-manager`
- Departments: leadership, content, social, demandgen, seo, brand, ops

**Status Enums:**
- Agents: `active`, `paused`, `error`, `maintenance`
- Tasks: `pending`, `queued`, `running`, `waiting_review`, `completed`, `failed`, `cancelled`
- Content: `draft`, `review`, `revision_needed`, `approved`, `scheduled`, `published`, `archived`
- Handoffs: `pending`, `accepted`, `rejected`, `completed`

## Where to Add New Code

**New Feature:**
- Primary code: `convex/functions.ts` (add new query/mutation)
- Backend action: `convex/actions.ts` (add action for external integration)
- Frontend page: `ai-marketing-department/ai-marketing-department/app/{feature}/page.tsx`
- Tests: Not applicable (no test infrastructure)

**New Component/Module:**
- Reusable UI: `ai-marketing-department/ai-marketing-department/components/{category}/{ComponentName}.tsx`
- Chart component: `ai-marketing-department/ai-marketing-department/components/charts/{ChartName}.tsx`
- Layout component: `ai-marketing-department/ai-marketing-department/components/layout/{LayoutName}.tsx`

**Utilities:**
- Shared helpers: `ai-marketing-department/ai-marketing-department/lib/utils.ts`
- Agent SDK helpers: `convex/agentSdk.ts`
- Chart theme constants: `ai-marketing-department/ai-marketing-department/components/charts/theme.ts`

**Database:**
- New table: Add definition to `convex/schema.ts` using `defineTable()`
- New queries: Add to `convex/functions.ts` with `query()` wrapper
- New mutations: Add to `convex/functions.ts` with `mutation()` wrapper
- Seed data: Add agent definitions to `convex/seed.ts`

**Styling:**
- Global styles: Edit `ai-marketing-department/ai-marketing-department/globals.css`
- Component styles: Use Tailwind classes inline in JSX
- Chart colors: Add to `ai-marketing-department/ai-marketing-department/components/charts/theme.ts`

**Workflows:**
- n8n workflows: Export JSON from n8n dashboard to `n8n-workflows/{category}/{name}.json`
- CLI scripts: Add Node.js scripts to `scripts/{feature}.js`

## Special Directories

**convex/_generated/:**
- Purpose: Auto-generated Convex type definitions
- Generated: Yes (by `npx convex codegen`)
- Committed: Yes (needed for IDE type safety)
- Contents: `api.d.ts`, `server.d.ts`, `dataModel.d.ts`

**ai-marketing-department/ai-marketing-department/.next/:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignore)
- Contents: Compiled pages, static assets, server-side code

**ai-marketing-department/ai-marketing-department/node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)
- Contents: Frontend package dependencies

**node_modules/ (root):**
- Purpose: Root project dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)
- Contents: Convex CLI, TypeScript, ESLint, etc.

**docs/:**
- Purpose: Technical documentation
- Generated: No
- Committed: Yes
- Contents: BLUEPRINT.md (detailed technical specifications)

---

*Structure analysis: 2026-01-27*
