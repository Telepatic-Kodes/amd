"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const AUDIT_SYSTEM_PROMPT = `You are a senior digital brand strategist. Analyze the provided brand data (Instagram profile, website content, and brand profile context) and produce a comprehensive brand audit.

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "metrics": {
    "followers": "formatted number string, e.g. '43.2K'",
    "following": "formatted number string",
    "posts": "formatted number string",
    "engagementNote": "brief note about follower/following ratio or engagement quality"
  },
  "strengths": [
    {
      "title": "short title in Spanish",
      "description": "1-2 sentence explanation in Spanish",
      "icon": "one of: identity, storytelling, product, ugc, community, visual, consistency, niche"
    }
  ],
  "weaknesses": [
    {
      "title": "short title in Spanish",
      "description": "1-2 sentence explanation in Spanish",
      "icon": "one of: frequency, following, cta, hashtags, engagement, bio, content_mix, analytics"
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
  "summary": "2-3 sentence executive summary in Spanish"
}

Guidelines:
- Provide 4-6 strengths and 4-6 weaknesses
- Provide 6-10 action items across all priority levels
- If metrics data is missing or couldn't be scraped, use "N/A" for that metric
- Base analysis on REAL data provided, don't invent metrics
- Be specific and actionable, referencing actual content from the scrape
- All text content should be in Spanish`;

async function callClaudeForAudit(
  brandContext: string,
  rawContent: string
): Promise<{ parsed: Record<string, unknown>; tokensUsed: number; cost: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const userMessage = `=== BRAND PROFILE CONTEXT ===\n${brandContext}\n\n=== SCRAPED DATA ===\n${rawContent.substring(0, 15000)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.4,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${errorText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  if (!data.content?.[0]?.text) {
    throw new Error("Claude API returned empty or invalid response");
  }
  const raw: string = data.content[0].text;
  const tokensUsed: number = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  const cost: number = ((data.usage?.input_tokens || 0) * 3 + (data.usage?.output_tokens || 0) * 15) / 1_000_000;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
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

    const brandContext = [
      `Company: ${profile.companyName}`,
      `Industry: ${profile.industry}`,
      profile.website ? `Website: ${profile.website}` : "",
      `Description: ${profile.description}`,
      `Voice tone: ${profile.voice.tone.join(", ")}`,
      `Channels: ${profile.strategy.channels.join(", ")}`,
      `Topics: ${profile.strategy.topics.join(", ")}`,
      profile.competitors.length > 0 ? `Competitors: ${competitorNames}` : "",
    ].filter(Boolean).join("\n");

    const { parsed, tokensUsed, cost } = await callClaudeForAudit(
      brandContext,
      args.rawContent
    );

    // Validate and normalize fields
    const metrics = parsed.metrics as Record<string, string> | undefined;
    const strengths = parsed.strengths as Array<{ title: string; description: string; icon: string }> | undefined;
    const weaknesses = parsed.weaknesses as Array<{ title: string; description: string; icon: string }> | undefined;
    const actionPlan = parsed.actionPlan as Array<{ priority: string; title: string; description: string; timeframe: string }> | undefined;

    const validPriorities = ["immediate", "short", "medium", "long"] as const;
    type Priority = typeof validPriorities[number];

    const auditId = await ctx.runMutation(internal.brandAudit._saveAudit, {
      brandProfileId: args.brandProfileId,
      instagramHandle: args.instagramHandle,
      websiteUrl: args.websiteUrl,
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
