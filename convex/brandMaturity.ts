import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// ===========================================
// TYPES
// ===========================================

interface SectionScore {
  name: string;
  score: number;
  weight: number;
  weighted: number;
}

interface MaturityResult {
  score: number;
  level: "empty" | "partial" | "complete" | "enriched";
  breakdown: SectionScore[];
  missingAreas: string[];
}

// ===========================================
// SCORING FUNCTIONS (pure, no AI)
// ===========================================

function scoreBasics(profile: Doc<"brandProfiles">): number {
  let score = 0;
  if (profile.companyName?.trim()) score += 25;
  if (profile.industry?.trim()) score += 25;
  if (profile.description && profile.description.length > 50) score += 25;
  if (profile.website?.trim()) score += 25;
  return score;
}

function scoreVoice(voice: Doc<"brandProfiles">["voice"]): number {
  let score = 0;
  if (voice.tone.length >= 2) score += 30;
  else if (voice.tone.length >= 1) score += 15;
  if (voice.personality.length >= 2) score += 25;
  else if (voice.personality.length >= 1) score += 12;
  if (voice.dos.length >= 2) score += 25;
  else if (voice.dos.length >= 1) score += 12;
  if (voice.donts.length >= 1) score += 20;
  return score;
}

function scoreAudience(audience: Doc<"brandProfiles">["audience"]): number {
  let score = 0;
  const segments = audience.segments;
  if (segments.length >= 1) score += 25;
  if (segments.length >= 2) score += 15;
  const hasDemographics = segments.some((s) => s.demographics?.trim());
  if (hasDemographics) score += 20;
  const totalPainPoints = segments.reduce((sum, s) => sum + s.painPoints.length, 0);
  if (totalPainPoints >= 2) score += 25;
  else if (totalPainPoints >= 1) score += 12;
  if (segments.length >= 2 && totalPainPoints >= 3) score += 15;
  return Math.min(100, score);
}

function scoreStrategy(strategy: Doc<"brandProfiles">["strategy"]): number {
  let score = 0;
  if (strategy.topics.length >= 3) score += 40;
  else if (strategy.topics.length >= 1) score += 20;
  if (strategy.channels.length >= 2) score += 30;
  else if (strategy.channels.length >= 1) score += 15;
  if (strategy.postingFrequency?.trim()) score += 30;
  return score;
}

function scoreCompetitors(competitors: Doc<"brandProfiles">["competitors"]): number {
  let score = 0;
  if (competitors.length >= 1) score += 30;
  if (competitors.length >= 3) score += 20;
  const hasUrls = competitors.some((c) => c.url?.trim());
  if (hasUrls) score += 25;
  const hasNotes = competitors.some((c) => c.notes?.trim());
  if (hasNotes) score += 25;
  return score;
}

function scoreVisual(visual: Doc<"brandProfiles">["visual"]): number {
  if (!visual) return 0;
  let score = 0;
  if (visual.primaryColor?.trim()) score += 30;
  if (visual.secondaryColor?.trim()) score += 20;
  if (visual.logoDescription?.trim()) score += 25;
  if (visual.styleNotes?.trim()) score += 25;
  return score;
}

function scoreSources(activeSources: number): number {
  return Math.min(100, activeSources * 25);
}

function getLevel(score: number): "empty" | "partial" | "complete" | "enriched" {
  if (score >= 80) return "enriched";
  if (score >= 60) return "complete";
  if (score >= 30) return "partial";
  return "empty";
}

// ===========================================
// QUERY
// ===========================================

export const computeBrandMaturity = query({
  handler: async (ctx): Promise<MaturityResult | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject;
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    // Count active sources
    const sources = await ctx.db
      .query("brandSources")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", profile._id))
      .collect();
    const activeSources = sources.filter((s) => s.status === "active").length;

    // Score each section
    const basicsScore = scoreBasics(profile);
    const voiceScore = scoreVoice(profile.voice);
    const audienceScore = scoreAudience(profile.audience);
    const strategyScore = scoreStrategy(profile.strategy);
    const competitorsScore = scoreCompetitors(profile.competitors);
    const visualScore = scoreVisual(profile.visual);
    const sourcesScore = scoreSources(activeSources);

    // Weighted breakdown
    const breakdown: SectionScore[] = [
      { name: "basics", score: basicsScore, weight: 0.15, weighted: basicsScore * 0.15 },
      { name: "voice", score: voiceScore, weight: 0.20, weighted: voiceScore * 0.20 },
      { name: "audience", score: audienceScore, weight: 0.20, weighted: audienceScore * 0.20 },
      { name: "strategy", score: strategyScore, weight: 0.20, weighted: strategyScore * 0.20 },
      { name: "competitors", score: competitorsScore, weight: 0.10, weighted: competitorsScore * 0.10 },
      { name: "visual", score: visualScore, weight: 0.05, weighted: visualScore * 0.05 },
      { name: "sources", score: sourcesScore, weight: 0.10, weighted: sourcesScore * 0.10 },
    ];

    const totalScore = Math.round(breakdown.reduce((sum, s) => sum + s.weighted, 0));

    // Missing areas
    const missingAreas: string[] = [];
    if (basicsScore < 75) missingAreas.push("basics");
    if (voiceScore < 50) missingAreas.push("voice");
    if (audienceScore < 50) missingAreas.push("audience");
    if (strategyScore < 50) missingAreas.push("strategy");
    if (competitorsScore < 30) missingAreas.push("competitors");
    if (visualScore < 25) missingAreas.push("visual");
    if (sourcesScore < 25) missingAreas.push("sources");

    return {
      score: totalScore,
      level: getLevel(totalScore),
      breakdown,
      missingAreas,
    };
  },
});
