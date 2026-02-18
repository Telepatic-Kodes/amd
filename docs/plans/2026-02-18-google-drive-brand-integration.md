# Google Drive Brand Content Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable manual import of brand assets and documents from Google Drive into AMD's Media Library, Knowledge Base, and Brand Profile.

**Architecture:** OAuth 2.0 connection in Settings, reusable DriveFilePicker modal, Convex actions to download from Drive API and store in Convex Storage. Follows the existing LinkedIn/Twitter/Instagram integration patterns.

**Tech Stack:** Convex (backend + storage), Google Drive API v3, OAuth 2.0, React 19, Next.js 16, shadcn/ui

---

## Task 1: Add Google Drive Connection Schema

**Files:**
- Modify: `convex/schema.ts` (after instagramPublishLog table, ~line 908)

**Step 1: Add `googleDriveConnections` table to schema**

Add after the `instagramPublishLog` table definition:

```typescript
// ===========================================
// GOOGLE DRIVE - Brand content import
// ===========================================
googleDriveConnections: defineTable({
  userId: v.optional(v.string()),
  googleAccountId: v.string(),
  email: v.string(),
  displayName: v.string(),
  profilePicture: v.optional(v.string()),
  accessToken: v.string(),
  refreshToken: v.string(),
  accessTokenExpiresAt: v.number(),
  scopes: v.array(v.string()),
  status: v.union(
    v.literal("connected"),
    v.literal("expired"),
    v.literal("disconnected"),
    v.literal("revoked")
  ),
  connectedAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_googleAccountId", ["googleAccountId"])
  .index("by_status", ["status"])
  .index("by_userId", ["userId"]),

googleDriveImportLog: defineTable({
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
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_connectionId", ["connectionId"])
  .index("by_status", ["status"])
  .index("by_driveFileId", ["driveFileId"]),
```

**Step 2: Run Convex dev to verify schema compiles**

Run: `cd /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd && npx convex dev --once`
Expected: Schema synced successfully

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(drive): add googleDriveConnections and importLog schema tables"
```

---

## Task 2: Create Google Drive Convex Queries

**Files:**
- Create: `convex/googledrive/queries.ts`

**Step 1: Create queries file**

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getConnection = query({
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connection) return null;

    const now = Date.now();
    const isExpired = connection.accessTokenExpiresAt < now;
    const expiresInDays = Math.floor(
      (connection.accessTokenExpiresAt - now) / (1000 * 60 * 60 * 24)
    );

    return {
      _id: connection._id,
      googleAccountId: connection.googleAccountId,
      email: connection.email,
      displayName: connection.displayName,
      profilePicture: connection.profilePicture,
      status: isExpired ? ("expired" as const) : connection.status,
      expiresInDays,
      isExpiringSoon: expiresInDays <= 7 && expiresInDays > 0,
      connectedAt: connection.connectedAt,
    };
  },
});

export const getImportHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleDriveImportLog")
      .order("desc")
      .take(args.limit ?? 20);
  },
});
```

**Step 2: Verify Convex compiles**

Run: `npx convex dev --once`

**Step 3: Commit**

```bash
git add convex/googledrive/queries.ts
git commit -m "feat(drive): add connection and import history queries"
```

---

## Task 3: Create Google Drive Convex Mutations

**Files:**
- Create: `convex/googledrive/mutations.ts`

**Step 1: Create mutations file**

```typescript
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

    // Check for existing connection with same Google account
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

    // Disconnect any other active connections
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
      status: "connected",
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
```

**Step 2: Verify Convex compiles**

Run: `npx convex dev --once`

**Step 3: Commit**

```bash
git add convex/googledrive/mutations.ts
git commit -m "feat(drive): add connection storage, disconnect, and import log mutations"
```

---

## Task 4: Create Google Drive Internal Queries

**Files:**
- Create: `convex/googledrive/internalQueries.ts`

**Step 1: Create internal queries file**

```typescript
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getConnectionWithToken = internalQuery({
  args: { connectionId: v.id("googleDriveConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Google Drive connection not found");
    return connection;
  },
});

export const getActiveConnection = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();
  },
});
```

**Step 2: Commit**

```bash
git add convex/googledrive/internalQueries.ts
git commit -m "feat(drive): add internal queries for token access"
```

---

## Task 5: Create Google Drive Actions (OAuth + API)

**Files:**
- Create: `convex/googledrive/actions.ts`

**Step 1: Create actions file with OAuth token exchange and Drive API calls**

```typescript
"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const exchangeCodeForTokens = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    // Exchange authorization code for tokens
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
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user profile info
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Google profile");
    }

    const profile = await profileResponse.json();
    const now = Date.now();

    // Store connection
    const connectionId = await ctx.runMutation(
      internal.googledrive.mutations.storeConnection,
      {
        googleAccountId: profile.id,
        email: profile.email,
        displayName: profile.name,
        profilePicture: profile.picture,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: now + tokenData.expires_in * 1000,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
      }
    );

    return {
      connectionId,
      email: profile.email,
      displayName: profile.name,
    };
  },
});

export const refreshAccessToken = internalAction({
  args: { connectionId: v.id("googleDriveConnections") },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getConnectionWithToken,
      { connectionId: args.connectionId }
    );

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
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    const now = Date.now();

    await ctx.runMutation(internal.googledrive.mutations.updateTokens, {
      connectionId: args.connectionId,
      accessToken: data.access_token,
      accessTokenExpiresAt: now + data.expires_in * 1000,
      refreshToken: data.refresh_token,
    });

    return data.access_token;
  },
});

// Helper: get valid access token, refreshing if needed
async function getValidToken(
  ctx: { runQuery: typeof import("../_generated/server").ActionCtx.prototype.runQuery; runAction: typeof import("../_generated/server").ActionCtx.prototype.runAction },
  connectionId: Parameters<typeof internal.googledrive.internalQueries.getConnectionWithToken>[0]["connectionId"]
): Promise<string> {
  const connection = await ctx.runQuery(
    internal.googledrive.internalQueries.getConnectionWithToken,
    { connectionId }
  );

  if (connection.accessTokenExpiresAt > Date.now() + 60_000) {
    return connection.accessToken;
  }

  return await ctx.runAction(internal.googledrive.actions.refreshAccessToken, {
    connectionId,
  });
}

export const listFiles = action({
  args: {
    folderId: v.optional(v.string()),
    pageToken: v.optional(v.string()),
    mimeTypeFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getActiveConnection
    );
    if (!connection) throw new Error("No Google Drive connection found");

    const accessToken = await getValidToken(ctx, connection._id);

    const params = new URLSearchParams({
      pageSize: "50",
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink,parents)",
      orderBy: "folder,name",
    });

    // Build query: files in folder, not trashed
    const queryParts = ["trashed = false"];
    if (args.folderId) {
      queryParts.push(`'${args.folderId}' in parents`);
    } else {
      queryParts.push("'root' in parents");
    }
    if (args.mimeTypeFilter) {
      // Support comma-separated MIME types
      const types = args.mimeTypeFilter.split(",").map((t) => t.trim());
      const mimeQuery = types
        .map((t) =>
          t === "folder"
            ? "mimeType = 'application/vnd.google-apps.folder'"
            : `mimeType contains '${t}'`
        )
        .join(" or ");
      queryParts.push(`(mimeType = 'application/vnd.google-apps.folder' or ${mimeQuery})`);
    }
    params.set("q", queryParts.join(" and "));

    if (args.pageToken) {
      params.set("pageToken", args.pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Drive API error: ${error}`);
    }

    const data = await response.json();

    return {
      files: data.files.map(
        (f: {
          id: string;
          name: string;
          mimeType: string;
          size?: string;
          modifiedTime: string;
          iconLink?: string;
          thumbnailLink?: string;
        }) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size ? parseInt(f.size) : undefined,
          modifiedTime: f.modifiedTime,
          iconLink: f.iconLink,
          thumbnailLink: f.thumbnailLink,
          isFolder: f.mimeType === "application/vnd.google-apps.folder",
        })
      ),
      nextPageToken: data.nextPageToken,
    };
  },
});

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
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.googledrive.internalQueries.getActiveConnection
    );
    if (!connection) throw new Error("No Google Drive connection found");

    const accessToken = await getValidToken(ctx, connection._id);
    const results: Array<{ fileId: string; status: string; error?: string }> = [];

    for (const fileId of args.fileIds) {
      try {
        // Get file metadata
        const metaResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!metaResponse.ok) throw new Error("Failed to get file metadata");
        const meta = await metaResponse.json();

        // Log import start
        const logId = await ctx.runMutation(
          internal.googledrive.mutations.logImport,
          {
            connectionId: connection._id,
            driveFileId: fileId,
            fileName: meta.name,
            mimeType: meta.mimeType,
            fileSize: meta.size ? parseInt(meta.size) : undefined,
            destination: args.destination,
            status: "downloading",
          }
        );

        // Download file content
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!downloadResponse.ok) throw new Error("Failed to download file");

        const fileBlob = await downloadResponse.blob();

        // Upload to Convex Storage
        const uploadUrl = await ctx.storage.generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": meta.mimeType },
          body: fileBlob,
        });
        if (!uploadResponse.ok) throw new Error("Failed to upload to storage");

        const { storageId } = await uploadResponse.json();

        // Route to destination
        if (args.destination === "media") {
          const type = meta.mimeType.startsWith("image/")
            ? "image"
            : meta.mimeType.startsWith("video/")
              ? "video"
              : meta.mimeType.startsWith("audio/")
                ? "audio"
                : meta.mimeType.includes("presentation")
                  ? "presentation"
                  : "document";

          await ctx.runMutation(internal.googledrive.mutations.createMediaAsset, {
            storageId,
            name: meta.name,
            type,
            mimeType: meta.mimeType,
            fileSize: meta.size ? parseInt(meta.size) : 0,
            tags: ["google-drive"],
          });
        } else if (args.destination === "kb" && args.kbId) {
          await ctx.runMutation(internal.googledrive.mutations.createKbDocument, {
            storageId,
            kbId: args.kbId,
            fileName: meta.name,
            mimeType: meta.mimeType,
            fileSize: meta.size ? parseInt(meta.size) : undefined,
          });
        }

        // Update log
        await ctx.runMutation(
          internal.googledrive.mutations.updateImportStatus,
          { logId, status: "completed", storageId }
        );

        results.push({ fileId, status: "completed" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ fileId, status: "failed", error: message });
      }
    }

    return results;
  },
});
```

**Step 2: Add helper mutations for media/KB creation**

Append to `convex/googledrive/mutations.ts`:

```typescript
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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
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
```

**Step 3: Verify Convex compiles**

Run: `npx convex dev --once`

**Step 4: Commit**

```bash
git add convex/googledrive/actions.ts convex/googledrive/mutations.ts
git commit -m "feat(drive): add OAuth exchange, file listing, and import actions"
```

---

## Task 6: Add OAuth HTTP Routes

**Files:**
- Modify: `convex/http.ts` (add routes after Instagram callback section)

**Step 1: Add Google Drive auth and callback routes**

Add after the Instagram OAuth routes:

```typescript
// ===========================================
// GOOGLE DRIVE OAuth
// ===========================================
http.route({
  path: "/googledrive/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
    }

    const url = new URL(request.url);
    const redirectUri = getOAuthCallbackUrl(request.url, "/googledrive/callback");
    const state = crypto.randomUUID();

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": `gdrive_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
      },
    });
  }),
});

http.route({
  path: "/googledrive/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const frontendUrl = getFrontendUrl();

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/settings?google_drive=error&error=${encodeURIComponent(error)}`,
        },
      });
    }

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/settings?google_drive=error&error=missing_params`,
        },
      });
    }

    // Validate state cookie
    const cookies = request.headers.get("cookie") || "";
    const stateCookie = cookies.match(/gdrive_oauth_state=([^;]+)/)?.[1];

    if (!stateCookie || stateCookie !== state) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/settings?google_drive=error&error=invalid_state`,
        },
      });
    }

    try {
      const redirectUri = getOAuthCallbackUrl(request.url, "/googledrive/callback");
      const result = await ctx.runAction(
        internal.googledrive.actions.exchangeCodeForTokens,
        { code, redirectUri }
      );

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/settings?google_drive=connected&name=${encodeURIComponent(result.displayName)}&email=${encodeURIComponent(result.email)}`,
          "Set-Cookie": "gdrive_oauth_state=; Path=/; HttpOnly; Max-Age=0",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/settings?google_drive=error&error=${encodeURIComponent(message)}`,
          "Set-Cookie": "gdrive_oauth_state=; Path=/; HttpOnly; Max-Age=0",
        },
      });
    }
  }),
});
```

**Step 2: Add import for internal googledrive actions at top of http.ts**

Ensure `internal` import includes the new googledrive module (Convex auto-generates this).

**Step 3: Verify Convex compiles**

Run: `npx convex dev --once`

**Step 4: Commit**

```bash
git add convex/http.ts
git commit -m "feat(drive): add OAuth auth and callback HTTP routes"
```

---

## Task 7: Create GoogleDriveConnectionCard Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/googledrive/GoogleDriveConnectionCard.tsx`

**Step 1: Create connection card following LinkedIn pattern**

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
  HardDrive,
} from "lucide-react";
import { useState, useEffect } from "react";

interface GoogleDriveConnectionCardProps {
  convexSiteUrl?: string;
}

export function GoogleDriveConnectionCard({
  convexSiteUrl,
}: GoogleDriveConnectionCardProps) {
  const connection = useQuery(api.googledrive.queries.getConnection);
  const disconnect = useMutation(api.googledrive.mutations.disconnect);
  const { success, error: showError } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check for OAuth callback results in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveStatus = params.get("google_drive");
    const driveName = params.get("name");
    const driveEmail = params.get("email");
    const driveError = params.get("error");

    if (driveStatus === "connected" && driveName) {
      success(
        "Google Drive conectado",
        `${driveName} (${driveEmail}) conectado exitosamente`
      );
      window.history.replaceState({}, "", window.location.pathname);
    } else if (driveStatus === "error" && driveError) {
      showError("Error de conexión", driveError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [success, showError]);

  const handleConnect = () => {
    const authUrl = convexSiteUrl
      ? `${convexSiteUrl}/googledrive/auth`
      : "/api/googledrive/auth";
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!connection?._id) return;
    if (!window.confirm("¿Desconectar tu cuenta de Google Drive?")) return;

    setIsDisconnecting(true);
    try {
      await disconnect({ connectionId: connection._id });
      success("Google Drive desconectado", "Cuenta desconectada");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: "text-[var(--success)]",
      bg: "bg-green-400/10",
      border: "border-green-500/30",
      label: "Conectado",
    },
    expired: {
      icon: AlertTriangle,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/30",
      label: "Token expirado",
    },
    disconnected: {
      icon: XCircle,
      color: "text-[var(--text-tertiary)]",
      bg: "bg-[var(--surface-0)]",
      border: "border-[var(--border)]",
      label: "Desconectado",
    },
  };

  const status = connection?.status ?? "disconnected";
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.disconnected;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <HardDrive className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-[var(--text-primary)]">
              Google Drive
            </h4>
            {connection ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                {connection.email} · {connection.displayName}
              </p>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">
                Importa assets y documentos de marca
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>

          {connection?.status === "connected" ? (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="ml-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {isDisconnecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Desconectar"
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
              Conectar
            </button>
          )}
        </div>
      </div>

      {connection?.isExpiringSoon && (
        <div className="mt-3 rounded-lg bg-yellow-400/5 border border-yellow-500/20 px-3 py-2">
          <p className="text-xs text-yellow-400">
            Token expira en {connection.expiresInDays} días. Reconecta para
            renovar.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add to Settings page**

In `ai-marketing-department/ai-marketing-department/app/(dashboard)/settings/page.tsx`:

- Add import: `import { GoogleDriveConnectionCard } from "@/components/googledrive/GoogleDriveConnectionCard";`
- Add the card in the platforms section, after `EmailConnectionCard`:

```tsx
<GoogleDriveConnectionCard
  convexSiteUrl={
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site")
      : undefined
  }
/>
```

**Step 3: Verify frontend compiles**

Run: `cd ai-marketing-department/ai-marketing-department && npm run build`

**Step 4: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/googledrive/GoogleDriveConnectionCard.tsx ai-marketing-department/ai-marketing-department/app/\(dashboard\)/settings/page.tsx
git commit -m "feat(drive): add GoogleDriveConnectionCard to Settings platforms"
```

---

## Task 8: Create DriveFilePicker Modal Component

**Files:**
- Create: `ai-marketing-department/ai-marketing-department/components/googledrive/DriveFilePicker.tsx`

**Step 1: Create the reusable file picker modal**

```tsx
"use client";

import { useState, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import {
  X,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  ChevronRight,
  Loader2,
  Check,
  ArrowLeft,
  HardDrive,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
  iconLink?: string;
  thumbnailLink?: string;
  isFolder: boolean;
}

interface DriveFilePickerProps {
  open: boolean;
  onClose: () => void;
  onImport: (fileIds: string[]) => Promise<void>;
  acceptTypes?: string[];
  maxFiles?: number;
  title?: string;
}

const MIME_ICONS: Record<string, typeof FileText> = {
  "image/": Image,
  "video/": Film,
  "audio/": Music,
};

function getFileIcon(mimeType: string) {
  for (const [prefix, Icon] of Object.entries(MIME_ICONS)) {
    if (mimeType.startsWith(prefix)) return Icon;
  }
  return FileText;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DriveFilePicker({
  open,
  onClose,
  onImport,
  acceptTypes,
  maxFiles,
  title = "Importar desde Google Drive",
}: DriveFilePickerProps) {
  const connection = useQuery(api.googledrive.queries.getConnection);
  const listFiles = useAction(api.googledrive.actions.listFiles);
  const { success, error: showError } = useToast();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderStack, setFolderStack] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const currentFolderId =
    folderStack.length > 0 ? folderStack[folderStack.length - 1].id : undefined;

  const loadFiles = useCallback(
    async (folderId?: string) => {
      setLoading(true);
      try {
        const result = await listFiles({
          folderId,
          mimeTypeFilter: acceptTypes?.join(","),
        });
        setFiles(result.files);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error";
        showError("Error cargando archivos", message);
      } finally {
        setLoading(false);
      }
    },
    [listFiles, acceptTypes, showError]
  );

  // Load files when modal opens
  const handleOpen = useCallback(() => {
    if (open && connection?.status === "connected") {
      setSelectedIds(new Set());
      setFolderStack([]);
      setSearchQuery("");
      loadFiles();
    }
  }, [open, connection?.status, loadFiles]);

  // Effect to load on open
  useState(() => {
    handleOpen();
  });

  const navigateToFolder = (folder: DriveFile) => {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedIds(new Set());
    loadFiles(folder.id);
  };

  const navigateBack = () => {
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    const parentId = newStack.length > 0 ? newStack[newStack.length - 1].id : undefined;
    loadFiles(parentId);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderStack([]);
      loadFiles();
    } else {
      const newStack = folderStack.slice(0, index + 1);
      setFolderStack(newStack);
      loadFiles(newStack[newStack.length - 1].id);
    }
  };

  const toggleSelection = (fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        if (maxFiles && next.size >= maxFiles) return prev;
        next.add(fileId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setImporting(true);
    try {
      await onImport(Array.from(selectedIds));
      success(
        "Archivos importados",
        `${selectedIds.size} archivo(s) importados exitosamente`
      );
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error";
      showError("Error importando", message);
    } finally {
      setImporting(false);
    }
  };

  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  if (!open) return null;

  if (!connection || connection.status !== "connected") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl">
          <div className="text-center">
            <HardDrive className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
              Google Drive no conectado
            </h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Conecta tu cuenta de Google Drive en Settings → Plataformas.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-0)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] px-6 py-2 text-sm">
          {folderStack.length > 0 && (
            <button
              onClick={navigateBack}
              className="mr-1 rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-0)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="text-[var(--accent)] hover:underline"
          >
            Mi Drive
          </button>
          {folderStack.map((folder, i) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)]" />
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={cn(
                  i === folderStack.length - 1
                    ? "text-[var(--text-primary)] font-medium"
                    : "text-[var(--accent)] hover:underline"
                )}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="border-b border-[var(--border)] px-6 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-0)] px-3 py-1.5">
            <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivos..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
              <p>No se encontraron archivos</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                const FileIcon = file.isFolder
                  ? Folder
                  : getFileIcon(file.mimeType);

                return (
                  <button
                    key={file.id}
                    onClick={() =>
                      file.isFolder
                        ? navigateToFolder(file)
                        : toggleSelection(file.id)
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      isSelected
                        ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30"
                        : "hover:bg-[var(--surface-0)] border border-transparent"
                    )}
                  >
                    {!file.isFolder && (
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]"
                            : "border-[var(--border)]"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    )}
                    <FileIcon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        file.isFolder
                          ? "text-yellow-500"
                          : "text-[var(--text-tertiary)]"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {file.isFolder
                          ? "Carpeta"
                          : formatFileSize(file.size)}
                        {file.modifiedTime &&
                          ` · ${new Date(file.modifiedTime).toLocaleDateString("es-CL")}`}
                      </p>
                    </div>
                    {file.isFolder && (
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            {selectedIds.size > 0
              ? `${selectedIds.size} archivo(s) seleccionado(s)`
              : "Selecciona archivos para importar"}
            {maxFiles && ` (máx. ${maxFiles})`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-0)]"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importing}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify frontend compiles**

Run: `cd ai-marketing-department/ai-marketing-department && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/googledrive/DriveFilePicker.tsx
git commit -m "feat(drive): add reusable DriveFilePicker modal component"
```

---

## Task 9: Integrate DriveFilePicker in Media Library

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/app/(dashboard)/media/page.tsx`

**Step 1: Add import and state for Drive picker**

Add imports at top:
```tsx
import { DriveFilePicker } from "@/components/googledrive/DriveFilePicker";
import { useAction } from "convex/react";
import { HardDrive } from "lucide-react";
```

Add state and handler inside the component:
```tsx
const [drivePickerOpen, setDrivePickerOpen] = useState(false);
const importFromDrive = useAction(api.googledrive.actions.importFiles);

const handleDriveImport = async (fileIds: string[]) => {
  await importFromDrive({ fileIds, destination: "media" });
};
```

**Step 2: Add "Importar desde Drive" button next to existing upload button**

Find the upload button area and add alongside it:
```tsx
<button
  onClick={() => setDrivePickerOpen(true)}
  className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-0)]"
>
  <HardDrive className="h-4 w-4 text-blue-500" />
  Importar desde Drive
</button>
```

**Step 3: Add DriveFilePicker modal at end of component**

```tsx
<DriveFilePicker
  open={drivePickerOpen}
  onClose={() => setDrivePickerOpen(false)}
  onImport={handleDriveImport}
  title="Importar assets desde Google Drive"
/>
```

**Step 4: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/app/\(dashboard\)/media/page.tsx
git commit -m "feat(drive): add Drive import button to Media Library"
```

---

## Task 10: Integrate DriveFilePicker in Knowledge Base

**Files:**
- Modify: Knowledge Base page component (find exact path by searching for kbDocuments UI)

**Step 1: Add Drive picker with document-only filter**

Same pattern as Media Library, but with `acceptTypes` filter:

```tsx
<DriveFilePicker
  open={drivePickerOpen}
  onClose={() => setDrivePickerOpen(false)}
  onImport={handleDriveImport}
  acceptTypes={["application/pdf", "application/vnd.openxmlformats", "text/"]}
  title="Importar documentos desde Google Drive"
/>
```

Handler passes the kbId:
```tsx
const handleDriveImport = async (fileIds: string[]) => {
  await importFromDrive({ fileIds, destination: "kb", kbId: selectedKbId });
};
```

**Step 2: Add button next to existing upload**

```tsx
<button
  onClick={() => setDrivePickerOpen(true)}
  className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-0)]"
>
  <HardDrive className="h-4 w-4 text-blue-500" />
  Importar desde Drive
</button>
```

**Step 3: Commit**

```bash
git add <kb-page-file>
git commit -m "feat(drive): add Drive import to Knowledge Base"
```

---

## Task 11: Integrate DriveFilePicker in Brand Wizard (Step Visual)

**Files:**
- Modify: `ai-marketing-department/ai-marketing-department/components/brand/BrandStepVisual.tsx`

**Step 1: Replace the placeholder logo upload section (around line 160)**

Replace the "Subida de logo via Convex Storage disponible proximamente" section with:

```tsx
<div className="flex gap-2">
  <button
    onClick={() => setDrivePickerOpen(true)}
    className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-hover)] px-4 py-2.5 text-sm text-[var(--text-tertiary)] transition hover:border-blue-500/50 hover:bg-blue-500/5"
  >
    <HardDrive className="h-4 w-4 text-blue-500" />
    Importar logo desde Drive
  </button>
</div>
```

**Step 2: Add DriveFilePicker with image-only filter**

```tsx
<DriveFilePicker
  open={drivePickerOpen}
  onClose={() => setDrivePickerOpen(false)}
  onImport={handleLogoImport}
  acceptTypes={["image/"]}
  maxFiles={1}
  title="Seleccionar logo desde Google Drive"
/>
```

**Step 3: Commit**

```bash
git add ai-marketing-department/ai-marketing-department/components/brand/BrandStepVisual.tsx
git commit -m "feat(drive): add Drive logo import to Brand wizard visual step"
```

---

## Task 12: Add Environment Variables

**Files:**
- Modify: `.env.example`

**Step 1: Add Google credentials to .env.example**

```env
# Google Drive Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Step 2: Configure in Convex Dashboard**

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as environment variables in the Convex Dashboard (Settings → Environment Variables).

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(drive): add Google OAuth env vars to .env.example"
```

---

## Task 13: Manual E2E Verification

**Steps:**
1. Start Convex dev: `npx convex dev`
2. Start frontend: `cd ai-marketing-department/ai-marketing-department && npm run dev`
3. Go to Settings → Plataformas → verify GoogleDriveConnectionCard appears
4. Click "Conectar" → complete Google OAuth flow
5. Verify connection shows "Conectado" with email
6. Go to Media Library → click "Importar desde Drive"
7. Verify DriveFilePicker opens, shows folders/files
8. Select files → import → verify they appear in Media Library
9. Go to Knowledge Base → repeat import with documents
10. Go to Brand wizard → Step Visual → import logo from Drive

**Step 2: Commit final verification notes**

```bash
git commit --allow-empty -m "chore(drive): Google Drive brand content integration complete"
```
