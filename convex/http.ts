import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getFrontendUrl } from "./oauthHelpers";

const http = httpRouter();

// ===========================================
// PUBLIC REST API v1
// ===========================================

// Helper: SHA-256 hash for token validation
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Authenticate API request, check permissions, and enforce rate limits
async function authenticateRequest(
  ctx: any,
  request: Request,
  requiredPermission: string
): Promise<{ valid: boolean; error?: string; userId?: string; keyId?: any; rateLimited?: boolean }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing Authorization header. Use: Bearer <token>" };
  }

  const token = authHeader.slice(7);
  if (!token.startsWith("amd_live_")) {
    return { valid: false, error: "Invalid token format" };
  }

  const keyHash = await hashToken(token);
  const result = await ctx.runMutation(internal.publicApi.validateToken, {
    keyHash,
    requiredPermission,
  });

  if (!result.valid) return result;

  // Rate limiting: check recent requests in the last minute
  const recentUsage = await ctx.runQuery(internal.publicApi.getRecentRequestCount, {
    apiKeyId: result.keyId,
    windowMs: 60_000, // 1 minute window
  });

  const rateLimit = 100; // 100 requests per minute
  if (recentUsage >= rateLimit) {
    return { valid: false, error: `Rate limit exceeded (${rateLimit}/min)`, rateLimited: true };
  }

  return result;
}

// Helper: JSON response with CORS headers
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-API-Version": "v1",
    },
  });
}

// Helper: Error response
function errorResponse(error: string, status: number): Response {
  return jsonResponse({ error, meta: { timestamp: Date.now() } }, status);
}

// CORS preflight handler
http.route({
  path: "/api/v1/content",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

http.route({
  path: "/api/v1/agents",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

http.route({
  path: "/api/v1/analytics",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

http.route({
  path: "/api/v1/strategies",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

/**
 * GET /api/v1/agents - List all agents
 * Query params: ?department=content&status=active
 */
http.route({
  path: "/api/v1/agents",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const auth = await authenticateRequest(ctx, request, "read:agents");
    if (!auth.valid) return errorResponse(auth.error!, auth.rateLimited ? 429 : 401);

    try {
      const url = new URL(request.url);
      const department = url.searchParams.get("department") || undefined;
      const status = url.searchParams.get("status") || undefined;

      const agents = await ctx.runQuery(api.functions.listAgents, {
        department,
        status,
      });

      // Log usage
      await ctx.runMutation(internal.publicApi.logUsage, {
        apiKeyId: auth.keyId,
        endpoint: "/api/v1/agents",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
      });

      return jsonResponse({
        data: agents.map((a: any) => ({
          id: a._id,
          agentId: a.agentId,
          name: a.name,
          department: a.department,
          role: a.role,
          status: a.status,
          description: a.description,
        })),
        meta: { total: agents.length, timestamp: Date.now() },
      });
    } catch (err: any) {
      return errorResponse(err.message || "Error interno", 500);
    }
  }),
});

/**
 * GET /api/v1/content - List content with pagination
 * Query params: ?status=published&type=blog&limit=20&offset=0
 */
http.route({
  path: "/api/v1/content",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const auth = await authenticateRequest(ctx, request, "read:content");
    if (!auth.valid) return errorResponse(auth.error!, auth.rateLimited ? 429 : 401);

    try {
      const url = new URL(request.url);
      const status = url.searchParams.get("status") || undefined;
      const type = url.searchParams.get("type") || undefined;
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

      const content = await ctx.runQuery(api.functions.listContent, {
        status,
        type,
      });

      const paginated = content.slice(0, limit);

      await ctx.runMutation(internal.publicApi.logUsage, {
        apiKeyId: auth.keyId,
        endpoint: "/api/v1/content",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
      });

      return jsonResponse({
        data: paginated.map((c: any) => ({
          id: c._id,
          title: c.title,
          type: c.type,
          status: c.status,
          summary: c.summary,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          metadata: c.metadata,
          seo: c.seo,
        })),
        meta: {
          total: content.length,
          limit,
          returned: paginated.length,
          timestamp: Date.now(),
        },
      });
    } catch (err: any) {
      return errorResponse(err.message || "Error interno", 500);
    }
  }),
});

/**
 * POST /api/v1/content - Create new content
 * Body: { type, title, body, summary?, metadata?, seo? }
 */
http.route({
  path: "/api/v1/content",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const auth = await authenticateRequest(ctx, request, "write:content");
    if (!auth.valid) return errorResponse(auth.error!, auth.rateLimited ? 429 : 401);

    try {
      const body = await request.json();

      if (!body.type || !body.title || !body.body) {
        return errorResponse("Campos requeridos: type, title, body", 400);
      }

      const contentId = await ctx.runMutation(api.functions.createContent, {
        type: body.type,
        title: body.title,
        body: body.body,
        summary: body.summary,
        metadata: body.metadata || {},
        seo: body.seo,
        createdBy: "system" as const,
      });

      await ctx.runMutation(internal.publicApi.logUsage, {
        apiKeyId: auth.keyId,
        endpoint: "/api/v1/content",
        method: "POST",
        statusCode: 201,
        responseTimeMs: Date.now() - startTime,
      });

      return jsonResponse(
        { data: { id: contentId }, meta: { timestamp: Date.now() } },
        201
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear contenido";
      return errorResponse(message, 500);
    }
  }),
});

/**
 * GET /api/v1/analytics - Dashboard analytics overview
 */
http.route({
  path: "/api/v1/analytics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const auth = await authenticateRequest(ctx, request, "read:analytics");
    if (!auth.valid) return errorResponse(auth.error!, auth.rateLimited ? 429 : 401);

    try {
      const stats = await ctx.runQuery(api.functions.getDashboardStats, {});

      await ctx.runMutation(internal.publicApi.logUsage, {
        apiKeyId: auth.keyId,
        endpoint: "/api/v1/analytics",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
      });

      return jsonResponse({
        data: stats,
        meta: { timestamp: Date.now() },
      });
    } catch (err: any) {
      return errorResponse(err.message || "Error interno", 500);
    }
  }),
});

/**
 * GET /api/v1/strategies - List strategies
 */
http.route({
  path: "/api/v1/strategies",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const auth = await authenticateRequest(ctx, request, "read:strategies");
    if (!auth.valid) return errorResponse(auth.error!, auth.rateLimited ? 429 : 401);

    try {
      const strategies = await ctx.runQuery(api.cmoEngine.listStrategies, {});

      await ctx.runMutation(internal.publicApi.logUsage, {
        apiKeyId: auth.keyId,
        endpoint: "/api/v1/strategies",
        method: "GET",
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
      });

      return jsonResponse({
        data: strategies.map((s: any) => ({
          id: s._id,
          strategyId: s.strategyId,
          status: s.status,
          goal: s.goal,
          summary: s.strategy?.summary,
          totalTasks: s.totalTasks,
          completedTasks: s.completedTasks,
          failedTasks: s.failedTasks,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
        })),
        meta: { total: strategies.length, timestamp: Date.now() },
      });
    } catch (err: any) {
      return errorResponse(err.message || "Error interno", 500);
    }
  }),
});

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
    const frontendUrl = getFrontendUrl();

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
    const frontendUrl = getFrontendUrl();

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
    const frontendUrl = getFrontendUrl();

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
    const frontendUrl = getFrontendUrl();

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
    const frontendUrl = getFrontendUrl();

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
    const frontendUrl = getFrontendUrl();

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
