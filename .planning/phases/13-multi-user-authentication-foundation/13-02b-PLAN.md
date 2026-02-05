---
phase: 13-multi-user-authentication-foundation
plan: 02b
type: execute
wave: 2
depends_on: ["13-02"]
files_modified:
  - convex/functions.ts
  - convex/contentPipeline.ts
  - convex/guidance.ts
  - convex/onboarding.ts
  - convex/controlCenter.ts
autonomous: true

must_haves:
  truths:
    - "All Convex queries and mutations that return user-specific data require authentication via ctx.auth.getUserIdentity()"
    - "User-facing queries filter results by userId (content, tasks, campaigns, onboarding, guidance)"
    - "Mutations that create user data set userId from getUserId()"
    - "Mutations that modify user data verify ownership before allowing changes"
    - "System-wide resources (agents, settings, executions) remain unprotected and shared"
  artifacts:
    - path: "convex/functions.ts"
      provides: "Auth-enforced queries and mutations for content, tasks, campaigns, dashboard stats"
      contains: "requireAuth"
    - path: "convex/contentPipeline.ts"
      provides: "Auth-enforced content pipeline queries and mutations"
      contains: "requireAuth"
    - path: "convex/guidance.ts"
      provides: "Auth-enforced guidance queries and mutations scoped by userId"
      contains: "requireAuth"
    - path: "convex/onboarding.ts"
      provides: "Auth-enforced onboarding queries and mutations scoped by userId"
      contains: "requireAuth"
    - path: "convex/controlCenter.ts"
      provides: "Auth-enforced control center queries"
      contains: "requireAuth"
  key_links:
    - from: "convex/functions.ts"
      to: "convex/lib/auth.ts"
      via: "All user-facing queries import and call requireAuth/getUserId"
      pattern: "requireAuth|getUserId"
    - from: "convex/contentPipeline.ts"
      to: "convex/lib/auth.ts"
      via: "Content pipeline functions import requireAuth/getUserId"
      pattern: "requireAuth|getUserId"
    - from: "convex/guidance.ts"
      to: "convex/lib/auth.ts"
      via: "Guidance functions import requireAuth/getUserId"
      pattern: "requireAuth|getUserId"
---

<objective>
Update all existing Convex queries and mutations to enforce authentication and data isolation per user, using the auth helpers from Plan 13-02.

Purpose: This is the defense-in-depth enforcement layer. Every user-facing Convex function independently verifies the user's identity and only returns their data. Even if middleware is bypassed, no data leaks between users.

Output: All 5 Convex function files updated with auth enforcement. User-facing queries filter by userId. Mutations set userId on creation and verify ownership on update.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/13-multi-user-authentication-foundation/13-01-SUMMARY.md
@.planning/phases/13-multi-user-authentication-foundation/13-02-SUMMARY.md

@convex/lib/auth.ts
@convex/functions.ts
@convex/contentPipeline.ts
@convex/guidance.ts
@convex/onboarding.ts
@convex/controlCenter.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add auth enforcement to core functions (functions.ts)</name>
  <files>
    convex/functions.ts
  </files>
  <action>
    Update `convex/functions.ts` — Add auth to user-facing queries/mutations:

    Import `requireAuth` and `getUserId` from `./lib/auth` at the top.

    **Queries that need userId filtering** (filter by userId, handle undefined for backward compat):
    - `listContent`: Add auth, filter by `userId === currentUserId || userId === undefined` (shows user's content + legacy unassigned)
    - `getContent`: Add auth check (requireAuth), keep working for any authenticated user to view individual content
    - `listTasks`: Add auth, filter by userId
    - `getPendingTasks`: Add auth, filter by userId
    - `getDashboardStats`: Add auth, scope stats to user's data
    - `getAnalyticsOverview`: Add auth, scope to user's data
    - `listCampaigns`: Add auth, filter by userId
    - `getCampaign`: Add auth check

    **Mutations that need userId on creation:**
    - `createTask`: Add auth, set `userId` from getUserId()
    - `createContent`: Add auth, set `userId` from getUserId()
    - `updateContentStatus`: Add auth check (verify user owns the content)
    - `updateContent`: Add auth check (verify user owns the content)

    **Queries/mutations that stay UNPROTECTED** (system-wide resources):
    - `listAgents`, `getAgent`, `getAgentById`, `getAgentHierarchy` — agents are shared
    - `listSettings`, `getSetting`, `updateSetting` — system settings
    - `createAgent`, `updateAgentStatus`, `updateAgentConfig` — agent management (shared)
    - `logExecution`, `createHandoff`, `updateHandoffStatus` — system operations
    - `getAgentMetrics` — system-wide metrics

    **Pattern for backward-compatible userId filtering:**
    ```typescript
    // In queries that filter by userId:
    const userId = await getUserId(ctx);
    const results = await ctx.db.query("content").collect();
    // Filter: show user's own data + legacy data without userId (for migration grace period)
    return results.filter(item => item.userId === userId || item.userId === undefined);
    ```

    After migration runs, all legacy data will have userId set, so the `|| item.userId === undefined` fallback will match nothing. This is intentional for safe rollout.

    **Pattern for ownership verification on mutations:**
    ```typescript
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("No encontrado");
    const userId = await getUserId(ctx);
    if (item.userId && item.userId !== userId) {
      throw new Error("No tienes permiso para modificar este recurso.");
    }
    ```
  </action>
  <verify>
    - `grep -r "requireAuth\|getUserId" convex/functions.ts` shows auth usage in user-facing functions
    - `grep -c "requireAuth\|getUserId" convex/functions.ts` shows multiple occurrences (one per protected function)
    - Agent-related functions (listAgents, getAgent, etc.) do NOT have requireAuth calls
    - `npx convex dev --once` succeeds
  </verify>
  <done>
    All user-facing queries in functions.ts filter by userId. All user-facing mutations set userId on creation or verify ownership on update. System-wide resources remain unprotected and shared.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add auth enforcement to content pipeline and user features</name>
  <files>
    convex/contentPipeline.ts
    convex/guidance.ts
    convex/onboarding.ts
  </files>
  <action>
    1. Update `convex/contentPipeline.ts`:
       - Import `requireAuth` and `getUserId` from `./lib/auth`
       - `getContentByStatus`: Add auth, filter results by userId
       - `getContentStatusCounts`: Add auth, count only user's content
       - `getScheduledContent`: Add auth, filter by userId
       - `moveContent`: Add auth, verify user owns the content before moving
       - `moveContentToReview`, `approveContent`, `rejectContent`, `scheduleContent`, `publishContent`: Add auth, verify ownership

       Same backward-compatible filter pattern as functions.ts:
       ```typescript
       const userId = await getUserId(ctx);
       return results.filter(item => item.userId === userId || item.userId === undefined);
       ```

    2. Update `convex/guidance.ts`:
       - Import `requireAuth` and `getUserId` from `./lib/auth`
       - `getGuidance`: Add auth, filter by userId (return user's guidance record)
       - `getSetupProgress`: Add auth, filter by userId
       - `initGuidance`: Add auth, set userId on creation
       - `completeSetupStep`, `trackFeatureDiscovery`, `toggleQuickMode`, `incrementOnboardingCompletion`: Add auth, find user's record by userId

    3. Update `convex/onboarding.ts`:
       - Import `requireAuth` and `getUserId` from `./lib/auth`
       - `complete` mutation (or similar): Add auth, set userId on onboarding record
       - Any onboarding queries: Add auth, filter by userId
  </action>
  <verify>
    - `grep -r "requireAuth\|getUserId" convex/contentPipeline.ts` shows auth usage
    - `grep -r "requireAuth\|getUserId" convex/guidance.ts` shows auth usage
    - `grep -r "requireAuth\|getUserId" convex/onboarding.ts` shows auth usage
    - All user-facing queries include userId filtering
    - All mutations that modify user data verify ownership
    - `npx convex dev --once` succeeds
  </verify>
  <done>
    Content pipeline, guidance, and onboarding functions all enforce auth. Queries filter by userId. Mutations verify ownership. Users only see and modify their own data in these subsystems.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add auth enforcement to control center</name>
  <files>
    convex/controlCenter.ts
  </files>
  <action>
    Update `convex/controlCenter.ts`:
    - Import `requireAuth` from `./lib/auth`
    - Add `requireAuth(ctx)` to queries that return activity data
    - Control center shows system-wide agent status (shared), but activity feeds may be user-scoped
    - For queries that show agent execution data (shared resources): just add `requireAuth` check without userId filtering (any authenticated user can view agent activity)
    - For queries that show user-specific activity: add userId filtering

    This file is lighter than the others — mainly gate checks rather than data isolation, since control center data is largely system-wide.
  </action>
  <verify>
    - `grep -r "requireAuth" convex/controlCenter.ts` shows auth usage
    - `npx convex dev --once` succeeds
    - No TypeScript errors
  </verify>
  <done>
    Control center queries require authentication. System-wide agent data is viewable by any authenticated user. User-specific activity is filtered by userId.
  </done>
</task>

</tasks>

<verification>
- All queries in functions.ts, contentPipeline.ts, guidance.ts, onboarding.ts, controlCenter.ts use auth helpers
- User-facing queries filter by userId
- User-facing mutations set userId on creation
- User-facing mutations verify ownership on update
- System-wide queries (agents, settings) remain unprotected
- `npx convex dev --once` succeeds
- No TypeScript errors in any Convex function files
</verification>

<success_criteria>
- Unauthenticated Convex calls to user-facing functions throw "No autenticado" error
- Authenticated user only sees their own content, tasks, campaigns, guidance, onboarding data
- System-wide resources (agents, settings, executions) remain accessible to all authenticated users
- Backward compatibility: queries handle records with undefined userId gracefully
- Defense-in-depth: even without middleware, Convex functions independently enforce auth
</success_criteria>

<output>
After completion, create `.planning/phases/13-multi-user-authentication-foundation/13-02b-SUMMARY.md`
</output>
