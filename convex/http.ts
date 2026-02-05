import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * LinkedIn OAuth: Start authorization flow
 * GET /linkedin/auth
 *
 * Generates CSRF state, builds LinkedIn authorization URL, and redirects user.
 */
http.route({
  path: "/linkedin/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!clientId) {
      return new Response("LinkedIn credentials no configuradas", {
        status: 500,
      });
    }

    // Build callback URL using the Convex .site domain
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/linkedin/callback`;

    // Generate CSRF state token
    const state = crypto.randomUUID();

    // Build LinkedIn authorization URL
    const scopes = "openid profile email w_member_social";
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    // Store state in a short-lived cookie for CSRF validation
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": `linkedin_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
      },
    });
  }),
});

/**
 * LinkedIn OAuth: Handle callback
 * GET /linkedin/callback?code=xxx&state=xxx
 *
 * Exchanges authorization code for tokens, fetches profile, stores connection.
 */
http.route({
  path: "/linkedin/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Handle user denied or error
    if (error) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("linkedin", "error");
      redirectUrl.searchParams.set("error", errorDescription || error);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    if (!code || !state) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("linkedin", "error");
      redirectUrl.searchParams.set("error", "Parámetros inválidos");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    // Build redirect URI (must match the one used in /linkedin/auth)
    const redirectUri = `${url.origin}/linkedin/callback`;

    try {
      // Exchange code for tokens and store connection
      const result = await ctx.runAction(
        internal.linkedin.actions.exchangeCodeForTokens,
        { code, redirectUri }
      );

      // Redirect back to settings with success
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("linkedin", "connected");
      redirectUrl.searchParams.set("name", result.displayName);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    } catch (err: any) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("linkedin", "error");
      redirectUrl.searchParams.set("error", err.message || "Error de autenticación");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }
  }),
});

export default http;
