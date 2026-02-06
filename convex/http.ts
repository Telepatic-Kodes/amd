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

/**
 * Twitter/X OAuth 2.0: Start authorization flow with PKCE
 * GET /twitter/auth
 *
 * Generates PKCE code_verifier + code_challenge, builds Twitter authorization URL, and redirects user.
 */
http.route({
  path: "/twitter/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!clientId) {
      return new Response("Twitter credentials no configuradas", {
        status: 500,
      });
    }

    // Build callback URL using the Convex .site domain
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/twitter/callback`;

    // Generate PKCE code_verifier (43-128 chars alphanumeric)
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 43);

    // Compute SHA-256 hash and base64url encode as code_challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeChallenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Generate CSRF state token
    const state = crypto.randomUUID();

    // Build Twitter OAuth 2.0 authorization URL
    const scopes = "tweet.read tweet.write users.read offline.access";
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    // Store state and code_verifier in short-lived cookies for CSRF validation
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": [
          `twitter_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
          `twitter_code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
        ].join(", "),
      },
    });
  }),
});

/**
 * Twitter/X OAuth 2.0: Handle callback
 * GET /twitter/callback?code=xxx&state=xxx
 *
 * Exchanges authorization code for tokens with PKCE, fetches profile, stores connection.
 */
http.route({
  path: "/twitter/callback",
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
      redirectUrl.searchParams.set("twitter", "error");
      redirectUrl.searchParams.set("error", errorDescription || error);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    if (!code || !state) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("twitter", "error");
      redirectUrl.searchParams.set("error", "Parámetros inválidos");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    // Try to read state from cookie for CSRF validation (but don't fail if missing)
    const cookies = request.headers.get("cookie") || "";
    const stateCookie = cookies.match(/twitter_oauth_state=([^;]+)/)?.[1];
    const codeVerifier = cookies.match(/twitter_code_verifier=([^;]+)/)?.[1];

    if (!stateCookie) {
      console.warn("Twitter OAuth: state cookie missing (third-party cookies may be blocked)");
    }

    if (!codeVerifier) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("twitter", "error");
      redirectUrl.searchParams.set("error", "code_verifier cookie missing");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    // Build redirect URI (must match the one used in /twitter/auth)
    const redirectUri = `${url.origin}/twitter/callback`;

    try {
      // Exchange code for tokens and store connection
      const result = await ctx.runAction(
        internal.twitter.actions.exchangeCodeForTokens,
        { code, redirectUri, codeVerifier }
      );

      // Redirect back to settings with success
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("twitter", "connected");
      redirectUrl.searchParams.set("name", result.username);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    } catch (err: any) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("twitter", "error");
      redirectUrl.searchParams.set("error", err.message || "Error de autenticación");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }
  }),
});

/**
 * Instagram OAuth (via Facebook): Start authorization flow
 * GET /instagram/auth
 *
 * Generates CSRF state, builds Facebook OAuth URL, and redirects user.
 */
http.route({
  path: "/instagram/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const appId = process.env.META_APP_ID;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!appId) {
      return new Response("Meta App ID no configurado", {
        status: 500,
      });
    }

    // Build callback URL using the Convex .site domain
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/instagram/callback`;

    // Generate CSRF state token
    const state = crypto.randomUUID();

    // Build Facebook OAuth URL
    const scopes = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    // Store state in a short-lived cookie for CSRF validation
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": `instagram_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
      },
    });
  }),
});

/**
 * Instagram OAuth (via Facebook): Handle callback
 * GET /instagram/callback?code=xxx&state=xxx
 *
 * Exchanges authorization code for tokens, fetches profile, stores connection.
 */
http.route({
  path: "/instagram/callback",
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
      redirectUrl.searchParams.set("instagram", "error");
      redirectUrl.searchParams.set("error", errorDescription || error);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    if (!code || !state) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("instagram", "error");
      redirectUrl.searchParams.set("error", "Parámetros inválidos");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }

    // Try to read state from cookie for CSRF validation (but don't fail if missing)
    const cookies = request.headers.get("cookie") || "";
    const stateCookie = cookies.match(/instagram_oauth_state=([^;]+)/)?.[1];

    if (!stateCookie) {
      console.warn("Instagram OAuth: state cookie missing (third-party cookies may be blocked)");
    }

    // Build redirect URI (must match the one used in /instagram/auth)
    const redirectUri = `${url.origin}/instagram/callback`;

    try {
      // Exchange code for tokens and store connection
      const result = await ctx.runAction(
        internal.instagram.actions.exchangeCodeForTokens,
        { code, redirectUri }
      );

      // Redirect back to settings with success
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("instagram", "connected");
      redirectUrl.searchParams.set("name", result.username);
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    } catch (err: any) {
      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set("instagram", "error");
      redirectUrl.searchParams.set("error", err.message || "Error de autenticación");
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });
    }
  }),
});

export default http;
