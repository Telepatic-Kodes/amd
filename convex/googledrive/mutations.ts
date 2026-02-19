import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const storeConnection = internalMutation({
  args: {
    googleAccountId: v.string(),
    email: v.string(),
    displayName: v.string(),
    profilePicture: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.string(),
    accessTokenExpiresAt: v.number(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_googleAccountId", (q) =>
        q.eq("googleAccountId", args.googleAccountId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
        profilePicture: args.profilePicture,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        scopes: args.scopes,
        status: "connected",
        updatedAt: now,
      });
      return existing._id;
    }

    // Disconnect other active connections (single account)
    const activeConnections = await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();

    for (const conn of activeConnections) {
      await ctx.db.patch(conn._id, { status: "disconnected", updatedAt: now });
    }

    return await ctx.db.insert("googleDriveConnections", {
      googleAccountId: args.googleAccountId,
      email: args.email,
      displayName: args.displayName,
      profilePicture: args.profilePicture,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      scopes: args.scopes,
      status: "connected",
      connectedAt: now,
      updatedAt: now,
    });
  },
});

export const updateTokens = internalMutation({
  args: {
    connectionId: v.id("googleDriveConnections"),
    accessToken: v.string(),
    accessTokenExpiresAt: v.number(),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      accessToken: args.accessToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      status: "connected" as const,
      updatedAt: Date.now(),
    };
    if (args.refreshToken) {
      patch.refreshToken = args.refreshToken;
    }
    await ctx.db.patch(args.connectionId, patch);
  },
});

export const disconnect = mutation({
  args: { connectionId: v.id("googleDriveConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      updatedAt: Date.now(),
    });
  },
});

export const logImport = internalMutation({
  args: {
    connectionId: v.id("googleDriveConnections"),
    driveFileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.optional(v.number()),
    destination: v.union(
      v.literal("media"),
      v.literal("kb"),
      v.literal("brand")
    ),
    destinationId: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("pending"),
      v.literal("downloading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("googleDriveImportLog", {
      connectionId: args.connectionId,
      driveFileId: args.driveFileId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      destination: args.destination,
      destinationId: args.destinationId,
      storageId: args.storageId,
      status: args.status,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
      completedAt: args.status === "completed" ? Date.now() : undefined,
    });
  },
});

export const updateImportStatus = internalMutation({
  args: {
    logId: v.id("googleDriveImportLog"),
    status: v.union(
      v.literal("pending"),
      v.literal("downloading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    storageId: v.optional(v.id("_storage")),
    destinationId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.storageId) patch.storageId = args.storageId;
    if (args.destinationId) patch.destinationId = args.destinationId;
    if (args.errorMessage) patch.errorMessage = args.errorMessage;
    if (args.status === "completed") patch.completedAt = Date.now();
    await ctx.db.patch(args.logId, patch);
  },
});

export const createMediaAsset = internalMutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("document"),
      v.literal("presentation")
    ),
    mimeType: v.string(),
    fileSize: v.number(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return await ctx.db.insert("mediaAssets", {
      name: args.name,
      storageId: args.storageId,
      url: url ?? "",
      type: args.type,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      tags: args.tags ?? [],
      uploadedBy: "google-drive",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const createKbDocument = internalMutation({
  args: {
    storageId: v.id("_storage"),
    kbId: v.id("knowledgeBases"),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const fileTypeMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "text/plain": "txt",
      "text/markdown": "md",
    };

    const fileType = fileTypeMap[args.mimeType] ?? "pdf";
    const documentId = crypto.randomUUID();

    return await ctx.db.insert("kbDocuments", {
      documentId,
      kbId: args.kbId,
      name: args.fileName,
      sourceType: "upload",
      fileType: fileType as "pdf" | "docx" | "pptx" | "txt" | "md",
      storageId: args.storageId,
      status: "pending",
      metadata: { sizeBytes: args.fileSize },
      createdAt: Date.now(),
    });
  },
});
