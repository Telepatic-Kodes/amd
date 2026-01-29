import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { v4 as uuidv4 } from "uuid";

/**
 * Generates a URL for uploading a file to Convex storage
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Creates a KB document record after file upload
 */
export const createDocumentFromUpload = mutation({
  args: {
    kbId: v.id("knowledgeBases"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    sizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const documentId = uuidv4();

    // Infer file type from MIME type
    const fileTypeMap: Record<string, "pdf" | "docx" | "pptx" | "txt" | "md"> =
      {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          "docx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          "pptx",
        "text/plain": "txt",
        "text/markdown": "md",
      };

    const fileType =
      fileTypeMap[args.fileType] ||
      (args.fileName.endsWith(".pdf")
        ? "pdf"
        : args.fileName.endsWith(".docx")
          ? "docx"
          : args.fileName.endsWith(".pptx")
            ? "pptx"
            : "txt");

    const docId = await ctx.db.insert("kbDocuments", {
      documentId,
      kbId: args.kbId,
      name: args.fileName,
      sourceType: "upload",
      fileType,
      storageId: args.storageId,
      status: "pending",
      metadata: {
        sizeBytes: args.sizeBytes,
      },
      createdAt: Date.now(),
    });

    // TODO: Schedule async processing via action or hook
    // For now, file processing should be triggered via a separate action call

    return docId;
  },
});

/**
 * Creates a KB document from URL for scraping
 */
export const createDocumentFromUrl = mutation({
  args: {
    kbId: v.id("knowledgeBases"),
    url: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const documentId = uuidv4();

    const docId = await ctx.db.insert("kbDocuments", {
      documentId,
      kbId: args.kbId,
      name: args.name,
      sourceType: "url",
      sourceUrl: args.url,
      status: "pending",
      metadata: {},
      createdAt: Date.now(),
    });

    // TODO: Schedule async scraping via action or hook
    // For now, URL scraping should be triggered via a separate action call

    return docId;
  },
});

/**
 * Updates document status during processing
 */
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("kbDocuments"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
    processingError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);

    if (!doc) {
      throw new Error(`Document not found`);
    }

    await ctx.db.patch(args.documentId, {
      status: args.status,
      processingError: args.processingError,
      processedAt: args.status === "processed" ? Date.now() : undefined,
    });
  },
});
