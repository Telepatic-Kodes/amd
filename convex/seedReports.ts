/**
 * Seed: Report Settings + Mock Reports
 *
 * Run: npx convex run seedReports:seedReportData
 */

import { mutation } from "./_generated/server";

export const seedReportData = mutation({
  handler: async (ctx) => {
    const userId = "seed-user";
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const WEEK = 7 * DAY;

    // 1. Upsert report settings
    const existing = await ctx.db
      .query("reportSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      await ctx.db.insert("reportSettings", {
        userId,
        emailEnabled: true,
        frequency: "weekly",
        recipientEmail: "team@aiaiai.cl",
        includeNarrative: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Create 5 mock reports (last 5 weeks)
    const reports = [
      {
        title: "Reporte Semanal — Semana 6",
        type: "weekly" as const,
        offset: 0,
        metrics: {
          totalContent: 24,
          contentPublished: 18,
          totalTokens: 845000,
          totalCost: 12.4,
          successRate: 94.2,
          topPlatform: "LinkedIn",
          totalEngagement: 3200,
        },
        narrative: "Semana excepcional con 18 publicaciones. LinkedIn superó expectativas con 3.2K de engagement total. El contenido SEO generó 12 nuevos backlinks orgánicos.",
      },
      {
        title: "Reporte Semanal — Semana 5",
        type: "weekly" as const,
        offset: 1,
        metrics: {
          totalContent: 19,
          contentPublished: 15,
          totalTokens: 720000,
          totalCost: 10.8,
          successRate: 91.5,
          topPlatform: "Twitter",
          totalEngagement: 2800,
        },
        narrative: "Buen desempeño en Twitter con 3 threads virales. Tasa de éxito estable sobre 90%. Costo por contenido publicado bajo a $0.72.",
      },
      {
        title: "Reporte Semanal — Semana 4",
        type: "weekly" as const,
        offset: 2,
        metrics: {
          totalContent: 22,
          contentPublished: 17,
          totalTokens: 790000,
          totalCost: 11.6,
          successRate: 88.3,
          topPlatform: "LinkedIn",
          totalEngagement: 2500,
        },
        narrative: "Se identificaron problemas en el agente de newsletters que bajaron la tasa de éxito. Corregido a mitad de semana. LinkedIn sigue como plataforma top.",
      },
      {
        title: "Reporte Mensual — Enero 2026",
        type: "monthly" as const,
        offset: 3,
        metrics: {
          totalContent: 85,
          contentPublished: 68,
          totalTokens: 3200000,
          totalCost: 48.5,
          successRate: 92.1,
          topPlatform: "LinkedIn",
          totalEngagement: 12400,
        },
        narrative: "Mes record con 68 piezas publicadas. ROI de contenido mejoró 23% vs diciembre. Los agentes de SEO generaron 45 keywords nuevos en top 10.",
      },
      {
        title: "Reporte Semanal — Semana 3",
        type: "weekly" as const,
        offset: 4,
        metrics: {
          totalContent: 20,
          contentPublished: 16,
          totalTokens: 680000,
          totalCost: 9.9,
          successRate: 93.7,
          topPlatform: "Instagram",
          totalEngagement: 4100,
        },
        narrative: "Instagram destacó con un carrusel que alcanzó 4.1K de engagement. Los agentes de demandgen optimizaron ROAS a 3.2x en Meta Ads.",
      },
    ];

    for (const report of reports) {
      const periodEnd = now - report.offset * WEEK;
      const periodStart = periodEnd - (report.type === "monthly" ? 30 * DAY : WEEK);

      await ctx.db.insert("reports", {
        userId,
        type: report.type,
        title: report.title,
        periodStart,
        periodEnd,
        htmlContent: `<h1>${report.title}</h1><p>${report.narrative}</p>`,
        metrics: report.metrics,
        narrative: report.narrative,
        emailSent: report.offset > 0,
        emailSentAt: report.offset > 0 ? periodEnd + 3600000 : undefined,
        generatedAt: periodEnd,
      });
    }

    return { success: true, reportsCreated: reports.length };
  },
});
