# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Full-stack Next.js with Convex backend, using server and client components with real-time data synchronization via Convex's React hooks.

**Key Characteristics:**
- Multi-brand SaaS with brand context switching
- Real-time dashboard with Convex as source of truth
- File-based API routes for external integrations (brand audits, Instagram scraping)
- Client-side rendering with dynamic imports for modular features
- Clerk for authentication with dev auth bypass for development
- TypeScript strict mode enforced throughout

## Layers

**Presentation Layer:**
- Purpose: User interface and client-side rendering
- Location: `components/` (204 components), `app/` (pages using App Router)
- Contains: React components (tsx), page layouts, UI primitives from shadcn/ui
- Depends on: Convex hooks (`useQuery`, `useMutation`), React Context API, Next.js utilities
- Used by: Users through browser; provides data binding to backend

**Routing & Pages Layer:**
- Purpose: Next.js App Router with route groups and dynamic segments
- Location: `app/(dashboard)/` (protected routes), `app/(public)/` (public routes), `app/sign-in/`
- Contains: Page components, layouts, error boundaries, loading states
- Depends on: Presentation layer components, API routes
- Used by: Browser navigation, middleware auth checks

**State Management Layer:**
- Purpose: Context-based state management for brand switching and theme
- Location: `hooks/useBrandContext.tsx` (BrandProvider, useBrandContext), `hooks/useTheme.ts`
- Contains: React Context providers, custom hooks wrapping Convex queries
- Depends on: Convex API (`api.brandProfile.*`)
- Used by: Page components and nested components for cross-cutting data

**Business Logic Layer:**
- Purpose: Application-specific utilities, data transformations, validations
- Location: `lib/` (15+ utility files), `hooks/` (6 custom hooks)
- Contains: Brand utilities (`brand-utils.ts`), file parsers (`file-parsers.ts`), error handling (`errors.ts`), content adapters (`contentAdapters.ts`)
- Depends on: Zod for validation, external libraries (date-fns, dompurify)
- Used by: Components and page files for data processing

**Backend Layer (Convex):**
- Purpose: Serverless backend with real-time database and business logic execution
- Location: `convex/` (schema, functions, actions, onboarding)
- Contains: Schema definitions, queries, mutations, actions, feeds, cron jobs
- Depends on: Claude API (via actions), Anthropic SDK
- Used by: Frontend via Convex React client, webhooks, scheduled jobs

**API Routes Layer:**
- Purpose: Server-side API endpoints for specific integrations
- Location: `app/api/` (brand-audit, scrape-instagram)
- Contains: Next.js route handlers using `NextRequest`/`NextResponse`
- Depends on: Playwright for browser automation, external services
- Used by: Frontend pages and external webhooks

**Authentication Layer:**
- Purpose: Request authentication and authorization
- Location: `middleware.ts` (Clerk middleware), `ConvexClientProvider.tsx` (auth integration)
- Contains: Route protection, auth state management, token handling
- Depends on: Clerk SDK, Convex auth utilities
- Used by: All protected routes and Convex client

**Data Flow:**

1. **Query Flow (Read):**
   ```
   Component → useQuery(api.*)
   ↓
   Convex Query → Database lookup
   ↓
   Real-time subscription (auto-rerender on change)
   ```

2. **Mutation Flow (Write):**
   ```
   Component → useMutation(api.*)
   ↓
   Convex Mutation → Database update
   ↓
   Optimistic UI update + auto-sync
   ```

3. **Action Flow (External API):**
   ```
   Component → useMutation(api.*)
   ↓
   Convex Action → Claude API call
   ↓
   Data stored in database
   ↓
   UI re-renders via subscription
   ```

4. **Brand Context Flow:**
   ```
   LayoutShell → BrandProvider
   ↓
   BrandContext (activeBrandId, activeBrand stored in localStorage)
   ↓
   Descendant components → useBrandContext()
   ↓
   Pass brandProfileId to Convex queries for filtering
   ```

5. **File Upload Flow:**
   - User selects file in component (e.g., brand step for logo)
   - Converted to base64 string
   - Passed to Convex mutation
   - Stored in database (file content + metadata)
   - Retrieved via query and rendered in UI

**State Management:**

**Convex Real-time Sync:** Primary state source. Components subscribe via `useQuery()` hooks. Updates to database trigger component re-renders automatically. No Redux or Zustand needed due to Convex's reactivity.

**Local Storage:**
- Brand switching: Active brand ID persisted in `localStorage[amd_active_brand_id]`
- Tour state: onboarding tour dismissed flag
- Theme preference: light/dark mode toggle

**React Context API:**
- `BrandContext` wraps the dashboard (`BrandProvider` in `LayoutShell`)
- `ToastProvider` for toast notifications
- Theme context for dark mode

**Client-side Cache:** Convex client handles intelligent caching of queries and mutations. Manual cache invalidation via mutation completion.

## Key Abstractions

**Brand Profile:**
- Purpose: Multi-tenant data isolation; each user has multiple brands
- Examples: `hooks/useBrandContext.tsx`, `lib/brand-utils.ts`, schema in Convex
- Pattern: Query filters on `brandProfileId`, context provider ensures correct brand is active

**Content Pipeline:**
- Purpose: Workflow for creating, editing, reviewing, and publishing content
- Examples: `components/content/`, `lib/contentAdapters.ts`, Convex mutations
- Pattern: Content has states (draft → review → approved → published), UI shows contextual actions per state

**Brand Audit & Data Collection:**
- Purpose: Extract brand information from Instagram, websites, and file uploads
- Examples: `app/api/brand-audit/route.ts`, `app/api/scrape-instagram/`, `lib/file-parsers.ts`
- Pattern: API routes use Playwright for browser automation; results flow to Convex mutations

**Agent Execution:**
- Purpose: Task orchestration and agent coordination
- Examples: Dashboard execute modal, agent cards with status display
- Pattern: Click to trigger agent → Convex action calls Claude → results stored → UI updates via subscription

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Page load
- Responsibilities: Global font setup, Clerk provider, Convex client provider, metadata

**Dashboard Layout:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: Navigation to any `/` page
- Responsibilities: Renders `LayoutShell` which contains sidebar, mobile nav, command palette, auth checks

**Dashboard Page (Home):**
- Location: `app/(dashboard)/page.tsx`
- Triggers: `/` route
- Responsibilities: Renders hero metrics, activity summary, department kanban, results, and execute modal

**Brand Page:**
- Location: `app/(dashboard)/brand/page.tsx`
- Triggers: `/brand` route
- Responsibilities: Multi-step wizard for brand profile creation and editing

**Content Page:**
- Location: `app/(dashboard)/content/page.tsx`
- Triggers: `/content` route
- Responsibilities: Content management with create, edit, filter, and workflow actions

**Agents Page:**
- Location: `app/(dashboard)/agents/page.tsx`
- Triggers: `/agents` route
- Responsibilities: Agent grid with filtering, detail panel, execution options

**Onboarding Page:**
- Location: `app/onboarding/page.tsx`
- Triggers: First-time users or manual navigation to `/onboarding`
- Responsibilities: Initial setup wizard (company info, channels, departments)

## Error Handling

**Strategy:** Layered error handling with user-friendly toast notifications and error boundaries.

**Patterns:**

1. **Component-level Error Boundaries:**
   - Location: `error.tsx` files in route groups (e.g., `app/(dashboard)/error.tsx`)
   - Catches render errors and provides fallback UI
   - Logs to console for debugging

2. **Mutation Error Handling:**
   ```typescript
   try {
     await mutation(data);
     success("Action completed");
   } catch (err) {
     error(getErrorMessage(err));
   }
   ```
   - Wraps Convex mutations with try-catch
   - Extracts human-readable message from `errors.ts`
   - Displays toast notification

3. **Query Fallbacks:**
   - If query returns `undefined`, show loading skeleton
   - If query fails (network), show error UI with retry button

4. **API Route Error Responses:**
   - Location: `app/api/*/route.ts`
   - Return `NextResponse.json({ error: message }, { status: 400 })`
   - Frontend catches via fetch error handling

5. **Validation Errors:**
   - Use Zod schemas in `lib/schemas.ts`
   - Pre-validate on client before sending to backend
   - Display field-level errors near inputs

## Cross-Cutting Concerns

**Logging:** Console-based only. Errors logged to browser console for debugging. Vercel Analytics and Speed Insights integrated at page load (`app/layout.tsx` lines 73-74).

**Validation:** Zod schemas in `lib/schemas.ts` for critical data. Brand data validated via `brand-utils.ts`. Content body must be ≥50 chars. File uploads validated by MIME type before sending to backend.

**Authentication:** Clerk middleware in `middleware.ts` protects routes. Public routes: `/sign-in`, `/landing`, `/api/clerk`. Convex integrates auth via `ConvexProviderWithClerk`. Dev bypass via `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` for development without Clerk.

**Authorization:** Convex mutations implicitly check user context via `ctx.auth.getUserIdentity()`. Brand queries filtered to user's brands only (enforced in Convex schema). Users cannot access other users' data due to backend filtering.

**Caching:** Convex handles automatic caching via React hooks. Component-level memoization with `useMemo` and `useCallback` to prevent unnecessary re-renders. Dynamic imports for heavy components (e.g., DashboardExecuteModal).

**Theme/Styling:** CSS custom properties (Tailwind CSS 4 with PostCSS). Light/dark theme variables set in `theme-init.js` (loaded via Script in root layout, before interactive). Theme toggle in user menu switches CSS variables.

**Localization:** Spanish language throughout UI and documentation. Locale set to `es-CL` in root layout. Date and time formatting uses `toLocaleString()` with Spanish locale in components (e.g., `DashboardGreeting.tsx`).

---

*Architecture analysis: 2026-02-14*
