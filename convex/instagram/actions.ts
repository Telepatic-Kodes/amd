import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { validateCaption, validateCarouselImages } from "./validation";

const FACEBOOK_GRAPH_VERSION = "v19.0";

/**
 * Exchange Facebook OAuth code for Instagram long-lived token
 * Flow: Facebook OAuth → Pages → Instagram Business Account → Profile
 */
export const exchangeCodeForTokens = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<{ username: string; displayName: string }> => {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Facebook credentials no configuradas");
    }

    // Step 1: Exchange code for short-lived token
    const shortTokenUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?` +
      `client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(args.redirectUri)}&code=${args.code}`;

    const shortTokenResponse = await fetch(shortTokenUrl);
    if (!shortTokenResponse.ok) {
      const error = await shortTokenResponse.text();
      throw new Error(`Error al obtener token de Facebook: ${error}`);
    }
    const shortTokenData = await shortTokenResponse.json();

    // Step 2: Exchange for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortTokenData.access_token}`;

    const longTokenResponse = await fetch(longTokenUrl);
    if (!longTokenResponse.ok) {
      const error = await longTokenResponse.text();
      throw new Error(`Error al obtener token de larga duración: ${error}`);
    }
    const longTokenData = await longTokenResponse.json();
    const longLivedToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in || 5184000; // Default 60 days

    // Step 3: Get user's Facebook Pages
    const pagesUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts?access_token=${longLivedToken}`;
    const pagesResponse = await fetch(pagesUrl);
    if (!pagesResponse.ok) {
      throw new Error("Error al obtener páginas de Facebook");
    }
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No se encontraron páginas de Facebook. Necesitas una Página de Facebook para conectar Instagram Business.");
    }

    // Step 4: Find Instagram Business account linked to pages
    let instagramAccount = null;
    let pageAccessToken = null;
    let pageName = null;
    let pageId = null;

    for (const page of pagesData.data) {
      const igAccountUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${page.id}?` +
        `fields=instagram_business_account&access_token=${page.access_token}`;

      const igAccountResponse = await fetch(igAccountUrl);
      if (igAccountResponse.ok) {
        const igAccountData = await igAccountResponse.json();
        if (igAccountData.instagram_business_account) {
          instagramAccount = igAccountData.instagram_business_account;
          pageAccessToken = page.access_token;
          pageName = page.name;
          pageId = page.id;
          break;
        }
      }
    }

    if (!instagramAccount) {
      throw new Error(
        "No se encontro cuenta de Instagram Business vinculada a tus paginas de Facebook. " +
        "Necesitas una cuenta de Instagram Business conectada a una Pagina de Facebook."
      );
    }

    // Step 5: Get Instagram profile info
    const profileUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${instagramAccount.id}?` +
      `fields=id,username,name,profile_picture_url&access_token=${longLivedToken}`;

    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) {
      throw new Error("Error al obtener perfil de Instagram");
    }
    const profile = await profileResponse.json();

    // Step 6: Store connection
    const now = Date.now();
    await ctx.runMutation(internal.instagram.mutations.storeConnection, {
      instagramUserId: profile.id,
      username: profile.username,
      displayName: profile.name || profile.username,
      profilePictureUrl: profile.profile_picture_url,
      facebookPageId: pageId!,
      facebookPageName: pageName,
      accessToken: longLivedToken,
      accessTokenExpiresAt: now + expiresIn * 1000,
      scopes: ["instagram_basic", "instagram_content_publish", "pages_read_engagement"],
    });

    return {
      username: profile.username,
      displayName: profile.name || profile.username,
    };
  },
});

/**
 * Helper function to poll container status
 */
async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 5
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${containerId}?` +
      `fields=status_code&access_token=${accessToken}`;

    const response = await fetch(statusUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status_code === "FINISHED") {
        return;
      }
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error("Container no completó el procesamiento a tiempo");
}

/**
 * Publish content to Instagram (single image or carousel)
 */
export const publishToInstagram = action({
  args: {
    contentId: v.id("content"),
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{ success: boolean; instagramMediaId?: string; permalink?: string }> => {
    // 1. Get content
    const content = await ctx.runQuery(
      internal.instagram.internalQueries.getContentById,
      { contentId: args.contentId }
    );
    if (!content) throw new Error("Contenido no encontrado");
    if (content.status !== "approved" && content.status !== "scheduled") {
      throw new Error("El contenido debe estar aprobado o programado para publicar");
    }

    // 2. Get active Instagram connection
    const connection = await ctx.runQuery(api.instagram.queries.getConnection);
    if (!connection) throw new Error("No hay cuenta de Instagram conectada");
    if (connection.status === "expired") {
      throw new Error("Token de Instagram expirado. Reconecta tu cuenta.");
    }

    // 3. Validate caption
    const caption = content.body.substring(0, 2200);
    const captionValidation = validateCaption(caption);
    if (!captionValidation.valid) {
      throw new Error(`Error de validación: ${captionValidation.errors.join(", ")}`);
    }

    // 4. Get full connection with token
    const fullConnection: any = await ctx.runQuery(
      internal.instagram.internalQueries.getConnectionWithToken,
      { connectionId: connection._id }
    );
    if (!fullConnection) throw new Error("Error al obtener credenciales");

    // 5. Determine media type
    const isCarousel = args.imageUrls && args.imageUrls.length >= 2;
    const mediaType = isCarousel ? "carousel" : "image";

    // Validate carousel if applicable
    if (isCarousel) {
      const carouselValidation = validateCarouselImages(args.imageUrls!);
      if (!carouselValidation.valid) {
        throw new Error(`Error de validación: ${carouselValidation.errors.join(", ")}`);
      }
    }

    // 6. Log pending attempt
    const logId = await ctx.runMutation(internal.instagram.mutations.logPublishAttempt, {
      contentId: args.contentId,
      connectionId: connection._id,
      mediaType,
    });

    try {
      let publishContainerId: string;

      if (isCarousel) {
        // CAROUSEL FLOW
        const itemContainerIds: string[] = [];

        // Step 1: Create item containers
        for (const imageUrl of args.imageUrls!) {
          const itemUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${fullConnection.instagramUserId}/media`;
          const itemResponse = await fetch(itemUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrl,
              is_carousel_item: true,
              access_token: fullConnection.accessToken,
            }),
          });

          if (!itemResponse.ok) {
            const error = await itemResponse.text();
            throw new Error(`Error al crear item de carrusel: ${error}`);
          }

          const itemData = await itemResponse.json();
          itemContainerIds.push(itemData.id);

          // Wait for item container to be ready
          await waitForContainerReady(itemData.id, fullConnection.accessToken);
        }

        // Step 2: Create carousel container
        const carouselUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${fullConnection.instagramUserId}/media`;
        const carouselResponse = await fetch(carouselUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "CAROUSEL",
            children: itemContainerIds,
            caption,
            access_token: fullConnection.accessToken,
          }),
        });

        if (!carouselResponse.ok) {
          const error = await carouselResponse.text();
          if (carouselResponse.status === 429) {
            throw new Error("Instagram rate limit alcanzado. Intenta más tarde.");
          }
          throw new Error(`Error al crear carrusel: ${error}`);
        }

        const carouselData = await carouselResponse.json();
        publishContainerId = carouselData.id;

        // Wait for carousel container to be ready
        await waitForContainerReady(publishContainerId, fullConnection.accessToken);

      } else {
        // SINGLE IMAGE FLOW
        if (!args.imageUrl) {
          throw new Error("Se requiere imageUrl para publicación de imagen individual");
        }

        // Step 1: Create media container
        const containerUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${fullConnection.instagramUserId}/media`;
        const containerResponse = await fetch(containerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: args.imageUrl,
            caption,
            access_token: fullConnection.accessToken,
          }),
        });

        if (!containerResponse.ok) {
          const error = await containerResponse.text();
          if (containerResponse.status === 429) {
            throw new Error("Instagram rate limit alcanzado. Intenta más tarde.");
          }
          throw new Error(`Error al crear contenedor de Instagram: ${error}`);
        }

        const containerData = await containerResponse.json();
        publishContainerId = containerData.id;

        // Wait for container to be ready
        await waitForContainerReady(publishContainerId, fullConnection.accessToken);
      }

      // Step 3: Publish
      const publishUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${fullConnection.instagramUserId}/media_publish`;
      const publishResponse = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: publishContainerId,
          access_token: fullConnection.accessToken,
        }),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.text();
        if (publishResponse.status === 429) {
          throw new Error("Instagram rate limit alcanzado. Intenta más tarde.");
        }
        throw new Error(`Error al publicar en Instagram: ${error}`);
      }

      const publishData = await publishResponse.json();
      const mediaId = publishData.id;

      // Get permalink
      const permalinkUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${mediaId}?` +
        `fields=permalink&access_token=${fullConnection.accessToken}`;
      const permalinkResponse = await fetch(permalinkUrl);
      let permalink: string | undefined;
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        permalink = permalinkData.permalink;
      }

      // 7. Log success
      await ctx.runMutation(internal.instagram.mutations.updatePublishLog, {
        logId,
        status: "published",
        instagramMediaId: mediaId,
        metadata: {
          captionLength: caption.length,
          imageCount: isCarousel ? args.imageUrls!.length : 1,
          permalink,
        },
      });

      // 8. Increment daily count
      await ctx.runMutation(internal.instagram.mutations.incrementDailyCount, {
        connectionId: connection._id,
      });

      // 9. Update content status
      await ctx.runMutation(api.functions.updateContentStatus, {
        id: args.contentId,
        status: "published",
        publishedUrl: permalink,
      });

      return {
        success: true,
        instagramMediaId: mediaId,
        permalink,
      };

    } catch (error: any) {
      // Log failure
      await ctx.runMutation(internal.instagram.mutations.updatePublishLog, {
        logId,
        status: "failed",
        errorMessage: error.message,
      });

      // Mark connection as expired if token error
      if (error.message.includes("expirado") || error.message.includes("401")) {
        await ctx.runMutation(internal.instagram.mutations.markExpired, {
          connectionId: connection._id,
        });
      }

      throw error;
    }
  },
});
