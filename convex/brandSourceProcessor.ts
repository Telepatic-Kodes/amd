"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { extractContentFromURL, chunkTextSemantic } from "./kb/scrapeUrl";

// Simple hash function (same as brandProfile.ts)
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
// PROCESS SOURCE ACTION
// ===========================================

export const processSource = action({
  args: { sourceId: v.id("brandSources") },
  handler: async (ctx, args): Promise<{ success: boolean; sectionsCreated: number; documentId?: Id<"kbDocuments"> }> => {
    // 1. Get source
    const source = await ctx.runQuery(internal.brandSources._getSource, {
      sourceId: args.sourceId,
    });
    if (!source) throw new Error("Source not found");

    // 2. Get brand profile
    const profile = await ctx.runQuery(internal.brandProfile._getBrandProfileById, {
      id: source.brandProfileId,
    }) as Record<string, unknown> | null;
    if (!profile) throw new Error("Brand profile not found");

    // 3. Mark as processing
    await ctx.runMutation(internal.brandSources._updateStatus, {
      sourceId: args.sourceId,
      status: "processing",
    });

    try {
      // 4. Ensure KB exists
      let kbId = profile.kbId as Id<"knowledgeBases"> | undefined;

      if (!kbId) {
        kbId = await ctx.runMutation(api.kb.mutations.createKnowledgeBase, {
          name: `${profile.companyName} — Brand Identity`,
          description: `Brand profile and guidelines for ${profile.companyName}`,
          category: "brand",
          visibility: ["all"],
        });

        await ctx.runMutation(internal.brandProfile._linkKBToProfile, {
          profileId: source.brandProfileId,
          kbId,
        });
      }

      // 5. Extract content based on type
      let title: string;
      let content: string;

      switch (source.sourceType) {
        case "url": {
          if (!source.url) throw new Error("URL source missing url");
          const scraped = await extractContentFromURL(source.url);
          title = scraped.title;
          content = scraped.content;
          break;
        }
        case "note": {
          title = source.name;
          content = source.content || "";
          if (!content.trim()) throw new Error("Note source has no content");
          break;
        }
        case "upload": {
          // For uploads, create a document record; text extraction depends on file type
          // For now, treat the name as a placeholder — full file processing would need
          // a dedicated PDF/DOCX parser which is outside this scope
          title = source.name;
          content = `Uploaded file: ${source.name} (${source.fileType || "unknown type"})`;
          if (source.storageId) {
            const docId = await ctx.runMutation(api.kb.uploadFile.createDocumentFromUpload, {
              kbId,
              storageId: source.storageId,
              fileName: source.name,
              fileType: source.fileType || "application/octet-stream",
            });
            await ctx.runMutation(internal.brandSources._updateStatus, {
              sourceId: args.sourceId,
              status: "active",
              kbDocumentId: docId,
              sectionsCreated: 0,
            });
            return { success: true, sectionsCreated: 0, documentId: docId };
          }
          break;
        }
        case "feed": {
          // For feeds, create the linked feed entry and mark as active
          // The feed system handles ongoing sync separately
          if (!source.url) throw new Error("Feed source missing url");
          await ctx.runMutation(api.feeds.mutations.addFeed, {
            url: source.url,
            name: source.name,
            category: "brand",
            syncFrequency: source.syncFrequency || "daily",
          });
          await ctx.runMutation(internal.brandSources._updateStatus, {
            sourceId: args.sourceId,
            status: "active",
            sectionsCreated: 0,
          });
          return { success: true, sectionsCreated: 0 };
        }
        default:
          throw new Error(`Unknown source type: ${source.sourceType}`);
      }

      // 6. Create KB document
      const documentId = await ctx.runMutation(api.kb.uploadFile.createDocumentFromUrl, {
        kbId,
        url: source.url || `source://${source.sourceType}/${source.name}`,
        name: `[Source] ${source.name}`,
      });

      // 7. Chunk text and create KB sections
      const chunks = chunkTextSemantic(content, 2000);
      let sectionsCreated = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const contentHash = simpleHash(chunk);
        await ctx.runMutation(api.kb.mutations.createKBSection, {
          sectionId: `source-section-${shortId()}`,
          kbId,
          documentId,
          title: i === 0 ? title : `${title} (part ${i + 1})`,
          content: chunk,
          contentHash,
          order: i,
          metadata: {
            wordCount: chunk.split(/\s+/).length,
          },
        });
        sectionsCreated++;
      }

      // 8. Update source status
      await ctx.runMutation(internal.brandSources._updateStatus, {
        sourceId: args.sourceId,
        status: "active",
        kbDocumentId: documentId,
        sectionsCreated,
      });

      // 9. Update KB metadata
      await ctx.runMutation(api.kb.mutations.updateKBMetadata, {
        kbId,
        status: "active",
      });

      return { success: true, sectionsCreated, documentId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown processing error";
      await ctx.runMutation(internal.brandSources._updateStatus, {
        sourceId: args.sourceId,
        status: "error",
        processingError: message,
      });
      throw error;
    }
  },
});
