import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";

/**
 * Send email to all active subscribers
 *
 * Mock mode (provider === "mock"): simulates 1.5s delay, generates fake metrics
 * Real mode: would call provider API (SendGrid, Resend, Mailgun)
 */
export const sendEmail = action({
  args: { contentId: v.id("content") },
  handler: async (ctx, args): Promise<{
    success: boolean;
    recipientCount: number;
    sendLogId: string;
    metrics?: {
      sent: number;
      delivered: number;
      openRate: number;
      clickRate: number;
    };
  }> => {
    // 1. Get content
    const content = await ctx.runQuery(
      internal.email.internalQueries.getContentById,
      { contentId: args.contentId }
    );
    if (!content) throw new Error("Contenido no encontrado");
    if (content.status !== "approved" && content.status !== "scheduled") {
      throw new Error("El contenido debe estar aprobado o programado para enviar");
    }

    // 2. Get active connection
    const connection = await ctx.runQuery(
      internal.email.internalQueries.getActiveConnection
    );
    if (!connection) throw new Error("No hay proveedor de email conectado");

    // 3. Get active subscribers
    const subscribers = await ctx.runQuery(
      internal.email.internalQueries.getActiveSubscribers
    );
    if (subscribers.length === 0) {
      throw new Error("No hay suscriptores activos");
    }

    // 4. Check rate limits
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const resetNeeded = connection.lastSendCountResetAt < dayStart.getTime();
    const currentCount = resetNeeded ? 0 : connection.dailySendCount;

    if (currentCount + subscribers.length > connection.dailySendLimit) {
      throw new Error(
        `Límite diario de envío superado (${currentCount}/${connection.dailySendLimit}). ` +
        `Intentando enviar a ${subscribers.length} suscriptores.`
      );
    }

    // 5. Log pending attempt
    await ctx.runMutation(internal.email.mutations.logSendAttempt, {
      contentId: args.contentId,
      connectionId: connection._id,
      subject: content.title,
      recipientCount: subscribers.length,
      status: "pending",
    });

    // 6. Send based on provider
    try {
      if (connection.provider === "mock") {
        // Mock mode: simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate realistic mock metrics
        const sent = subscribers.length;
        const delivered = Math.floor(sent * 0.95);
        const opened = Math.floor(delivered * 0.38);
        const clicked = Math.floor(delivered * 0.042);
        const bounced = sent - delivered;
        const unsubscribed = Math.floor(delivered * 0.002);

        // Log successful send
        const sendLogId = await ctx.runMutation(
          internal.email.mutations.logSendAttempt,
          {
            contentId: args.contentId,
            connectionId: connection._id,
            subject: content.title,
            recipientCount: subscribers.length,
            status: "sent",
            metadata: {
              openRate: 38.0,
              clickRate: 4.2,
              bounceRate: 5.0,
              unsubscribeRate: 0.2,
            },
          }
        );

        // Store engagement data
        await ctx.runMutation(internal.email.mutations.storeEngagement, {
          contentId: args.contentId,
          sendLogId,
          sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
        });

        // Update content status to published
        await ctx.runMutation(api.functions.updateContentStatus, {
          id: args.contentId,
          status: "published",
        });

        return {
          success: true,
          recipientCount: subscribers.length,
          sendLogId,
          metrics: {
            sent,
            delivered,
            openRate: 38.0,
            clickRate: 4.2,
          },
        };
      }

      // Real provider mode (future implementation)
      // switch (connection.provider) {
      //   case "sendgrid":
      //     await fetch("https://api.sendgrid.com/v3/mail/send", { ... });
      //     break;
      //   case "resend":
      //     await fetch("https://api.resend.com/emails/batch", { ... });
      //     break;
      //   case "mailgun":
      //     await fetch(`https://api.mailgun.net/v3/.../messages`, { ... });
      //     break;
      // }

      throw new Error(
        `Proveedor ${connection.provider} no implementado aún. Usa "mock" para pruebas.`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";

      // Log failure if not already logged
      if (!message.includes("Límite diario")) {
        await ctx.runMutation(internal.email.mutations.logSendAttempt, {
          contentId: args.contentId,
          connectionId: connection._id,
          subject: content.title,
          recipientCount: subscribers.length,
          status: "failed",
          errorMessage: message,
        });
      }
      throw error;
    }
  },
});

/**
 * Send test email to a single address
 */
export const sendTestEmail = action({
  args: {
    contentId: v.id("content"),
    testEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    const content = await ctx.runQuery(
      internal.email.internalQueries.getContentById,
      { contentId: args.contentId }
    );
    if (!content) throw new Error("Contenido no encontrado");

    const connection = await ctx.runQuery(
      internal.email.internalQueries.getActiveConnection
    );
    if (!connection) throw new Error("No hay proveedor de email conectado");

    if (connection.provider === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        message: `Email de prueba enviado a ${args.testEmail} (mock)`,
      };
    }

    throw new Error(`Proveedor ${connection.provider} no implementado aún`);
  },
});

/**
 * Validate API key connection
 */
export const validateApiKey = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (_ctx, args): Promise<{ valid: boolean; message: string }> => {
    if (args.provider === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { valid: true, message: "Conexión mock válida" };
    }

    // Future: test real provider API keys
    // switch (args.provider) {
    //   case "sendgrid":
    //     const res = await fetch("https://api.sendgrid.com/v3/scopes", {
    //       headers: { Authorization: `Bearer ${args.apiKey}` },
    //     });
    //     return { valid: res.ok, message: res.ok ? "API key válida" : "API key inválida" };
    // }

    return {
      valid: false,
      message: `Validación para ${args.provider} no implementada aún`,
    };
  },
});
