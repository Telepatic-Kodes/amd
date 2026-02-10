import { mutation } from "./_generated/server";

/**
 * Seed data para el cliente: Umo Recolector
 * Marca B2C de inciensos artesanales - Foco Instagram + TikTok
 *
 * Ejecutar: npx convex run seedUmoRecolector:seedBrandProfile
 */

export const seedBrandProfile = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Check if profile already exists
    const existing = await ctx.db
      .query("brandProfiles")
      .filter((q) => q.eq(q.field("companyName"), "Umo Recolector"))
      .first();

    if (existing) {
      throw new Error("Brand profile for Umo Recolector already exists. Use updateBrandProfile instead.");
    }

    const profileId = await ctx.db.insert("brandProfiles", {
      companyName: "Umo Recolector",
      industry: "Inciensos artesanales / Bienestar natural",
      website: "", // TODO: agregar URL cuando exista
      description:
        "Umo Recolector es una marca artesanal de inciensos naturales. Recolectamos resinas, hierbas y maderas aromáticas de origen silvestre y las transformamos en inciensos únicos, hechos a mano con respeto por la naturaleza y las tradiciones ancestrales. Cada producto cuenta una historia de origen, proceso y conexión con la tierra.",

      voice: {
        tone: [
          "Cálido y cercano",
          "Natural y auténtico",
          "Pausado, sin urgencia comercial",
          "Sensorial — evoca aromas, texturas, paisajes",
        ],
        personality: [
          "Artesano que comparte su oficio",
          "Explorador de aromas naturales",
          "Respetuoso con la naturaleza y las tradiciones",
          "Honesto sobre ingredientes y procesos",
        ],
        dos: [
          "Hablar del origen de cada ingrediente",
          "Usar lenguaje sensorial (aromas, texturas, colores)",
          "Mostrar el proceso artesanal detrás de cada producto",
          "Conectar con rituales cotidianos (meditación, descanso, lectura)",
          "Usar primera persona plural: nosotros recolectamos, preparamos",
          "Incluir datos sobre ingredientes naturales y sus propiedades",
        ],
        donts: [
          "No usar lenguaje agresivo de venta (COMPRA YA, OFERTA)",
          "No prometer beneficios medicinales o terapéuticos sin respaldo",
          "No usar jerga espiritual excesiva o new age forzada",
          "No compararse directamente con competidores",
          "No usar emojis en exceso — máximo 2-3 por post",
          "No publicar contenido genérico sin conexión con la marca",
        ],
      },

      audience: {
        segments: [
          {
            name: "Buscadores de bienestar natural",
            demographics: "25-45 años, urbanos, interesados en wellness y mindfulness",
            painPoints: [
              "Inciensos comerciales con químicos sintéticos",
              "Falta de transparencia en ingredientes",
              "Quieren rituales personales pero no saben por dónde empezar",
              "Buscan productos auténticos, no industriales",
            ],
          },
          {
            name: "Amantes de lo artesanal y local",
            demographics: "28-50 años, valoran el comercio justo y lo hecho a mano",
            painPoints: [
              "Difícil encontrar productos artesanales genuinos online",
              "Desconfianza en marcas que dicen ser naturales sin serlo",
              "Quieren conocer al productor y su historia",
            ],
          },
          {
            name: "Comunidad yoga / meditación",
            demographics: "22-40 años, practican yoga, meditación o rituales de autocuidado",
            painPoints: [
              "Inciensos baratos que irritan o huelen artificial",
              "Buscan aromas que complementen su práctica",
              "Quieren variedad de aromas para diferentes momentos",
            ],
          },
        ],
      },

      strategy: {
        topics: [
          "Proceso de recolección y elaboración artesanal",
          "Ingredientes naturales: resinas, hierbas, maderas",
          "Rituales cotidianos con incienso",
          "Beneficios de aromaterapia natural",
          "Historias de origen de cada ingrediente",
          "Behind the scenes del taller",
          "Guías de uso y combinación de aromas",
          "Sostenibilidad y respeto por la naturaleza",
        ],
        channels: [
          "Instagram",
          "TikTok",
        ],
        postingFrequency: "Instagram: 4-5 posts/semana + stories diarios. TikTok: 3-4 videos/semana.",
      },

      competitors: [
        {
          name: "Inciensos Sagrados",
          notes: "Marca chilena de inciensos naturales, tono más espiritual",
        },
        {
          name: "Palo Santo Supply Co",
          notes: "Internacional, muy bien posicionada en Instagram, packaging premium",
        },
        {
          name: "Satya Incense",
          notes: "Marca masiva india, referencia de mercado pero industrial",
        },
      ],

      visual: {
        primaryColor: "#8B7355",   // Marrón tierra cálido
        secondaryColor: "#D4C5A9", // Beige arena natural
        logoDescription: "Tipografía serif orgánica con elemento de humo sutil",
        styleNotes: "Fotografía natural con luz cálida. Texturas de madera, lino, resinas. Paleta terrosa con acentos de verde bosque. Minimalista pero cálido. Videos con ritmo pausado, planos detalle de ingredientes y humo.",
      },

      status: "complete",
      createdAt: now,
      updatedAt: now,
    });

    // Also create the onboarding record
    await ctx.db.insert("onboarding", {
      companyName: "Umo Recolector",
      industry: "Inciensos artesanales / Bienestar natural",
      description:
        "Marca artesanal de inciensos naturales. Recolección silvestre, elaboración a mano, conexión con la tierra.",
      goals: [
        "Construir comunidad en Instagram y TikTok",
        "Posicionar como marca premium artesanal",
        "Generar contenido visual que muestre el proceso",
        "Educar sobre ingredientes naturales vs sintéticos",
      ],
      channels: ["Instagram", "TikTok"],
      feeds: [],
      departments: ["content", "social", "brand"],
      completedAt: now,
    });

    return {
      profileId,
      message: "Brand profile for Umo Recolector created successfully. Run seedFeeds next.",
    };
  },
});

/**
 * Seed RSS feeds relevantes para Umo Recolector
 * 12 feeds verificados en 4 categorías
 *
 * Ejecutar: npx convex run seedUmoRecolector:seedFeeds
 */
export const seedFeeds = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let skipped = 0;

    const feeds = [
      // WELLNESS / AROMATHERAPY
      {
        name: "Tisserand Institute",
        url: "https://tisserandinstitute.org/feed/",
        category: "wellness",
        syncFrequency: "daily" as const,
      },
      {
        name: "School of Essentria",
        url: "https://www.schoolofessentria.com/blog?format=rss",
        category: "wellness",
        syncFrequency: "weekly" as const,
      },
      {
        name: "Tiny Buddha",
        url: "https://tinybuddha.com/feed/",
        category: "wellness",
        syncFrequency: "daily" as const,
      },

      // ARTISANAL / HANDMADE
      {
        name: "Craft Gossip",
        url: "https://craftgossip.com/feed/",
        category: "artisanal",
        syncFrequency: "daily" as const,
      },
      {
        name: "Make: DIY Projects",
        url: "https://makezine.com/feed/",
        category: "artisanal",
        syncFrequency: "daily" as const,
      },

      // SOCIAL MEDIA MARKETING
      {
        name: "Social Media Examiner",
        url: "https://www.socialmediaexaminer.com/feed/",
        category: "marketing",
        syncFrequency: "daily" as const,
      },
      {
        name: "Hootsuite Blog",
        url: "https://blog.hootsuite.com/feed/",
        category: "marketing",
        syncFrequency: "daily" as const,
      },
      {
        name: "Sprout Social Insights",
        url: "https://sproutsocial.com/insights/feed/",
        category: "marketing",
        syncFrequency: "daily" as const,
      },
      {
        name: "HubSpot Marketing",
        url: "https://blog.hubspot.com/marketing/rss.xml",
        category: "marketing",
        syncFrequency: "daily" as const,
      },

      // SUSTAINABILITY / NATURAL PRODUCTS
      {
        name: "Sustainable Jungle",
        url: "https://www.sustainablejungle.com/feed/",
        category: "sustainability",
        syncFrequency: "daily" as const,
      },
      {
        name: "Green Matters",
        url: "https://www.greenmatters.com/rss",
        category: "sustainability",
        syncFrequency: "daily" as const,
      },
      {
        name: "Earth911",
        url: "https://earth911.com/feed/",
        category: "sustainability",
        syncFrequency: "daily" as const,
      },
    ];

    for (const feed of feeds) {
      // Skip duplicates
      const existing = await ctx.db
        .query("feeds")
        .withIndex("by_url", (q) => q.eq("url", feed.url))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("feeds", {
        feedId: crypto.randomUUID(),
        url: feed.url,
        name: feed.name,
        category: feed.category,
        status: "active",
        syncFrequency: feed.syncFrequency,
        consecutiveErrors: 0,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return {
      created,
      skipped,
      total: feeds.length,
      message: `${created} feeds created, ${skipped} skipped (duplicates)`,
    };
  },
});
