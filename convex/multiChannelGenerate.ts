import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Channel → Agent mapping
const CHANNEL_AGENT_MAP: Record<string, { agentId: string; taskType: string; contentType: string }> = {
  linkedin: { agentId: "social-001", taskType: "create_linkedin_post", contentType: "social_linkedin" },
  twitter: { agentId: "social-002", taskType: "create_twitter_thread", contentType: "social_twitter" },
  instagram: { agentId: "social-004", taskType: "create_instagram_post", contentType: "social_instagram" },
  tiktok: { agentId: "social-004", taskType: "create_tiktok_script", contentType: "social_tiktok" },
  blog: { agentId: "content-002", taskType: "write_blog", contentType: "blog" },
  email: { agentId: "ops-002", taskType: "write_newsletter", contentType: "newsletter" },
  youtube: { agentId: "social-003", taskType: "write_video_script", contentType: "video_script" },
};

export const generateMultiChannelContent = action({
  args: {
    topic: v.string(),
    channels: v.array(v.string()),
    customInstructions: v.optional(v.string()),
    templateId: v.optional(v.string()),
    templatePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Merge templatePrompt into customInstructions
    const effectiveInstructions = [
      args.templatePrompt,
      args.customInstructions,
    ].filter(Boolean).join("\n\n") || undefined;
    const results: Array<{
      channel: string;
      contentId: string | null;
      success: boolean;
      error?: string;
    }> = [];

    // Execute agents in parallel using Promise.allSettled
    const promises = args.channels.map(async (channel) => {
      const mapping = CHANNEL_AGENT_MAP[channel];
      if (!mapping) {
        return { channel, contentId: null, success: false, error: `Unknown channel: ${channel}` };
      }

      try {
        // Execute the agent
        const result = await ctx.runAction(api.actions.executeAgent, {
          agentId: mapping.agentId,
          taskType: mapping.taskType,
          input: {
            topic: args.topic,
            title: args.topic,
            customInstructions: effectiveInstructions,
            tone: "profesional pero cercano",
          },
        });

        // Create content from agent output
        const contentId = await ctx.runMutation(api.functions.createContent, {
          type: mapping.contentType as any,
          title: `[${channel.toUpperCase()}] ${args.topic}`,
          body: result.output,
          summary: `Contenido generado automáticamente para ${channel} sobre: ${args.topic}`,
          metadata: {
            wordCount: result.output.split(/\s+/).length,
            readingTime: Math.ceil(result.output.split(/\s+/).length / 200),
          },
          createdBy: "system",
          ...(args.templateId ? { sourceTemplateId: args.templateId } : {}),
        });

        return {
          channel,
          contentId: contentId.toString(),
          success: true,
        };
      } catch (error: any) {
        return {
          channel,
          contentId: null,
          success: false,
          error: error.message || "Agent execution failed",
        };
      }
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          channel: "unknown",
          contentId: null,
          success: false,
          error: result.reason?.message || "Promise rejected",
        });
      }
    }

    // Track template usage
    if (args.templateId) {
      try {
        await ctx.runMutation(api.contentTemplates.incrementUsage, {
          templateId: args.templateId,
        });
      } catch {
        // Non-critical, don't fail the generation
      }
    }

    return {
      topic: args.topic,
      totalChannels: args.channels.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});
