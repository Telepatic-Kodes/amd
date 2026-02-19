"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ActionCtx } from "../_generated/server";

// ---------------------------------------------------------------------------
// Helper: get a valid (non-expired) access token, refreshing if necessary
// ---------------------------------------------------------------------------

async function getValidToken(
  ctx: ActionCtx,
  connectionId: Id<"googleDriveConnections">
): Promise<string> {
  const connection = await ctx.runQuery(
    internal.googledrive.internalQueries.getConnectionWithToken,
    { connectionId }
  );

  if (!connection) {
    throw new Error("Google Drive connection not found");
  }

  // 60-second buffer before expiry
  const isValid = connection.accessTokenExpiresAt > Date.now() + 60_000;

  if (isValid) {
    return connection.accessToken;
  }

  // Token expired — refresh it
  const result = await ctx.runAction(
    internal.googledrive.actions.refreshAccessToken,
    { connectionId }
  );

  return result;
}

// ---------------------------------------------------------------------------
// Helper: determine media asset type from MIME type
// ---------------------------------------------------------------------------

function mediaTypeFromMime(
  mimeType: string
): "image" | "video" | "audio" | "document" | "presentation" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "presentation";
  }
  return "document";
}

// ---------------------------------------------------------------------------
// Google Workspace export MIME mapping (Docs/Sheets/Slides cannot be
// downloaded directly — they must be exported to a standard format)
// ---------------------------------------------------------------------------

const WORKSPACE_EXPORT_MAP: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: "pptx",
  },
};

// ===========================================================================
// 1. Exchange OAuth authorization code for tokens
// ===========================================================================

export const exchangeCodeForTokens = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ connectionId: Id<"googleDriveConnections">; displayName: string }> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials no configuradas (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
    }

    // 1. Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: args.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: args.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Error al obtener token de Google: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const now = Date.now();

    // 2. Get user profile
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Error al obtener perfil de Google");
    }

    const profile = await profileResponse.json();

    // 3. Store connection
    const connectionId = await ctx.runMutation(
      internal.googledrive.mutations.storeConnection,
      {
        googleAccountId: profile.id,
        email: profile.email,
        displayName: profile.name ?? profile.email,
        profilePicture: profile.picture,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: now + (tokenData.expires_in as number) * 1000,
        scopes: tokenData.scope ? (tokenData.scope as string).split(" ") : [],
      }
    );

    return {
      connectionId,
      displayName: profile.name ?? profile.email,
    };
  },
});

// ===========================================================================
// 2. Refresh an expired access token
// ===========================================================================

export const refreshAccessToken = internalAction({
  args: { connectionId: v.id("googleDriveConnections") },
  handler: async (ctx, args): Promise<string> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials no configuradas");
    }

    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getConnectionWithToken,
      { connectionId: args.connectionId }
    );

    if (!connection || !connection.refreshToken) {
      throw new Error("No hay refresh token disponible para Google Drive");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al refrescar token de Google: ${error}`);
    }

    const data = await response.json();
    const now = Date.now();

    await ctx.runMutation(internal.googledrive.mutations.updateTokens, {
      connectionId: args.connectionId,
      accessToken: data.access_token,
      accessTokenExpiresAt: now + (data.expires_in as number) * 1000,
      // Google only returns a new refresh_token occasionally
      refreshToken: data.refresh_token ?? undefined,
    });

    return data.access_token as string;
  },
});

// ===========================================================================
// 3. List files in a Google Drive folder
// ===========================================================================

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export const listFiles = action({
  args: {
    folderId: v.optional(v.string()),
    pageToken: v.optional(v.string()),
    mimeTypeFilter: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
    // Get active connection
    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getActiveConnection,
      {}
    );

    if (!connection) {
      throw new Error("No hay cuenta de Google Drive conectada");
    }

    const accessToken = await getValidToken(ctx, connection._id);

    // Build the query string for Google Drive API
    const queryParts: string[] = ["trashed = false"];

    // Parent folder filter
    const parentId = args.folderId ?? "root";
    queryParts.push(`'${parentId}' in parents`);

    // MIME type filter — always include folders alongside the requested types
    if (args.mimeTypeFilter) {
      const prefixes = args.mimeTypeFilter.split(",").map((p) => p.trim());
      const mimeClauses = prefixes.map(
        (prefix) => `mimeType contains '${prefix}'`
      );
      // Always include folders so users can navigate
      mimeClauses.push(`mimeType = 'application/vnd.google-apps.folder'`);
      queryParts.push(`(${mimeClauses.join(" or ")})`);
    }

    const q = queryParts.join(" and ");

    const params = new URLSearchParams({
      q,
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink,parents)",
      pageSize: "50",
      orderBy: "folder,name",
    });

    if (args.pageToken) {
      params.set("pageToken", args.pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Token de Google Drive expirado. Reconecta tu cuenta.");
      }
      const errorBody = await response.text();
      throw new Error(
        `Error de Google Drive API (${response.status}): ${errorBody}`
      );
    }

    const data = await response.json();

    return {
      files: (data.files ?? []) as DriveFile[],
      nextPageToken: data.nextPageToken as string | undefined,
    };
  },
});

// ===========================================================================
// 4. Import files from Google Drive into AMD
// ===========================================================================

export const importFiles = action({
  args: {
    fileIds: v.array(v.string()),
    destination: v.union(
      v.literal("media"),
      v.literal("kb"),
      v.literal("brand")
    ),
    kbId: v.optional(v.id("knowledgeBases")),
  },
  handler: async (
    ctx,
    args
  ): Promise<Array<{ fileId: string; status: string; error?: string }>> => {
    // Validate: kb destination requires kbId
    if (args.destination === "kb" && !args.kbId) {
      throw new Error("kbId es requerido cuando el destino es 'kb'");
    }

    // Get active connection
    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getActiveConnection,
      {}
    );

    if (!connection) {
      throw new Error("No hay cuenta de Google Drive conectada");
    }

    const accessToken = await getValidToken(ctx, connection._id);

    const results: Array<{ fileId: string; status: string; error?: string }> =
      [];

    for (const fileId of args.fileIds) {
      try {
        // a. Get file metadata
        const metaResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!metaResponse.ok) {
          throw new Error(`Error al obtener metadata (${metaResponse.status})`);
        }

        const meta = await metaResponse.json();
        const fileSize = meta.size ? parseInt(meta.size, 10) : undefined;

        // Determine if this is a Google Workspace file that needs export
        const exportInfo = WORKSPACE_EXPORT_MAP[meta.mimeType];
        const downloadMimeType = exportInfo ? exportInfo.mime : meta.mimeType;
        const fileName = exportInfo
          ? `${meta.name}.${exportInfo.ext}`
          : meta.name;

        // b. Log import start
        const logId = await ctx.runMutation(
          internal.googledrive.mutations.logImport,
          {
            connectionId: connection._id,
            driveFileId: fileId,
            fileName,
            mimeType: downloadMimeType,
            fileSize,
            destination: args.destination,
            status: "downloading",
          }
        );

        // c. Download file content
        let downloadUrl: string;
        if (exportInfo) {
          // Google Workspace files use export endpoint
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportInfo.mime)}`;
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        }

        const fileResponse = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!fileResponse.ok) {
          throw new Error(
            `Error al descargar archivo (${fileResponse.status})`
          );
        }

        const fileBlob = await fileResponse.blob();

        // d. Upload to Convex Storage
        await ctx.runMutation(
          internal.googledrive.mutations.updateImportStatus,
          {
            logId,
            status: "processing",
          }
        );

        const uploadUrl = await ctx.storage.generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": downloadMimeType },
          body: fileBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir archivo a Convex Storage");
        }

        const { storageId } = (await uploadResponse.json()) as {
          storageId: Id<"_storage">;
        };

        // e. Create destination record
        let destinationId: string | undefined;

        if (args.destination === "media" || args.destination === "brand") {
          const assetId = await ctx.runMutation(
            internal.googledrive.mutations.createMediaAsset,
            {
              storageId,
              name: fileName,
              type: mediaTypeFromMime(downloadMimeType),
              mimeType: downloadMimeType,
              fileSize: fileBlob.size,
              tags: ["google-drive"],
            }
          );
          destinationId = assetId;
        } else if (args.destination === "kb" && args.kbId) {
          const docId = await ctx.runMutation(
            internal.googledrive.mutations.createKbDocument,
            {
              storageId,
              kbId: args.kbId,
              fileName,
              mimeType: downloadMimeType,
              fileSize: fileBlob.size,
            }
          );
          destinationId = docId;
        }

        // f. Update import log — completed
        await ctx.runMutation(
          internal.googledrive.mutations.updateImportStatus,
          {
            logId,
            status: "completed",
            storageId,
            destinationId: destinationId?.toString(),
          }
        );

        results.push({ fileId, status: "completed" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Error desconocido";

        // Try to log the failure (best-effort)
        try {
          await ctx.runMutation(internal.googledrive.mutations.logImport, {
            connectionId: connection._id,
            driveFileId: fileId,
            fileName: fileId,
            mimeType: "unknown",
            destination: args.destination,
            status: "failed",
            errorMessage: message,
          });
        } catch {
          // Ignore logging errors
        }

        results.push({ fileId, status: "failed", error: message });
      }
    }

    return results;
  },
});
