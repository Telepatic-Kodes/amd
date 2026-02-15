# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
ai-marketing-department/
├── app/                          # Next.js App Router (pages and layouts)
│   ├── layout.tsx                # Root layout: fonts, Clerk, Convex, Analytics
│   ├── page.tsx                  # Root page → redirects to dashboard
│   ├── ConvexClientProvider.tsx  # Convex + Clerk integration
│   ├── globals.css               # Tailwind directives + CSS reset
│   ├── luxury-overrides.css      # Brand-specific CSS overrides
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard shell layout
│   │   ├── page.tsx              # Home/dashboard
│   │   ├── brand/                # Brand profile & manual pages
│   │   │   ├── page.tsx          # Brand wizard
│   │   │   └── manual/
│   │   │       └── page.tsx      # Brand manual view
│   │   ├── agents/               # Agent management
│   │   │   └── page.tsx
│   │   ├── content/              # Content management pipeline
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── analytics/            # Analytics & metrics
│   │   │   └── page.tsx
│   │   ├── settings/             # User settings
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── strategy/             # Strategy planning
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── reports/              # Reports & insights
│   │   │   └── page.tsx
│   │   ├── monitoring/           # System monitoring
│   │   │   └── page.tsx
│   │   ├── loading.tsx           # Dashboard loading state
│   │   └── error.tsx             # Dashboard error boundary
│   ├── (public)/                 # Public routes (no dashboard shell)
│   │   ├── layout.tsx
│   │   ├── landing/              # Landing page
│   │   │   └── page.tsx
│   │   └── manual/               # Brand manual public view
│   │       └── [token]/
│   │           └── page.tsx
│   ├── sign-in/                  # Clerk sign-in page
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── onboarding/               # First-time onboarding flow
│   │   └── page.tsx
│   ├── api/                      # API routes
│   │   ├── brand-audit/          # Instagram scrape & brand extraction
│   │   │   └── route.ts
│   │   └── scrape-instagram/     # Instagram profile scraping
│   │       └── route.ts
│   └── global-error.tsx          # Global error boundary
├── components/                   # 204+ React components
│   ├── layout/                   # Layout & shell components
│   │   ├── LayoutShell.tsx       # Main dashboard shell (sidebar, nav)
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── MobileNav.tsx         # Mobile navigation
│   │   ├── UserMenu.tsx          # User profile dropdown
│   │   ├── BrandSwitcher.tsx     # Brand switching dropdown
│   │   └── NavGroup.tsx          # Sidebar nav group helper
│   ├── dashboard/                # Home dashboard components
│   │   ├── HeroMetric.tsx        # Large metric card (executions, cost, etc.)
│   │   ├── ActivitySummary.tsx   # Recent activity list
│   │   ├── DecisionsPending.tsx  # Action items requiring attention
│   │   ├── DepartmentKanban.tsx  # Tasks by department kanban
│   │   ├── ResultsSummary.tsx    # Content & performance summary
│   │   ├── DashboardGreeting.tsx # Welcome message with time
│   │   ├── DashboardExecuteModal.tsx  # Run agent modal
│   │   ├── QuickExecuteModal.tsx      # Quick agent execution
│   │   ├── CommandPalette.tsx    # Command/search palette
│   │   ├── NotificationCenter.tsx     # Notifications popover
│   │   ├── ContentPipeline.tsx   # Content workflow visualization
│   │   ├── MarketingHealthWidget.tsx  # System health indicator
│   │   ├── TopAgentsTable.tsx    # Agent performance table
│   │   ├── ActivityChart.tsx     # Activity over time chart
│   │   ├── KpiCard.tsx           # KPI metric card
│   │   ├── MetricPill.tsx        # Small metric badge
│   │   ├── ChartsRow.tsx         # Multi-chart layout
│   │   ├── AgentCard.tsx         # Individual agent card
│   │   ├── AgentMiniCard.tsx     # Compact agent display
│   │   ├── StrategyLauncher.tsx  # Strategy execution panel
│   │   └── QuickActions.tsx      # Quick action buttons
│   ├── brand/                    # Brand profile wizard components
│   │   ├── BrandAuditPanel.tsx   # Results of brand audit
│   │   ├── BrandManual.tsx       # Complete brand manual view
│   │   ├── BrandProfileSummary.tsx      # Brand details summary
│   │   ├── BrandSummaryCard.tsx         # Card-style summary
│   │   ├── BrandMaturityBar.tsx         # Maturity score visualization
│   │   ├── BrandVersionHistory.tsx      # Previous versions
│   │   ├── BrandUploadFlow.tsx          # File upload handler
│   │   ├── BrandSourcesList.tsx         # Data sources used
│   │   ├── BrandOnboardingChoice.tsx    # Initial choice (quick vs full)
│   │   ├── BrandGuideExport.tsx         # Export brand guide
│   │   ├── BrandSuggestionsPanel.tsx    # AI suggestions
│   │   ├── AddSourceDialog.tsx          # Add data source modal
│   │   ├── BrandStepBasics.tsx          # Step 1: Company info
│   │   ├── BrandStepStrategy.tsx        # Step 2: Strategy
│   │   ├── BrandStepAudience.tsx        # Step 3: Target audience
│   │   ├── BrandStepCompetitors.tsx     # Step 4: Competitors
│   │   ├── BrandStepPositioning.tsx     # Step 5: Positioning
│   │   ├── BrandStepMessaging.tsx       # Step 6: Messaging
│   │   ├── BrandStepVoice.tsx           # Step 7: Voice & tone
│   │   └── BrandStepVisual.tsx          # Step 8: Visual identity
│   ├── content/                  # Content management components
│   │   ├── UploadContentForm.tsx        # Create content inline form
│   │   ├── EditContentModal.tsx         # Full-screen editor modal
│   │   ├── ContentCard.tsx              # Content item display
│   │   ├── ContentFilter.tsx            # Filter by type/status
│   │   ├── ContentPreview.tsx           # Content preview pane
│   │   └── StatusActions.tsx            # Workflow action buttons
│   ├── agents/                   # Agent management components
│   │   ├── AgentGrid.tsx         # Grid of all agents
│   │   ├── AgentDetailPanel.tsx  # Agent details sidebar
│   │   ├── AgentConfigModal.tsx  # Agent configuration
│   │   ├── ActiveChainsPanel.tsx # Active agent chains/handoffs
│   │   └── AgentCard.tsx         # Agent card display
│   ├── charts/                   # Chart components (Recharts)
│   │   ├── LineChart.tsx         # Line chart wrapper
│   │   ├── BarChart.tsx          # Bar chart wrapper
│   │   ├── AreaChart.tsx         # Area chart wrapper
│   │   ├── DonutChart.tsx        # Donut/pie chart
│   │   ├── ChartContainer.tsx    # Chart layout helper
│   │   ├── ChartTooltip.tsx      # Custom tooltip
│   │   └── Sparkline.tsx         # Tiny inline chart
│   ├── ui/                       # UI primitives & base components
│   │   ├── button/               # Button component
│   │   │   └── button.tsx
│   │   ├── accordion/            # Accordion component
│   │   │   └── accordion.tsx
│   │   ├── timeline/             # Timeline component
│   │   │   └── timeline.tsx
│   │   ├── Toast.tsx             # Toast notification context & hook
│   │   ├── Skeleton.tsx          # Loading skeleton
│   │   ├── FilterTabs.tsx        # Tab-based filter UI
│   │   ├── ProductTour.tsx       # Onboarding tour
│   │   ├── OfflineBanner.tsx     # Offline indicator
│   │   ├── SessionTimeout.tsx    # Session timeout warning
│   │   └── KeyboardShortcutsHelp.tsx  # Shortcuts modal
│   ├── linkedin/                 # LinkedIn-specific components
│   │   ├── LinkedInPostPreview.tsx    # Preview for LinkedIn
│   │   ├── LinkedInConnectionCard.tsx # Connection display
│   │   └── PublishToLinkedInButton.tsx  # Publish action
│   ├── twitter/                  # Twitter-specific components
│   │   ├── TwitterThreadPreview.tsx   # Thread preview
│   │   └── PublishToTwitterButton.tsx # Publish action
│   ├── instagram/                # Instagram-specific components
│   │   ├── InstagramPostPreview.tsx   # Post preview
│   │   └── InstagramCarouselEditor.tsx  # Carousel builder
│   ├── email/                    # Email campaign components
│   │   ├── EmailTemplateEditor.tsx
│   │   └── EmailPreview.tsx
│   ├── analytics/                # Analytics/reporting components
│   │   ├── AnalyticsOverview.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   └── ChartDashboard.tsx
│   ├── strategy/                 # Strategy planning components
│   │   ├── StrategyBoard.tsx
│   │   ├── GoalSetup.tsx
│   │   └── RoadmapView.tsx
│   ├── monitoring/               # System monitoring components
│   │   ├── SystemHealth.tsx
│   │   ├── AgentStatus.tsx
│   │   └── ErrorLog.tsx
│   ├── org/                      # Organization chart
│   │   ├── OrgChart.tsx          # Org hierarchy visualization
│   │   └── AgentNode.tsx         # Individual node in chart
│   ├── reports/                  # Report components
│   │   ├── ReportBuilder.tsx
│   │   ├── ReportExport.tsx
│   │   └── MetricsTable.tsx
│   ├── settings/                 # Settings page components
│   │   ├── ApiKeySettings.tsx
│   │   ├── PreferencesForm.tsx
│   │   └── AccountSettings.tsx
│   ├── onboarding/               # Onboarding flow components
│   │   ├── OnboardingWizard.tsx
│   │   └── activation/           # Activation tracking
│   │       └── ActivationTracker.tsx
│   ├── guided-ux/                # Guided UX helpers
│   │   ├── NextActionCard.tsx    # Contextual next action
│   │   ├── QuickModeToggle.tsx   # Quick vs detailed mode
│   │   ├── ContextualHelp.tsx    # Inline help text
│   │   └── SetupProgress.tsx     # Setup completion indicator
│   ├── control-center/           # Control center panel
│   │   └── ControlCenter.tsx
│   ├── landing/                  # Landing page components
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PricingSection.tsx
│   │   └── CTA.tsx
│   ├── team/                     # Team/org components
│   │   └── TeamMembersTable.tsx
│   ├── feeds/                    # Content feed components
│   │   ├── SocialFeed.tsx
│   │   └── FeedCard.tsx
│   └── content-pipeline/         # Content pipeline visualization
│       └── PipelineFlow.tsx
├── hooks/                        # Custom React hooks
│   ├── useBrandContext.tsx       # Brand switching context
│   ├── useDashboardData.ts       # Dashboard data computations
│   ├── useKeyboardShortcuts.ts   # Keyboard shortcut handling
│   ├── useAuthSync.ts            # Multi-tab auth sync
│   ├── useTheme.ts               # Theme toggle hook
│   └── usePreferences.ts         # User preferences
├── lib/                          # Utilities and helpers
│   ├── brand-utils.ts            # Brand data types and transformations
│   ├── contentAdapters.ts        # Content type conversions
│   ├── contentTypes.ts           # Content type definitions
│   ├── file-parsers.ts           # Parse DOCX, PDF, images
│   ├── editor-utils.ts           # Rich text editor utilities
│   ├── tour-utils.ts             # Product tour logic
│   ├── language.ts               # Language/locale utilities
│   ├── csv-export.ts             # CSV export functionality
│   ├── errors.ts                 # Error handling and messages
│   ├── agent-errors.ts           # Agent-specific error handling
│   ├── permissions-client.ts     # Client-side auth checks
│   ├── sanitize.ts               # HTML sanitization
│   ├── schemas.ts                # Zod validation schemas
│   ├── validateEnv.ts            # Environment variable validation
│   ├── next-action.ts            # Server action helpers
│   ├── landing-data.ts           # Landing page static data
│   └── utils.ts                  # General utilities
├── public/                       # Static assets
│   ├── theme-init.js             # Theme initialization (before interactive)
│   └── [other static files]
├── convex/                       # Backend Convex
│   ├── schema.ts                 # Database schema definition
│   ├── onboarding.ts             # Onboarding logic
│   ├── feeds/                    # Feed-related functions
│   └── _generated/               # Auto-generated types
├── __tests__/                    # Tests
│   └── critical-paths/           # Critical path testing
│       ├── auth-enforcement.test.ts
│       ├── brand-onboarding.test.tsx
│       ├── content-creation.test.tsx
│       └── oauth-flows.test.ts
├── .planning/                    # GSD planning documents
│   ├── codebase/                 # Architecture documents
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   └── [other docs]
│   └── phases/                   # Implementation phases
├── .husky/                       # Git hooks (pre-commit, etc.)
├── middleware.ts                 # Clerk auth middleware
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── vitest.config.ts              # Vitest test runner config
├── vitest.setup.ts               # Test environment setup
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Locked versions
└── README.md                     # Project documentation
```

## Directory Purposes

**`app/`:** Next.js App Router pages and layouts. Uses route groups `(dashboard)` for protected routes and `(public)` for public pages. Error boundaries and loading states per route.

**`components/`:** Reusable React components organized by feature/domain. 204 files total. Each subdirectory is a feature area (brand, content, analytics, etc.). UI primitives in `ui/` folder.

**`hooks/`:** Custom React hooks. Context hooks wrapping Convex queries. Composition hooks for complex component logic.

**`lib/`:** Utility functions, data types, and helper modules. No components. Includes validators, adapters, error messages, file parsers.

**`convex/`:** Convex backend (separate from frontend). Schema definition and serverless functions. Real-time database configuration. Note: Type definitions in `_generated/` are auto-created by Convex CLI.

**`__tests__/`:** Test files. Co-located by critical path (auth, brand onboarding, content creation). Files match source: `*.test.ts` or `*.test.tsx`.

**`.planning/`:** GSD orchestrator documents. `codebase/` has architecture analysis. `phases/` has implementation plans for features.

**`public/`:** Static assets. `theme-init.js` runs before interactive to prevent theme flash.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout; initializes fonts, auth, Convex
- `app/(dashboard)/layout.tsx`: Dashboard shell with sidebar and nav
- `app/(dashboard)/page.tsx`: Home dashboard
- `app/(public)/landing/page.tsx`: Marketing landing page

**Configuration:**
- `tsconfig.json`: TypeScript strict mode, path aliases (`@/*`, `@convex/*`)
- `next.config.ts`: Security headers, CSP, image optimization
- `middleware.ts`: Clerk auth checks
- `package.json`: Dependencies (Next.js 16, React 19, Convex, Clerk, Tailwind 4)

**Core Logic:**
- `lib/brand-utils.ts`: Brand data structure and transformations
- `hooks/useBrandContext.tsx`: Brand context provider and hook
- `components/layout/LayoutShell.tsx`: Dashboard shell container
- `app/api/brand-audit/route.ts`: Brand extraction from Instagram

**Testing:**
- `__tests__/critical-paths/`: Auth, onboarding, content creation tests
- `vitest.config.ts`: Jest-like test environment with jsdom
- `vitest.setup.ts`: Test environment initialization

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `DashboardGreeting.tsx`)
- Hooks: `useX.ts` or `useX.tsx` (e.g., `useBrandContext.tsx`)
- Utilities: `camelCase.ts` (e.g., `brand-utils.ts`, `file-parsers.ts`)
- Pages: `page.tsx` per Next.js convention
- Layouts: `layout.tsx` per Next.js convention
- Tests: `*.test.ts` or `*.test.tsx`

**Directories:**
- Features: kebab-case or lowercase plural (e.g., `components/dashboard/`, `components/brand/`)
- Route groups: parentheses for grouping without path change: `(dashboard)`, `(public)`

**TypeScript:**
- Interfaces/Types: `PascalCase` (e.g., `BrandProfile`, `ContentItem`)
- Function names: `camelCase` (e.g., `getBrandProfile`, `computeMetrics`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `STORAGE_KEY`, `MAX_FILE_SIZE`)

## Where to Add New Code

**New Feature (e.g., scheduling):**
- Feature pages: `app/(dashboard)/scheduling/page.tsx`
- Components: `components/scheduling/ScheduleCalendar.tsx`, `components/scheduling/ScheduleForm.tsx`
- Hooks: `hooks/useScheduleData.ts` if needed
- Utils: `lib/schedule-utils.ts` for shared logic
- Tests: `__tests__/critical-paths/scheduling.test.tsx`
- Convex backend: `convex/scheduling.ts` or `convex/functions/` directory

**New Component/Module:**
- Location: Create subdirectory in `components/` matching feature name (e.g., `components/reports/`)
- Components: `components/reports/ReportBuilder.tsx`, `components/reports/ReportExport.tsx`
- Export from index if creating helper: `components/reports/index.ts`

**Utilities:**
- Shared helpers: `lib/utils-name.ts` (e.g., `lib/date-utils.ts`)
- Validators: `lib/schemas.ts` (extend existing Zod schemas)
- Constants: `lib/constants.ts` if a new file is needed

**Convex Functions:**
- Queries: `convex/functions/queries/` or inline in `convex/schema.ts`
- Mutations: `convex/functions/mutations/`
- Actions: `convex/functions/actions/`
- Organize by domain (users, content, analytics, etc.)

**API Routes:**
- External integrations: `app/api/[service]/route.ts`
- Webhooks: `app/api/webhooks/[provider]/route.ts`

**Tests:**
- Feature tests: `__tests__/critical-paths/[feature-name].test.tsx`
- Utility tests: Co-locate next to source file as `utils.test.ts`
- Use describe blocks to organize test suites

## Special Directories

**`public/`:**
- Purpose: Static files served by Next.js
- Generated: No
- Committed: Yes
- Key files: `theme-init.js` (theme setup before hydration)

**`convex/_generated/`:**
- Purpose: Auto-generated types and API definitions by Convex CLI
- Generated: Yes (by `npx convex codegen`)
- Committed: No (in .gitignore)
- DO NOT edit manually

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**`.planning/`:**
- Purpose: GSD orchestrator documents and phase plans
- Generated: Partially (by GSD agents)
- Committed: Yes

**`.husky/`:**
- Purpose: Git hooks for pre-commit linting
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-14*
