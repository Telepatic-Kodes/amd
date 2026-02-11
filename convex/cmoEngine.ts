import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getUserId } from "./lib/auth";

// ===========================================
// TASK-TO-AGENT MAPPING
// Maps strategy task types to the appropriate specialist agent
// ===========================================

const TASK_AGENT_MAP: Record<string, string> = {
  strategy_blog_post: "content-002",
  strategy_social_linkedin: "social-001",
  strategy_social_twitter: "social-002",
  strategy_social_instagram: "social-004",
  strategy_ad_google: "demandgen-003",
  strategy_ad_meta: "demandgen-002",
  strategy_ad_linkedin: "demandgen-004",
  strategy_seo_audit: "seo-003",
  strategy_seo_keywords: "seo-001",
  strategy_email_welcome: "ops-002",
  strategy_email_nurture: "ops-003",
  strategy_newsletter: "ops-002",
  strategy_case_study: "content-004",
};

// Map channels to strategy task types
const CHANNEL_TASK_MAP: Record<string, string> = {
  Blog: "strategy_blog_post",
  LinkedIn: "strategy_social_linkedin",
  Twitter: "strategy_social_twitter",
  Instagram: "strategy_social_instagram",
  "Google Ads": "strategy_ad_google",
  "Meta Ads": "strategy_ad_meta",
  "LinkedIn Ads": "strategy_ad_linkedin",
  Newsletter: "strategy_newsletter",
  Email: "strategy_email_welcome",
};

// Map content types from calendar to task types
const CONTENT_TYPE_TASK_MAP: Record<string, string> = {
  blog: "strategy_blog_post",
  article: "strategy_blog_post",
  post_linkedin: "strategy_social_linkedin",
  post_twitter: "strategy_social_twitter",
  post_instagram: "strategy_social_instagram",
  newsletter: "strategy_newsletter",
  case_study: "strategy_case_study",
  email: "strategy_email_welcome",
};

// ===========================================
// CMO SYSTEM PROMPT BUILDER
// ===========================================

function buildCMOPrompt(brandProfile: {
  companyName: string;
  industry: string;
  description: string;
  voice: { tone: string[]; personality: string[] };
  audience: { segments: { name: string; demographics?: string; painPoints: string[] }[] };
  strategy: { topics: string[]; channels: string[]; postingFrequency?: string };
  competitors: { name: string; url?: string; notes?: string }[];
}): string {
  const segments = brandProfile.audience.segments
    .map((s) => `${s.name} (${s.painPoints.join(", ")})`)
    .join("; ");

  const competitors = brandProfile.competitors
    .map((c) => `${c.name}${c.notes ? ` — ${c.notes}` : ""}`)
    .join("; ");

  return `You are the CMO (Chief Marketing Officer) of ${brandProfile.companyName}. Based on the brand profile below, create a comprehensive marketing strategy.

BRAND DATA:
- Company: ${brandProfile.companyName} (${brandProfile.industry})
- Description: ${brandProfile.description}
- Voice: ${brandProfile.voice.tone.join(", ")} / ${brandProfile.voice.personality.join(", ")}
- Audience Segments: ${segments}
- Current Channels: ${brandProfile.strategy.channels.join(", ")}
- Posting Frequency: ${brandProfile.strategy.postingFrequency || "3x/week"}
- Content Topics: ${brandProfile.strategy.topics.join(", ")}
- Competitors: ${competitors}

YOUR TASK:
Create a full marketing strategy. Return ONLY valid JSON with this exact structure:

{
  "summary": "2-3 sentence executive brief of the strategy",
  "contentPillars": [
    {
      "name": "Pillar name",
      "description": "What this pillar covers and why",
      "topics": ["topic1", "topic2", "topic3"],
      "channels": ["Blog", "LinkedIn", "Twitter"]
    }
  ],
  "weeklyCalendar": [
    {
      "dayOfWeek": "Monday",
      "contentType": "blog",
      "channel": "Blog",
      "pillar": "Pillar name",
      "description": "Brief description of what to publish"
    }
  ],
  "adStrategy": {
    "platforms": ["Google Ads", "Meta Ads"],
    "budgetSplit": [
      { "platform": "Google Ads", "percentage": 60 },
      { "platform": "Meta Ads", "percentage": 40 }
    ],
    "objectives": ["Brand awareness", "Lead generation"]
  },
  "seoStrategy": {
    "primaryKeywords": ["keyword1", "keyword2"],
    "contentGaps": ["gap1", "gap2"],
    "technicalPriorities": ["Core Web Vitals", "Schema markup"]
  },
  "emailStrategy": {
    "sequences": ["Welcome sequence", "Nurture sequence"],
    "frequency": "Weekly",
    "segments": ["New subscribers", "Active users"]
  }
}

RULES:
- Create 3-5 content pillars aligned with the brand topics and audience
- Weekly calendar should have 5-7 entries (one per weekday)
- Include all channels the brand uses
- Ad strategy should reflect realistic budget splits
- SEO keywords should be specific and actionable
- Email sequences should match the funnel stages
- All text in Spanish (the brand operates in Spanish-speaking markets)
- Return ONLY the JSON, no markdown fences, no explanations`;
}

// ===========================================
// LAUNCH STRATEGY (public mutation + internal action)
// ===========================================

/**
 * launchStrategy — Public mutation that creates a strategy record
 * and schedules the CMO agent to generate the strategy.
 */
export const launchStrategy = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const strategyId = `strategy_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate brand profile exists
    const brandProfile = await ctx.db.get(args.brandProfileId);
    if (!brandProfile) {
      throw new Error("Perfil de marca no encontrado");
    }
    if (brandProfile.status !== "complete") {
      throw new Error("El perfil de marca debe estar completo antes de generar una estrategia");
    }

    // Check no active strategy already exists for this brand
    const existing = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_brandProfile", (q) => q.eq("brandProfileId", args.brandProfileId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "generating"),
          q.eq(q.field("status"), "executing"),
          q.eq(q.field("status"), "ready")
        )
      )
      .first();

    if (existing) {
      throw new Error("Ya existe una estrategia activa para esta marca");
    }

    // Create strategy record in "generating" state
    const id = await ctx.db.insert("marketingStrategies", {
      strategyId,
      brandProfileId: args.brandProfileId,
      userId: brandProfile.userId,
      status: "generating",
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule the CMO action to generate strategy via Claude
    await ctx.scheduler.runAfter(0, internal.cmoEngine.generateStrategyAsync, {
      strategyDocId: id,
      brandProfileId: args.brandProfileId,
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "strategy.launched",
      entityType: "marketingStrategy",
      entityId: strategyId,
      performedBy: "user",
      metadata: { brandProfileId: args.brandProfileId },
      timestamp: now,
    });

    return { strategyId, id };
  },
});

/**
 * generateStrategyAsync — Internal action that calls Claude as the CMO
 * to generate a marketing strategy based on the brand profile.
 */
export const generateStrategyAsync = internalAction({
  args: {
    strategyDocId: v.id("marketingStrategies"),
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch brand profile
      const brandProfile = await ctx.runQuery(api.brandProfile.getBrandProfile);
      if (!brandProfile) {
        throw new Error("Brand profile not found");
      }

      // Build CMO prompt
      const systemPrompt = buildCMOPrompt(brandProfile);

      // Call Claude as CMO
      const claudeResponse = await ctx.runAction(api.actions.callClaude, {
        systemPrompt,
        userMessage: `Generate the complete marketing strategy for ${brandProfile.companyName} now. Return only valid JSON.`,
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        maxTokens: 4096,
      });

      // Parse the strategy JSON from Claude's response
      let strategyData;
      try {
        // Clean any markdown fences if present
        let content = claudeResponse.content.trim();
        if (content.startsWith("```")) {
          content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        strategyData = JSON.parse(content);
      } catch {
        throw new Error(`Failed to parse CMO strategy JSON: ${claudeResponse.content.slice(0, 200)}`);
      }

      // Validate required fields
      if (!strategyData.summary || !strategyData.contentPillars || !strategyData.weeklyCalendar) {
        throw new Error("Strategy missing required fields: summary, contentPillars, weeklyCalendar");
      }

      // Save strategy to DB
      await ctx.runMutation(internal.cmoEngine.saveStrategy, {
        strategyDocId: args.strategyDocId,
        strategy: strategyData,
      });

      // Decompose strategy into tasks
      await ctx.runMutation(internal.cmoEngine.decomposeStrategy, {
        strategyDocId: args.strategyDocId,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.cmoEngine.failStrategy, {
        strategyDocId: args.strategyDocId,
        error: errorMessage,
      });
    }
  },
});

/**
 * saveStrategy — Internal mutation to save generated strategy data.
 */
export const saveStrategy = internalMutation({
  args: {
    strategyDocId: v.id("marketingStrategies"),
    strategy: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.strategyDocId, {
      strategy: args.strategy,
      status: "ready",
      updatedAt: Date.now(),
    });
  },
});

/**
 * failStrategy — Internal mutation to mark a strategy as failed.
 */
export const failStrategy = internalMutation({
  args: {
    strategyDocId: v.id("marketingStrategies"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.strategyDocId, {
      status: "failed",
      updatedAt: Date.now(),
    });

    // Log the error
    const strategy = await ctx.db.get(args.strategyDocId);
    if (strategy) {
      await ctx.db.insert("auditLog", {
        action: "strategy.failed",
        entityType: "marketingStrategy",
        entityId: strategy.strategyId,
        performedBy: "system",
        metadata: { error: args.error },
        timestamp: Date.now(),
      });

      // Dispatch webhook event
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "strategy.failed",
        payload: JSON.stringify({
          strategyId: args.strategyDocId,
          strategyName: strategy.goal || strategy.strategyId,
          error: args.error,
          failedAt: Date.now(),
        }),
      });
    }
  },
});

// ===========================================
// DECOMPOSE STRATEGY INTO TASKS
// ===========================================

/**
 * decomposeStrategy — Creates tasks from the strategy's content pillars,
 * calendar, ad strategy, SEO strategy, and email strategy.
 */
export const decomposeStrategy = internalMutation({
  args: {
    strategyDocId: v.id("marketingStrategies"),
  },
  handler: async (ctx, args) => {
    const strategyDoc = await ctx.db.get(args.strategyDocId);
    if (!strategyDoc || !strategyDoc.strategy) return;

    const strategy = strategyDoc.strategy;
    const strategyIdStr = strategyDoc.strategyId;
    const now = Date.now();
    let taskCount = 0;

    // Helper to find agent by string ID
    async function findAgent(agentStringId: string) {
      return await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", agentStringId))
        .first();
    }

    // Helper to create a strategy task
    async function createStrategyTask(
      taskType: string,
      title: string,
      input: Record<string, unknown>,
      parentTaskId?: Id<"tasks">
    ) {
      const agentStringId = TASK_AGENT_MAP[taskType];
      if (!agentStringId) return null;

      const agent = await findAgent(agentStringId);
      if (!agent || agent.status !== "active") return null;

      const taskId = `strat_${now}_${taskCount}_${Math.random().toString(36).substr(2, 5)}`;
      taskCount++;

      const id = await ctx.db.insert("tasks", {
        taskId,
        title,
        type: taskType,
        priority: "medium",
        status: "pending",
        agentId: agent._id,
        strategyId: strategyIdStr,
        input: { ...input, strategyId: strategyIdStr },
        parentTaskId,
        retryCount: 0,
        maxRetries: 3,
        createdAt: now,
        updatedAt: now,
      });

      return id;
    }

    // 1. Content pillar tasks: create blog posts and social content per pillar
    for (const pillar of strategy.contentPillars) {
      for (const topic of pillar.topics.slice(0, 2)) { // Limit to 2 topics per pillar
        for (const channel of pillar.channels) {
          const taskType = CHANNEL_TASK_MAP[channel];
          if (!taskType) continue;

          await createStrategyTask(
            taskType,
            `${channel}: ${topic} (${pillar.name})`,
            {
              topic,
              pillar: pillar.name,
              channel,
              description: pillar.description,
              tone: "profesional",
              objective: "engagement",
            }
          );
        }
      }
    }

    // 2. Weekly calendar tasks: create content for each day
    for (const entry of strategy.weeklyCalendar) {
      const taskType = CONTENT_TYPE_TASK_MAP[entry.contentType] ||
        CHANNEL_TASK_MAP[entry.channel];
      if (!taskType) continue;

      await createStrategyTask(
        taskType,
        `${entry.dayOfWeek}: ${entry.description} (${entry.channel})`,
        {
          topic: entry.description,
          pillar: entry.pillar,
          channel: entry.channel,
          dayOfWeek: entry.dayOfWeek,
          contentType: entry.contentType,
        }
      );
    }

    // 3. SEO tasks
    if (strategy.seoStrategy) {
      await createStrategyTask(
        "strategy_seo_keywords",
        "SEO: Investigacion de keywords prioritarias",
        {
          keywords: strategy.seoStrategy.primaryKeywords,
          contentGaps: strategy.seoStrategy.contentGaps,
        }
      );

      await createStrategyTask(
        "strategy_seo_audit",
        "SEO: Auditoria tecnica del sitio",
        {
          priorities: strategy.seoStrategy.technicalPriorities,
        }
      );
    }

    // 4. Ad strategy tasks
    if (strategy.adStrategy) {
      for (const platform of strategy.adStrategy.platforms) {
        const platformMap: Record<string, string> = {
          "Google Ads": "strategy_ad_google",
          "Meta Ads": "strategy_ad_meta",
          "LinkedIn Ads": "strategy_ad_linkedin",
        };
        const taskType = platformMap[platform];
        if (!taskType) continue;

        const budgetEntry = strategy.adStrategy.budgetSplit.find(
          (b: { platform: string }) => b.platform === platform
        );

        await createStrategyTask(
          taskType,
          `Ads: Campana en ${platform}`,
          {
            platform,
            budgetPercentage: budgetEntry?.percentage || 0,
            objectives: strategy.adStrategy.objectives,
          }
        );
      }
    }

    // 5. Email strategy tasks
    if (strategy.emailStrategy) {
      for (const sequence of strategy.emailStrategy.sequences) {
        const taskType = sequence.toLowerCase().includes("welcome")
          ? "strategy_email_welcome"
          : "strategy_email_nurture";

        await createStrategyTask(
          taskType,
          `Email: ${sequence}`,
          {
            sequence,
            frequency: strategy.emailStrategy.frequency,
            segments: strategy.emailStrategy.segments,
          }
        );
      }
    }

    // Update strategy with task count
    await ctx.db.patch(args.strategyDocId, {
      totalTasks: taskCount,
      completedTasks: 0,
      failedTasks: 0,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// EXECUTE STRATEGY TASKS
// ===========================================

/**
 * startExecution — Public mutation to begin executing a ready strategy.
 */
export const startExecution = mutation({
  args: {
    strategyDocId: v.id("marketingStrategies"),
  },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyDocId);
    if (!strategy) throw new Error("Estrategia no encontrada");
    if (strategy.status !== "ready") {
      throw new Error("La estrategia debe estar en estado 'ready' para ejecutarse");
    }

    await ctx.db.patch(args.strategyDocId, {
      status: "executing",
      updatedAt: Date.now(),
    });

    // Schedule first batch
    await ctx.scheduler.runAfter(0, internal.cmoEngine.executeNextBatch, {
      strategyDocId: args.strategyDocId,
    });

    return { started: true };
  },
});

/**
 * executeNextBatch — Gets pending tasks with no unfinished deps and executes up to 5.
 */
export const executeNextBatch = internalAction({
  args: {
    strategyDocId: v.id("marketingStrategies"),
  },
  handler: async (ctx, args) => {
    // Get strategy
    const strategy = await ctx.runQuery(api.cmoEngine.getStrategyInternal, {
      strategyDocId: args.strategyDocId,
    });
    if (!strategy || strategy.status !== "executing") return;

    // Get pending tasks for this strategy
    const pendingTasks = await ctx.runQuery(api.cmoEngine.getPendingStrategyTasks, {
      strategyId: strategy.strategyId,
    });

    if (pendingTasks.length === 0) return;

    // Execute up to 5 tasks in parallel
    const batch = pendingTasks.slice(0, 5);

    for (const task of batch) {
      const agent = await ctx.runQuery(api.functions.getAgentById, {
        id: task.agentId,
      });

      if (!agent || agent.status !== "active") continue;

      await ctx.scheduler.runAfter(0, internal.agentExecution.executeAgentAsync, {
        taskId: task._id,
        agentId: task.agentId,
        agentStringId: agent.agentId,
        taskType: task.type,
        input: task.input,
      });
    }
  },
});

// ===========================================
// STRATEGY TASK COMPLETION CALLBACK
// ===========================================

/**
 * onStrategyTaskComplete — Called when a strategy task completes.
 * Updates counters and schedules next batch if needed.
 */
export const onStrategyTaskComplete = internalMutation({
  args: {
    strategyId: v.string(),
    taskStatus: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const strategyDoc = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_strategyId", (q) => q.eq("strategyId", args.strategyId))
      .first();

    if (!strategyDoc || strategyDoc.status !== "executing") return;

    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (args.taskStatus === "completed") {
      updates.completedTasks = (strategyDoc.completedTasks || 0) + 1;
    } else {
      updates.failedTasks = (strategyDoc.failedTasks || 0) + 1;
    }

    const newCompleted = (updates.completedTasks as number) ?? (strategyDoc.completedTasks || 0);
    const newFailed = (updates.failedTasks as number) ?? (strategyDoc.failedTasks || 0);
    const totalDone = newCompleted + newFailed;

    // Check if all tasks are done
    if (totalDone >= (strategyDoc.totalTasks || 0)) {
      updates.status = "completed";
      updates.completedAt = now;

      // Dispatch webhook event for strategy completion
      await ctx.scheduler.runAfter(0, internal.webhookEngine.dispatchEvent, {
        event: "strategy.completed",
        payload: JSON.stringify({
          strategyId: strategyDoc._id,
          strategyName: strategyDoc.goal || strategyDoc.strategyId,
          completedTasks: newCompleted,
          failedTasks: newFailed,
          completedAt: now,
        }),
      });
    }

    await ctx.db.patch(strategyDoc._id, updates);

    // If not done, schedule next batch
    if (!updates.status) {
      await ctx.scheduler.runAfter(1000, internal.cmoEngine.executeNextBatch, {
        strategyDocId: strategyDoc._id,
      });
    }
  },
});

// ===========================================
// PAUSE / RESUME
// ===========================================

export const pauseStrategy = mutation({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyDocId);
    if (!strategy) throw new Error("Estrategia no encontrada");
    if (strategy.status !== "executing") throw new Error("Solo se puede pausar una estrategia en ejecucion");

    await ctx.db.patch(args.strategyDocId, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

export const resumeStrategy = mutation({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyDocId);
    if (!strategy) throw new Error("Estrategia no encontrada");
    if (strategy.status !== "paused") throw new Error("Solo se puede reanudar una estrategia pausada");

    await ctx.db.patch(args.strategyDocId, {
      status: "executing",
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.cmoEngine.executeNextBatch, {
      strategyDocId: args.strategyDocId,
    });
  },
});

// ===========================================
// QUERIES
// ===========================================

/**
 * getStrategy — Full strategy + progress for the dashboard.
 */
export const getStrategy = query({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.strategyDocId);
  },
});

/**
 * getActiveStrategy — Get the current active strategy for the user's brand profile.
 */
export const getActiveStrategy = query({
  args: {},
  handler: async (ctx) => {
    // Get user's brand profile using shared auth helper (supports dev bypass)
    const userId = await getUserId(ctx);

    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!brandProfile) return null;

    // Find most recent non-failed strategy
    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_brandProfile", (q) => q.eq("brandProfileId", brandProfile._id))
      .order("desc")
      .take(1);

    return strategies[0] || null;
  },
});

/**
 * listStrategies — All strategies for the current user.
 */
export const listStrategies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    return await ctx.db
      .query("marketingStrategies")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * getStrategyTasks — Tasks for a strategy, grouped by department.
 */
export const getStrategyTasks = query({
  args: { strategyId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .collect();

    // Filter by strategyId
    const strategyTasks = tasks.filter((t) => t.strategyId === args.strategyId);

    // Get agent info for grouping
    const agentMap = new Map<string, { name: string; department: string }>();
    for (const task of strategyTasks) {
      const agentIdStr = task.agentId.toString();
      if (!agentMap.has(agentIdStr)) {
        const agent = await ctx.db.get(task.agentId);
        if (agent) {
          agentMap.set(agentIdStr, { name: agent.name, department: agent.department });
        }
      }
    }

    // Group by department
    const grouped: Record<string, Array<{
      _id: Id<"tasks">;
      title: string;
      type: string;
      status: string;
      agentName: string;
      createdAt: number;
      completedAt?: number;
    }>> = {};

    for (const task of strategyTasks) {
      const agentInfo = agentMap.get(task.agentId.toString());
      const dept = agentInfo?.department || "unknown";

      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push({
        _id: task._id,
        title: task.title,
        type: task.type,
        status: task.status,
        agentName: agentInfo?.name || "Desconocido",
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      });
    }

    return grouped;
  },
});

// ===========================================
// INTERNAL QUERIES (for actions to call)
// ===========================================

export const getStrategyInternal = query({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.strategyDocId);
  },
});

export const getPendingStrategyTasks = query({
  args: { strategyId: v.string() },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return allTasks.filter((t) => t.strategyId === args.strategyId);
  },
});

// ===========================================
// GOAL-BASED STRATEGY LAUNCH
// ===========================================

/**
 * launchStrategyFromGoal — Creates a strategy from a natural language goal.
 * User types something like "Aumentar engagement en LinkedIn 20%" and the
 * CMO generates a targeted strategy for that specific goal.
 */
export const launchStrategyFromGoal = mutation({
  args: {
    goal: v.string(),
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const strategyId = `strategy_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const brandProfile = await ctx.db.get(args.brandProfileId);
    if (!brandProfile) {
      throw new Error("Perfil de marca no encontrado");
    }
    if (brandProfile.status !== "complete") {
      throw new Error("El perfil de marca debe estar completo");
    }

    // Check no active strategy already running
    const existing = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_brandProfile", (q) => q.eq("brandProfileId", args.brandProfileId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "generating"),
          q.eq(q.field("status"), "executing"),
          q.eq(q.field("status"), "ready")
        )
      )
      .first();

    if (existing) {
      throw new Error("Ya existe una estrategia activa para esta marca. Completa o archiva la actual primero.");
    }

    const id = await ctx.db.insert("marketingStrategies", {
      strategyId,
      brandProfileId: args.brandProfileId,
      userId: brandProfile.userId,
      goal: args.goal,
      status: "generating",
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.cmoEngine.generateStrategyFromGoalAsync, {
      strategyDocId: id,
      brandProfileId: args.brandProfileId,
      goal: args.goal,
    });

    await ctx.db.insert("auditLog", {
      action: "strategy.launched_from_goal",
      entityType: "marketingStrategy",
      entityId: strategyId,
      performedBy: "user",
      metadata: { brandProfileId: args.brandProfileId, goal: args.goal },
      timestamp: now,
    });

    return { strategyId, id };
  },
});

/**
 * generateStrategyFromGoalAsync — Claude CMO generates strategy
 * targeting a specific user goal.
 */
export const generateStrategyFromGoalAsync = internalAction({
  args: {
    strategyDocId: v.id("marketingStrategies"),
    brandProfileId: v.id("brandProfiles"),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const brandProfile = await ctx.runQuery(api.brandProfile.getBrandProfile);
      if (!brandProfile) {
        throw new Error("Brand profile not found");
      }

      const basePrompt = buildCMOPrompt(brandProfile);
      const goalPrompt = `${basePrompt}

IMPORTANT CONTEXT — USER GOAL:
The user has set this specific marketing objective: "${args.goal}"

Your strategy MUST be laser-focused on achieving this goal. Every content pillar, calendar entry, ad campaign, SEO priority, and email sequence should directly contribute to this objective.

Include a "goalMetrics" section in your JSON response:
{
  "goalMetrics": {
    "objective": "${args.goal}",
    "kpis": ["KPI 1", "KPI 2", "KPI 3"],
    "targetTimeline": "4 weeks",
    "milestones": [
      { "week": 1, "target": "Description of week 1 milestone" },
      { "week": 2, "target": "Description of week 2 milestone" },
      { "week": 3, "target": "Description of week 3 milestone" },
      { "week": 4, "target": "Description of week 4 milestone" }
    ]
  }
}`;

      const claudeResponse = await ctx.runAction(api.actions.callClaude, {
        systemPrompt: goalPrompt,
        userMessage: `Generate a focused marketing strategy for ${brandProfile.companyName} to achieve: "${args.goal}". Return only valid JSON.`,
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        maxTokens: 4096,
      });

      let strategyData;
      try {
        let content = claudeResponse.content.trim();
        if (content.startsWith("```")) {
          content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        strategyData = JSON.parse(content);
      } catch {
        throw new Error(`Failed to parse CMO strategy JSON: ${claudeResponse.content.slice(0, 200)}`);
      }

      if (!strategyData.summary || !strategyData.contentPillars || !strategyData.weeklyCalendar) {
        throw new Error("Strategy missing required fields");
      }

      await ctx.runMutation(internal.cmoEngine.saveStrategy, {
        strategyDocId: args.strategyDocId,
        strategy: strategyData,
      });

      await ctx.runMutation(internal.cmoEngine.decomposeStrategy, {
        strategyDocId: args.strategyDocId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.cmoEngine.failStrategy, {
        strategyDocId: args.strategyDocId,
        error: errorMessage,
      });
    }
  },
});

// ===========================================
// ARCHIVE STRATEGY
// ===========================================

export const archiveStrategy = mutation({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyDocId);
    if (!strategy) throw new Error("Estrategia no encontrada");
    if (strategy.status === "executing" || strategy.status === "generating") {
      throw new Error("No se puede archivar una estrategia en ejecucion o generandose");
    }

    await ctx.db.patch(args.strategyDocId, {
      status: "failed", // reuse failed status as "archived"
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      action: "strategy.archived",
      entityType: "marketingStrategy",
      entityId: strategy.strategyId,
      performedBy: "user",
      metadata: {},
      timestamp: Date.now(),
    });
  },
});

// ===========================================
// STRATEGY PERFORMANCE
// ===========================================

/**
 * getStrategyPerformance — Returns execution metrics for a strategy.
 */
export const getStrategyPerformance = query({
  args: { strategyDocId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyDocId);
    if (!strategy) return null;

    // Get all tasks for this strategy
    const allTasks = await ctx.db.query("tasks").order("desc").collect();
    const stratTasks = allTasks.filter((t) => t.strategyId === strategy.strategyId);

    // Get executions for these tasks
    const executions = [];
    for (const task of stratTasks) {
      const taskExecs = await ctx.db
        .query("executions")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      executions.push(...taskExecs);
    }

    const totalTokens = executions.reduce((s, e) => s + (e.tokensUsed?.total || 0), 0);
    const totalCost = executions.reduce((s, e) => s + (e.cost || 0), 0);
    const totalDuration = executions.reduce((s, e) => s + (e.duration || 0), 0);
    const successCount = executions.filter((e) => e.status === "success").length;

    // Content generated from this strategy
    const contentGenerated = await ctx.db.query("content").order("desc").collect();
    const stratContent = contentGenerated.filter((c) =>
      stratTasks.some((t) => t._id === c.sourceTaskId)
    );

    // Timeline: task completion over time
    const completedTasks = stratTasks
      .filter((t) => t.completedAt)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    const timeline = completedTasks.map((t) => ({
      timestamp: t.completedAt!,
      title: t.title,
      status: t.status,
    }));

    return {
      strategyId: strategy.strategyId,
      goal: strategy.goal,
      status: strategy.status,
      tasks: {
        total: stratTasks.length,
        completed: stratTasks.filter((t) => t.status === "completed").length,
        running: stratTasks.filter((t) => t.status === "running").length,
        pending: stratTasks.filter((t) => t.status === "pending").length,
        failed: stratTasks.filter((t) => t.status === "failed").length,
      },
      execution: {
        totalExecutions: executions.length,
        successRate: executions.length > 0 ? (successCount / executions.length) * 100 : 0,
        totalTokens,
        totalCost,
        avgDuration: executions.length > 0 ? totalDuration / executions.length : 0,
      },
      content: {
        total: stratContent.length,
        published: stratContent.filter((c) => c.status === "published").length,
        draft: stratContent.filter((c) => c.status === "draft").length,
      },
      timeline,
      createdAt: strategy.createdAt,
      completedAt: strategy.completedAt,
    };
  },
});

/**
 * getStrategyTasksDetailed — Returns all strategy tasks with full agent info
 * for the real-time execution monitoring view.
 */
export const getStrategyTasksDetailed = query({
  args: { strategyId: v.string() },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db.query("tasks").order("desc").collect();
    const stratTasks = allTasks.filter((t) => t.strategyId === args.strategyId);

    const result = [];
    for (const task of stratTasks) {
      const agent = await ctx.db.get(task.agentId);

      // Get latest execution for this task
      const executions = await ctx.db
        .query("executions")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .order("desc")
        .take(1);

      const latestExec = executions[0];

      result.push({
        _id: task._id,
        taskId: task.taskId,
        title: task.title,
        type: task.type,
        status: task.status,
        priority: task.priority,
        agent: agent
          ? { name: agent.name, department: agent.department, agentId: agent.agentId, status: agent.status }
          : null,
        execution: latestExec
          ? {
              status: latestExec.status,
              duration: latestExec.duration,
              tokensUsed: latestExec.tokensUsed?.total || 0,
              cost: latestExec.cost,
              timestamp: latestExec.timestamp,
            }
          : null,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      });
    }

    return result.sort((a, b) => {
      // Running first, then pending, then completed, then failed
      const order: Record<string, number> = { running: 0, pending: 1, queued: 2, completed: 3, failed: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });
  },
});
