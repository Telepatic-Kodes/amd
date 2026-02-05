import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";

const LINKEDIN_API_VERSION = "202601";

/**
 * Publish content to LinkedIn as a text post
 */
export const publishToLinkedIn = action({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    // 1. Get content by _id
    const content = await ctx.runQuery(
      internal.linkedin.internalQueries.getContentById,
      { contentId: args.contentId }
    );
    if (!content) throw new Error("Contenido no encontrado");
    if (content.status !== "approved" && content.status !== "scheduled") {
      throw new Error("El contenido debe estar aprobado o programado para publicar");
    }

    // 2. Get active LinkedIn connection
    const connection = await ctx.runQuery(api.linkedin.queries.getConnection);
    if (!connection) throw new Error("No hay cuenta de LinkedIn conectada");
    if (connection.status === "expired") {
      throw new Error("Token de LinkedIn expirado. Reconecta tu cuenta.");
    }

    // 3. Check rate limits (max 10 posts/day)
    if (connection.dailyPostCount >= 10) {
      throw new Error("Límite diario de publicaciones alcanzado (10/día)");
    }

    // 4. Validate content length
    const commentary = content.body.substring(0, 3000);
    if (commentary.length === 0) {
      throw new Error("El contenido no puede estar vacío");
    }

    // 5. Get full connection with token (internal query needed)
    const fullConnection = await ctx.runQuery(
      internal.linkedin.internalQueries.getConnectionWithToken,
      { connectionId: connection._id }
    );
    if (!fullConnection) throw new Error("Error al obtener credenciales");

    // 6. Log pending attempt
    await ctx.runMutation(internal.linkedin.mutations.logPublishAttempt, {
      contentId: args.contentId,
      connectionId: connection._id,
      status: "pending",
      metadata: {
        postType: "text",
        characterCount: commentary.length,
        hasImage: false,
        visibility: "PUBLIC",
      },
    });

    // 7. Publish to LinkedIn
    try {
      const response = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${fullConnection.accessToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${fullConnection.linkedinMemberId}`,
          commentary,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();

        // Handle 401 - token expired
        if (response.status === 401) {
          await ctx.runMutation(internal.linkedin.mutations.markExpired, {
            connectionId: connection._id,
          });
          throw new Error("Token expirado. Reconecta tu cuenta de LinkedIn.");
        }

        // Handle 429 - rate limited
        if (response.status === 429) {
          throw new Error("LinkedIn rate limit alcanzado. Intenta más tarde.");
        }

        throw new Error(`Error de LinkedIn (${response.status}): ${errorBody}`);
      }

      // Get post URN from response header
      const postUrn = response.headers.get("x-restli-id") || undefined;

      // 8. Log success
      await ctx.runMutation(internal.linkedin.mutations.logPublishAttempt, {
        contentId: args.contentId,
        connectionId: connection._id,
        status: "published",
        linkedinPostUrn: postUrn,
        metadata: {
          postType: "text",
          characterCount: commentary.length,
          hasImage: false,
          visibility: "PUBLIC",
        },
      });

      // 9. Update content status to published
      await ctx.runMutation(api.functions.updateContentStatus, {
        id: args.contentId,
        status: "published",
        publishedUrl: postUrn
          ? `https://www.linkedin.com/feed/update/${postUrn}`
          : undefined,
      });

      return {
        success: true,
        postUrn,
        linkedinUrl: postUrn
          ? `https://www.linkedin.com/feed/update/${postUrn}`
          : null,
      };
    } catch (error: any) {
      // Log failure (only if not already a re-throw)
      if (!error.message.includes("Token expirado") &&
          !error.message.includes("rate limit")) {
        await ctx.runMutation(internal.linkedin.mutations.logPublishAttempt, {
          contentId: args.contentId,
          connectionId: connection._id,
          status: "failed",
          errorMessage: error.message,
        });
      }
      throw error;
    }
  },
});

/**
 * Exchange OAuth authorization code for tokens
 */
export const exchangeCodeForTokens = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("LinkedIn credentials no configuradas");
    }

    // 1. Exchange code for tokens
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: args.code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: args.redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Error al obtener token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const now = Date.now();

    // 2. Get user profile
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Error al obtener perfil de LinkedIn");
    }

    const profile = await profileResponse.json();

    // 3. Store connection
    const connectionId = await ctx.runMutation(
      internal.linkedin.mutations.storeConnection,
      {
        linkedinMemberId: profile.sub,
        displayName: profile.name || `${profile.given_name} ${profile.family_name}`,
        email: profile.email,
        profilePicture: profile.picture,
        profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: now + tokenData.expires_in * 1000,
        refreshTokenExpiresAt: tokenData.refresh_token_expires_in
          ? now + tokenData.refresh_token_expires_in * 1000
          : undefined,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
      }
    );

    return { connectionId, displayName: profile.name };
  },
});

/**
 * Refresh an expired access token using refresh token
 */
export const refreshAccessToken = internalAction({
  args: { connectionId: v.id("linkedinConnections") },
  handler: async (ctx, args) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("LinkedIn credentials no configuradas");
    }

    const connection = await ctx.runQuery(
      internal.linkedin.internalQueries.getConnectionWithToken,
      { connectionId: args.connectionId }
    );

    if (!connection || !connection.refreshToken) {
      throw new Error("No hay refresh token disponible");
    }

    const response = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: connection.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      // If refresh fails, mark connection as expired
      await ctx.runMutation(internal.linkedin.mutations.markExpired, {
        connectionId: args.connectionId,
      });
      throw new Error(`Error al refrescar token: ${error}`);
    }

    const data = await response.json();
    const now = Date.now();

    await ctx.runMutation(internal.linkedin.mutations.updateTokens, {
      connectionId: args.connectionId,
      accessToken: data.access_token,
      accessTokenExpiresAt: now + data.expires_in * 1000,
      refreshToken: data.refresh_token,
      refreshTokenExpiresAt: data.refresh_token_expires_in
        ? now + data.refresh_token_expires_in * 1000
        : undefined,
    });

    return { success: true };
  },
});
