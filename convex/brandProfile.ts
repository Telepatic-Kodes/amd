import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getUserId } from "./lib/auth";

// Simple hash function (no Node crypto needed)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function shortId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===========================================
// QUERIES
// ===========================================

export const getBrandProfile = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

export const getBrandProfileById = query({
  args: { id: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * getAllBrandProfiles - Returns all brand profiles for the current user.
 * Used by BrandSwitcher to list available clients/brands.
 */
export const getAllBrandProfiles = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Also include legacy profiles without userId (for backward compat)
    const legacyProfiles = await ctx.db
      .query("brandProfiles")
      .collect();
    const legacyWithoutUser = legacyProfiles.filter(
      (p) => !p.userId && !profiles.some((up) => up._id === p._id)
    );

    return [...profiles, ...legacyWithoutUser].map((p) => ({
      _id: p._id,
      companyName: p.companyName,
      industry: p.industry,
      description: p.description,
      maturityScore: p.maturityScore,
      maturityLevel: p.maturityLevel,
      status: p.status,
      visual: p.visual,
    }));
  },
});

// ===========================================
// B2: VERSION HISTORY QUERIES & MUTATIONS
// ===========================================

// B2: Get version history for a brand profile
export const getBrandProfileVersions = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("brandProfileVersions")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    return versions.sort((a, b) => b.version - a.version);
  },
});

// B2: Rollback to a specific version
export const rollbackBrandProfile = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    targetVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    const profile = await ctx.db.get(args.brandProfileId);
    if (!profile) throw new Error("Brand profile not found");

    // Find the target version
    const versions = await ctx.db
      .query("brandProfileVersions")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    const targetVersionDoc = versions.find((ver) => ver.version === args.targetVersion);
    if (!targetVersionDoc) throw new Error("Version not found");

    // Snapshot current state before rollback
    const nextVersion = versions.length + 1;
    await ctx.db.insert("brandProfileVersions", {
      brandProfileId: args.brandProfileId,
      version: nextVersion,
      snapshot: {
        companyName: profile.companyName,
        industry: profile.industry,
        website: profile.website,
        description: profile.description,
        voice: profile.voice,
        audience: profile.audience,
        strategy: profile.strategy,
        competitors: profile.competitors,
        references: profile.references,
        visual: profile.visual,
        messaging: profile.messaging,
        positioning: profile.positioning,
      },
      editedBy: userId,
      changeType: "rollback",
      changeSummary: `Rollback a versión ${args.targetVersion}`,
      createdAt: now,
    });

    // Restore the snapshot
    const snapshot = targetVersionDoc.snapshot as Record<string, unknown>;
    await ctx.db.patch(args.brandProfileId, {
      ...snapshot,
      updatedAt: now,
    });

    return { rolledBackTo: args.targetVersion };
  },
});

// ===========================================
// MUTATIONS
// ===========================================

// Shared brand profile args validator (reused by save and create mutations)
const brandProfileArgs = {
  companyName: v.string(),
  industry: v.string(),
  website: v.optional(v.string()),
  description: v.string(),
  voice: v.object({
    tone: v.array(v.string()),
    personality: v.array(v.string()),
    dos: v.array(v.string()),
    donts: v.array(v.string()),
  }),
  audience: v.object({
    segments: v.array(
      v.object({
        name: v.string(),
        demographics: v.optional(v.string()),
        painPoints: v.array(v.string()),
      })
    ),
  }),
  strategy: v.object({
    topics: v.array(v.string()),
    channels: v.array(v.string()),
    postingFrequency: v.optional(v.string()),
  }),
  competitors: v.array(
    v.object({
      name: v.string(),
      url: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
  ),
  references: v.optional(v.array(v.string())),
  visual: v.optional(
    v.object({
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      logoDescription: v.optional(v.string()),
      logoStorageId: v.optional(v.id("_storage")),
      fontPrimary: v.optional(v.string()),
      fontSecondary: v.optional(v.string()),
      styleNotes: v.optional(v.string()),
    })
  ),
  messaging: v.optional(
    v.object({
      guide: v.optional(v.string()),
      problem: v.optional(v.string()),
      solution: v.optional(v.string()),
      successVision: v.optional(v.string()),
      failureVision: v.optional(v.string()),
      callToAction: v.optional(v.string()),
    })
  ),
  positioning: v.optional(
    v.object({
      uniqueValue: v.optional(v.string()),
      category: v.optional(v.string()),
      differentiators: v.optional(v.array(v.string())),
      proofPoints: v.optional(v.array(v.string())),
    })
  ),
};

export const saveBrandProfile = mutation({
  args: brandProfileArgs,
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    // Check for existing profile (upsert)
    const existing = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // B2: Create version snapshot before overwriting
      const existingVersions = await ctx.db
        .query("brandProfileVersions")
        .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", existing._id))
        .collect();
      const nextVersion = existingVersions.length + 1;

      await ctx.db.insert("brandProfileVersions", {
        brandProfileId: existing._id,
        version: nextVersion,
        snapshot: {
          companyName: existing.companyName,
          industry: existing.industry,
          website: existing.website,
          description: existing.description,
          voice: existing.voice,
          audience: existing.audience,
          strategy: existing.strategy,
          competitors: existing.competitors,
          references: existing.references,
          visual: existing.visual,
          messaging: existing.messaging,
          positioning: existing.positioning,
        },
        editedBy: userId,
        changeType: "edited",
        changeSummary: `Perfil actualizado`,
        createdAt: now,
      });

      await ctx.db.patch(existing._id, {
        ...args,
        status: "complete" as const,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("brandProfiles", {
      userId,
      ...args,
      status: "complete",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * createNewBrandProfile — Always creates a NEW brand profile (no upsert).
 * Used when adding additional brands from the Brand Switcher.
 */
export const createNewBrandProfile = mutation({
  args: brandProfileArgs,
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    return await ctx.db.insert("brandProfiles", {
      userId,
      ...args,
      status: "complete",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ===========================================
// INTERNAL MUTATIONS (AI-generated messaging/positioning)
// ===========================================

export const _updateMessaging = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    messaging: v.object({
      guide: v.optional(v.string()),
      problem: v.optional(v.string()),
      solution: v.optional(v.string()),
      successVision: v.optional(v.string()),
      failureVision: v.optional(v.string()),
      callToAction: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.brandProfileId, {
      messaging: args.messaging,
      updatedAt: Date.now(),
    });
  },
});

export const _updatePositioning = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    positioning: v.object({
      uniqueValue: v.optional(v.string()),
      category: v.optional(v.string()),
      differentiators: v.optional(v.array(v.string())),
      proofPoints: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.brandProfileId, {
      positioning: args.positioning,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// INTERNAL FUNCTIONS (used by syncBrandToKB)
// ===========================================

export const _getFirstBrandProfile = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("brandProfiles").first();
  },
});

export const _getBrandProfileById = internalQuery({
  args: { id: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * linkUserToProfile — Links the current authenticated user to an existing brand profile.
 * Used to fix legacy profiles that were created without a userId.
 */
export const linkUserToProfile = mutation({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db.get(args.brandProfileId);
    if (!profile) throw new Error("Brand profile not found");
    await ctx.db.patch(args.brandProfileId, {
      userId,
      updatedAt: Date.now(),
    });
    return { linked: true, userId };
  },
});

export const _deleteKBSectionsForKB = internalMutation({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const sections = await ctx.db
      .query("kbSections")
      .withIndex("by_kbId", (q) => q.eq("kbId", args.kbId))
      .collect();

    for (const section of sections) {
      await ctx.db.delete(section._id);
    }

    return sections.length;
  },
});

export const _deleteKBDocumentsForKB = internalMutation({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("kbDocuments")
      .withIndex("by_kbId", (q) => q.eq("kbId", args.kbId))
      .collect();

    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    return docs.length;
  },
});

export const _createBrandDocument = internalMutation({
  args: { kbId: v.id("knowledgeBases") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kbDocuments", {
      documentId: `brand-doc-${shortId()}`,
      kbId: args.kbId,
      name: "Brand Profile (Auto-generated)",
      sourceType: "upload",
      status: "processed",
      metadata: {},
      createdAt: Date.now(),
      processedAt: Date.now(),
    });
  },
});

export const _linkKBToProfile = internalMutation({
  args: {
    profileId: v.id("brandProfiles"),
    kbId: v.id("knowledgeBases"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      kbId: args.kbId,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const syncBrandToKB = action({
  args: {
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args): Promise<{ kbId: Id<"knowledgeBases">; sectionsCreated: number }> => {
    // 1. Read brand profile
    const profile = await ctx.runQuery(internal.brandProfile._getBrandProfileById, {
      id: args.brandProfileId,
    }) as Record<string, unknown> | null;

    if (!profile) {
      throw new Error("Brand profile not found");
    }

    let kbId: Id<"knowledgeBases">;
    let documentId: Id<"kbDocuments">;

    // 2. If kbId exists, delete existing sections and document, then recreate
    if (profile.kbId) {
      kbId = profile.kbId as Id<"knowledgeBases">;

      // Delete existing sections for this KB
      await ctx.runMutation(internal.brandProfile._deleteKBSectionsForKB, {
        kbId,
      });

      // Delete existing brand document
      await ctx.runMutation(internal.brandProfile._deleteKBDocumentsForKB, {
        kbId,
      });

      // Create new virtual document for brand sections
      documentId = await ctx.runMutation(internal.brandProfile._createBrandDocument, {
        kbId,
      });
    } else {
      // 3. Create new KB
      kbId = await ctx.runMutation(api.kb.mutations.createKnowledgeBase, {
        name: `${profile.companyName} — Brand Identity`,
        description: `Brand profile and guidelines for ${profile.companyName}`,
        category: "brand",
        visibility: ["all"],
      });

      // Create virtual document for brand sections
      documentId = await ctx.runMutation(internal.brandProfile._createBrandDocument, {
        kbId,
      });

      // Link KB to brand profile
      await ctx.runMutation(internal.brandProfile._linkKBToProfile, {
        profileId: args.brandProfileId,
        kbId,
      });
    }

    // 4. Create 6 KB sections from brand data
    const sections = buildBrandSections(profile);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const contentHash = simpleHash(section.content);

      await ctx.runMutation(api.kb.mutations.createKBSection, {
        sectionId: `brand-section-${shortId()}`,
        kbId,
        documentId,
        title: section.title,
        content: section.content,
        contentHash,
        order: i,
        metadata: {
          wordCount: section.content.split(/\s+/).length,
        },
      });
    }

    // 5. Update KB metadata to active
    await ctx.runMutation(api.kb.mutations.updateKBMetadata, {
      kbId,
      documentCount: 1,
      totalSizeBytes: sections.reduce((sum, s) => sum + s.content.length, 0),
      status: "active",
    });

    return { kbId, sectionsCreated: sections.length };
  },
});

export const generateMessagingDraft = action({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.runQuery(internal.brandProfile._getBrandProfileById, {
      id: args.brandProfileId,
    }) as Record<string, unknown> | null;

    if (!profile) throw new Error("Brand profile not found");

    const voice = profile.voice as { tone: string[]; personality: string[] };
    const audience = profile.audience as { segments: Array<{ name: string; painPoints: string[] }> };
    const strategy = profile.strategy as { topics: string[] };

    const audienceStr = audience.segments
      .map((s: { name: string; painPoints: string[] }) => s.name + " (dolor: " + s.painPoints.join(", ") + ")")
      .join("; ");

    const prompt = `Eres un experto en StoryBrand Framework de Donald Miller. Basándote en esta información de marca, genera el messaging framework completo.

Empresa: ${profile.companyName}
Industria: ${profile.industry}
Descripción: ${profile.description}
Tono de voz: ${voice.tone.join(", ")}
Personalidad: ${voice.personality.join(", ")}
Audiencia: ${audienceStr}
Temas clave: ${strategy.topics.join(", ")}

Genera un JSON con esta estructura exacta (en español):
{
  "guide": "La marca como guía - quién es y por qué puede ayudar (1-2 oraciones)",
  "problem": "El problema principal del cliente - externo, interno y filosófico (2-3 oraciones)",
  "solution": "La solución que ofrece la marca (1-2 oraciones)",
  "successVision": "Cómo se ve el éxito para el cliente (1-2 oraciones)",
  "failureVision": "Qué pasa si no actúan (1-2 oraciones)",
  "callToAction": "El call to action principal (frase corta y directa)"
}

Responde ÚNICAMENTE con JSON válido, sin markdown.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    const content = data.content[0].text;

    // Parse the JSON response — strip markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const messaging: {
      guide: string;
      problem: string;
      solution: string;
      successVision: string;
      failureVision: string;
      callToAction: string;
    } = JSON.parse(cleaned);

    // Return the draft (don't auto-save — let user review first)
    return messaging;
  },
});

export const generatePositioningDraft = action({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.runQuery(internal.brandProfile._getBrandProfileById, {
      id: args.brandProfileId,
    }) as Record<string, unknown> | null;

    if (!profile) throw new Error("Brand profile not found");

    const audience = profile.audience as { segments: Array<{ name: string; painPoints: string[] }> };
    const competitors = profile.competitors as Array<{ name: string; url?: string; notes?: string }>;
    const messaging = profile.messaging as Record<string, string> | undefined;

    const audienceNames = audience.segments.map((s: { name: string }) => s.name).join(", ");
    const competitorNames = competitors.map((c: { name: string }) => c.name).join(", ") || "No definidos";
    const solutionLine = messaging?.solution ? "Solución: " + messaging.solution : "";

    const prompt = `Eres un experto en posicionamiento de marca (April Dunford framework). Basándote en esta información, genera el posicionamiento estratégico.

Empresa: ${profile.companyName}
Industria: ${profile.industry}
Descripción: ${profile.description}
Audiencia: ${audienceNames}
Competidores: ${competitorNames}
${solutionLine}

Genera un JSON con esta estructura exacta (en español):
{
  "uniqueValue": "Propuesta de valor única en 1-2 oraciones",
  "category": "Categoría de mercado donde compite la marca",
  "differentiators": ["Diferenciador 1", "Diferenciador 2", "Diferenciador 3"],
  "proofPoints": ["Evidencia 1", "Evidencia 2", "Evidencia 3"]
}

Responde ÚNICAMENTE con JSON válido, sin markdown.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    const content = data.content[0].text;

    // Parse the JSON response — strip markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const positioning: {
      uniqueValue: string;
      category: string;
      differentiators: string[];
      proofPoints: string[];
    } = JSON.parse(cleaned);

    return positioning;
  },
});

// ===========================================
// SECTION BUILDERS
// ===========================================

function buildBrandSections(profile: Record<string, unknown>) {
  const voice = profile.voice as { tone: string[]; personality: string[]; dos: string[]; donts: string[] };
  const audience = profile.audience as { segments: Array<{ name: string; demographics?: string; painPoints: string[] }> };
  const strategy = profile.strategy as { topics: string[]; channels: string[]; postingFrequency?: string };
  const competitors = profile.competitors as Array<{ name: string; url?: string; notes?: string }>;
  const references = profile.references as string[] | undefined;
  const visual = profile.visual as { primaryColor?: string; secondaryColor?: string; accentColor?: string; backgroundColor?: string; textColor?: string; logoDescription?: string; fontPrimary?: string; fontSecondary?: string; styleNotes?: string } | undefined;
  const messaging = profile.messaging as { guide?: string; problem?: string; solution?: string; successVision?: string; failureVision?: string; callToAction?: string } | undefined;
  const positioning = profile.positioning as { uniqueValue?: string; category?: string; differentiators?: string[]; proofPoints?: string[] } | undefined;

  return [
    {
      title: "Brand Identity",
      content: `# ${profile.companyName} — Brand Identity

Industry: ${profile.industry}
${profile.website ? `Website: ${profile.website}` : ""}

## Description
${profile.description}

This is the core identity of ${profile.companyName}. All content should reflect this identity and positioning.`,
    },
    {
      title: "Brand Voice & Tone",
      content: `# Brand Voice & Tone — ${profile.companyName}

## Tone
${voice.tone.map((t: string) => `- ${t}`).join("\n")}

## Personality Traits
${voice.personality.map((p: string) => `- ${p}`).join("\n")}

## Do's (Always follow)
${voice.dos.map((d: string) => `✓ ${d}`).join("\n")}

## Don'ts (Never do)
${voice.donts.map((d: string) => `✗ ${d}`).join("\n")}

Always maintain this voice across ALL content channels and formats.`,
    },
    {
      title: "Target Audience",
      content: `# Target Audience — ${profile.companyName}

${audience.segments
  .map(
    (s) =>
      `## Segment: ${s.name}
${s.demographics ? `Demographics: ${s.demographics}` : ""}
Pain Points:
${s.painPoints.map((p: string) => `- ${p}`).join("\n")}`
  )
  .join("\n\n")}

When creating content, always consider which audience segment(s) the piece targets and address their specific pain points.`,
    },
    {
      title: "Content Strategy",
      content: `# Content Strategy — ${profile.companyName}

## Core Topics
${strategy.topics.map((t: string) => `- ${t}`).join("\n")}

## Active Channels
${strategy.channels.map((c: string) => `- ${c}`).join("\n")}

${strategy.postingFrequency ? `## Posting Frequency\n${strategy.postingFrequency}` : ""}

Focus content on these topics and optimize for the specified channels.`,
    },
    {
      title: "Competitive Landscape",
      content: `# Competitive Landscape — ${profile.companyName}

## Competitors
${competitors
  .map(
    (c) =>
      `### ${c.name}
${c.url ? `URL: ${c.url}` : ""}
${c.notes ? `Notes: ${c.notes}` : ""}`
  )
  .join("\n\n")}

${references && references.length > 0 ? `## Reference URLs\n${references.map((r: string) => `- ${r}`).join("\n")}` : ""}

Use competitive intelligence to differentiate our content and positioning.`,
    },
    {
      title: "Visual Identity",
      content: `# Visual Identity — ${profile.companyName}

## Color Palette
${visual?.primaryColor ? `Primary Color: ${visual.primaryColor}` : ""}
${visual?.secondaryColor ? `Secondary Color: ${visual.secondaryColor}` : ""}
${visual?.accentColor ? `Accent Color: ${visual.accentColor}` : ""}
${visual?.backgroundColor ? `Background Color: ${visual.backgroundColor}` : ""}
${visual?.textColor ? `Text Color: ${visual.textColor}` : ""}

## Typography
${visual?.fontPrimary ? `Primary Font: ${visual.fontPrimary}` : ""}
${visual?.fontSecondary ? `Secondary Font: ${visual.fontSecondary}` : ""}

## Logo
${visual?.logoDescription ? `Description: ${visual.logoDescription}` : "No logo description provided"}

${visual?.styleNotes ? `## Style Notes\n${visual.styleNotes}` : ""}

Apply these visual guidelines when creating content that includes design elements or visual descriptions. Use the primary color for headlines and key branding, accent color for CTAs and highlights, and ensure text maintains readability against the background color.`,
    },
    // Section 7: StoryBrand Messaging
    ...(messaging && (messaging.guide || messaging.problem || messaging.solution)
      ? [
          {
            title: "StoryBrand Messaging",
            content: `# StoryBrand Messaging — ${profile.companyName}

## The Guide (Our Brand)
${messaging.guide || "Not defined yet"}

## The Problem (Customer's Challenge)
${messaging.problem || "Not defined yet"}

## The Solution (What We Offer)
${messaging.solution || "Not defined yet"}

## Success Vision (What Happens When They Win)
${messaging.successVision || "Not defined yet"}

## Failure Vision (What Happens If They Don't Act)
${messaging.failureVision || "Not defined yet"}

## Call to Action
${messaging.callToAction || "Not defined yet"}

Use this messaging framework in ALL content. Position the customer as the hero and our brand as the guide. Address their problem, show the solution, paint the success vision, and always include a clear CTA.`,
          },
        ]
      : []),
    // Section 8: Brand Positioning
    ...(positioning && (positioning.uniqueValue || positioning.category)
      ? [
          {
            title: "Brand Positioning",
            content: `# Brand Positioning — ${profile.companyName}

## Unique Value Proposition
${positioning.uniqueValue || "Not defined yet"}

## Market Category
${positioning.category || "Not defined yet"}

## Key Differentiators
${positioning.differentiators?.map((d: string) => `- ${d}`).join("\n") || "None defined"}

## Proof Points
${positioning.proofPoints?.map((p: string) => `- ${p}`).join("\n") || "None defined"}

Use this positioning to differentiate our content from competitors. Every piece should reinforce our unique value and back it up with proof points.`,
          },
        ]
      : []),
  ];
}
