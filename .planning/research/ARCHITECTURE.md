# Architecture Patterns for v2.0 UX/UI Excellence

**Domain:** Real-time AI Marketing Dashboard with Operational Features
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

This research documents the architecture integration points for adding v2.0 UX/UI Excellence features to the existing AI Marketing Department application. The system currently uses Convex (serverless real-time backend) + Next.js 16 App Router + React 19, with 37 AI agents and existing content management workflows.

The four new feature categories require different architectural patterns:
1. **Control Center** - Real-time subscription to agent/task state via Convex queries
2. **Content Pipeline** - Extending existing content schema with workflow states
3. **LinkedIn Integration** - OAuth flow + Convex actions for API calls
4. **Guided UX** - Client-side state machine with backend persistence

### Primary Recommendation

Use Convex's reactive query system for all real-time features, implement OAuth via Convex actions (server-side security), and use a headless state machine (OnboardJS or custom) for guided UX with Convex mutations for persistence.

---

## Existing Architecture Analysis

### Current System Components

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Next.js 16 App Router + React 19 + Tailwind 4   │
│  - useQuery(api.functions.*) for real-time data           │
│  - useMutation(api.functions.*) for writes                │
│  - Convex React client with automatic subscriptions       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Convex Backend (Serverless + Real-time)                   │
│  - Schema: 11+ tables (agents, tasks, content, etc.)      │
│  - Queries: Read functions with automatic reactivity      │
│  - Mutations: ACID transactions                           │
│  - Actions: External API calls (Claude, etc.)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  External Integrations                                      │
│  - Claude API (via actions.ts)                             │
│  - n8n workflows (orchestration)                           │
└─────────────────────────────────────────────────────────────┘
```

### Real-Time Data Flow (Existing)

Based on code analysis and [Convex real-time patterns](https://www.convex.dev/realtime):

**Query Subscription Pattern:**
```typescript
// Frontend component
const agents = useQuery(api.functions.listAgents, { status: "active" });
const tasks = useQuery(api.functions.listTasks, { agentId: selectedAgent });

// Convex automatically:
// 1. Executes query on backend
// 2. Tracks dependencies (which documents were read)
// 3. Subscribes component to changes
// 4. Re-runs query when dependencies change
// 5. Pushes updates to frontend (WebSocket)
```

**Mutation Pattern:**
```typescript
// Frontend
const updateStatus = useMutation(api.functions.updateTaskStatus);
await updateStatus({ id: taskId, status: "running" });

// Convex:
// 1. Runs mutation as ACID transaction
// 2. Detects which queries are affected
// 3. Re-runs affected queries
// 4. Pushes updates to all subscribed clients
```

This pattern is **already working** in the existing dashboard (see `app/page.tsx` - real-time campaign/content/agent counts).

### Schema Extensions Needed

Current schema has these relevant tables:
- `agents` - 37 AI agents with status, config, department
- `tasks` - Work queue with status tracking
- `executions` - LLM call logs with tokens/cost
- `content` - Generated content with workflow states
- `handoffs` - Agent-to-agent transfers

**New tables required:**
```typescript
// User progress tracking (Guided UX)
onboardingProgress: {
  userId: string,           // User identifier
  currentStep: string,      // "add-first-agent" | "create-campaign" | etc.
  completedSteps: string[], // Array of completed step IDs
  skippedSteps: string[],   // User chose to skip
  lastActiveAt: number,     // Timestamp for resume
  metadata: any,            // Custom data per step
}

// LinkedIn integration (Phase 3)
linkedInConnections: {
  userId: string,
  accessToken: string,      // Encrypted
  refreshToken: string,     // Encrypted
  expiresAt: number,
  profile: {
    id: string,
    name: string,
    profileUrl: string,
  },
  permissions: string[],    // Granted scopes
  status: "active" | "revoked" | "expired",
  connectedAt: number,
}

// LinkedIn post scheduling/publishing
linkedInPosts: {
  contentId: Id<"content">,      // Link to content table
  linkedInConnectionId: Id<"linkedInConnections">,
  status: "draft" | "scheduled" | "publishing" | "published" | "failed",
  scheduledFor: number?,         // Timestamp
  publishedAt: number?,
  linkedInPostId: string?,       // LinkedIn's post ID
  error: string?,
  metrics: {                     // Post-publish analytics
    impressions: number?,
    reactions: number?,
    comments: number?,
    shares: number?,
  },
}
```

---

## Feature 1: Control Center (Operational Dashboard)

### Requirements
- Real-time agent status (active/paused/running)
- Live task progress (queued → running → completed)
- Token usage and cost tracking
- Performance metrics (success rate, avg duration)

### Architecture Pattern: Reactive Queries with Aggregation

**Implementation:**

```typescript
// NEW: convex/controlCenter.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getLiveAgentStatus = query({
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Get recent executions for each agent
    const agentStatus = await Promise.all(
      agents.map(async (agent) => {
        const recentExecutions = await ctx.db
          .query("executions")
          .withIndex("by_agent_timestamp", (q) =>
            q.eq("agentId", agent._id).gte("timestamp", oneHourAgo)
          )
          .collect();

        const runningTasks = await ctx.db
          .query("tasks")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.eq(q.field("status"), "running"))
          .collect();

        return {
          agent: {
            id: agent._id,
            name: agent.name,
            department: agent.department,
            status: agent.status,
          },
          metrics: {
            executionsLastHour: recentExecutions.length,
            tokensLastHour: recentExecutions.reduce(
              (sum, e) => sum + e.tokensUsed.total,
              0
            ),
            currentlyRunning: runningTasks.length,
            avgDuration:
              recentExecutions.length > 0
                ? recentExecutions.reduce((sum, e) => sum + e.duration, 0) /
                  recentExecutions.length
                : 0,
          },
        };
      })
    );

    return agentStatus;
  },
});

export const getTaskQueue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) =>
        q.eq("status", "pending").or(
          q.eq("status", "queued"),
          q.eq("status", "running")
        )
      )
      .order("desc")
      .take(limit);

    // Enrich with agent info
    return await Promise.all(
      tasks.map(async (task) => {
        const agent = await ctx.db.get(task.agentId);
        return {
          ...task,
          agentName: agent?.name || "Unknown",
          agentDepartment: agent?.department || "unknown",
        };
      })
    );
  },
});
```

**Frontend Component:**

```typescript
// NEW: components/control-center/LiveAgentMonitor.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function LiveAgentMonitor() {
  // Real-time subscription - updates every time agent executes
  const agentStatus = useQuery(api.controlCenter.getLiveAgentStatus);

  if (!agentStatus) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {agentStatus.map((status) => (
        <AgentCard key={status.agent.id} {...status} />
      ))}
    </div>
  );
}

// Component re-renders automatically when:
// - Agent status changes (active → paused)
// - New execution completes (metrics update)
// - Task starts/completes (currentlyRunning changes)
```

**Performance Optimization:**

Per [Convex high-throughput patterns](https://stack.convex.dev/high-throughput-mutations-via-precise-queries), for dashboards with frequent updates:

1. **Index optimization** - Already have `by_agent_timestamp` for efficient time-range queries
2. **Limit result sets** - Use `.take(limit)` instead of `.collect()` when possible
3. **Pagination** - For task queues, implement cursor-based pagination
4. **Debounce UI** - Use React's `useDeferredValue` for non-critical updates

**Integration Points:**
- Query: `convex/controlCenter.ts` (new file)
- Component: `app/(dashboard)/control-center/page.tsx` (new page)
- Navigation: Add to `app/(dashboard)/layout.tsx` sidebar

---

## Feature 2: Content Pipeline Extension

### Requirements
- Extend existing content workflow with additional states
- Visual pipeline view (Kanban-style)
- Drag-and-drop state transitions
- Approval notifications

### Architecture Pattern: Schema Extension + Optimistic Updates

**Schema Changes:**

```typescript
// MODIFY: convex/schema.ts - content table
content: defineTable({
  // ... existing fields ...

  // NEW workflow fields
  workflowStage: v.union(
    v.literal("ideation"),      // Brainstorming phase
    v.literal("drafting"),      // AI writing
    v.literal("editing"),       // Human review/edits
    v.literal("approval"),      // Manager approval
    v.literal("scheduling"),    // Ready to publish
    v.literal("published"),     // Live
    v.literal("archived")       // Completed/obsolete
  ),

  assignedTo: v.optional(v.string()),  // User/agent responsible
  dueDate: v.optional(v.number()),     // Deadline timestamp
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("urgent")
  ),

  // Approval workflow
  approvals: v.optional(v.array(v.object({
    userId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    comment: v.optional(v.string()),
    timestamp: v.number(),
  }))),

  // Activity log
  stateTransitions: v.array(v.object({
    from: v.string(),
    to: v.string(),
    by: v.string(),  // userId or agentId
    timestamp: v.number(),
    reason: v.optional(v.string()),
  })),
})
```

**Mutations:**

```typescript
// NEW: convex/contentPipeline.ts
export const moveContentStage = mutation({
  args: {
    contentId: v.id("content"),
    toStage: v.string(),
    reason: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) throw new Error("Content not found");

    const fromStage = content.workflowStage || content.status;

    // Validation: Check allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      ideation: ["drafting", "archived"],
      drafting: ["editing", "archived"],
      editing: ["approval", "drafting"],  // Can send back
      approval: ["scheduling", "editing"], // Can request changes
      scheduling: ["published"],
      published: ["archived"],
    };

    if (!allowedTransitions[fromStage]?.includes(args.toStage)) {
      throw new Error(`Invalid transition: ${fromStage} → ${args.toStage}`);
    }

    // Update content
    await ctx.db.patch(args.contentId, {
      workflowStage: args.toStage as any,
      updatedAt: Date.now(),
      stateTransitions: [
        ...(content.stateTransitions || []),
        {
          from: fromStage,
          to: args.toStage,
          by: args.userId,
          timestamp: Date.now(),
          reason: args.reason,
        },
      ],
    });

    // Notification logic (if needed)
    // await ctx.runMutation(internal.notifications.sendApprovalRequest, ...)
  },
});

export const getContentByStage = query({
  args: { stage: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("workflowStage"), args.stage as any))
      .order("desc")
      .collect();
  },
});
```

**Frontend Pattern: Optimistic Updates**

Per [Next.js 16 advanced patterns](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7), use optimistic UI for drag-and-drop:

```typescript
// components/content-pipeline/KanbanBoard.tsx
"use client";

import { useMutation } from "convex/react";
import { useOptimistic } from "react";

export function KanbanBoard({ initialContent }: Props) {
  const moveContent = useMutation(api.contentPipeline.moveContentStage);
  const [optimisticContent, setOptimisticContent] = useOptimistic(
    initialContent,
    (state, { id, toStage }) => {
      return state.map((item) =>
        item._id === id ? { ...item, workflowStage: toStage } : item
      );
    }
  );

  const handleDrop = async (contentId, toStage) => {
    // Immediate UI update
    setOptimisticContent({ id: contentId, toStage });

    // Backend sync
    try {
      await moveContent({ contentId, toStage, userId: "current-user" });
    } catch (error) {
      // Revert on failure
      toast.error("Failed to move content");
    }
  };

  return <KanbanView items={optimisticContent} onDrop={handleDrop} />;
}
```

**Integration Points:**
- Schema: Modify `convex/schema.ts` (content table)
- Queries/Mutations: `convex/contentPipeline.ts` (new file)
- Component: `app/(dashboard)/pipeline/page.tsx` (new page)
- Drag-and-drop library: `@dnd-kit/core` (recommended for React 19)

---

## Feature 3: LinkedIn Integration

### Requirements
- OAuth 2.0 authentication flow
- Post publishing from content
- Scheduled posting
- Analytics tracking (impressions, engagement)

### Architecture Pattern: OAuth via Convex Actions + Secure Token Storage

Based on [LinkedIn OAuth best practices](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication):

**Security Principles:**
1. **Never expose client secret in frontend** - Use Convex actions (server-side)
2. **Exchange auth codes on backend** - Prevent token interception
3. **Encrypt stored tokens** - Use environment variables for encryption keys
4. **Validate state parameter** - Prevent CSRF attacks

**Implementation:**

```typescript
// NEW: convex/linkedIn.ts (Actions)
import { action } from "./_generated/server";
import { v } from "convex/values";

export const startOAuthFlow = action({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    // Generate CSRF state token
    const state = generateSecureToken();

    // Store state temporarily for validation
    await ctx.runMutation(internal.linkedIn.storeOAuthState, {
      userId: args.userId,
      state,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    // Return authorization URL
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", "openid profile w_member_social");

    return { authUrl: authUrl.toString() };
  },
});

export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    state: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate state (CSRF protection)
    const storedState = await ctx.runQuery(
      internal.linkedIn.getOAuthState,
      { userId: args.userId }
    );

    if (storedState?.state !== args.state) {
      throw new Error("Invalid state - possible CSRF attack");
    }
    if (storedState.expiresAt < Date.now()) {
      throw new Error("State expired");
    }

    // 2. Exchange code for access token (MUST be server-side)
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: args.code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!, // Server-side only
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const { access_token, expires_in, refresh_token } = await tokenResponse.json();

    // 3. Get LinkedIn profile
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileResponse.json();

    // 4. Encrypt and store tokens
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = encrypt(refresh_token);

    await ctx.runMutation(internal.linkedIn.storeConnection, {
      userId: args.userId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: Date.now() + expires_in * 1000,
      profile: {
        id: profile.sub,
        name: profile.name,
        profileUrl: profile.profile,
      },
      permissions: ["openid", "profile", "w_member_social"],
    });

    return { success: true, profile };
  },
});

export const publishToLinkedIn = action({
  args: {
    contentId: v.id("content"),
    userId: v.string(),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Get content
    const content = await ctx.runQuery(api.functions.getContent, {
      contentId: args.contentId,
    });

    // 2. Get LinkedIn connection
    const connection = await ctx.runQuery(
      internal.linkedIn.getActiveConnection,
      { userId: args.userId }
    );

    if (!connection || connection.expiresAt < Date.now()) {
      throw new Error("LinkedIn connection expired - please re-authenticate");
    }

    const accessToken = decrypt(connection.accessToken);

    // 3. If scheduled, store for later
    if (args.scheduledFor && args.scheduledFor > Date.now()) {
      await ctx.runMutation(internal.linkedIn.schedulePost, {
        contentId: args.contentId,
        connectionId: connection._id,
        scheduledFor: args.scheduledFor,
      });
      return { scheduled: true };
    }

    // 4. Publish immediately
    const postResponse = await fetch(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${connection.profile.id}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content.body },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      }
    );

    if (!postResponse.ok) {
      throw new Error("Failed to publish to LinkedIn");
    }

    const { id: linkedInPostId } = await postResponse.json();

    // 5. Update content status
    await ctx.runMutation(api.functions.updateContentStatus, {
      id: args.contentId,
      status: "published",
      publishedUrl: `https://www.linkedin.com/feed/update/${linkedInPostId}`,
    });

    // 6. Log post for analytics
    await ctx.runMutation(internal.linkedIn.logPublishedPost, {
      contentId: args.contentId,
      connectionId: connection._id,
      linkedInPostId,
    });

    return { published: true, linkedInPostId };
  },
});
```

**Frontend Flow:**

```typescript
// app/(dashboard)/integrations/linkedin/page.tsx
"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function LinkedInIntegrationPage() {
  const startOAuth = useAction(api.linkedIn.startOAuthFlow);
  const connection = useQuery(api.linkedIn.getActiveConnection, {
    userId: "current-user",
  });

  const handleConnect = async () => {
    const { authUrl } = await startOAuth({ userId: "current-user" });
    // Redirect to LinkedIn OAuth page
    window.location.href = authUrl;
  };

  if (connection) {
    return <ConnectedState connection={connection} />;
  }

  return (
    <button onClick={handleConnect}>
      Connect LinkedIn Account
    </button>
  );
}

// app/(dashboard)/integrations/linkedin/callback/page.tsx
export default function LinkedInCallbackPage({ searchParams }) {
  const handleCallback = useAction(api.linkedIn.handleOAuthCallback);

  useEffect(() => {
    const { code, state } = searchParams;
    if (code && state) {
      handleCallback({ code, state, userId: "current-user" })
        .then(() => router.push("/integrations/linkedin"))
        .catch((error) => toast.error(error.message));
    }
  }, [searchParams]);

  return <LoadingSpinner />;
}
```

**Scheduled Publishing (Cron):**

```typescript
// NEW: convex/crons.ts addition
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Run every 5 minutes
crons.interval(
  "publish-scheduled-linkedin-posts",
  { minutes: 5 },
  internal.linkedIn.processScheduledPosts
);

// Implementation in linkedIn.ts
export const processScheduledPosts = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("linkedInPosts")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.lte(q.field("scheduledFor"), now)
        )
      )
      .collect();

    for (const post of due) {
      // Trigger publish action
      await ctx.scheduler.runAfter(0, internal.linkedIn.publishPostById, {
        postId: post._id,
      });
    }
  },
});
```

**Integration Points:**
- Schema: Add `linkedInConnections` and `linkedInPosts` tables
- Actions: `convex/linkedIn.ts` (new file)
- OAuth callback route: `app/(dashboard)/integrations/linkedin/callback/page.tsx`
- Publish UI: Button in content detail view
- Environment vars: `.env.local` (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI, ENCRYPTION_KEY)

---

## Feature 4: Guided UX Onboarding

### Requirements
- Multi-step onboarding flow
- Progress tracking per user
- Conditional step visibility
- Resume from last step
- Skip/complete tracking

### Architecture Pattern: Headless State Machine + Backend Persistence

Based on [React onboarding patterns 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared):

**Recommended Library:** OnboardJS (headless, TypeScript-first) or custom state machine

**Schema:**

```typescript
// Already shown above - onboardingProgress table

// Step definitions (could be in code or database)
type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  component: string; // Which React component to render
  requiredFor?: string[]; // Steps that require this one
  condition?: (user: User, context: Context) => boolean; // Show conditionally
  skipable: boolean;
  analytics: {
    event: string; // "onboarding_step_viewed"
    properties?: Record<string, any>;
  };
};
```

**Implementation (Custom State Machine):**

```typescript
// NEW: lib/onboarding/steps.ts
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to AI Marketing Department",
    description: "Let's get you set up in 5 minutes",
    component: "WelcomeStep",
    skipable: false,
    analytics: { event: "onboarding_started" },
  },
  {
    id: "connect-integrations",
    title: "Connect Your Tools",
    description: "Link LinkedIn, Google Analytics, etc.",
    component: "IntegrationsStep",
    skipable: true,
    analytics: { event: "onboarding_integrations_viewed" },
  },
  {
    id: "create-first-agent",
    title: "Create Your First Agent",
    description: "Let AI write your first blog post",
    component: "FirstAgentStep",
    requiredFor: ["launch-campaign"],
    skipable: false,
    analytics: { event: "onboarding_agent_created" },
  },
  {
    id: "launch-campaign",
    title: "Launch Your Campaign",
    description: "Deploy your content to channels",
    component: "CampaignStep",
    condition: (user, ctx) => ctx.hasContent && ctx.hasIntegrations,
    skipable: false,
    analytics: { event: "onboarding_campaign_launched" },
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Your AI marketing team is ready",
    component: "CompleteStep",
    skipable: false,
    analytics: { event: "onboarding_completed" },
  },
];

// State machine logic
export class OnboardingStateMachine {
  constructor(
    private progress: OnboardingProgress,
    private steps: OnboardingStep[]
  ) {}

  getCurrentStep(): OnboardingStep | null {
    if (this.progress.currentStep === "complete") return null;
    return this.steps.find((s) => s.id === this.progress.currentStep) || this.steps[0];
  }

  getAvailableSteps(context: Context): OnboardingStep[] {
    return this.steps.filter((step) => {
      // Already completed
      if (this.progress.completedSteps.includes(step.id)) return false;

      // Check conditions
      if (step.condition && !step.condition(this.progress.userId, context)) {
        return false;
      }

      // Check dependencies
      if (step.requiredFor) {
        const hasRequired = step.requiredFor.every((reqId) =>
          this.progress.completedSteps.includes(reqId)
        );
        if (!hasRequired) return false;
      }

      return true;
    });
  }

  async completeStep(stepId: string, updateProgress: Function) {
    await updateProgress({
      currentStep: this.getNextStep(stepId)?.id || "complete",
      completedSteps: [...this.progress.completedSteps, stepId],
      lastActiveAt: Date.now(),
    });
  }

  async skipStep(stepId: string, updateProgress: Function) {
    if (!this.steps.find((s) => s.id === stepId)?.skipable) {
      throw new Error("Step cannot be skipped");
    }
    await updateProgress({
      currentStep: this.getNextStep(stepId)?.id || "complete",
      skippedSteps: [...this.progress.skippedSteps, stepId],
      lastActiveAt: Date.now(),
    });
  }

  private getNextStep(currentId: string): OnboardingStep | null {
    const currentIndex = this.steps.findIndex((s) => s.id === currentId);
    return this.steps[currentIndex + 1] || null;
  }
}
```

**Convex Integration:**

```typescript
// NEW: convex/onboarding.ts
export const getProgress = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("onboardingProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const initializeOnboarding = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing;

    return await ctx.db.insert("onboardingProgress", {
      userId: args.userId,
      currentStep: "welcome",
      completedSteps: [],
      skippedSteps: [],
      lastActiveAt: Date.now(),
      metadata: {},
    });
  },
});

export const updateProgress = mutation({
  args: {
    userId: v.string(),
    currentStep: v.string(),
    completedSteps: v.array(v.string()),
    skippedSteps: v.array(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) throw new Error("Progress not found");

    await ctx.db.patch(progress._id, {
      currentStep: args.currentStep,
      completedSteps: args.completedSteps,
      skippedSteps: args.skippedSteps,
      lastActiveAt: Date.now(),
      metadata: args.metadata,
    });
  },
});

export const trackStepAnalytics = mutation({
  args: {
    userId: v.string(),
    stepId: v.string(),
    event: v.string(),
    properties: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Log to audit trail or analytics service
    await ctx.db.insert("auditLog", {
      action: `onboarding.${args.event}`,
      entityType: "onboarding",
      entityId: args.stepId,
      performedBy: "user",
      performerId: args.userId,
      metadata: args.properties,
      timestamp: Date.now(),
    });
  },
});
```

**Frontend Implementation:**

```typescript
// NEW: components/onboarding/OnboardingFlow.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { OnboardingStateMachine, ONBOARDING_STEPS } from "@/lib/onboarding/steps";

export function OnboardingFlow({ userId }: { userId: string }) {
  const progress = useQuery(api.onboarding.getProgress, { userId });
  const updateProgress = useMutation(api.onboarding.updateProgress);
  const trackAnalytics = useMutation(api.onboarding.trackStepAnalytics);

  if (!progress) return <LoadingSpinner />;

  const stateMachine = new OnboardingStateMachine(progress, ONBOARDING_STEPS);
  const currentStep = stateMachine.getCurrentStep();

  if (!currentStep) {
    // Onboarding complete - redirect to dashboard
    return <OnboardingComplete />;
  }

  const handleComplete = async () => {
    await trackAnalytics({
      userId,
      stepId: currentStep.id,
      event: "step_completed",
      properties: { duration: performance.now() },
    });

    await stateMachine.completeStep(currentStep.id, (updates) =>
      updateProgress({ userId, ...updates })
    );
  };

  const handleSkip = async () => {
    if (!currentStep.skipable) return;

    await trackAnalytics({
      userId,
      stepId: currentStep.id,
      event: "step_skipped",
    });

    await stateMachine.skipStep(currentStep.id, (updates) =>
      updateProgress({ userId, ...updates })
    );
  };

  return (
    <div className="onboarding-container">
      <ProgressBar
        current={progress.completedSteps.length}
        total={ONBOARDING_STEPS.length}
      />

      <StepContent
        step={currentStep}
        onComplete={handleComplete}
        onSkip={currentStep.skipable ? handleSkip : undefined}
      />
    </div>
  );
}

// Dynamic step components
function StepContent({ step, onComplete, onSkip }) {
  const StepComponent = stepComponents[step.component];
  return <StepComponent onComplete={onComplete} onSkip={onSkip} />;
}

const stepComponents = {
  WelcomeStep: () => <div>Welcome content...</div>,
  IntegrationsStep: () => <div>Connect integrations...</div>,
  FirstAgentStep: () => <div>Create agent...</div>,
  // ...
};
```

**Resume Logic:**

```typescript
// app/(onboarding)/page.tsx
export default function OnboardingPage() {
  const { user } = useAuth();
  const initialize = useMutation(api.onboarding.initializeOnboarding);
  const progress = useQuery(api.onboarding.getProgress, { userId: user.id });

  useEffect(() => {
    if (!progress) {
      initialize({ userId: user.id });
    }
  }, [progress]);

  // Show resume prompt if user returns after partial completion
  if (progress && progress.completedSteps.length > 0) {
    const minutesSinceActive = (Date.now() - progress.lastActiveAt) / 1000 / 60;

    if (minutesSinceActive > 30) {
      return (
        <ResumePrompt
          progress={progress}
          onResume={() => setShowOnboarding(true)}
          onRestart={async () => {
            await initialize({ userId: user.id }); // Resets progress
            setShowOnboarding(true);
          }}
        />
      );
    }
  }

  return <OnboardingFlow userId={user.id} />;
}
```

**Integration Points:**
- Schema: Add `onboardingProgress` table
- Queries/Mutations: `convex/onboarding.ts` (new file)
- State machine: `lib/onboarding/steps.ts` (new file)
- Components: `components/onboarding/` (new directory)
- Route: `app/(onboarding)/page.tsx` (new layout group)
- Analytics: Track events via `auditLog` or external service

---

## Data Flow Summary

### Real-Time Flow (Control Center, Content Pipeline)

```
User Action (Frontend)
    ↓
useMutation(api.*.mutation)
    ↓
Convex Mutation (ACID transaction)
    ↓
Database Write
    ↓
Convex detects affected queries
    ↓
Re-run queries with changed data
    ↓
Push updates via WebSocket
    ↓
useQuery() hooks receive new data
    ↓
React re-renders components
    ↓
UI updates (< 100ms typically)
```

### OAuth Flow (LinkedIn)

```
User clicks "Connect LinkedIn"
    ↓
useAction(api.linkedIn.startOAuthFlow)
    ↓
Convex action generates state token
    ↓
Store state in DB (10 min expiry)
    ↓
Redirect to LinkedIn auth page
    ↓
User approves permissions
    ↓
LinkedIn redirects to /callback?code=X&state=Y
    ↓
useAction(api.linkedIn.handleOAuthCallback)
    ↓
Validate state (CSRF check)
    ↓
Exchange code for token (server-side)
    ↓
Encrypt and store tokens
    ↓
Redirect to connected state UI
```

### Onboarding Flow

```
User visits /onboarding
    ↓
useQuery(api.onboarding.getProgress)
    ↓
Initialize if not exists
    ↓
Load OnboardingStateMachine with progress
    ↓
Render current step component
    ↓
User completes action (e.g., creates agent)
    ↓
useMutation(api.onboarding.updateProgress)
    ↓
Update completedSteps, advance currentStep
    ↓
Track analytics event
    ↓
useQuery re-fetches updated progress
    ↓
State machine calculates next step
    ↓
Render next step (or completion screen)
```

---

## Build Order Recommendation

Based on dependencies and complexity:

### Phase 1: Foundation (Week 1)
1. **Schema extensions** - Add new tables (onboardingProgress, linkedInConnections, etc.)
2. **Control Center queries** - Basic real-time agent/task monitoring
3. **Content Pipeline mutations** - Stage transitions with validation

**Rationale:** These extend existing patterns (queries/mutations) with minimal new concepts. Gets real-time features visible quickly.

### Phase 2: Integrations (Week 2)
4. **LinkedIn OAuth flow** - Authentication infrastructure
5. **LinkedIn publishing** - Single post publish (no scheduling yet)
6. **Content Pipeline UI** - Kanban board with drag-and-drop

**Rationale:** OAuth is isolated and can be built/tested independently. Pipeline UI benefits from having working mutations from Phase 1.

### Phase 3: Advanced Features (Week 3)
7. **LinkedIn scheduling** - Cron job + scheduled posts table
8. **Onboarding state machine** - Step definitions + progress tracking
9. **Onboarding UI** - Step components + flow controller

**Rationale:** Scheduling builds on working OAuth. Onboarding is most complex (state machine + analytics) but benefits from learned patterns.

### Phase 4: Polish (Week 4)
10. **LinkedIn analytics** - Fetch post metrics from API
11. **Control Center charts** - Visualizations for metrics
12. **Onboarding analytics** - Drop-off tracking, A/B testing hooks

**Rationale:** Analytics/polish work can iterate based on user feedback from earlier phases.

---

## Common Pitfalls

### Pitfall 1: Over-fetching in Real-Time Queries

**What goes wrong:**
Queries that fetch entire collections (`.collect()`) on every update cause performance issues as data grows.

**Example:**
```typescript
// BAD - Fetches all tasks every time any task updates
export const getAllTasks = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect(); // 🔴 Scales poorly
  },
});
```

**Prevention:**
- Use indexes with `.take(limit)` instead of `.collect()`
- Filter to relevant subset (e.g., last 24 hours, specific agent)
- Implement pagination for large lists

```typescript
// GOOD - Fetches only recent, limited results
export const getRecentTasks = query({
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("tasks")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
      .order("desc")
      .take(50); // ✅ Limited result set
  },
});
```

**Detection:** Monitor Convex dashboard "Query Duration" metrics. Queries > 500ms indicate over-fetching.

---

### Pitfall 2: Exposing OAuth Secrets in Frontend

**What goes wrong:**
Storing `LINKEDIN_CLIENT_SECRET` in frontend code or exchanging auth codes client-side exposes credentials to XSS attacks.

**Why it happens:**
Developers follow OAuth examples that use client-side libraries (designed for SPAs) instead of server-side flows.

**Prevention:**
✅ Always use Convex **actions** (server-side) for OAuth token exchange
✅ Store secrets in `.env.local` (never commit to git)
✅ Encrypt tokens before storing in database
❌ Never call LinkedIn API with client secret from `useQuery` or client components

**Example:**
```typescript
// 🔴 NEVER DO THIS
"use client";
const clientSecret = process.env.NEXT_PUBLIC_LINKEDIN_SECRET; // Exposed in bundle!

// ✅ DO THIS
// convex/actions.ts (server-side)
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET; // Safe, server-only
```

---

### Pitfall 3: Not Validating OAuth State Parameter

**What goes wrong:**
Attacker initiates OAuth flow with their LinkedIn account, then tricks user into completing it. User's app now connected to attacker's account.

**How to avoid:**
```typescript
export const handleOAuthCallback = action({
  handler: async (ctx, { code, state, userId }) => {
    // ✅ CRITICAL: Validate state before proceeding
    const storedState = await ctx.runQuery(internal.linkedIn.getOAuthState, {
      userId,
    });

    if (storedState?.state !== state) {
      throw new Error("Invalid state - possible CSRF attack");
    }

    // ... proceed with token exchange
  },
});
```

---

### Pitfall 4: Race Conditions in Optimistic Updates

**What goes wrong:**
User drags content from "Draft" → "Review", but mutation fails. UI shows content in "Review" but database still has "Draft". Subsequent actions operate on wrong state.

**Prevention:**
```typescript
const handleDrop = async (contentId, toStage) => {
  // Optimistic UI update
  setOptimisticContent({ id: contentId, toStage });

  try {
    await moveContent({ contentId, toStage });
  } catch (error) {
    // ✅ CRITICAL: Revert optimistic update on failure
    toast.error("Failed to move content");
    // React 19's useOptimistic handles revert automatically
  }
};
```

Also use validation in mutations:
```typescript
export const moveContentStage = mutation({
  handler: async (ctx, args) => {
    // ✅ Validate allowed transitions
    if (!isValidTransition(currentStage, targetStage)) {
      throw new Error("Invalid transition");
    }
    // ... update
  },
});
```

---

### Pitfall 5: Not Handling Onboarding State Edge Cases

**What goes wrong:**
User completes 3/5 steps, closes browser, returns tomorrow. Onboarding restarts from step 1, frustrating user.

**Or:** User skips optional step but later needs it. No way to re-enter skipped step.

**Prevention:**
```typescript
// ✅ Resume from last step
const progress = await ctx.db
  .query("onboardingProgress")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .first();

if (progress && progress.currentStep !== "complete") {
  // Resume from where they left off
  return <OnboardingFlow startStep={progress.currentStep} />;
}

// ✅ Allow re-visiting skipped steps
const handleRevisitStep = async (stepId) => {
  await updateProgress({
    skippedSteps: progress.skippedSteps.filter((s) => s !== stepId),
    currentStep: stepId,
  });
};
```

---

### Pitfall 6: Forgetting LinkedIn Token Refresh

**What goes wrong:**
Access tokens expire after 60 days. User successfully connected LinkedIn, but 2 months later publishing fails silently with 401 errors.

**Prevention:**
```typescript
export const refreshLinkedInToken = action({
  handler: async (ctx, { connectionId }) => {
    const connection = await ctx.runQuery(internal.linkedIn.getConnection, {
      id: connectionId,
    });

    // ✅ Check if token expired or expiring soon (7 days buffer)
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (connection.expiresAt < sevenDaysFromNow) {
      const refreshToken = decrypt(connection.refreshToken);

      const response = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          }),
        }
      );

      const { access_token, expires_in } = await response.json();

      // Update stored tokens
      await ctx.runMutation(internal.linkedIn.updateTokens, {
        connectionId,
        accessToken: encrypt(access_token),
        expiresAt: Date.now() + expires_in * 1000,
      });
    }
  },
});

// ✅ Run before every publish
export const publishToLinkedIn = action({
  handler: async (ctx, args) => {
    // Refresh token if needed
    await ctx.runAction(internal.linkedIn.refreshLinkedInToken, {
      connectionId: args.connectionId,
    });

    // ... proceed with publish
  },
});
```

---

## Performance Optimization Strategies

### 1. Index Optimization

Ensure all queries have supporting indexes:

```typescript
// Schema design
tasks: defineTable({
  // ... fields
})
  .index("by_agent_status", ["agentId", "status"])  // ✅ Compound index
  .index("by_timestamp", ["createdAt"])             // ✅ Time-range queries
  .index("by_priority_status", ["priority", "status"]) // ✅ Dashboard filters
```

**Why:** Un-indexed queries scan entire table (O(n)). Indexed queries are O(log n).

### 2. Pagination with Cursors

For infinite scroll or large lists:

```typescript
export const getTasksPaginated = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, { cursor, limit }) => {
    let q = ctx.db.query("tasks").order("desc");

    if (cursor) {
      q = q.filter((q) => q.lt(q.field("_creationTime"), Number(cursor)));
    }

    const tasks = await q.take(limit + 1);
    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, -1) : tasks;
    const nextCursor = hasMore
      ? items[items.length - 1]._creationTime.toString()
      : null;

    return { items, nextCursor, hasMore };
  },
});
```

### 3. Debounce UI Updates

For high-frequency updates (e.g., live token count):

```typescript
import { useDeferredValue } from "react";

function TokenCounter() {
  const stats = useQuery(api.controlCenter.getTokenStats);
  const deferredStats = useDeferredValue(stats); // ✅ Smooth rendering

  return <div>{deferredStats?.totalTokens}</div>;
}
```

### 4. Selective Re-renders

Memoize expensive components:

```typescript
const AgentCard = memo(function AgentCard({ agent }) {
  // Only re-renders if agent prop changes
  return <div>...</div>;
});
```

---

## Environment Variables Required

Add to `.env.local`:

```env
# Existing
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
ANTHROPIC_API_KEY=sk-ant-...

# NEW for v2.0
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-app-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/integrations/linkedin/callback

# Token encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-32-byte-key

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature flags (optional)
ENABLE_ONBOARDING=true
ENABLE_LINKEDIN_INTEGRATION=true
```

---

## Testing Strategy

### Unit Tests (Convex Functions)

```bash
# Install test framework
npm install --save-dev @convex-dev/test vitest

# Run tests
npx vitest
```

```typescript
// convex/linkedIn.test.ts
import { describe, it, expect } from "vitest";
import { convexTest } from "@convex-dev/test";
import { api } from "./_generated/api";

describe("LinkedIn OAuth", () => {
  it("should validate state parameter", async () => {
    const t = convexTest();

    // Store state
    await t.mutation(api.linkedIn.storeOAuthState, {
      userId: "user1",
      state: "valid-state",
    });

    // Valid callback
    await expect(
      t.action(api.linkedIn.handleOAuthCallback, {
        code: "auth-code",
        state: "valid-state",
        userId: "user1",
      })
    ).resolves.toBeDefined();

    // Invalid state (CSRF)
    await expect(
      t.action(api.linkedIn.handleOAuthCallback, {
        code: "auth-code",
        state: "invalid-state",
        userId: "user1",
      })
    ).rejects.toThrow("Invalid state");
  });
});
```

### Integration Tests (E2E)

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npx playwright test
```

```typescript
// e2e/onboarding.spec.ts
import { test, expect } from "@playwright/test";

test("complete onboarding flow", async ({ page }) => {
  await page.goto("/onboarding");

  // Step 1: Welcome
  await expect(page.locator("h1")).toContainText("Welcome");
  await page.click('button:has-text("Get Started")');

  // Step 2: Connect integrations (skip)
  await page.click('button:has-text("Skip")');

  // Step 3: Create first agent
  await page.fill('input[name="agentName"]', "Test Agent");
  await page.click('button:has-text("Create")');

  // Verify progress saved
  await page.reload();
  await expect(page.locator(".progress-bar")).toHaveAttribute(
    "data-progress",
    "3"
  );
});
```

---

## Deployment Considerations

### Convex Deployment

```bash
# Deploy backend
npx convex deploy --prod

# Run migrations (if schema changed)
# Convex auto-migrates, but verify:
npx convex dashboard
# Check "Logs" for migration status
```

### Next.js Deployment (Vercel)

```bash
# Deploy frontend
vercel --prod

# Or via Git integration (recommended)
git push origin main  # Triggers auto-deploy
```

### Environment Variables

Set in Vercel dashboard:
- Settings → Environment Variables
- Add all variables from `.env.local`
- Ensure `LINKEDIN_CLIENT_SECRET` is marked as "Sensitive"

### OAuth Callback URL

Update LinkedIn App settings:
- Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
- Your App → Auth → Redirect URLs
- Add: `https://yourdomain.com/integrations/linkedin/callback`

---

## Monitoring & Observability

### Convex Dashboard Metrics

Monitor at https://dashboard.convex.dev:

**Key metrics:**
- Query duration (should be < 100ms p95)
- Mutation throughput (writes/second)
- Active subscriptions (WebSocket connections)
- Database size and growth rate

**Alerts to set:**
- Query duration > 500ms (investigate indexing)
- Mutation errors > 1% (check validation logic)
- Active subscriptions > 1000 (may need scaling)

### Frontend Monitoring

Use Vercel Analytics or custom solution:

```typescript
// lib/analytics.ts
export function trackOnboardingStep(stepId: string, duration: number) {
  if (typeof window !== "undefined") {
    window.analytics?.track("onboarding_step_completed", {
      step_id: stepId,
      duration_ms: duration,
    });
  }
}

export function trackLinkedInPublish(contentId: string, success: boolean) {
  window.analytics?.track("linkedin_publish", {
    content_id: contentId,
    success,
  });
}
```

---

## Migration Path from Existing System

### Phase 1: Additive Changes (No Breaking Changes)

1. **Add new tables** - `onboardingProgress`, `linkedInConnections`, `linkedInPosts`
2. **Add new query/mutation files** - `controlCenter.ts`, `linkedIn.ts`, `onboarding.ts`
3. **Add new routes** - `/control-center`, `/pipeline`, `/onboarding`, `/integrations/linkedin`

Existing dashboard continues working unchanged.

### Phase 2: Schema Extensions (Minor Breaking)

4. **Extend `content` table** - Add `workflowStage`, `assignedTo`, `stateTransitions`
5. **Run data migration** - Populate new fields from existing `status` field:

```typescript
// convex/migrations/001_content_workflow.ts
export const migrateContentWorkflow = internalMutation({
  handler: async (ctx) => {
    const allContent = await ctx.db.query("content").collect();

    for (const content of allContent) {
      const workflowStage = mapStatusToStage(content.status);
      await ctx.db.patch(content._id, {
        workflowStage,
        stateTransitions: [
          {
            from: "legacy",
            to: workflowStage,
            by: "system",
            timestamp: Date.now(),
            reason: "Migration from v1 status field",
          },
        ],
      });
    }
  },
});

function mapStatusToStage(status: string): string {
  const mapping = {
    draft: "drafting",
    review: "approval",
    approved: "scheduling",
    published: "published",
    archived: "archived",
  };
  return mapping[status] || "drafting";
}
```

### Phase 3: UI Transition (Gradual Rollout)

6. **Feature flags** - Enable new features per user:

```typescript
export const isFeatureEnabled = query({
  args: {
    userId: v.string(),
    feature: v.string(),
  },
  handler: async (ctx, { userId, feature }) => {
    const flags = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", `feature_${feature}`))
      .first();

    if (flags?.value?.beta_users?.includes(userId)) return true;
    if (flags?.value?.enabled_for_all) return true;
    return false;
  },
});
```

7. **A/B testing** - Show new pipeline UI to 50% of users, track metrics
8. **Full rollout** - Enable for all users after validation

---

## Sources

### Official Documentation
- [Convex Real-Time](https://www.convex.dev/realtime)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)
- [Next.js 16 Blog](https://nextjs.org/blog/next-16)
- [LinkedIn OAuth 3-Legged Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn Authentication Overview](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)

### Advanced Patterns (2026)
- [Next.js Advanced Patterns for 2026](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7)
- [Convex Opinionated Guidelines](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339)
- [High-Throughput Mutations via Precise Queries](https://stack.convex.dev/high-throughput-mutations-via-precise-queries)

### Onboarding & UX
- [OnboardJS React Guide](https://onboardjs.com/blog/react-onboarding-onboardjs-getting-started)
- [5 Best React Onboarding Libraries (2026)](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared)
- [Implementing Effective Onboarding in React](https://radzion.com/blog/onboarding/)

### Security
- [LinkedIn OAuth Security Best Practices](https://techdocs.akamai.com/identity-cloud/docs/the-linkedin-oauth-20-social-login-configuration-guide)

---

## Summary

This architecture leverages Convex's reactive query system for real-time features, implements OAuth securely via server-side actions, extends existing content schema with workflow states, and uses a headless state machine for guided onboarding. All patterns align with existing codebase conventions (Next.js 16 + React 19 + Convex) and require minimal breaking changes.

**Confidence Assessment:**
- Real-time patterns: HIGH (verified in existing codebase)
- OAuth flow: HIGH (official LinkedIn docs + security best practices)
- State machine: MEDIUM (pattern validated, library choice flexible)
- Performance: HIGH (Convex docs + community guidelines)
