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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject;
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

// ===========================================
// MUTATIONS
// ===========================================

export const saveBrandProfile = mutation({
  args: {
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
        logoDescription: v.optional(v.string()),
        styleNotes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    // Check for existing profile (upsert)
    const existing = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
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

// ===========================================
// SECTION BUILDERS
// ===========================================

function buildBrandSections(profile: Record<string, unknown>) {
  const voice = profile.voice as { tone: string[]; personality: string[]; dos: string[]; donts: string[] };
  const audience = profile.audience as { segments: Array<{ name: string; demographics?: string; painPoints: string[] }> };
  const strategy = profile.strategy as { topics: string[]; channels: string[]; postingFrequency?: string };
  const competitors = profile.competitors as Array<{ name: string; url?: string; notes?: string }>;
  const references = profile.references as string[] | undefined;
  const visual = profile.visual as { primaryColor?: string; secondaryColor?: string; logoDescription?: string; styleNotes?: string } | undefined;

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

${visual?.primaryColor ? `Primary Color: ${visual.primaryColor}` : ""}
${visual?.secondaryColor ? `Secondary Color: ${visual.secondaryColor}` : ""}
${visual?.logoDescription ? `Logo: ${visual.logoDescription}` : ""}
${visual?.styleNotes ? `Style Notes: ${visual.styleNotes}` : ""}

Apply these visual guidelines when creating content that includes design elements or visual descriptions.`,
    },
  ];
}
