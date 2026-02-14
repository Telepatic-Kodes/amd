import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Static handoff rules: when a task of type X completes on agent A,
 * auto-trigger task type Y on agent B.
 *
 * outputMapping defines how to transform the parent task's output
 * into the child task's input.
 */
interface HandoffRule {
  targetAgentId: string;
  targetTaskType: string;
  outputMapping:
    | "blog_to_social"
    | "keyword_to_blog"
    | "social_to_analytics"
    | "strategy_blog_to_social"
    | "strategy_seo_to_content"
    | "hero_to_hub"
    | "hub_to_hygiene"
    | "hero_video_to_hub"
    | "passthrough";
  /** If set, only triggers when content matches this tier */
  contentTierFilter?: "hero" | "hub";
}

const HANDOFF_RULES: Record<string, HandoffRule[]> = {
  keyword_research: [
    {
      targetAgentId: "content-002",
      targetTaskType: "write_blog",
      outputMapping: "keyword_to_blog",
    },
  ],
  write_blog: [
    {
      targetAgentId: "social-001",
      targetTaskType: "create_linkedin_post",
      outputMapping: "blog_to_social",
    },
    {
      targetAgentId: "social-002",
      targetTaskType: "create_twitter_thread",
      outputMapping: "blog_to_social",
    },
  ],
  create_linkedin_post: [
    {
      targetAgentId: "social-006",
      targetTaskType: "analyze_engagement",
      outputMapping: "social_to_analytics",
    },
  ],
  // Strategy task handoff chains (CMO Orchestration Engine)
  strategy_blog_post: [
    {
      targetAgentId: "social-001",
      targetTaskType: "create_linkedin_post",
      outputMapping: "strategy_blog_to_social",
    },
    {
      targetAgentId: "social-002",
      targetTaskType: "create_twitter_thread",
      outputMapping: "strategy_blog_to_social",
    },
  ],
  strategy_seo_keywords: [
    {
      targetAgentId: "content-001",
      targetTaskType: "create_content_brief",
      outputMapping: "strategy_seo_to_content",
    },
  ],

  // ──────────────────────────────────────────────
  // Content Pyramid — Hero → Hub → Hygiene chains
  // ──────────────────────────────────────────────

  // Hero blog → hub derivatives (carousel, thread, newsletter)
  strategy_hero_blog: [
    {
      targetAgentId: "social-001",
      targetTaskType: "create_linkedin_carousel",
      outputMapping: "hero_to_hub",
      contentTierFilter: "hero",
    },
    {
      targetAgentId: "social-002",
      targetTaskType: "create_twitter_thread",
      outputMapping: "hero_to_hub",
      contentTierFilter: "hero",
    },
    {
      targetAgentId: "ops-002",
      targetTaskType: "write_newsletter_section",
      outputMapping: "hero_to_hub",
      contentTierFilter: "hero",
    },
  ],

  // Hero video script → hub derivatives (blog recap, carousel, reel script)
  strategy_hero_video: [
    {
      targetAgentId: "content-002",
      targetTaskType: "write_blog",
      outputMapping: "hero_video_to_hub",
      contentTierFilter: "hero",
    },
    {
      targetAgentId: "social-001",
      targetTaskType: "create_linkedin_carousel",
      outputMapping: "hero_video_to_hub",
      contentTierFilter: "hero",
    },
    {
      targetAgentId: "social-004",
      targetTaskType: "create_reel_script",
      outputMapping: "hero_video_to_hub",
      contentTierFilter: "hero",
    },
  ],

  // Hub LinkedIn carousel → hygiene micro-content
  create_linkedin_carousel: [
    {
      targetAgentId: "social-004",
      targetTaskType: "create_instagram_post",
      outputMapping: "hub_to_hygiene",
      contentTierFilter: "hub",
    },
    {
      targetAgentId: "social-002",
      targetTaskType: "create_tweet",
      outputMapping: "hub_to_hygiene",
      contentTierFilter: "hub",
    },
  ],

  // Hub twitter thread → hygiene tweets
  create_twitter_thread: [
    {
      targetAgentId: "social-004",
      targetTaskType: "create_instagram_post",
      outputMapping: "hub_to_hygiene",
      contentTierFilter: "hub",
    },
  ],
};

/**
 * Map parent output → child input based on the output mapping type.
 */
function mapOutput(
  mapping: HandoffRule["outputMapping"],
  parentOutput: string,
  parentInput: Record<string, unknown>
): Record<string, unknown> {
  switch (mapping) {
    case "keyword_to_blog":
      return {
        title: parentInput.topic ? `Guía: ${parentInput.topic}` : "Artículo basado en keyword research",
        keyword: parentInput.topic || "",
        wordCount: 1500,
        tone: "profesional",
        audience: parentInput.industry || "general",
        instructions: `Usa los siguientes resultados de keyword research como base:\n\n${parentOutput.slice(0, 2000)}`,
      };

    case "blog_to_social":
      return {
        topic: parentInput.title || parentInput.keyword || "Nuevo contenido",
        sourceContent: parentOutput.slice(0, 3000),
        objective: "engagement",
        tone: "profesional pero cercano",
      };

    case "social_to_analytics":
      return {
        metrics: {
          source: "auto_generated_post",
          parentContent: parentOutput.slice(0, 500),
        },
      };

    case "strategy_blog_to_social":
      return {
        topic: parentInput.topic || parentInput.title || "Contenido de estrategia",
        sourceContent: parentOutput.slice(0, 3000),
        objective: "engagement",
        tone: "profesional pero cercano",
        strategyContext: `Parte de la estrategia de marketing - Pilar: ${parentInput.pillar || "general"}`,
      };

    case "strategy_seo_to_content":
      return {
        keywords: parentInput.keywords || [],
        contentGaps: parentInput.contentGaps || [],
        instructions: `Crea un brief de contenido basado en este analisis SEO:\n\n${parentOutput.slice(0, 2000)}`,
      };

    case "hero_to_hub":
      return {
        topic: parentInput.title || parentInput.topic || "Contenido derivado",
        sourceContent: parentOutput.slice(0, 4000),
        contentTier: "hub",
        parentContentTier: "hero",
        pillarName: parentInput.pillarName || parentInput.pillar || "",
        funnelStage: parentInput.funnelStage || "reach",
        tayaCategory: parentInput.tayaCategory || "",
        objective: "engagement",
        tone: "profesional pero cercano",
        instructions: `Repurposea este contenido HERO en una versión más corta y digerible. Mantén los puntos clave y adapta el formato al canal de destino.`,
      };

    case "hub_to_hygiene":
      return {
        topic: parentInput.topic || parentInput.title || "Micro contenido",
        sourceContent: parentOutput.slice(0, 2000),
        contentTier: "hygiene",
        parentContentTier: "hub",
        pillarName: parentInput.pillarName || parentInput.pillar || "",
        funnelStage: parentInput.funnelStage || "reach",
        objective: "awareness",
        tone: "directo y visual",
        instructions: `Crea micro-contenido a partir de este contenido HUB. Extrae 1-2 ideas clave y adáptalas al formato del canal (post corto, imagen con texto, etc).`,
      };

    case "hero_video_to_hub":
      return {
        topic: parentInput.title || parentInput.topic || "Contenido derivado de video",
        sourceContent: parentOutput.slice(0, 4000),
        contentTier: "hub",
        parentContentTier: "hero",
        pillarName: parentInput.pillarName || parentInput.pillar || "",
        funnelStage: parentInput.funnelStage || "reach",
        objective: "engagement",
        tone: "educativo y dinámico",
        instructions: `Adapta este guión de video HERO a otro formato. Extrae los puntos principales y crea contenido derivado que complemente el video original.`,
      };

    case "passthrough":
    default:
      return { prompt: parentOutput.slice(0, 3000) };
  }
}

/**
 * processHandoffs — Called after a task completes successfully.
 * Checks rules and triggers downstream agent executions.
 */
export const processHandoffs = internalMutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    taskType: v.string(),
    output: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = HANDOFF_RULES[args.taskType];
    if (!rules || rules.length === 0) return;

    // Get the original task for its input
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    for (const rule of rules) {
      // Content Pyramid: skip rule if tier filter doesn't match
      if (rule.contentTierFilter) {
        const taskTier = (task.input as Record<string, unknown>)?.contentTier as string | undefined;
        if (taskTier !== rule.contentTierFilter) continue;
      }

      // Look up target agent
      const targetAgent = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", rule.targetAgentId))
        .first();

      if (!targetAgent || targetAgent.status !== "active") {
        console.warn(`Handoff target ${rule.targetAgentId} not found or not active`);
        continue;
      }

      // Map output to input for downstream task
      const childInput = mapOutput(rule.outputMapping, args.output, task.input || {});

      // Create handoff record
      await ctx.db.insert("handoffs", {
        fromAgent: args.agentId,
        toAgent: targetAgent._id,
        taskId: args.taskId,
        reason: `Auto-handoff: ${args.taskType} → ${rule.targetTaskType}`,
        payload: childInput,
        instructions: `Tarea automática generada por la cadena de handoff.`,
        status: "accepted",
        acceptedAt: Date.now(),
        timestamp: Date.now(),
      });

      // Create downstream task
      const now = Date.now();
      const taskId = `task_${now}_${Math.random().toString(36).substr(2, 9)}`;

      const newTaskId = await ctx.db.insert("tasks", {
        taskId,
        title: `${rule.targetTaskType} - Handoff de ${args.taskType}`,
        type: rule.targetTaskType,
        priority: "medium",
        status: "pending",
        agentId: targetAgent._id,
        assignedBy: args.agentId,
        input: childInput,
        parentTaskId: args.taskId,
        retryCount: 0,
        maxRetries: 3,
        createdAt: now,
        updatedAt: now,
      });

      // Update parent's childTaskIds
      const parentTask = await ctx.db.get(args.taskId);
      if (parentTask) {
        const childIds = parentTask.childTaskIds || [];
        await ctx.db.patch(args.taskId, {
          childTaskIds: [...childIds, newTaskId],
          updatedAt: now,
        });
      }

      // Schedule async execution for the downstream task
      await ctx.scheduler.runAfter(0, internal.agentExecution.executeAgentAsync, {
        taskId: newTaskId,
        agentId: targetAgent._id,
        agentStringId: rule.targetAgentId,
        taskType: rule.targetTaskType,
        input: childInput,
      });
    }
  },
});

/**
 * getHandoffChain — Build the full chain from a root task.
 * Follows parentTaskId links to reconstruct the execution tree.
 */
export const getHandoffChain = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    // Walk up to find the root
    const initialTask = await ctx.db.get(args.taskId);
    if (!initialTask) return null;

    let rootTask = initialTask;
    while (rootTask.parentTaskId) {
      const parent = await ctx.db.get(rootTask.parentTaskId);
      if (!parent) break;
      rootTask = parent;
    }

    // Now walk down the tree (BFS)
    const chain: Array<{
      taskId: Id<"tasks">;
      taskType: string;
      status: string;
      agentName: string;
      department: string;
      duration?: number;
      createdAt: number;
      completedAt?: number;
      parentTaskId?: Id<"tasks">;
    }> = [];

    const queue: Id<"tasks">[] = [rootTask._id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId.toString())) continue;
      visited.add(currentId.toString());

      const task = await ctx.db.get(currentId);
      if (!task) continue;

      const agent = await ctx.db.get(task.agentId);

      chain.push({
        taskId: task._id,
        taskType: task.type,
        status: task.status,
        agentName: agent?.name || "Desconocido",
        department: agent?.department || "unknown",
        duration: task.completedAt && task.startedAt
          ? task.completedAt - task.startedAt
          : undefined,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        parentTaskId: task.parentTaskId,
      });

      // Add children to queue
      if (task.childTaskIds) {
        for (const childId of task.childTaskIds) {
          queue.push(childId);
        }
      }
    }

    return chain;
  },
});

/**
 * listActiveChains — Find chains that have at least one running/pending task.
 */
export const listActiveChains = query({
  args: {},
  handler: async (ctx) => {
    // Get recent running or pending tasks
    const runningTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .take(20);

    const pendingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(20);

    const activeTasks = [...runningTasks, ...pendingTasks];

    // Find root tasks (walk up parentTaskId)
    const rootTaskIds = new Set<string>();
    const chains: Array<{
      rootTaskId: Id<"tasks">;
      rootTaskType: string;
      totalTasks: number;
      completedTasks: number;
      runningTasks: number;
      createdAt: number;
    }> = [];

    for (const task of activeTasks) {
      // Walk up to root
      let current = task;
      while (current.parentTaskId) {
        const parent = await ctx.db.get(current.parentTaskId);
        if (!parent) break;
        current = parent;
      }

      if (rootTaskIds.has(current._id.toString())) continue;
      rootTaskIds.add(current._id.toString());

      // Count chain stats (BFS down)
      let totalTasks = 0;
      let completedTasks = 0;
      let runningCount = 0;
      const queue: Id<"tasks">[] = [current._id];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id.toString())) continue;
        visited.add(id.toString());

        const t = await ctx.db.get(id);
        if (!t) continue;

        totalTasks++;
        if (t.status === "completed") completedTasks++;
        if (t.status === "running") runningCount++;

        if (t.childTaskIds) {
          for (const childId of t.childTaskIds) {
            queue.push(childId);
          }
        }
      }

      chains.push({
        rootTaskId: current._id,
        rootTaskType: current.type,
        totalTasks,
        completedTasks,
        runningTasks: runningCount,
        createdAt: current.createdAt,
      });
    }

    return chains;
  },
});
