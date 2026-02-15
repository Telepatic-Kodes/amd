import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Publish content to multiple platforms in a single action
 *
 * Uses Promise.allSettled to run all platform publishes in parallel.
 * One platform failure does not block others.
 *
 * Important: This action does NOT adapt content - each platform action
 * handles its own content reading and formatting. Content adaptation
 * from lib/contentAdapters.ts is for PREVIEW purposes only (used by frontend).
 */
export const publishToMultiplePlatforms = action({
  args: {
    contentId: v.id("content"),
    platforms: v.array(v.string()), // ["linkedin", "twitter", "instagram"]
    instagramImageUrl: v.optional(v.string()), // Required if instagram in platforms
    instagramImageUrls: v.optional(v.array(v.string())), // For carousel
  },
  handler: async (ctx, args): Promise<{
    results: Array<{
      platform: string;
      success: boolean;
      error?: string;
      url?: string;
    }>;
  }> => {
    // Authentication check (skip in dev/mock mode when no auth provider configured)
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("No autenticado. Inicia sesión para continuar.");
    // }

    // Validate platforms array
    if (!args.platforms || args.platforms.length === 0) {
      throw new Error("Debes seleccionar al menos una plataforma");
    }

    // Validate Instagram requirements
    const hasInstagram = args.platforms.includes("instagram");
    const isCarousel = args.instagramImageUrls && args.instagramImageUrls.length >= 2;

    if (hasInstagram && !isCarousel && !args.instagramImageUrl) {
      throw new Error("Instagram requiere una URL de imagen (instagramImageUrl)");
    }

    // Build platform publish promises
    type PublishResult = {
      platform: string;
      success: boolean;
      error?: string;
      url?: string;
    };

    const publishPromises = args.platforms.map(async (platform): Promise<PublishResult> => {
      const platformLower = platform.toLowerCase();

      try {
        switch (platformLower) {
          case "linkedin": {
            const linkedinResult: any = await ctx.runAction(
              api.linkedin.actions.publishToLinkedIn,
              { contentId: args.contentId }
            );
            return {
              platform: "linkedin",
              success: linkedinResult.success,
              url: linkedinResult.linkedinUrl || undefined,
              error: undefined,
            };
          }

          case "twitter": {
            const twitterResult: any = await ctx.runAction(
              api.twitter.actions.publishToTwitter,
              { contentId: args.contentId }
            );
            return {
              platform: "twitter",
              success: twitterResult.success,
              url: twitterResult.tweetUrl || undefined,
              error: undefined,
            };
          }

          case "instagram": {
            // Instagram publish requires imageUrl
            if (!args.instagramImageUrl && !isCarousel) {
              return {
                platform: "instagram",
                success: false,
                error: "Se requiere una URL de imagen para publicar en Instagram",
                url: undefined,
              };
            }

            const instagramArgs: any = {
              contentId: args.contentId,
            };

            // Use carousel if multiple images provided
            if (isCarousel) {
              instagramArgs.imageUrls = args.instagramImageUrls;
            } else {
              instagramArgs.imageUrl = args.instagramImageUrl;
            }

            const instagramResult: any = await ctx.runAction(
              api.instagram.actions.publishToInstagram,
              instagramArgs
            );

            return {
              platform: "instagram",
              success: instagramResult.success,
              url: instagramResult.permalink || undefined,
              error: undefined,
            };
          }

          case "email": {
            const emailResult: any = await ctx.runAction(
              api.email.actions.sendEmail,
              { contentId: args.contentId }
            );
            return {
              platform: "email",
              success: emailResult.success,
              url: undefined,
              error: undefined,
            };
          }

          default:
            return {
              platform: platformLower,
              success: false,
              error: `Plataforma no soportada: ${platform}`,
              url: undefined,
            };
        }
      } catch (error: any) {
        return {
          platform: platformLower,
          success: false,
          error: error.message || "Error desconocido",
          url: undefined,
        };
      }
    });

    // Execute all publishes in parallel
    const settledResults = await Promise.allSettled(publishPromises);

    // Format results
    const results: PublishResult[] = settledResults.map((result, index: number) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          platform: args.platforms[index].toLowerCase(),
          success: false,
          error: result.reason?.message || "Error al publicar",
          url: undefined,
        };
      }
    });

    return { results };
  },
});
