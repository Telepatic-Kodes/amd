import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { splitIntoThread } from "./threadSplitter";

/**
 * Exchange OAuth authorization code for Twitter access token
 * Uses PKCE flow (code_verifier from cookie)
 */
export const exchangeCodeForTokens = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
    codeVerifier: v.string(),
  },
  handler: async (ctx, args): Promise<{ username: string; displayName: string }> => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Twitter credentials no configuradas");
    }

    // 1. Exchange code for tokens
    // Twitter uses Basic Auth for confidential clients
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: args.code,
          redirect_uri: args.redirectUri,
          code_verifier: args.codeVerifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Error al obtener token de Twitter: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const now = Date.now();

    // 2. Get user profile
    const profileResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      throw new Error(`Error al obtener perfil de Twitter: ${error}`);
    }

    const profileData = await profileResponse.json();
    const user = profileData.data;

    // 3. Store connection
    await ctx.runMutation(
      internal.twitter.mutations.storeConnection,
      {
        twitterUserId: user.id,
        username: user.username,
        displayName: user.name,
        profileImageUrl: user.profile_image_url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: now + tokenData.expires_in * 1000,
        scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
      }
    );

    return { username: user.username, displayName: user.name };
  },
});

/**
 * Publish content to Twitter/X (single tweet or thread)
 */
export const publishToTwitter = action({
  args: { contentId: v.id("content") },
  handler: async (ctx, args): Promise<{ success: boolean; tweetIds: string[]; tweetUrl: string | null }> => {
    // 1. Get content by _id
    const content = await ctx.runQuery(
      internal.twitter.internalQueries.getContentById,
      { contentId: args.contentId }
    );
    if (!content) throw new Error("Contenido no encontrado");
    if (content.status !== "approved" && content.status !== "scheduled") {
      throw new Error("El contenido debe estar aprobado o programado para publicar");
    }

    // 2. Get active Twitter connection
    const connection = await ctx.runQuery(api.twitter.queries.getConnection);
    if (!connection) throw new Error("No hay cuenta de Twitter conectada");
    if (connection.status === "expired") {
      throw new Error("Token de Twitter expirado. Reconecta tu cuenta.");
    }

    // 3. Check rate limits (default max 50 tweets/day)
    const maxDailyTweets = 50; // Conservative limit
    if (connection.dailyTweetCount >= maxDailyTweets) {
      throw new Error(`Límite diario de tweets alcanzado (${maxDailyTweets}/día)`);
    }

    // 4. Get full connection with token (internal query needed)
    const fullConnection: any = await ctx.runQuery(
      internal.twitter.internalQueries.getConnectionWithToken,
      { connectionId: connection._id }
    );
    if (!fullConnection) throw new Error("Error al obtener credenciales");

    // 5. Split content into tweets
    const threadResult = splitIntoThread(content.body);

    if (threadResult.tweets.length === 0) {
      throw new Error("El contenido no puede estar vacío");
    }

    // 6. Log pending attempt
    const logId = await ctx.runMutation(internal.twitter.mutations.logPublishAttempt, {
      contentId: args.contentId,
      connectionId: connection._id,
    });

    // 7. Publish to Twitter
    try {
      const tweetIds: string[] = [];
      let replyToId: string | undefined = undefined;

      // Publish each tweet in sequence (thread)
      for (let i = 0; i < threadResult.tweets.length; i++) {
        const tweetText = threadResult.tweets[i];

        const tweetPayload: any = {
          text: tweetText,
        };

        // If not first tweet, make it a reply to previous tweet
        if (replyToId) {
          tweetPayload.reply = {
            in_reply_to_tweet_id: replyToId,
          };
        }

        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${fullConnection.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tweetPayload),
        });

        if (!response.ok) {
          const errorBody = await response.text();

          // Handle 401 - token expired
          if (response.status === 401) {
            await ctx.runMutation(internal.twitter.mutations.markExpired, {
              connectionId: connection._id,
            });
            throw new Error("Token expirado. Reconecta tu cuenta de Twitter.");
          }

          // Handle 429 - rate limited
          if (response.status === 429) {
            throw new Error("Límite de Twitter alcanzado. Intenta más tarde.");
          }

          throw new Error(`Error de Twitter (${response.status}): ${errorBody}`);
        }

        const responseData = await response.json();
        const tweetId = responseData.data.id;
        tweetIds.push(tweetId);

        // Set reply chain for next tweet
        replyToId = tweetId;
      }

      // 8. Build tweet URL (first tweet ID)
      const tweetUrl = `https://twitter.com/${connection.username}/status/${tweetIds[0]}`;

      // 9. Update publish log with success
      await ctx.runMutation(internal.twitter.mutations.updatePublishLog, {
        logId,
        status: "published",
        tweetIds,
        metadata: {
          tweetCount: tweetIds.length,
          characterCount: threadResult.totalChars,
          isThread: threadResult.isThread,
          threadUrl: threadResult.isThread ? tweetUrl : undefined,
        },
      });

      // 10. Increment daily count
      await ctx.runMutation(internal.twitter.mutations.incrementDailyCount, {
        connectionId: connection._id,
      });

      // 11. Update content status to published
      await ctx.runMutation(api.functions.updateContentStatus, {
        id: args.contentId,
        status: "published",
        publishedUrl: tweetUrl,
      });

      return {
        success: true,
        tweetIds,
        tweetUrl,
      };
    } catch (error: any) {
      // Log failure
      await ctx.runMutation(internal.twitter.mutations.updatePublishLog, {
        logId,
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
  },
});
