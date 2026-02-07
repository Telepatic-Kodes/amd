"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Internal helper: buildReportHtml
 * Generates HTML email template
 */
function buildReportHtml(
  title: string,
  metrics: {
    totalContent: number;
    contentPublished: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
    topPlatform?: string;
    totalEngagement?: number;
  },
  narrative: string | undefined,
  periodLabel: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #18181b;
      color: #fafafa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #27272a;
      padding: 40px 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      color: #6366f1;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #a1a1aa;
    }
    .metrics {
      display: table;
      width: 100%;
      margin: 30px 0;
    }
    .metric-row {
      display: table-row;
    }
    .metric {
      display: table-cell;
      padding: 20px;
      background-color: #3f3f46;
      text-align: center;
      border-radius: 8px;
      margin: 10px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
      margin: 0;
    }
    .metric-label {
      font-size: 14px;
      color: #a1a1aa;
      margin: 5px 0 0 0;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background-color: #3f3f46;
      border-radius: 8px;
    }
    .section h2 {
      margin: 0 0 15px 0;
      font-size: 20px;
      color: #fafafa;
    }
    .section p {
      margin: 10px 0;
      line-height: 1.6;
      color: #d4d4d8;
    }
    .section ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #d4d4d8;
    }
    .section li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #3f3f46;
      color: #71717a;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AMD - Reporte ${title.includes("Semanal") ? "Semanal" : "Mensual"}</h1>
      <p>${periodLabel}</p>
    </div>

    <div class="metrics">
      <div class="metric-row">
        <div class="metric">
          <p class="metric-value">${metrics.contentPublished}</p>
          <p class="metric-label">Contenido Publicado</p>
        </div>
        <div class="metric">
          <p class="metric-value">${Math.round(metrics.totalTokens / 1000)}K</p>
          <p class="metric-label">Tokens</p>
        </div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric-row">
        <div class="metric">
          <p class="metric-value">$${metrics.totalCost.toFixed(2)}</p>
          <p class="metric-label">Costo</p>
        </div>
        <div class="metric">
          <p class="metric-value">${metrics.successRate.toFixed(1)}%</p>
          <p class="metric-label">Éxito</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Resumen de Contenido</h2>
      <ul>
        <li><strong>Total de contenido:</strong> ${metrics.totalContent} items</li>
        <li><strong>Publicado en el período:</strong> ${metrics.contentPublished} items</li>
        ${metrics.topPlatform ? `<li><strong>Plataforma principal:</strong> ${metrics.topPlatform}</li>` : ""}
        ${metrics.totalEngagement ? `<li><strong>Engagement total:</strong> ${metrics.totalEngagement} interacciones</li>` : ""}
      </ul>
    </div>

    ${narrative ? `
    <div class="section">
      <h2>Análisis IA</h2>
      <p>${narrative.split("\n").join("</p><p>")}</p>
    </div>
    ` : ""}

    <div class="footer">
      <p>Generado por AI Marketing Department</p>
      <p>© ${new Date().getFullYear()} AIAIAI Consulting</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Action: generateWeeklyReport
 * Main weekly report generator
 */
export const generateWeeklyReport = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Get all users with report settings
    const allSettings: any = await ctx.runQuery(internal.reports.getAllReportSettings);

    // Calculate period: last 7 days
    const periodEnd = Date.now();
    const periodStart = periodEnd - 7 * 24 * 60 * 60 * 1000;

    const periodLabel = `${new Date(periodStart).toLocaleDateString("es-ES")} - ${new Date(periodEnd).toLocaleDateString("es-ES")}`;

    const results: any[] = [];

    for (const settings of allSettings) {
      const shouldGenerate =
        settings.emailEnabled && (settings.frequency === "weekly" || settings.frequency === "both");

      if (!shouldGenerate) {
        continue;
      }

      try {
        // Build metrics
        const metrics: any = await ctx.runQuery(internal.reports.buildReportMetricsInternal, {
          userId: settings.userId,
          periodStart,
          periodEnd,
        });

        // Generate narrative if requested
        let narrative: string | undefined;
        if (settings.includeNarrative) {
          try {
            const narrativeResult = await ctx.runAction(api.actions.callClaude, {
              systemPrompt:
                "Eres el CMO de un departamento de marketing AI. Analiza métricas y genera insights accionables.",
              userMessage: `Analiza estas métricas de la semana y escribe un resumen ejecutivo de 2 párrafos en español destacando logros, áreas de mejora y recomendaciones:

Contenido publicado: ${metrics.contentPublished}
Tokens utilizados: ${metrics.totalTokens}
Costo: $${metrics.totalCost.toFixed(2)}
Tasa de éxito: ${metrics.successRate.toFixed(1)}%
${metrics.topPlatform ? `Plataforma principal: ${metrics.topPlatform}` : ""}
${metrics.totalEngagement ? `Engagement total: ${metrics.totalEngagement}` : ""}

Escribe un análisis conciso y accionable.`,
              model: "claude-sonnet-4-20250514",
              temperature: 0.7,
              maxTokens: 500,
            });
            narrative = narrativeResult.content;
          } catch (error: any) {
            console.error("Error generating narrative:", error);
            narrative = undefined;
          }
        }

        // Build HTML
        const title = "Reporte Semanal";
        const htmlContent = buildReportHtml(title, metrics, narrative, periodLabel);

        // Insert report
        const reportId: any = await ctx.runMutation(internal.reports.insertReport, {
          userId: settings.userId,
          type: "weekly",
          title,
          periodStart,
          periodEnd,
          htmlContent,
          metrics,
          narrative,
        });

        // Send email if configured
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey && settings.emailEnabled && settings.recipientEmail) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);

            await resend.emails.send({
              from: "AMD Reports <onboarding@resend.dev>",
              to: settings.recipientEmail,
              subject: title,
              html: htmlContent,
            });

            // Mark as sent
            await ctx.runMutation(internal.reports.markReportSent, {
              reportId,
              emailSentAt: Date.now(),
            });

            results.push({ userId: settings.userId, success: true, reportId });
          } catch (error: any) {
            console.error("Error sending email:", error);
            await ctx.runMutation(internal.reports.markReportError, {
              reportId,
              emailError: error.message,
            });
            results.push({ userId: settings.userId, success: false, error: error.message });
          }
        } else {
          results.push({ userId: settings.userId, success: true, reportId, emailSkipped: true });
        }
      } catch (error: any) {
        console.error(`Error generating report for user ${settings.userId}:`, error);
        results.push({ userId: settings.userId, success: false, error: error.message });
      }
    }

    return {
      trigger: "weekly",
      timestamp: Date.now(),
      reportsGenerated: results.length,
      results,
    };
  },
});

/**
 * Action: generateMonthlyReport
 * Same flow for 30-day period
 */
export const generateMonthlyReport = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Get all users with report settings
    const allSettings: any = await ctx.runQuery(internal.reports.getAllReportSettings);

    // Calculate period: last 30 days
    const periodEnd = Date.now();
    const periodStart = periodEnd - 30 * 24 * 60 * 60 * 1000;

    const periodLabel = `${new Date(periodStart).toLocaleDateString("es-ES")} - ${new Date(periodEnd).toLocaleDateString("es-ES")}`;

    const results = [];

    for (const settings of allSettings) {
      const shouldGenerate =
        settings.emailEnabled && (settings.frequency === "monthly" || settings.frequency === "both");

      if (!shouldGenerate) {
        continue;
      }

      try {
        // Build metrics
        const metrics = await ctx.runQuery(internal.reports.buildReportMetricsInternal, {
          userId: settings.userId,
          periodStart,
          periodEnd,
        });

        // Generate narrative if requested
        let narrative: string | undefined;
        if (settings.includeNarrative) {
          try {
            const narrativeResult = await ctx.runAction(api.actions.callClaude, {
              systemPrompt:
                "Eres el CMO de un departamento de marketing AI. Analiza métricas y genera insights accionables.",
              userMessage: `Analiza estas métricas del mes y escribe un resumen ejecutivo de 2 párrafos en español destacando logros, áreas de mejora y recomendaciones:

Contenido publicado: ${metrics.contentPublished}
Tokens utilizados: ${metrics.totalTokens}
Costo: $${metrics.totalCost.toFixed(2)}
Tasa de éxito: ${metrics.successRate.toFixed(1)}%
${metrics.topPlatform ? `Plataforma principal: ${metrics.topPlatform}` : ""}
${metrics.totalEngagement ? `Engagement total: ${metrics.totalEngagement}` : ""}

Escribe un análisis conciso y accionable.`,
              model: "claude-sonnet-4-20250514",
              temperature: 0.7,
              maxTokens: 500,
            });
            narrative = narrativeResult.content;
          } catch (error: any) {
            console.error("Error generating narrative:", error);
            narrative = undefined;
          }
        }

        // Build HTML
        const title = "Reporte Mensual";
        const htmlContent = buildReportHtml(title, metrics, narrative, periodLabel);

        // Insert report
        const reportId: any = await ctx.runMutation(internal.reports.insertReport, {
          userId: settings.userId,
          type: "monthly",
          title,
          periodStart,
          periodEnd,
          htmlContent,
          metrics,
          narrative,
        });

        // Send email if configured
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey && settings.emailEnabled && settings.recipientEmail) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);

            await resend.emails.send({
              from: "AMD Reports <onboarding@resend.dev>",
              to: settings.recipientEmail,
              subject: title,
              html: htmlContent,
            });

            // Mark as sent
            await ctx.runMutation(internal.reports.markReportSent, {
              reportId,
              emailSentAt: Date.now(),
            });

            results.push({ userId: settings.userId, success: true, reportId });
          } catch (error: any) {
            console.error("Error sending email:", error);
            await ctx.runMutation(internal.reports.markReportError, {
              reportId,
              emailError: error.message,
            });
            results.push({ userId: settings.userId, success: false, error: error.message });
          }
        } else {
          results.push({ userId: settings.userId, success: true, reportId, emailSkipped: true });
        }
      } catch (error: any) {
        console.error(`Error generating report for user ${settings.userId}:`, error);
        results.push({ userId: settings.userId, success: false, error: error.message });
      }
    }

    return {
      trigger: "monthly",
      timestamp: Date.now(),
      reportsGenerated: results.length,
      results,
    };
  },
});

/**
 * Action: generateReportNow
 * Manual trigger for current user
 */
export const generateReportNow = action({
  args: {
    type: v.union(v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }
    const userId = identity.subject;

    // Calculate period
    const periodEnd = Date.now();
    const days = args.type === "weekly" ? 7 : 30;
    const periodStart = periodEnd - days * 24 * 60 * 60 * 1000;

    const periodLabel = `${new Date(periodStart).toLocaleDateString("es-ES")} - ${new Date(periodEnd).toLocaleDateString("es-ES")}`;

    // Build metrics
    const metrics: any = await ctx.runQuery(internal.reports.buildReportMetricsInternal, {
      userId,
      periodStart,
      periodEnd,
    });

    // Generate narrative
    let narrative: string | undefined;
    try {
      const narrativeResult = await ctx.runAction(api.actions.callClaude, {
        systemPrompt:
          "Eres el CMO de un departamento de marketing AI. Analiza métricas y genera insights accionables.",
        userMessage: `Analiza estas métricas del ${args.type === "weekly" ? "semana" : "mes"} y escribe un resumen ejecutivo de 2 párrafos en español destacando logros, áreas de mejora y recomendaciones:

Contenido publicado: ${metrics.contentPublished}
Tokens utilizados: ${metrics.totalTokens}
Costo: $${metrics.totalCost.toFixed(2)}
Tasa de éxito: ${metrics.successRate.toFixed(1)}%
${metrics.topPlatform ? `Plataforma principal: ${metrics.topPlatform}` : ""}
${metrics.totalEngagement ? `Engagement total: ${metrics.totalEngagement}` : ""}

Escribe un análisis conciso y accionable.`,
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        maxTokens: 500,
      });
      narrative = narrativeResult.content;
    } catch (error: any) {
      console.error("Error generating narrative:", error);
      narrative = undefined;
    }

    // Build HTML
    const title = args.type === "weekly" ? "Reporte Semanal" : "Reporte Mensual";
    const htmlContent = buildReportHtml(title, metrics, narrative, periodLabel);

    // Insert report
    const reportId = await ctx.runMutation(internal.reports.insertReport, {
      userId,
      type: args.type,
      title,
      periodStart,
      periodEnd,
      htmlContent,
      metrics,
      narrative,
    });

    return { reportId };
  },
});
