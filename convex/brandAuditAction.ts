"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { callLLM } from "./lib/llm";

const AUDIT_SYSTEM_PROMPT = `You are a senior digital brand strategist. Analyze the provided brand data across multiple platforms (Instagram, LinkedIn, Twitter/X, Website, and more) and produce a comprehensive multi-platform brand audit.

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "metrics": {
    "followers": "total combined followers formatted, e.g. '43.2K'",
    "following": "total combined following formatted",
    "posts": "total combined posts formatted",
    "engagementNote": "brief note about overall engagement quality across platforms"
  },
  "platformMetrics": {
    "instagram": {
      "followers": "N/A or formatted number",
      "following": "N/A or formatted number",
      "posts": "N/A or formatted number",
      "engagementNote": "platform-specific engagement note",
      "score": 0-100,
      "highlights": ["key finding 1", "key finding 2"]
    },
    "linkedin": {
      "followers": "N/A or formatted number",
      "connections": "N/A or formatted number",
      "posts": "N/A or formatted number",
      "engagementNote": "platform-specific engagement note",
      "score": 0-100,
      "highlights": ["key finding 1", "key finding 2"]
    },
    "twitter": {
      "followers": "N/A or formatted number",
      "following": "N/A or formatted number",
      "tweets": "N/A or formatted number",
      "engagementNote": "platform-specific engagement note",
      "score": 0-100,
      "highlights": ["key finding 1", "key finding 2"]
    },
    "website": {
      "score": 0-100,
      "highlights": ["key finding 1", "key finding 2"]
    }
  },
  "strengths": [
    {
      "title": "short title in Spanish",
      "description": "1-2 sentence explanation in Spanish, mentioning specific platform when relevant",
      "icon": "one of: identity, storytelling, product, ugc, community, visual, consistency, niche, linkedin, twitter, cross_platform"
    }
  ],
  "weaknesses": [
    {
      "title": "short title in Spanish",
      "description": "1-2 sentence explanation in Spanish, mentioning specific platform when relevant",
      "icon": "one of: frequency, following, cta, hashtags, engagement, bio, content_mix, analytics, linkedin, twitter, cross_platform"
    }
  ],
  "actionPlan": [
    {
      "priority": "immediate | short | medium | long",
      "title": "action title in Spanish",
      "description": "1-2 sentence explanation in Spanish",
      "timeframe": "e.g. 'Esta semana', '2-4 semanas', '1-3 meses', '3-6 meses'"
    }
  ],
  "summary": "2-3 sentence executive summary in Spanish covering ALL audited platforms"
}

Guidelines:
- Provide 4-6 strengths and 4-6 weaknesses
- Provide 6-10 action items across all priority levels
- Only include platformMetrics entries for platforms that were actually audited (provided in the data)
- If metrics data is missing or couldn't be scraped, use "N/A" for that metric
- Base analysis on REAL data provided, don't invent metrics
- Be specific and actionable, referencing actual content from the scrape
- Analyze cross-platform consistency (brand voice, visual identity, messaging alignment)
- All text content should be in Spanish
- Score each platform from 0-100 based on presence quality`;

async function callClaudeForAudit(
  brandContext: string,
  rawContent: string
): Promise<{ parsed: Record<string, unknown>; tokensUsed: number; cost: number }> {
  const userMessage = `=== BRAND PROFILE CONTEXT ===\n${brandContext}\n\n=== SCRAPED DATA ===\n${rawContent.substring(0, 15000)}`;

  const result = await callLLM({
    system: AUDIT_SYSTEM_PROMPT,
    user: userMessage,
    model: "claude-sonnet-4-20250514", // maps to gpt-4o
    maxTokens: 4096,
    temperature: 0.4,
    jsonMode: true,
  });

  const tokensUsed = result.usage.totalTokens;
  // gpt-4o pricing: $2.50 input / $10 output per MTok
  const cost =
    (result.usage.inputTokens * 2.5 + result.usage.outputTokens * 10) /
    1_000_000;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    const match = result.content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Could not parse audit from AI response");
    }
  }

  return { parsed, tokensUsed, cost };
}

export const analyze = action({
  args: {
    brandProfileId: v.id("brandProfiles"),
    rawContent: v.string(),
    instagramHandle: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    // B6: Multi-platform handles
    linkedinHandle: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ auditId: string; tokensUsed: number; cost: number }> => {
    // Get brand profile for context
    const profile = await ctx.runQuery(internal.brandAudit._getBrandProfile, {
      id: args.brandProfileId,
    });

    if (!profile) {
      throw new Error("Brand profile not found");
    }

    // Build context from brand profile
    const competitorNames = profile.competitors.map(
      (c: { name: string }) => c.name
    ).join(", ");

    // B6: Build list of platforms being audited
    const platforms: string[] = [];
    if (args.instagramHandle) platforms.push("instagram");
    if (args.linkedinHandle) platforms.push("linkedin");
    if (args.twitterHandle) platforms.push("twitter");
    if (args.websiteUrl) platforms.push("website");

    const brandContext = [
      `Company: ${profile.companyName}`,
      `Industry: ${profile.industry}`,
      profile.website ? `Website: ${profile.website}` : "",
      `Description: ${profile.description}`,
      `Voice tone: ${profile.voice.tone.join(", ")}`,
      `Channels: ${profile.strategy.channels.join(", ")}`,
      `Topics: ${profile.strategy.topics.join(", ")}`,
      profile.competitors.length > 0 ? `Competitors: ${competitorNames}` : "",
      `\nPlatforms being audited: ${platforms.join(", ")}`,
      args.instagramHandle ? `Instagram Handle: @${args.instagramHandle}` : "",
      args.linkedinHandle ? `LinkedIn: ${args.linkedinHandle}` : "",
      args.twitterHandle ? `Twitter/X: @${args.twitterHandle}` : "",
    ].filter(Boolean).join("\n");

    const { parsed, tokensUsed, cost } = await callClaudeForAudit(
      brandContext,
      args.rawContent
    );

    // Validate and normalize fields
    const metrics = parsed.metrics as Record<string, string> | undefined;
    const platformMetrics = parsed.platformMetrics as Record<string, unknown> | undefined;
    const strengths = parsed.strengths as Array<{ title: string; description: string; icon: string }> | undefined;
    const weaknesses = parsed.weaknesses as Array<{ title: string; description: string; icon: string }> | undefined;
    const actionPlan = parsed.actionPlan as Array<{ priority: string; title: string; description: string; timeframe: string }> | undefined;

    const validPriorities = ["immediate", "short", "medium", "long"] as const;
    type Priority = typeof validPriorities[number];

    const auditId = await ctx.runMutation(internal.brandAudit._saveAudit, {
      brandProfileId: args.brandProfileId,
      instagramHandle: args.instagramHandle,
      websiteUrl: args.websiteUrl,
      // B6: Multi-platform fields
      linkedinHandle: args.linkedinHandle,
      twitterHandle: args.twitterHandle,
      platforms: platforms.length > 0 ? platforms : undefined,
      platformMetrics: platformMetrics || undefined,
      metrics: {
        followers: metrics?.followers || "N/A",
        following: metrics?.following || "N/A",
        posts: metrics?.posts || "N/A",
        engagementNote: metrics?.engagementNote || "Sin datos suficientes",
      },
      strengths: (strengths || []).map((s: { title: string; description: string; icon: string }) => ({
        title: s.title || "Fortaleza",
        description: s.description || "",
        icon: s.icon || "identity",
      })),
      weaknesses: (weaknesses || []).map((w: { title: string; description: string; icon: string }) => ({
        title: w.title || "Debilidad",
        description: w.description || "",
        icon: w.icon || "frequency",
      })),
      actionPlan: (actionPlan || []).map((a: { priority: string; title: string; description: string; timeframe: string }) => ({
        priority: (validPriorities.includes(a.priority as Priority) ? a.priority : "medium") as Priority,
        title: a.title || "Accion",
        description: a.description || "",
        timeframe: a.timeframe || "Por definir",
      })),
      summary: (parsed.summary as string) || "Auditoria completada.",
      rawContent: args.rawContent.substring(0, 5000),
      tokensUsed,
      cost,
    });

    return { auditId, tokensUsed, cost };
  },
});
