/**
 * Seed: Monitoring / Alert Digests
 *
 * Run: npx convex run seedMonitoring:seedMonitoringData
 *
 * Creates a mock feed + feedItems first (required by alertDigests.items.feedItemId),
 * then creates 10 alertDigest records.
 */

import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedMonitoringData = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // 1. Create a mock feed (needed for feedItems)
    const existingFeed = await ctx.db
      .query("feeds")
      .filter((q) => q.eq(q.field("feedId"), "seed-monitor-feed"))
      .first();

    let feedId: Id<"feeds">;
    if (existingFeed) {
      feedId = existingFeed._id;
    } else {
      feedId = await ctx.db.insert("feeds", {
        feedId: "seed-monitor-feed",
        url: "https://example.com/feed.xml",
        name: "Monitor Feed (Seed)",
        category: "industry",
        status: "active",
        syncFrequency: "daily",
        consecutiveErrors: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Create 30 mock feedItems (to reference from digests)
    const mockTitles = [
      "AIAIAI Consulting destaca en ranking de empresas IA en Chile",
      "Competidor XYZ lanza nueva plataforma de marketing automatizado",
      "Tendencias de marketing IA para 2026: lo que viene",
      "Análisis del mercado MarTech en Latinoamérica",
      "5 herramientas de IA que están transformando el marketing digital",
      "El futuro del contenido generado por IA en redes sociales",
      "Competidor ABC adquiere startup de analytics por $50M",
      "AIAIAI mencionado como líder en automatización de contenido",
      "Nuevas regulaciones de IA afectarán al marketing digital en Chile",
      "Estudio revela que 78% de marketers usan IA generativa",
      "Competidor DEF anuncia expansión a mercado mexicano",
      "AIAIAI Consulting gana premio de innovación digital 2026",
      "El impacto de la IA en la estrategia de marca según expertos",
      "Marketing programático alcanza record de inversión en LATAM",
      "Competidor XYZ reporta pérdida de clientes enterprise",
      "AIAIAI integra nueva tecnología de personalización de contenido",
      "Podcast sobre automatización de marketing con IA marca tendencia",
      "Competidor ABC lanza versión gratuita de su herramienta SEO",
      "LinkedIn actualiza su algoritmo: impacto en contenido B2B",
      "AIAIAI Consulting expande equipo de agentes a 50+ bots",
      "Análisis competitivo: quién lidera el mercado de marketing IA",
      "Webinar sobre ROI de contenido automatizado atrae 5000 registros",
      "Competidor DEF sufre caída de servicio por 12 horas",
      "Nuevo estudio compara AIAIAI vs competidores en calidad de contenido",
      "El mercado de SaaS de marketing IA crecerá 40% en 2026",
      "Competidor XYZ pivotea hacia modelo de agentes multi-canal",
      "AIAIAI mencionado en artículo de Forbes sobre IA en marketing",
      "Regulador chileno propone marco para transparencia en IA",
      "Competidor ABC pierde CTO y 3 directores de producto",
      "Informe revela que contenido IA supera a humano en engagement",
    ];

    const feedItemIds: Id<"feedItems">[] = [];
    for (let i = 0; i < 30; i++) {
      const id = await ctx.db.insert("feedItems", {
        feedId,
        contentHash: `seed-hash-${i}-${Date.now()}`,
        title: mockTitles[i],
        link: `https://example.com/article/${i}`,
        publishedAt: now - (i * DAY) / 2,
        createdAt: now,
        updatedAt: now,
        sentiment: (["positive", "neutral", "negative"] as const)[i % 3],
        relevanceScore: 50 + Math.floor(Math.random() * 50),
        brandMentions: mockTitles[i].includes("AIAIAI") ? ["AIAIAI"] : undefined,
        competitorMentions: mockTitles[i].includes("Competidor")
          ? [mockTitles[i].match(/Competidor (\w+)/)?.[1] || "Unknown"]
          : undefined,
      });
      feedItemIds.push(id);
    }

    // 3. Create 10 alertDigest records
    const digestConfigs = [
      { daysAgo: 0, status: "generated" as const, itemIndices: [0, 1, 2], summary: "Digest reciente: AIAIAI destacado en ranking, competidor XYZ lanza nueva plataforma, tendencias 2026 identificadas." },
      { daysAgo: 1, status: "sent" as const, itemIndices: [3, 4, 5], summary: "Análisis del mercado MarTech muestra crecimiento sostenido. 5 herramientas clave identificadas para monitoreo." },
      { daysAgo: 2, status: "sent" as const, itemIndices: [6, 7, 8], summary: "Movimiento competitivo importante: ABC adquiere startup. AIAIAI mencionado como líder." },
      { daysAgo: 3, status: "sent" as const, itemIndices: [9, 10, 11], summary: "78% de marketers adoptaron IA generativa. Competidor DEF expandiéndose a México." },
      { daysAgo: 5, status: "sent" as const, itemIndices: [12, 13, 14, 15], summary: "Semana de alta actividad: impacto IA en estrategia de marca, record de inversión programática." },
      { daysAgo: 7, status: "sent" as const, itemIndices: [16, 17, 18], summary: "Competidor ABC lanza herramienta SEO gratuita. LinkedIn cambia algoritmo para contenido B2B." },
      { daysAgo: 10, status: "sent" as const, itemIndices: [19, 20, 21], summary: "AIAIAI expande a 50+ agentes. Análisis competitivo favorable publicado." },
      { daysAgo: 14, status: "sent" as const, itemIndices: [22, 23, 24], summary: "Competidor DEF con problemas técnicos. AIAIAI supera en calidad de contenido según nuevo estudio." },
      { daysAgo: 20, status: "sent" as const, itemIndices: [25, 26, 27], summary: "Mercado SaaS crecerá 40%. AIAIAI mencionado en Forbes. XYZ pivotea modelo." },
      { daysAgo: 28, status: "failed" as const, itemIndices: [28, 29], summary: "Regulación IA en Chile avanza. Competidor ABC pierde talento clave." },
    ];

    for (const config of digestConfigs) {
      const items = config.itemIndices.map((idx) => {
        const isBrand = mockTitles[idx].includes("AIAIAI");
        const competitorMatch = mockTitles[idx].match(/Competidor (\w+)/);
        return {
          feedItemId: feedItemIds[idx],
          title: mockTitles[idx],
          relevanceScore: 60 + Math.floor(Math.random() * 40),
          brandMentions: isBrand ? ["AIAIAI Consulting"] : [],
          competitorMentions: competitorMatch ? [competitorMatch[1]] : [],
          sentiment: (["positive", "neutral", "negative"] as const)[idx % 3],
        };
      });

      const brandCount = items.filter((i) => i.brandMentions.length > 0).length;
      const competitorCount = items.filter((i) => i.competitorMentions.length > 0).length;
      const highRelevance = items.filter((i) => i.relevanceScore >= 80).length;

      const periodEnd = now - config.daysAgo * DAY;
      const periodStart = periodEnd - DAY;

      await ctx.db.insert("alertDigests", {
        createdAt: periodEnd,
        sentAt: config.status === "sent" ? periodEnd + 60000 : undefined,
        status: config.status,
        period: { start: periodStart, end: periodEnd },
        items,
        stats: {
          totalItems: items.length,
          highRelevance,
          brandMentionCount: brandCount,
          competitorMentionCount: competitorCount,
        },
        summary: config.summary,
      });
    }

    return { success: true, feedItemsCreated: 30, digestsCreated: 10 };
  },
});
