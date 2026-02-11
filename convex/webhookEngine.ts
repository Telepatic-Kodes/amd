import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Webhook management and delivery engine.
 * Supports registration, event dispatch, HMAC signing, and retry logic.
 */

// Generate a random signing secret
function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Register a new webhook.
 */
export const createWebhook = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, { name, url, events }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    // Basic URL validation
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        throw new Error("Solo se permiten URLs HTTPS");
      }
    } catch {
      throw new Error("URL inválida. Debe ser una URL HTTPS válida.");
    }

    if (events.length === 0) {
      throw new Error("Selecciona al menos un evento");
    }

    const now = Date.now();
    const secret = generateSecret();

    const id = await ctx.db.insert("webhooks", {
      userId: identity.subject,
      name,
      url,
      events,
      secret,
      status: "active",
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { id, secret };
  },
});

/**
 * List webhooks for the current user.
 */
export const listWebhooks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("webhooks")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/**
 * Update webhook configuration.
 */
export const updateWebhook = mutation({
  args: {
    id: v.id("webhooks"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"))),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const webhook = await ctx.db.get(id);
    if (!webhook || webhook.userId !== identity.subject) {
      throw new Error("Webhook no encontrado");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name) patch.name = updates.name;
    if (updates.url) patch.url = updates.url;
    if (updates.events) patch.events = updates.events;
    if (updates.status) patch.status = updates.status;

    await ctx.db.patch(id, patch);
  },
});

/**
 * Delete a webhook.
 */
export const deleteWebhook = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const webhook = await ctx.db.get(id);
    if (!webhook || webhook.userId !== identity.subject) {
      throw new Error("Webhook no encontrado");
    }

    await ctx.db.delete(id);
  },
});

/**
 * Get recent deliveries for a webhook.
 */
export const getDeliveries = query({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, { webhookId }) => {
    return ctx.db
      .query("webhookDeliveries")
      .withIndex("by_webhookId", (q) => q.eq("webhookId", webhookId))
      .order("desc")
      .take(20);
  },
});

/**
 * Dispatch an event to all matching webhooks.
 * Called internally when events occur (content published, agent completed, etc.)
 */
export const dispatchEvent = internalMutation({
  args: {
    event: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, { event, payload }) => {
    // Find all active webhooks subscribed to this event
    const allWebhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const matching = allWebhooks.filter((w) => w.events.includes(event));

    const now = Date.now();
    for (const webhook of matching) {
      // Create pending delivery
      await ctx.db.insert("webhookDeliveries", {
        webhookId: webhook._id,
        event,
        payload,
        attempt: 1,
        status: "pending",
        createdAt: now,
      });
    }

    // Schedule delivery via action
    if (matching.length > 0) {
      await ctx.scheduler.runAfter(0, internal.webhookEngine.deliverPending, {});
    }
  },
});

/**
 * Deliver all pending webhooks (action — can make HTTP calls).
 */
export const deliverPending = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get pending deliveries
    const pending = await ctx.runQuery(internal.webhookEngine.getPendingDeliveries, {});

    for (const delivery of pending) {
      const webhook = await ctx.runQuery(internal.webhookEngine.getWebhookInternal, {
        id: delivery.webhookId,
      });

      if (!webhook || webhook.status !== "active") continue;

      try {
        // Sign payload with HMAC-SHA256
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhook.secret);
        const payloadData = encoder.encode(delivery.payload);

        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
        const signature = Array.from(new Uint8Array(signatureBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Send webhook
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-AMD-Event": delivery.event,
            "X-AMD-Signature": `sha256=${signature}`,
            "X-AMD-Delivery": delivery._id,
          },
          body: delivery.payload,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        // Mark delivery result
        await ctx.runMutation(internal.webhookEngine.updateDelivery, {
          id: delivery._id,
          webhookId: webhook._id,
          statusCode: response.status,
          responseBody: (await response.text()).slice(0, 500),
          success: response.ok,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        await ctx.runMutation(internal.webhookEngine.updateDelivery, {
          id: delivery._id,
          webhookId: webhook._id,
          statusCode: 0,
          responseBody: message,
          success: false,
        });
      }
    }
  },
});

/**
 * Internal: get pending deliveries.
 */
export const getPendingDeliveries = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(50);
  },
});

/**
 * Internal: get webhook by ID.
 */
export const getWebhookInternal = internalQuery({
  args: { id: v.id("webhooks") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

/**
 * Internal: update delivery status after attempt.
 */
export const updateDelivery = internalMutation({
  args: {
    id: v.id("webhookDeliveries"),
    webhookId: v.id("webhooks"),
    statusCode: v.number(),
    responseBody: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, { id, webhookId, statusCode, responseBody, success }) => {
    const now = Date.now();

    await ctx.db.patch(id, {
      statusCode,
      responseBody,
      status: success ? "success" : "failed",
      sentAt: now,
    });

    // Update webhook stats
    const webhook = await ctx.db.get(webhookId);
    if (!webhook) return;

    if (success) {
      await ctx.db.patch(webhookId, {
        lastDeliveryAt: now,
        lastDeliveryStatus: statusCode,
        failureCount: 0,
        updatedAt: now,
      });
    } else {
      const newFailureCount = (webhook.failureCount || 0) + 1;
      await ctx.db.patch(webhookId, {
        lastDeliveryAt: now,
        lastDeliveryStatus: statusCode,
        failureCount: newFailureCount,
        // Auto-pause after 5 consecutive failures
        status: newFailureCount >= 5 ? "failed" : webhook.status,
        updatedAt: now,
      });

      // Retry with exponential backoff (up to 3 attempts)
      const delivery = await ctx.db.get(id);
      if (delivery && delivery.attempt < 3) {
        const delayMs = Math.pow(2, delivery.attempt) * 5000; // 10s, 20s
        await ctx.scheduler.runAfter(delayMs, internal.webhookEngine.retryDelivery, {
          originalId: id,
          webhookId,
          event: delivery.event,
          payload: delivery.payload,
          attempt: delivery.attempt + 1,
        });
      }
    }
  },
});

/**
 * Internal: retry a failed delivery.
 */
export const retryDelivery = internalMutation({
  args: {
    originalId: v.id("webhookDeliveries"),
    webhookId: v.id("webhooks"),
    event: v.string(),
    payload: v.string(),
    attempt: v.number(),
  },
  handler: async (ctx, { webhookId, event, payload, attempt }) => {
    await ctx.db.insert("webhookDeliveries", {
      webhookId,
      event,
      payload,
      attempt,
      status: "pending",
      createdAt: Date.now(),
    });

    // Trigger delivery
    await ctx.scheduler.runAfter(0, internal.webhookEngine.deliverPending, {});
  },
});

/**
 * Send a test ping to a webhook.
 */
export const sendTestPing = action({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, { webhookId }): Promise<{ success: boolean; statusCode: number; body: string }> => {
    const webhook = await ctx.runQuery(internal.webhookEngine.getWebhookInternal, {
      id: webhookId,
    });

    if (!webhook) throw new Error("Webhook no encontrado");

    const testPayload = JSON.stringify({
      event: "test.ping",
      timestamp: Date.now(),
      data: { message: "Test ping from AMD" },
    });

    try {
      const resp = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AMD-Event": "test.ping",
        },
        body: testPayload,
        signal: AbortSignal.timeout(10000),
      });

      return {
        success: resp.ok,
        statusCode: resp.status,
        body: (await resp.text()).slice(0, 200),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error de conexión";
      return { success: false, statusCode: 0, body: message };
    }
  },
});

// Available webhook events
export const WEBHOOK_EVENTS = [
  { value: "content.published", label: "Contenido publicado" },
  { value: "content.status_changed", label: "Estado de contenido cambiado" },
  { value: "agent.execution_completed", label: "Ejecución de agente completada" },
  { value: "agent.execution_failed", label: "Ejecución de agente fallida" },
  { value: "strategy.completed", label: "Estrategia completada" },
  { value: "strategy.failed", label: "Estrategia fallida" },
  { value: "report.generated", label: "Reporte generado" },
] as const;
