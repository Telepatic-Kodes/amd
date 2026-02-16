/**
 * Seed: Knowledge Base with documents and sections
 *
 * Run: npx convex run seedKnowledgeBase:seed
 */

import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // Check if already seeded
    const existing = await ctx.db.query("knowledgeBases").first();
    if (existing) {
      // Clear existing KB data for clean seed
      const allKBs = await ctx.db.query("knowledgeBases").collect();
      for (const kb of allKBs) {
        const docs = await ctx.db
          .query("kbDocuments")
          .withIndex("by_kbId", (q) => q.eq("kbId", kb._id))
          .collect();
        for (const doc of docs) {
          const sections = await ctx.db
            .query("kbSections")
            .withIndex("by_documentId", (q) => q.eq("documentId", doc._id))
            .collect();
          for (const s of sections) await ctx.db.delete(s._id);
          await ctx.db.delete(doc._id);
        }
        await ctx.db.delete(kb._id);
      }
    }

    // ─── KB 1: Brand Identity ───────────────────────────
    const kb1 = await ctx.db.insert("knowledgeBases", {
      kbId: "kb-brand-001",
      name: "Identidad de Marca",
      description:
        "Guía completa de identidad visual, tono de voz, valores y posicionamiento de marca.",
      category: "brand",
      status: "active",
      visibility: ["all"],
      metadata: {
        documentCount: 2,
        totalSizeBytes: 245000,
        lastProcessedAt: now - 2 * DAY,
      },
      createdAt: now - 30 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const doc1a = await ctx.db.insert("kbDocuments", {
      documentId: "doc-brand-guide",
      kbId: kb1,
      name: "Brand_Guidelines_2026.pdf",
      sourceType: "upload",
      fileType: "pdf",
      status: "processed",
      metadata: { sizeBytes: 185000, pageCount: 24 },
      createdAt: now - 30 * DAY,
      processedAt: now - 29 * DAY,
    });

    const doc1b = await ctx.db.insert("kbDocuments", {
      documentId: "doc-tone-voice",
      kbId: kb1,
      name: "Tone_of_Voice_Manual.md",
      sourceType: "upload",
      fileType: "md",
      status: "processed",
      metadata: { sizeBytes: 60000, pageCount: 8 },
      createdAt: now - 28 * DAY,
      processedAt: now - 28 * DAY,
    });

    // Sections for Brand Guidelines
    const brandSections = [
      {
        title: "Misión y Visión",
        content:
          "Nuestra misión es democratizar el marketing de alto rendimiento mediante inteligencia artificial. Creemos que cada empresa merece acceso a estrategias de marketing que antes solo estaban disponibles para grandes corporaciones. Nuestra visión es ser la plataforma líder en automatización de marketing inteligente en Latinoamérica para 2028.",
        keywords: ["misión", "visión", "posicionamiento", "marketing IA"],
        topics: ["estrategia", "brand"],
        relevanceScore: 95,
      },
      {
        title: "Valores de Marca",
        content:
          "1. Innovación Responsable: Adoptamos tecnología de punta pero siempre con ética y transparencia. 2. Resultados Medibles: Cada acción se traduce en métricas concretas. 3. Simplicidad Poderosa: Interfaces intuitivas que esconden complejidad técnica. 4. Colaboración Humano-IA: La IA ejecuta, los humanos definen estrategia.",
        keywords: ["valores", "ética", "innovación", "resultados"],
        topics: ["cultura", "brand"],
        relevanceScore: 90,
      },
      {
        title: "Paleta de Colores",
        content:
          "Color primario: Naranja (#F97316) — Representa energía, creatividad y acción. Secundario: Slate (#1E293B) — Profesionalismo y confianza. Acento: Amber (#F59E0B) — Alertas y highlights. Fondos: White (#FFFFFF) para light mode, Zinc-950 (#09090B) para dark mode. Nunca usar más de 3 colores en una pieza.",
        keywords: ["colores", "paleta", "naranja", "diseño"],
        topics: ["diseño", "identidad visual"],
        relevanceScore: 88,
      },
      {
        title: "Tipografía",
        content:
          "Fuente principal: Inter — Usada en UI, headings y body text. Pesos: Regular (400) para body, Medium (500) para labels, Semibold (600) para headings, Bold (700) para títulos principales. Tamaños: 14px body, 16px lead, 20px h3, 24px h2, 32px h1. Line-height: 1.5 para body, 1.2 para headings.",
        keywords: ["tipografía", "fuentes", "Inter", "diseño"],
        topics: ["diseño", "identidad visual"],
        relevanceScore: 85,
      },
      {
        title: "Logo y Uso",
        content:
          "El logo AMD combina un ícono de circuito neural con tipografía bold. Siempre mantener zona de exclusión de 1x la altura del ícono. Versiones disponibles: full color, monocromático blanco, monocromático negro. Tamaño mínimo: 32px de altura en digital, 15mm en print. Nunca distorsionar, rotar o cambiar colores del logo.",
        keywords: ["logo", "marca", "identidad", "uso correcto"],
        topics: ["identidad visual", "brand"],
        relevanceScore: 92,
      },
    ];

    for (let i = 0; i < brandSections.length; i++) {
      const s = brandSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-brand-${i + 1}`,
        kbId: kb1,
        documentId: doc1a,
        title: s.title,
        content: s.content,
        contentHash: `hash-brand-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: s.topics,
        keywords: s.keywords,
        relevanceScore: s.relevanceScore,
        processed: true,
        processedAt: now - 29 * DAY,
        createdAt: now - 29 * DAY,
      });
    }

    // Sections for Tone of Voice
    const toneSections = [
      {
        title: "Tono General",
        content:
          "Nuestro tono es profesional pero accesible. Evitamos jerga técnica innecesaria. Hablamos como un experto que explica con claridad, no como un académico que impresiona. Usamos 'nosotros' cuando hablamos de la empresa, 'tú' cuando nos dirigimos al usuario. Siempre en español latinoamericano neutro.",
        keywords: ["tono", "voz", "comunicación", "estilo"],
      },
      {
        title: "Estilo de Escritura",
        content:
          "Frases cortas y directas. Párrafos de máximo 3-4 líneas. Bullet points para listas de más de 3 items. Verbos activos sobre pasivos. Números concretos sobre adjetivos vagos: 'aumentó 34%' en vez de 'mejoró significativamente'. Headlines que informan, no que solo llaman la atención.",
        keywords: ["escritura", "estilo", "redacción", "contenido"],
      },
      {
        title: "Lo Que Somos vs No Somos",
        content:
          "SOMOS: Claros, directos, orientados a resultados, educativos, colaborativos, optimistas realistas. NO SOMOS: Agresivos, hiperbólicos, condescendientes, demasiado técnicos, vagos, prometiendo resultados imposibles. Nunca decir 'garantizamos resultados' — siempre 'trabajamos para optimizar'.",
        keywords: ["personalidad", "marca", "comunicación", "guidelines"],
      },
    ];

    for (let i = 0; i < toneSections.length; i++) {
      const s = toneSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-tone-${i + 1}`,
        kbId: kb1,
        documentId: doc1b,
        title: s.title,
        content: s.content,
        contentHash: `hash-tone-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: ["tono de voz", "comunicación"],
        keywords: s.keywords,
        relevanceScore: 85,
        processed: true,
        processedAt: now - 28 * DAY,
        createdAt: now - 28 * DAY,
      });
    }

    // ─── KB 2: Productos y Servicios ────────────────────
    const kb2 = await ctx.db.insert("knowledgeBases", {
      kbId: "kb-products-001",
      name: "Catálogo de Productos",
      description:
        "Información detallada de planes, features, precios y comparativas de la plataforma AMD.",
      category: "products",
      status: "active",
      visibility: ["all"],
      metadata: {
        documentCount: 1,
        totalSizeBytes: 120000,
        lastProcessedAt: now - 5 * DAY,
      },
      createdAt: now - 20 * DAY,
      updatedAt: now - 5 * DAY,
    });

    const doc2a = await ctx.db.insert("kbDocuments", {
      documentId: "doc-product-catalog",
      kbId: kb2,
      name: "Product_Catalog_2026.pdf",
      sourceType: "upload",
      fileType: "pdf",
      status: "processed",
      metadata: { sizeBytes: 120000, pageCount: 16 },
      createdAt: now - 20 * DAY,
      processedAt: now - 19 * DAY,
    });

    const productSections = [
      {
        title: "Plan Starter",
        content:
          "Plan ideal para startups y emprendedores. Incluye 5 agentes activos, 10.000 tokens/mes, 1 campaña simultánea, dashboard básico, reportes semanales. Precio: $49 USD/mes. Ideal para empresas que están comenzando su estrategia de marketing digital y quieren automatizar tareas repetitivas.",
        keywords: ["starter", "plan", "precio", "emprendedor"],
      },
      {
        title: "Plan Professional",
        content:
          "Para empresas en crecimiento. Incluye 15 agentes activos, 100.000 tokens/mes, 5 campañas simultáneas, dashboard completo, reportes diarios, API access, integraciones con CRM. Precio: $199 USD/mes. El plan más popular — 67% de nuestros clientes lo eligen.",
        keywords: ["professional", "plan", "precio", "crecimiento"],
      },
      {
        title: "Plan Enterprise",
        content:
          "Solución completa para grandes empresas. 37 agentes activos (todos), tokens ilimitados, campañas ilimitadas, dashboard enterprise, reportes en tiempo real, API priority, SLA 99.9%, account manager dedicado, custom integrations. Precio: Custom — contactar ventas.",
        keywords: ["enterprise", "plan", "precio", "corporativo"],
      },
      {
        title: "Features Principales",
        content:
          "1. 37 Agentes IA especializados en 6 departamentos de marketing. 2. Orquestación automática con handoffs entre agentes. 3. Content Management System completo (draft → review → publish). 4. Analytics en tiempo real con métricas de ROI. 5. Knowledge Base para entrenar agentes con datos de la empresa. 6. Campañas multicanal automatizadas.",
        keywords: ["features", "funcionalidades", "plataforma", "marketing"],
      },
    ];

    for (let i = 0; i < productSections.length; i++) {
      const s = productSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-prod-${i + 1}`,
        kbId: kb2,
        documentId: doc2a,
        title: s.title,
        content: s.content,
        contentHash: `hash-prod-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: ["producto", "pricing"],
        keywords: s.keywords,
        relevanceScore: 90,
        processed: true,
        processedAt: now - 19 * DAY,
        createdAt: now - 19 * DAY,
      });
    }

    // ─── KB 3: Buyer Personas ───────────────────────────
    const kb3 = await ctx.db.insert("knowledgeBases", {
      kbId: "kb-personas-001",
      name: "Buyer Personas",
      description:
        "Perfiles detallados de los segmentos de clientes ideales con pain points y motivaciones.",
      category: "personas",
      status: "active",
      visibility: ["content", "social", "demandgen"],
      metadata: {
        documentCount: 1,
        totalSizeBytes: 95000,
        lastProcessedAt: now - 7 * DAY,
      },
      createdAt: now - 15 * DAY,
      updatedAt: now - 7 * DAY,
    });

    const doc3a = await ctx.db.insert("kbDocuments", {
      documentId: "doc-buyer-personas",
      kbId: kb3,
      name: "Buyer_Personas_Research.docx",
      sourceType: "upload",
      fileType: "docx",
      status: "processed",
      metadata: { sizeBytes: 95000, pageCount: 12 },
      createdAt: now - 15 * DAY,
      processedAt: now - 14 * DAY,
    });

    const personaSections = [
      {
        title: "Persona: María — CMO de Startup",
        content:
          "María, 35 años, CMO en startup tech Series A (15-50 empleados). Pain points: equipo de marketing de 2 personas, no puede contratar más, necesita escalar contenido y campañas. Motivación: demostrar ROI al board, automatizar tareas repetitivas. Canales: LinkedIn (diario), Twitter (semanal), newsletters. Budget: $2K-5K/mes en herramientas.",
        keywords: ["persona", "CMO", "startup", "María"],
      },
      {
        title: "Persona: Carlos — Director de Marketing Corp",
        content:
          "Carlos, 45 años, Director de Marketing en empresa mediana (200-500 empleados). Pain points: coordinar 8 personas, reportes manuales, silos entre equipos. Motivación: eficiencia operacional, datos centralizados, reducir tiempo de ejecución. Canales: Email (primary), LinkedIn, eventos. Budget: $10K-25K/mes en herramientas.",
        keywords: ["persona", "director", "corporativo", "Carlos"],
      },
      {
        title: "Persona: Ana — Freelancer de Marketing",
        content:
          "Ana, 28 años, consultora freelance de marketing digital con 5-10 clientes. Pain points: gestionar múltiples marcas, crear contenido para cada una, escalar sin contratar. Motivación: atender más clientes sin burnout, profesionalizar entregas. Canales: Instagram, LinkedIn, WhatsApp. Budget: $50-200/mes por cliente.",
        keywords: ["persona", "freelancer", "consultora", "Ana"],
      },
    ];

    for (let i = 0; i < personaSections.length; i++) {
      const s = personaSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-persona-${i + 1}`,
        kbId: kb3,
        documentId: doc3a,
        title: s.title,
        content: s.content,
        contentHash: `hash-persona-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: ["buyer persona", "segmentación"],
        keywords: s.keywords,
        relevanceScore: 88,
        processed: true,
        processedAt: now - 14 * DAY,
        createdAt: now - 14 * DAY,
      });
    }

    // ─── KB 4: Content Guidelines ───────────────────────
    const kb4 = await ctx.db.insert("knowledgeBases", {
      kbId: "kb-guidelines-001",
      name: "Guía de Contenido",
      description:
        "Reglas editoriales, formatos por canal, mejores prácticas SEO y templates de contenido.",
      category: "guidelines",
      status: "active",
      visibility: ["content", "social", "seo"],
      metadata: {
        documentCount: 2,
        totalSizeBytes: 180000,
        lastProcessedAt: now - 3 * DAY,
      },
      createdAt: now - 25 * DAY,
      updatedAt: now - 3 * DAY,
    });

    const doc4a = await ctx.db.insert("kbDocuments", {
      documentId: "doc-editorial-guide",
      kbId: kb4,
      name: "Editorial_Guidelines.md",
      sourceType: "upload",
      fileType: "md",
      status: "processed",
      metadata: { sizeBytes: 100000, pageCount: 14 },
      createdAt: now - 25 * DAY,
      processedAt: now - 24 * DAY,
    });

    const doc4b = await ctx.db.insert("kbDocuments", {
      documentId: "doc-seo-playbook",
      kbId: kb4,
      name: "SEO_Content_Playbook.pdf",
      sourceType: "upload",
      fileType: "pdf",
      status: "processed",
      metadata: { sizeBytes: 80000, pageCount: 10 },
      createdAt: now - 22 * DAY,
      processedAt: now - 21 * DAY,
    });

    const editorialSections = [
      {
        title: "Formato Blog Posts",
        content:
          "Largo ideal: 1,500-2,500 palabras. Estructura: H1 (título SEO), intro hook (2-3 líneas), H2 (3-5 secciones), bullet points para listas, CTA final. Siempre incluir: meta description (150-160 chars), 1-2 imágenes, internal links (mín 2), external links (mín 1 de autoridad). Publicar martes y jueves a las 9:00 AM CLT.",
        keywords: ["blog", "formato", "estructura", "publicación"],
      },
      {
        title: "Formato LinkedIn",
        content:
          "Posts: 150-300 palabras. Hook en primera línea (pregunta o dato impactante). Usar line breaks cada 2-3 líneas. Máximo 5 hashtags relevantes. Emojis: usar con moderación (1-3 por post). Mejor horario: Martes-Jueves 8:00-10:00 AM. Carousel: 8-12 slides, texto grande legible en mobile.",
        keywords: ["LinkedIn", "formato", "social media", "B2B"],
      },
      {
        title: "Formato Twitter/X",
        content:
          "Tweets: máximo 280 chars, idealmente 100-200. Threads: 5-10 tweets, primer tweet es el hook. Usar datos/estadísticas concretas. CTAs claros al final del thread. Hashtags: 1-2 máximo. Frecuencia: 3-5 tweets/día, 1 thread/semana. Responder mentions en < 2 horas durante horario laboral.",
        keywords: ["Twitter", "X", "formato", "threads"],
      },
      {
        title: "Formato Email/Newsletter",
        content:
          "Subject line: 40-50 chars, personalizada. Preview text: complementa el subject, no lo repite. Estructura: saludo → 1 insight principal → 2-3 items secundarios → CTA. Largo total: 500-800 palabras. Links: máximo 5 por email. Enviar martes o jueves a las 10:00 AM. A/B test subjects con 10% de la lista.",
        keywords: ["email", "newsletter", "formato", "nurturing"],
      },
    ];

    for (let i = 0; i < editorialSections.length; i++) {
      const s = editorialSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-editorial-${i + 1}`,
        kbId: kb4,
        documentId: doc4a,
        title: s.title,
        content: s.content,
        contentHash: `hash-editorial-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: ["editorial", "formato"],
        keywords: s.keywords,
        relevanceScore: 92,
        processed: true,
        processedAt: now - 24 * DAY,
        createdAt: now - 24 * DAY,
      });
    }

    const seoSections = [
      {
        title: "Keyword Research Process",
        content:
          "Paso 1: Listar 10-15 seed keywords del negocio. Paso 2: Expandir con variaciones long-tail (3-5 palabras). Paso 3: Analizar volumen (mín 100 búsquedas/mes), difficulty (target < 40 para empezar), intent (informational, transactional, navigational). Paso 4: Priorizar por impact score = volumen × (100 - difficulty) × intent_match.",
        keywords: ["keyword", "SEO", "research", "proceso"],
      },
      {
        title: "On-Page SEO Checklist",
        content:
          "Title tag: keyword principal al inicio, < 60 chars. Meta description: incluir keyword, CTA, < 160 chars. H1: único por página, incluye keyword. URL: corta, con keyword, sin stop words. First paragraph: keyword en las primeras 100 palabras. Images: alt text descriptivo con keyword. Internal linking: mín 2-3 links relevantes por página.",
        keywords: ["SEO", "on-page", "checklist", "optimización"],
      },
      {
        title: "Content Performance KPIs",
        content:
          "Métricas primarias: Organic traffic (Google Analytics), Keyword rankings (top 10), Conversion rate by content. Métricas secundarias: Time on page (target > 3 min), Bounce rate (target < 60%), Social shares, Backlinks earned. Reportar semanalmente, revisar strategy mensualmente. Goal: 20% growth MoM en organic traffic.",
        keywords: ["KPIs", "métricas", "performance", "analytics"],
      },
    ];

    for (let i = 0; i < seoSections.length; i++) {
      const s = seoSections[i];
      await ctx.db.insert("kbSections", {
        sectionId: `sec-seo-${i + 1}`,
        kbId: kb4,
        documentId: doc4b,
        title: s.title,
        content: s.content,
        contentHash: `hash-seo-${i + 1}-${now}`,
        order: i,
        metadata: { wordCount: s.content.split(" ").length },
        topics: ["SEO", "optimización"],
        keywords: s.keywords,
        relevanceScore: 90,
        processed: true,
        processedAt: now - 21 * DAY,
        createdAt: now - 21 * DAY,
      });
    }

    return {
      created: {
        knowledgeBases: 4,
        documents: 6,
        sections:
          brandSections.length +
          toneSections.length +
          productSections.length +
          personaSections.length +
          editorialSections.length +
          seoSections.length,
      },
    };
  },
});
