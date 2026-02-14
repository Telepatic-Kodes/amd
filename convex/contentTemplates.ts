import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// ===========================================
// QUERIES
// ===========================================

export const listTemplates = query({
  args: {
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let templates;

    if (args.category) {
      templates = await ctx.db
        .query("contentTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .collect();
    } else {
      templates = await ctx.db.query("contentTemplates").collect();
    }

    // Filter active only
    templates = templates.filter((t) => t.isActive);

    // Filter by industry if provided
    if (args.industry) {
      templates = templates.filter(
        (t) => t.industry.includes(args.industry!) || t.industry.includes("general")
      );
    }

    // Filter by contentType if provided
    if (args.contentType) {
      templates = templates.filter((t) => t.contentType === args.contentType);
    }

    return templates;
  },
});

export const getTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentTemplates")
      .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
      .first();
  },
});

export const listMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? "dev-user";
    const templates = await ctx.db
      .query("contentTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return templates.filter((t) => t.isActive);
  },
});

export const getActiveTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("contentTemplates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const incrementUsage = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("contentTemplates")
      .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
      .first();
    if (!template) return;
    await ctx.db.patch(template._id, {
      usageCount: (template.usageCount ?? 0) + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const createCustomTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("social"),
      v.literal("blog"),
      v.literal("email"),
      v.literal("ads"),
      v.literal("misc")
    ),
    contentType: v.string(),
    channels: v.array(v.string()),
    promptTemplate: v.string(),
    variables: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        required: v.boolean(),
        default: v.optional(v.string()),
      })
    ),
    exampleOutput: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? "dev-user";
    const now = Date.now();
    const templateId = `tpl_custom_${now}_${Math.random().toString(36).substr(2, 6)}`;

    await ctx.db.insert("contentTemplates", {
      ...args,
      templateId,
      industry: ["general"],
      isActive: true,
      usageCount: 0,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("social"),
        v.literal("blog"),
        v.literal("email"),
        v.literal("ads"),
        v.literal("misc")
      )
    ),
    contentType: v.optional(v.string()),
    promptTemplate: v.optional(v.string()),
    exampleOutput: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject ?? "dev-user";

    const template = await ctx.db
      .query("contentTemplates")
      .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
      .first();
    if (!template) throw new Error("Template not found");

    // Only owner can edit user-created templates
    if (template.userId && template.userId !== currentUserId) {
      throw new Error("Not authorized to edit this template");
    }

    const { templateId: _, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(template._id, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject ?? "dev-user";

    const template = await ctx.db
      .query("contentTemplates")
      .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
      .first();
    if (!template) throw new Error("Template not found");

    // Only owner can delete user-created templates
    if (template.userId && template.userId !== currentUserId) {
      throw new Error("Not authorized to delete this template");
    }

    // Soft delete
    await ctx.db.patch(template._id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const generateFromTemplate = action({
  args: {
    templateId: v.string(),
    variables: v.object({
      topic: v.string(),
      audience: v.optional(v.string()),
      tone: v.optional(v.string()),
      customInstructions: v.optional(v.string()),
      cta: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Get the template
    const template: any = await ctx.runQuery(api.contentTemplates.getTemplate, {
      templateId: args.templateId,
    });
    if (!template) {
      throw new Error(`Template not found: ${args.templateId}`);
    }

    // 2. Get brand profile for voice injection
    const brandProfile: any = await ctx.runQuery(api.brandProfile.getBrandProfile);

    // 3. Build the prompt by replacing variables in the template
    let prompt = template.promptTemplate;
    prompt = prompt.replace(/\{\{topic\}\}/g, args.variables.topic);
    prompt = prompt.replace(
      /\{\{audience\}\}/g,
      args.variables.audience || brandProfile?.audience?.segments?.[0]?.name || "profesionales"
    );
    prompt = prompt.replace(
      /\{\{tone\}\}/g,
      args.variables.tone || brandProfile?.voice?.tone?.join(", ") || "profesional"
    );
    prompt = prompt.replace(/\{\{cta\}\}/g, args.variables.cta || "");

    // 4. Build system prompt with brand context
    const brandContext = brandProfile
      ? `
BRAND CONTEXT:
- Company: ${brandProfile.companyName}
- Industry: ${brandProfile.industry}
- Voice tone: ${brandProfile.voice?.tone?.join(", ") || "profesional"}
- Voice personality: ${brandProfile.voice?.personality?.join(", ") || "cercano"}
- Do: ${brandProfile.voice?.dos?.join("; ") || "ser claro y directo"}
- Don't: ${brandProfile.voice?.donts?.join("; ") || "ser genérico"}
- Target audience: ${brandProfile.audience?.segments?.map((s: { name: string }) => s.name).join(", ") || "profesionales"}
`
      : "";

    const systemPrompt = `You are an expert content creator for a marketing department. Create high-quality, publish-ready content following the template instructions below.

${brandContext}

IMPORTANT RULES:
- Write in Spanish (Latin American) unless instructed otherwise
- Follow the brand voice and tone closely
- Make content actionable and engaging
- Do NOT include meta-commentary or instructions in the output
- Output ONLY the final content, ready to publish`;

    const userMessage = `${prompt}

${args.variables.customInstructions ? `\nADDITIONAL INSTRUCTIONS: ${args.variables.customInstructions}` : ""}`;

    // 5. Call Claude
    const claudeResult: { content: string; usage: { totalTokens: number } } = await ctx.runAction(api.actions.callClaude, {
      systemPrompt,
      userMessage,
      temperature: 0.7,
      maxTokens: 4096,
    });

    // 6. Create content as draft
    const body: string = claudeResult.content;
    const wordCount: number = body.split(/\s+/).length;

    const contentId: string = await ctx.runMutation(api.functions.createContent, {
      type: template.contentType as any,
      title: `${args.variables.topic}`,
      body,
      summary: `Generado con template "${template.name}" — ${template.description}`,
      metadata: {
        wordCount,
        readingTime: Math.ceil(wordCount / 200),
        tone: args.variables.tone || brandProfile?.voice?.tone?.[0],
        targetAudience: args.variables.audience || brandProfile?.audience?.segments?.[0]?.name,
        cta: args.variables.cta || undefined,
      },
      sourceTemplateId: args.templateId,
      createdBy: "system",
    });

    // Track template usage
    await ctx.runMutation(api.contentTemplates.incrementUsage, {
      templateId: args.templateId,
    });

    return {
      contentId: contentId.toString(),
      body,
      wordCount,
      templateName: template.name,
      tokensUsed: claudeResult.usage.totalTokens,
    };
  },
});
