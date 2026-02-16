import { mutation } from "./_generated/server";

/**
 * Seeds a complete brand profile so the /brand page shows the Intelligence Hub
 * instead of redirecting to /onboarding.
 */
export const seed = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Clear existing brand profiles
    const existing = await ctx.db.query("brandProfiles").collect();
    for (const p of existing) {
      await ctx.db.delete(p._id);
    }

    // Clear existing brand sources
    const existingSources = await ctx.db.query("brandSources").collect();
    for (const s of existingSources) {
      await ctx.db.delete(s._id);
    }

    // Clear existing brand suggestions
    const existingSuggestions = await ctx.db.query("brandSuggestions").collect();
    for (const s of existingSuggestions) {
      await ctx.db.delete(s._id);
    }

    // Insert a realistic brand profile for a SaaS marketing agency
    const profileId = await ctx.db.insert("brandProfiles", {
      companyName: "NovaTech Solutions",
      industry: "SaaS / Marketing Technology",
      website: "https://novatech.io",
      description:
        "NovaTech Solutions es una plataforma de marketing impulsada por IA que ayuda a empresas B2B a automatizar su generación de demanda, crear contenido de alto impacto y optimizar sus campañas multicanal. Fundada en 2023, combinamos inteligencia artificial con estrategia humana para multiplicar los resultados de marketing.",
      voice: {
        tone: ["profesional", "innovador", "confiable", "directo"],
        personality: [
          "Experto accesible",
          "Data-driven",
          "Orientado a resultados",
          "Visionario pragmático",
        ],
        dos: [
          "Usar datos y métricas para respaldar afirmaciones",
          "Hablar de resultados concretos y ROI",
          "Mantener un tono conversacional pero profesional",
          "Explicar conceptos técnicos de forma simple",
          "Incluir ejemplos prácticos y casos de uso",
        ],
        donts: [
          "Usar jerga excesivamente técnica sin contexto",
          "Hacer promesas exageradas sin evidencia",
          "Sonar corporativo o impersonal",
          "Ignorar las preocupaciones del cliente",
          "Usar superlativos vacíos (el mejor, único, revolucionario)",
        ],
      },
      audience: {
        segments: [
          {
            name: "CMOs y VP de Marketing",
            demographics: "35-50 años, empresas B2B SaaS, $5M-$50M ARR",
            painPoints: [
              "Equipos de marketing pequeños para la demanda del negocio",
              "Dificultad para escalar producción de contenido sin perder calidad",
              "Falta de visibilidad sobre ROI de las acciones de marketing",
              "Presión para generar pipeline con presupuesto limitado",
            ],
          },
          {
            name: "Founders y CEOs de Startups",
            demographics: "28-45 años, startups Series A/B, equipos < 50",
            painPoints: [
              "No tienen equipo de marketing dedicado",
              "Necesitan resultados rápidos para reportar a inversores",
              "No saben por dónde empezar con marketing digital",
              "Budget limitado que necesita maximizar",
            ],
          },
          {
            name: "Marketing Managers",
            demographics: "27-40 años, equipos de 3-10, ejecutores tácticos",
            painPoints: [
              "Sobrecargados con tareas operativas repetitivas",
              "Dificultad para mantener consistencia en múltiples canales",
              "Falta de herramientas integradas (usan 10+ plataformas)",
              "Necesitan reportes que sus jefes entiendan",
            ],
          },
        ],
      },
      strategy: {
        topics: [
          "AI en Marketing",
          "Automatización B2B",
          "Generación de Demanda",
          "Content Marketing",
          "Growth Hacking",
          "Marketing Analytics",
          "SEO & Contenido Orgánico",
          "Email Marketing",
        ],
        channels: [
          "linkedin",
          "twitter",
          "blog",
          "email",
          "youtube",
        ],
        postingFrequency:
          "LinkedIn: 5x/semana, Twitter: 3x/semana, Blog: 2x/semana, Newsletter: 1x/semana, YouTube: 1x/mes",
      },
      competitors: [
        {
          name: "HubSpot",
          url: "https://hubspot.com",
          notes:
            "Líder en inbound marketing, pero costoso y complejo para equipos pequeños. Su IA es básica.",
        },
        {
          name: "Jasper AI",
          url: "https://jasper.ai",
          notes:
            "Fuerte en generación de contenido con IA, pero no tiene orquestación de agentes ni workflow automatizado.",
        },
        {
          name: "Copy.ai",
          url: "https://copy.ai",
          notes:
            "Buen producto para escritura, pero sin visión de departamento de marketing completo. Enfocado solo en copywriting.",
        },
      ],
      references: [
        "https://novatech.io/blog/ai-marketing-future",
        "https://novatech.io/case-studies/techcorp-3x-roi",
      ],
      visual: {
        primaryColor: "#FF6B35",
        secondaryColor: "#1C1917",
        accentColor: "#F59E0B",
        backgroundColor: "#FFFFFF",
        textColor: "#1C1917",
        logoDescription:
          "Isotipo geométrico con forma de estrella/nova en naranja, acompañado del logotipo 'NovaTech' en Geist Sans Bold",
        fontPrimary: "Geist Sans",
        fontSecondary: "Inter",
        styleNotes:
          "Estilo moderno y limpio. Usar gradientes sutiles de naranja a ámbar. Fondos oscuros para landing pages, fondos claros para dashboard. Fotografía real preferida sobre ilustraciones.",
      },
      socialHandles: {
        instagram: "novatech.io",
        linkedin: "company/novatech-solutions",
        twitter: "novatech_io",
        youtube: "@novatech-solutions",
      },
      messaging: {
        guide:
          "NovaTech es el guía experto que ha ayudado a cientos de empresas a transformar su marketing con IA. Somos el mentor tecnológico que simplifica lo complejo.",
        problem:
          "Los equipos de marketing están abrumados: demasiados canales, poco presupuesto, herramientas fragmentadas y presión constante por resultados. La IA promete ayudar pero la mayoría no sabe cómo implementarla.",
        solution:
          "Un departamento de marketing completo impulsado por 37 agentes de IA que trabajan 24/7, coordinados por una plataforma inteligente que aprende de tus datos y optimiza continuamente.",
        successVision:
          "Tu marketing funciona como una máquina bien aceitada: contenido de calidad publicándose en todos los canales, leads calificados entrando al pipeline, y métricas claras que demuestran el ROI a tu equipo directivo.",
        failureVision:
          "Seguir haciendo marketing manualmente mientras tus competidores automatizan. Perder market share, quemar presupuesto sin datos, y reportar a tus inversores sin métricas claras de crecimiento.",
        callToAction: "Agenda una demo personalizada y ve tus 37 agentes en acción",
      },
      positioning: {
        uniqueValue:
          "El único sistema que orquesta un departamento de marketing completo con 37 agentes de IA especializados, no solo genera contenido",
        category: "AI Marketing Automation Platform",
        differentiators: [
          "37 agentes especializados vs. un solo chatbot genérico",
          "Orquestación inteligente de workflows entre agentes",
          "Conocimiento de marca integrado en cada pieza de contenido",
          "Dashboard unificado con métricas cross-channel en tiempo real",
          "Setup en minutos, no en meses como soluciones enterprise",
        ],
        proofPoints: [
          "3x ROI promedio en los primeros 90 días",
          "85% reducción en tiempo de producción de contenido",
          "120+ empresas activas en la plataforma",
          "NPS de 72 entre clientes activos",
          "Certificado SOC 2 Type II",
        ],
      },
      maturityScore: 92,
      maturityLevel: "enriched",
      status: "complete",
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
    });

    // Add brand sources (schema: name, sourceType: url|feed|upload|note, status: active|pending|...)
    await ctx.db.insert("brandSources", {
      brandProfileId: profileId,
      name: "Sitio web principal",
      sourceType: "url",
      url: "https://novatech.io",
      status: "active",
      createdAt: now - 25 * 24 * 60 * 60 * 1000,
      updatedAt: now - 25 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSources", {
      brandProfileId: profileId,
      name: "Brand Guidelines v2.1",
      sourceType: "upload",
      fileType: "application/pdf",
      status: "active",
      createdAt: now - 20 * 24 * 60 * 60 * 1000,
      updatedAt: now - 20 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSources", {
      brandProfileId: profileId,
      name: "Blog corporativo",
      sourceType: "feed",
      url: "https://novatech.io/blog/rss",
      status: "active",
      createdAt: now - 15 * 24 * 60 * 60 * 1000,
      updatedAt: now - 15 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSources", {
      brandProfileId: profileId,
      name: "Notas de posicionamiento competitivo",
      sourceType: "note",
      content: "HubSpot domina enterprise pero deja hueco en SMB. Jasper y Copy.ai solo cubren contenido, no orquestación. Nuestra ventaja: departamento completo vs. herramienta individual.",
      status: "active",
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      updatedAt: now - 10 * 24 * 60 * 60 * 1000,
    });

    // Add brand suggestions (schema: category, title, description, priority, status, generatedAt)
    await ctx.db.insert("brandSuggestions", {
      brandProfileId: profileId,
      category: "voice",
      title: "Ampliar vocabulario técnico accesible",
      description:
        "Detectamos que tu audiencia responde bien a explicaciones técnicas simplificadas. Considera agregar un glosario de términos IA en tu blog y reutilizarlo en tus posts de LinkedIn.",
      priority: "high",
      status: "pending",
      generatedAt: now - 5 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSuggestions", {
      brandProfileId: profileId,
      category: "strategy",
      title: "Aprovechar tendencia de AI Agents",
      description:
        'El término "AI Agents" ha crecido 340% en búsquedas el último trimestre. Posicionar contenido sobre este tema podría capturar tráfico orgánico significativo.',
      priority: "high",
      status: "pending",
      generatedAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSuggestions", {
      brandProfileId: profileId,
      category: "visual",
      title: "Mejorar consistencia en thumbnails de YouTube",
      description:
        "Los thumbnails de tus videos no siguen una plantilla consistente. Crear un sistema de thumbnails con tu paleta de colores aumentará el reconocimiento de marca.",
      priority: "medium",
      status: "accepted",
      generatedAt: now - 7 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("brandSuggestions", {
      brandProfileId: profileId,
      category: "audience",
      title: "Nuevo segmento: Agencias de Marketing",
      description:
        "Hemos detectado interés creciente de agencias de marketing que quieren usar NovaTech como white-label para sus clientes. Evalúa crear un programa de partners.",
      priority: "medium",
      status: "pending",
      generatedAt: now - 1 * 24 * 60 * 60 * 1000,
    });

    return {
      profileId,
      message: "Brand profile seeded: NovaTech Solutions (complete, enriched) with 4 sources and 4 suggestions",
    };
  },
});
