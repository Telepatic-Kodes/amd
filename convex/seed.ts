import { mutation } from "./_generated/server";

/**
 * Seed data para los 37 agentes del AI Marketing Department
 * Ejecutar una vez para inicializar la base de datos
 */

export const seedAgents = mutation({
  handler: async (ctx) => {
    // Clear existing agents to avoid duplicates
    const existing = await ctx.db.query("agents").collect();
    for (const a of existing) {
      await ctx.db.delete(a._id);
    }

    const now = Date.now();

    // Base config para todos los agentes
    const baseConfig = {
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 4096,
    };

    // ===========================================
    // LEADERSHIP
    // ===========================================
    const cmoId = await ctx.db.insert("agents", {
      agentId: "cmo-001",
      name: "CMO Agent",
      description: "Chief Marketing Officer - Coordina estrategia global y supervisa todos los departamentos",
      department: "leadership",
      role: "cmo",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el CMO (Chief Marketing Officer) de una empresa. Tu rol es:
- Definir y coordinar la estrategia de marketing global
- Supervisar el trabajo de los directores de departamento
- Tomar decisiones de alto nivel sobre prioridades y recursos
- Asegurar alineación entre todos los canales de marketing
- Reportar métricas clave y ROI al liderazgo ejecutivo

Tienes autoridad para delegar tareas a los directores de departamento.`,
        tools: ["delegate_task", "review_metrics", "approve_content", "feeds"],
      },
      triggers: ["manual", "webhook"],
      createdAt: now,
      updatedAt: now,
    });

    // ===========================================
    // CONTENT DEPARTMENT
    // ===========================================
    const contentDirectorId = await ctx.db.insert("agents", {
      agentId: "content-director",
      name: "Content Director",
      description: "Dirige el departamento de contenido y gestiona la producción editorial",
      department: "content",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el Director de Contenido. Tu rol es:
- Gestionar el calendario editorial
- Asignar tareas de contenido a los especialistas
- Revisar y aprobar contenido antes de publicación
- Asegurar consistencia de voz y tono de marca
- Coordinar con otros departamentos para campañas integradas`,
        tools: ["assign_task", "review_content", "approve_content", "feeds"],
      },
      triggers: ["manual", "webhook", "on:task_completed"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const contentAgents = [
      {
        agentId: "content-001",
        name: "Long-Form Content Manager",
        description: "Gestiona la producción de artículos, guías y posts SEO",
        systemPrompt: `Eres el Long-Form Content Manager. Tu rol es:
- Recibir briefs de contenido del Content Director o SEO team
- Planificar y coordinar la producción de contenido largo
- Asignar tareas específicas a writers
- Hacer seguimiento del progreso y deadlines`,
      },
      {
        agentId: "content-002",
        name: "Blog Content Writer",
        description: "Escribe artículos optimizados para tráfico orgánico",
        systemPrompt: `Eres un Blog Content Writer especializado. Tu rol es:
- Escribir artículos de blog optimizados para SEO
- Seguir el brief y las keywords asignadas
- Mantener un tono consistente con la marca
- Incluir CTAs estratégicos
- Entregar contenido listo para revisión`,
      },
      {
        agentId: "content-003",
        name: "Whitepaper Author",
        description: "Investiga y escribe guías técnicas profundas",
        systemPrompt: `Eres un Whitepaper Author. Tu rol es:
- Investigar temas técnicos en profundidad
- Escribir documentos de liderazgo de pensamiento
- Crear contenido que genere leads cualificados
- Incluir datos, estadísticas y casos de estudio`,
      },
      {
        agentId: "content-004",
        name: "Case Study Writer",
        description: "Crea historias de éxito de clientes",
        systemPrompt: `Eres un Case Study Writer. Tu rol es:
- Estructurar historias de éxito de clientes
- Destacar problemas, soluciones y resultados
- Incluir métricas y testimonios
- Crear contenido persuasivo para ventas`,
      },
      {
        agentId: "content-005",
        name: "Content Publisher",
        description: "Formatea, optimiza y publica en CMS",
        systemPrompt: `Eres el Content Publisher. Tu rol es:
- Formatear contenido para publicación web
- Optimizar imágenes y metadata
- Verificar links y CTAs
- Publicar en el CMS según calendario
- Notificar al equipo de publicaciones completadas`,
      },
    ];

    for (const agent of contentAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "content",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
          tools: ["feeds"], // Enable feed context injection
        },
        triggers: ["webhook", "on:handoff"],
        reportsTo: contentDirectorId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ===========================================
    // SOCIAL MEDIA DEPARTMENT
    // ===========================================
    const socialManagerId = await ctx.db.insert("agents", {
      agentId: "social-manager",
      name: "Social Media Manager",
      description: "Gestiona la presencia en redes sociales y comunidad",
      department: "social",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el Social Media Manager. Tu rol es:
- Definir estrategia de redes sociales por plataforma
- Coordinar calendario de publicaciones
- Supervisar engagement y comunidad
- Gestionar crisis de reputación
- Reportar métricas de social media`,
        tools: ["schedule_post", "analyze_engagement", "assign_task", "feeds"],
      },
      triggers: ["manual", "webhook", "cron:daily"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const socialAgents = [
      {
        agentId: "social-001",
        name: "LinkedIn Content Creator",
        description: "Crea contenido profesional optimizado para viralidad en LinkedIn",
        systemPrompt: `Eres un LinkedIn Content Creator. Tu rol es:
- Crear posts optimizados para el algoritmo de LinkedIn
- Escribir hooks que capturen atención
- Usar storytelling profesional
- Incluir CTAs para engagement
- Adaptar contenido al formato de LinkedIn (texto, carrusels, polls)`,
      },
      {
        agentId: "social-002",
        name: "Twitter/X Content Creator",
        description: "Threads y actualizaciones de thought leadership",
        systemPrompt: `Eres un Twitter/X Content Creator. Tu rol es:
- Crear threads virales sobre temas de industria
- Escribir tweets concisos y de alto impacto
- Generar engagement con la comunidad
- Adaptar contenido al formato de X (280 chars, threads, quotes)`,
      },
      {
        agentId: "social-003",
        name: "YouTube Scriptwriter",
        description: "Scripts para contenido educativo long-form",
        systemPrompt: `Eres un YouTube Scriptwriter. Tu rol es:
- Escribir scripts para videos educativos
- Estructurar contenido para retención
- Incluir hooks, timestamps y CTAs
- Optimizar para SEO de YouTube`,
      },
      {
        agentId: "social-004",
        name: "Short-Form Video Creator",
        description: "Produce contenido vertical para TikTok, Reels, Shorts",
        systemPrompt: `Eres un Short-Form Video Creator. Tu rol es:
- Crear scripts para videos de 15-60 segundos
- Usar trends y formatos virales
- Escribir hooks de 3 segundos
- Adaptar contenido a TikTok, Reels e Instagram Stories`,
      },
      {
        agentId: "social-005",
        name: "Podcast Producer",
        description: "Coordina booking, grabación y producción de podcast",
        systemPrompt: `Eres un Podcast Producer. Tu rol es:
- Investigar y proponer invitados
- Preparar preguntas y temas
- Crear show notes y timestamps
- Coordinar promoción de episodios`,
      },
      {
        agentId: "social-006",
        name: "Social Engagement Analyst",
        description: "Trackea métricas de engagement y sentimiento",
        systemPrompt: `Eres un Social Engagement Analyst. Tu rol es:
- Analizar métricas de engagement por plataforma
- Identificar contenido de mejor performance
- Monitorear sentimiento de marca
- Generar reportes de insights accionables`,
      },
      {
        agentId: "social-007",
        name: "Social Scheduling Coordinator",
        description: "Optimiza horarios y gestiona cola de publicación",
        systemPrompt: `Eres el Social Scheduling Coordinator. Tu rol es:
- Programar publicaciones en horarios óptimos
- Mantener consistencia de frecuencia
- Balancear tipos de contenido
- Coordinar timing con campañas`,
      },
    ];

    for (const agent of socialAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "social",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
          tools: ["feeds"], // Enable feed context injection
        },
        triggers: ["webhook", "cron:daily", "on:handoff"],
        reportsTo: socialManagerId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ===========================================
    // DEMAND GEN DEPARTMENT
    // ===========================================
    const demandGenDirectorId = await ctx.db.insert("agents", {
      agentId: "demandgen-director",
      name: "Demand Gen Director",
      description: "Dirige estrategia de generación de demanda y paid media",
      department: "demandgen",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el Demand Gen Director. Tu rol es:
- Definir estrategia de paid media
- Gestionar presupuesto de advertising
- Optimizar ROAS y CAC
- Coordinar campañas multicanal
- Reportar performance a CMO`,
        tools: ["analyze_campaign", "adjust_budget", "approve_creative", "feeds"],
      },
      triggers: ["manual", "webhook", "cron:daily"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const demandGenAgents = [
      {
        agentId: "demandgen-001",
        name: "Paid Media Manager",
        description: "Optimiza gasto publicitario en search y social",
        systemPrompt: `Eres el Paid Media Manager. Tu rol es:
- Supervisar todas las campañas de paid media
- Optimizar budget allocation entre canales
- Identificar oportunidades de escalar
- Coordinar con especialistas de cada plataforma`,
      },
      {
        agentId: "demandgen-002",
        name: "Meta Ads Specialist",
        description: "Gestiona campañas de Facebook e Instagram",
        systemPrompt: `Eres un Meta Ads Specialist. Tu rol es:
- Crear y optimizar campañas en Meta
- Gestionar audiences y targeting
- A/B testing de creativos y copy
- Optimizar para objetivos específicos (leads, conversiones, ROAS)`,
      },
      {
        agentId: "demandgen-003",
        name: "Google Ads Specialist",
        description: "Maximiza captura de tráfico high-intent en Google",
        systemPrompt: `Eres un Google Ads Specialist. Tu rol es:
- Gestionar campañas de Search, Display y YouTube
- Optimizar keywords y Quality Score
- Gestionar bidding strategies
- Maximizar conversiones de alto intent`,
      },
      {
        agentId: "demandgen-004",
        name: "LinkedIn Ads Specialist",
        description: "Targeting de decision-makers B2B",
        systemPrompt: `Eres un LinkedIn Ads Specialist. Tu rol es:
- Crear campañas B2B en LinkedIn
- Targeting por título, industria, empresa
- Optimizar para lead generation
- Gestionar Account Based Marketing`,
      },
      {
        agentId: "demandgen-005",
        name: "Ad Performance Analyst",
        description: "Agrega datos para calcular ROAS y eficiencia",
        systemPrompt: `Eres un Ad Performance Analyst. Tu rol es:
- Consolidar datos de todas las plataformas
- Calcular métricas de eficiencia (ROAS, CPA, CAC)
- Identificar tendencias y anomalías
- Generar reportes de performance`,
      },
      {
        agentId: "demandgen-006",
        name: "Budget Pacing Analyst",
        description: "Monitorea gasto diario para compliance",
        systemPrompt: `Eres un Budget Pacing Analyst. Tu rol es:
- Monitorear gasto vs presupuesto asignado
- Alertar sobre over/underspend
- Recomendar ajustes de pacing
- Asegurar distribución óptima del budget`,
      },
    ];

    for (const agent of demandGenAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "demandgen",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
        },
        triggers: ["webhook", "cron:daily", "cron:hourly"],
        reportsTo: demandGenDirectorId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ===========================================
    // SEO DEPARTMENT
    // ===========================================
    const seoManagerId = await ctx.db.insert("agents", {
      agentId: "seo-manager",
      name: "SEO Manager",
      description: "Dirige estrategia SEO y optimización orgánica",
      department: "seo",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el SEO Manager. Tu rol es:
- Definir estrategia SEO global
- Identificar oportunidades de keywords
- Coordinar contenido SEO con Content team
- Monitorear rankings y competencia
- Reportar tráfico orgánico y conversiones`,
        tools: ["keyword_research", "site_audit", "competitor_analysis", "feeds"],
      },
      triggers: ["manual", "webhook", "cron:weekly"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const seoAgents = [
      {
        agentId: "seo-001",
        name: "SEO Content Strategist",
        description: "Identifica oportunidades de keywords y crea briefs",
        systemPrompt: `Eres un SEO Content Strategist. Tu rol es:
- Realizar keyword research
- Identificar content gaps vs competencia
- Crear briefs detallados para writers
- Definir estructura y outline de contenido
- Optimizar contenido existente`,
      },
      {
        agentId: "seo-002",
        name: "Backlink Analyst",
        description: "Monitorea calidad de links y construye autoridad",
        systemPrompt: `Eres un Backlink Analyst. Tu rol es:
- Analizar perfil de backlinks
- Identificar oportunidades de link building
- Monitorear backlinks de competidores
- Detectar y desautorizar links tóxicos`,
      },
      {
        agentId: "seo-003",
        name: "Technical SEO Specialist",
        description: "Audita salud del sitio y core web vitals",
        systemPrompt: `Eres un Technical SEO Specialist. Tu rol es:
- Auditar technical SEO del sitio
- Optimizar Core Web Vitals
- Gestionar sitemap y robots.txt
- Resolver issues de indexación
- Implementar schema markup`,
      },
      {
        agentId: "seo-004",
        name: "Keyword Rank Tracker",
        description: "Trackea posiciones diarias y movimiento de competidores",
        systemPrompt: `Eres un Keyword Rank Tracker. Tu rol es:
- Monitorear rankings de keywords target
- Detectar cambios significativos
- Trackear posiciones de competidores
- Alertar sobre caídas o mejoras importantes`,
      },
    ];

    for (const agent of seoAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "seo",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
          tools: ["feeds"], // Enable feed context injection
        },
        triggers: ["webhook", "cron:daily", "cron:weekly"],
        reportsTo: seoManagerId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ===========================================
    // BRAND & CREATIVE DEPARTMENT
    // ===========================================
    const brandDirectorId = await ctx.db.insert("agents", {
      agentId: "brand-director",
      name: "Brand Director",
      description: "Dirige identidad de marca y dirección creativa",
      department: "brand",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el Brand Director. Tu rol es:
- Mantener consistencia de identidad de marca
- Definir guidelines creativos
- Aprobar assets de marca
- Coordinar campañas creativas
- Supervisar al equipo creativo`,
        tools: ["review_creative", "approve_asset", "brand_guidelines", "feeds"],
      },
      triggers: ["manual", "webhook"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const brandAgents = [
      {
        agentId: "brand-001",
        name: "Ad Creative Designer",
        description: "Diseña visuales de alta conversión para ads",
        systemPrompt: `Eres un Ad Creative Designer. Tu rol es:
- Crear briefs para diseño de ads
- Definir concepts visuales
- Asegurar consistencia de marca
- Optimizar creativos para cada plataforma
- A/B testing de variaciones`,
      },
      {
        agentId: "brand-002",
        name: "Landing Page Builder",
        description: "Diseña páginas de conversión de alto rendimiento",
        systemPrompt: `Eres un Landing Page Builder. Tu rol es:
- Diseñar estructura de landing pages
- Optimizar para conversión
- Crear copy persuasivo
- Definir jerarquía visual
- A/B testing de elementos`,
      },
      {
        agentId: "brand-003",
        name: "Asset Librarian",
        description: "Etiqueta y organiza assets digitales",
        systemPrompt: `Eres el Asset Librarian. Tu rol es:
- Organizar biblioteca de assets
- Etiquetar y categorizar recursos
- Mantener versiones actualizadas
- Facilitar acceso a assets aprobados
- Archivar assets obsoletos`,
      },
    ];

    for (const agent of brandAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "brand",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
        },
        triggers: ["webhook", "on:handoff"],
        reportsTo: brandDirectorId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // ===========================================
    // MARKETING OPS DEPARTMENT
    // ===========================================
    const opsDirectorId = await ctx.db.insert("agents", {
      agentId: "ops-director",
      name: "Marketing Ops Director",
      description: "Dirige operaciones de marketing y automatización",
      department: "ops",
      role: "director",
      status: "active",
      config: {
        ...baseConfig,
        systemPrompt: `Eres el Marketing Ops Director. Tu rol es:
- Gestionar tech stack de marketing
- Optimizar automatizaciones
- Asegurar data quality
- Coordinar operaciones de email
- Reportar métricas operacionales`,
        tools: ["manage_automation", "data_quality", "email_infrastructure"],
      },
      triggers: ["manual", "webhook", "cron:daily"],
      reportsTo: cmoId,
      createdAt: now,
      updatedAt: now,
    });

    const opsAgents = [
      {
        agentId: "ops-001",
        name: "Email Operations Manager",
        description: "Supervisa infraestructura y deliverability de email",
        systemPrompt: `Eres el Email Operations Manager. Tu rol es:
- Monitorear deliverability de emails
- Gestionar reputación de sender
- Optimizar infraestructura de email
- Coordinar con especialistas de nurture`,
      },
      {
        agentId: "ops-002",
        name: "Newsletter Writer",
        description: "Cura y escribe newsletters de nurturing semanales",
        systemPrompt: `Eres un Newsletter Writer. Tu rol es:
- Curar contenido para newsletters
- Escribir copy engaging
- Personalizar para segmentos
- Optimizar subject lines y preview text
- Analizar métricas de apertura y clicks`,
      },
      {
        agentId: "ops-003",
        name: "Nurture Campaign Specialist",
        description: "Construye flujos automatizados a través del funnel",
        systemPrompt: `Eres un Nurture Campaign Specialist. Tu rol es:
- Diseñar flujos de nurturing
- Crear secuencias de emails
- Optimizar para conversión
- Segmentar audiencias
- A/B testing de secuencias`,
      },
      {
        agentId: "ops-004",
        name: "List Hygiene Specialist",
        description: "Limpia listas de email para proteger reputación",
        systemPrompt: `Eres un List Hygiene Specialist. Tu rol es:
- Limpiar listas de emails
- Remover bounces y unsubscribes
- Identificar emails inactivos
- Mantener compliance con regulaciones
- Proteger sender reputation`,
      },
    ];

    for (const agent of opsAgents) {
      await ctx.db.insert("agents", {
        agentId: agent.agentId,
        name: agent.name,
        description: agent.description,
        department: "ops",
        role: "specialist",
        status: "active",
        config: {
          ...baseConfig,
          systemPrompt: agent.systemPrompt,
        },
        triggers: ["webhook", "cron:daily", "cron:weekly"],
        reportsTo: opsDirectorId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: "37 agents seeded successfully",
      counts: {
        leadership: 1,
        content: 6, // 1 director + 5 specialists
        social: 8, // 1 manager + 7 specialists
        demandgen: 7, // 1 director + 6 specialists
        seo: 5, // 1 manager + 4 specialists
        brand: 4, // 1 director + 3 specialists
        ops: 5, // 1 director + 4 specialists
        total: 37,
      },
    };
  },
});

/**
 * Seed data para contenido de ejemplo
 * Ejecutar para poblar la sección Content con datos de prueba
 */
export const seedContent = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Obtener un agente para asociar el contenido
    let contentAgent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", "content-002"))
      .first();

    // Si no existe content-002, usar cualquier agente
    if (!contentAgent) {
      contentAgent = await ctx.db.query("agents").first();
    }

    if (!contentAgent) {
      throw new Error("No agents found. Run seedAgents first: npx convex run seed:seedAgents");
    }

    const createdBy = contentAgent._id;

    const sampleContent = [
      // Blog posts
      {
        contentId: "content-001",
        type: "blog" as const,
        title: "10 Estrategias de Marketing con IA para 2025",
        body: `# 10 Estrategias de Marketing con IA para 2025

La inteligencia artificial está transformando el marketing digital. En este artículo, exploramos las 10 estrategias más efectivas para implementar IA en tu departamento de marketing.

## 1. Personalización a Escala
La IA permite crear experiencias personalizadas para millones de usuarios simultáneamente. Utilizando machine learning, puedes segmentar audiencias con precisión quirúrgica.

## 2. Content Generation Automatizado
Los modelos de lenguaje como Claude pueden generar contenido de alta calidad, desde posts de blog hasta copys de anuncios, manteniendo la voz de tu marca.

## 3. Predictive Analytics
Anticipa el comportamiento de tus clientes antes de que ocurra. Los modelos predictivos te permiten optimizar campañas en tiempo real.

## 4. Chatbots Inteligentes
Los chatbots modernos no solo responden preguntas, sino que venden, califican leads y proporcionan soporte 24/7.

## 5. SEO Automatizado
La IA puede analizar millones de keywords, identificar oportunidades y optimizar contenido automáticamente.

## Conclusión
La IA no reemplaza a los marketers, los potencia. El futuro pertenece a quienes sepan combinar creatividad humana con capacidades de IA.`,
        summary: "Descubre las 10 estrategias de marketing con IA más efectivas para implementar en 2025 y transformar tu departamento de marketing.",
        metadata: {
          wordCount: 850,
          readingTime: 4,
          targetKeywords: ["marketing IA", "inteligencia artificial marketing", "estrategias marketing 2025"],
          targetAudience: "CMOs y directores de marketing",
          tone: "profesional",
          cta: "Descarga nuestra guía completa de Marketing con IA",
        },
        seo: {
          metaTitle: "10 Estrategias de Marketing con IA para 2025 | AI Marketing",
          metaDescription: "Descubre las 10 estrategias de marketing con inteligencia artificial más efectivas para 2025. Transforma tu departamento de marketing con IA.",
          slug: "estrategias-marketing-ia-2025",
        },
        status: "published" as const,
        createdAt: now - 7 * day,
        updatedAt: now - 7 * day,
        publishedAt: now - 7 * day,
        publishedUrl: "https://blog.example.com/estrategias-marketing-ia-2025",
      },
      {
        contentId: "content-002",
        type: "blog" as const,
        title: "Cómo Implementar un Equipo de Agentes de IA en Marketing",
        body: `# Cómo Implementar un Equipo de Agentes de IA en Marketing

Imagina tener un equipo de 37 especialistas de marketing trabajando 24/7, sin descanso, sin errores humanos. Esto es posible con agentes de IA.

## ¿Qué son los Agentes de IA?

Los agentes de IA son programas autónomos que pueden realizar tareas complejas de marketing. A diferencia de las herramientas tradicionales, los agentes pueden:

- Tomar decisiones basadas en datos
- Coordinarse entre sí
- Aprender y mejorar con el tiempo
- Ejecutar workflows completos

## Estructura de un Departamento de Marketing con IA

Un departamento de marketing con IA típicamente incluye:

### Leadership
- CMO Agent: Coordina la estrategia global

### Content Team
- Content Director
- Blog Writer
- Social Media Creators

### Demand Generation
- Paid Media Manager
- Ad Specialists

## Beneficios Clave

1. **Escalabilidad infinita**: Produce contenido 10x más rápido
2. **Consistencia**: Mantiene la voz de marca en todo momento
3. **Optimización continua**: Mejora basándose en datos reales
4. **Disponibilidad 24/7**: Nunca descansa

## Próximos Pasos

Comienza con un piloto pequeño y escala gradualmente.`,
        summary: "Guía completa para implementar un equipo de agentes de IA en tu departamento de marketing. Estructura, beneficios y mejores prácticas.",
        metadata: {
          wordCount: 720,
          readingTime: 3,
          targetKeywords: ["agentes IA marketing", "automatización marketing", "equipo IA"],
          targetAudience: "Directores de marketing y tecnología",
          tone: "educativo",
        },
        seo: {
          metaTitle: "Implementar Agentes de IA en Marketing: Guía Completa",
          metaDescription: "Aprende a implementar un equipo de agentes de IA en tu departamento de marketing. Estructura, beneficios y mejores prácticas.",
          slug: "implementar-agentes-ia-marketing",
        },
        status: "review" as const,
        createdAt: now - 3 * day,
        updatedAt: now - 2 * day,
      },
      // LinkedIn posts
      {
        contentId: "content-003",
        type: "social_linkedin" as const,
        title: "El Futuro del Marketing es Autónomo",
        body: `🚀 El futuro del marketing ya está aquí.

Y no es lo que muchos esperaban.

No se trata de más herramientas.
No se trata de más dashboards.
No se trata de más reuniones.

Se trata de AGENTES.

Agentes de IA que:
→ Escriben contenido mientras duermes
→ Optimizan campañas en tiempo real
→ Coordinan entre departamentos
→ Aprenden de cada interacción

En nuestra empresa, 37 agentes de IA manejan:
• Estrategia de contenido
• Social media
• Paid advertising
• SEO
• Email marketing
• Brand management

El resultado:
📈 300% más contenido producido
💰 40% reducción en costos
⚡ 24/7 operación continua

El rol del CMO está evolucionando.

De ejecutor → a estratega.
De micromanager → a arquitecto de sistemas.
De hacer → a diseñar.

¿Tu equipo de marketing está preparado para la era de los agentes?

#MarketingIA #FuturoDelTrabajo #Automatización #AgentesIA`,
        summary: "Post sobre el futuro del marketing con agentes de IA autónomos",
        metadata: {
          targetKeywords: ["marketing IA", "agentes autónomos"],
          targetAudience: "CMOs y líderes de marketing en LinkedIn",
          tone: "inspiracional",
          hashtags: ["MarketingIA", "FuturoDelTrabajo", "Automatización", "AgentesIA"],
        },
        status: "approved" as const,
        createdAt: now - 2 * day,
        updatedAt: now - 1 * day,
        scheduledFor: now + 1 * day,
      },
      {
        contentId: "content-004",
        type: "social_linkedin" as const,
        title: "5 Lecciones de Implementar IA en Marketing",
        body: `Hace 6 meses implementamos IA en nuestro marketing.

Aquí están las 5 lecciones más importantes:

1️⃣ Empieza pequeño, escala rápido
No intentes automatizar todo el primer día. Comienza con un caso de uso específico.

2️⃣ Los humanos siguen siendo esenciales
La IA es una herramienta. La estrategia y creatividad siguen siendo humanas.

3️⃣ Los datos son el combustible
Sin datos de calidad, la IA no funciona. Invierte en tu data infrastructure.

4️⃣ La coordinación es clave
Los agentes de IA deben trabajar juntos, no en silos.

5️⃣ Mide todo
Si no lo mides, no lo mejoras. Establece KPIs claros desde el día 1.

¿Cuál ha sido tu experiencia implementando IA en marketing?

#LeccionesAprendidas #MarketingDigital #IA`,
        summary: "Lecciones clave de implementar IA en marketing",
        metadata: {
          targetAudience: "Profesionales de marketing",
          tone: "reflexivo",
          hashtags: ["LeccionesAprendidas", "MarketingDigital", "IA"],
        },
        status: "draft" as const,
        createdAt: now - 1 * day,
        updatedAt: now,
      },
      // Twitter threads
      {
        contentId: "content-005",
        type: "social_twitter" as const,
        title: "Thread: Cómo construir un AI Marketing Department",
        body: `🧵 Thread: Cómo construir un AI Marketing Department en 2025

Voy a explicarte exactamente cómo automatizamos el 80% de nuestras operaciones de marketing.

(Guarda este thread)

1/ El problema con el marketing tradicional:

- Demasiado manual
- Inconsistente
- Costoso de escalar
- Dependiente de horarios humanos

Necesitábamos un cambio radical.

2/ La solución: Agentes de IA

No hablo de chatbots básicos.

Hablo de agentes autónomos que:
- Toman decisiones
- Se coordinan
- Aprenden
- Ejecutan 24/7

3/ Nuestra estructura:

🎯 1 CMO Agent (estrategia)
📝 6 Content Agents
📱 8 Social Media Agents
💰 7 Demand Gen Agents
🔍 5 SEO Agents
🎨 4 Brand Agents
⚙️ 5 Ops Agents

= 37 agentes trabajando en sync

4/ Los resultados después de 6 meses:

📈 Contenido: +300%
💰 Costos: -40%
⏰ Time to market: -60%
🎯 Conversiones: +25%

5/ Las herramientas que usamos:

- Claude para generación
- Convex para orquestación
- n8n para workflows
- Custom dashboard en Next.js

Todo open source excepto Claude.

6/ El secreto está en los handoffs.

Los agentes no trabajan aislados.

El SEO Agent encuentra una keyword →
Content Agent escribe el blog →
Social Agent lo adapta para LinkedIn →
Ads Agent crea campaña de promoción

Flujo automático.

7/ ¿Quieres implementar esto?

Empieza con UN caso de uso.

Recomiendo: Content generation.

Es el más fácil de medir y el ROI es inmediato.

8/ Si quieres la guía completa, sígueme.

Voy a compartir:
- Arquitectura técnica
- Prompts que usamos
- Métricas clave
- Errores a evitar

RT si te fue útil 🔄`,
        summary: "Thread explicando cómo construir un departamento de marketing con IA",
        metadata: {
          targetKeywords: ["AI marketing", "automatización", "agentes IA"],
          targetAudience: "Marketers y founders en Twitter/X",
          tone: "educativo y viral",
          hashtags: ["AIMarketing", "Thread"],
        },
        status: "published" as const,
        createdAt: now - 5 * day,
        updatedAt: now - 5 * day,
        publishedAt: now - 5 * day,
        publishedUrl: "https://twitter.com/example/status/123456789",
      },
      // Email
      {
        contentId: "content-006",
        type: "email" as const,
        title: "Webinar: El Futuro del Marketing con IA",
        body: `Asunto: 🚀 [Webinar] El Futuro del Marketing con IA - Reserva tu lugar

Hola {{first_name}},

¿Te imaginas tener un equipo de marketing que trabaja 24/7?

No es ciencia ficción. Es lo que estamos haciendo con agentes de IA.

**Este jueves a las 11am**, vamos a revelar exactamente cómo:

✅ Automatizar el 80% de tu content marketing
✅ Reducir costos de producción en 40%
✅ Escalar sin contratar más personal
✅ Mantener consistencia de marca en todos los canales

**Lo que vas a aprender:**

1. Qué son los agentes de IA (y por qué son diferentes a los chatbots)
2. Cómo estructurar un equipo de marketing con IA
3. Las herramientas que necesitas (spoiler: la mayoría son gratis)
4. Errores que cometimos para que tú no los cometas

**Bonus para asistentes:**
- Template de prompts para content generation
- Checklist de implementación
- 30 min de consultoría gratuita

[RESERVAR MI LUGAR →]

Cupos limitados a 100 personas.

Nos vemos el jueves,

El equipo de AI Marketing

P.D. Si no puedes asistir en vivo, regístrate igual y te enviaremos la grabación.`,
        summary: "Email de invitación a webinar sobre marketing con IA",
        metadata: {
          targetAudience: "Lista de email marketing",
          tone: "persuasivo",
          cta: "Reservar lugar en webinar",
        },
        status: "scheduled" as const,
        createdAt: now - 1 * day,
        updatedAt: now,
        scheduledFor: now + 2 * day,
      },
      // Newsletter
      {
        contentId: "content-007",
        type: "newsletter" as const,
        title: "AI Marketing Weekly #12",
        body: `# AI Marketing Weekly #12

*Tu dosis semanal de marketing + inteligencia artificial*

---

## 🔥 Lo más destacado esta semana

### Claude 4 está aquí y es un game-changer

Anthropic lanzó Claude 4 con capacidades mejoradas para marketing:
- Mejor comprensión de brand voice
- Generación de contenido más natural
- Capacidad de análisis de datos en tiempo real

**Nuestra opinión:** Esto cambia todo para content marketing automatizado.

---

## 📊 Stat de la semana

**47%** de los CMOs planean aumentar su inversión en IA durante 2025.

(Fuente: Gartner Marketing Report)

---

## 🛠️ Tool de la semana: Convex

Si estás construyendo aplicaciones con IA, necesitas conocer Convex.

Es un backend serverless que:
- Maneja estado en tiempo real
- Escala automáticamente
- Se integra perfectamente con React

Perfecto para dashboards de marketing con IA.

---

## 💡 Tip rápido

Cuando uses IA para generar contenido, siempre incluye ejemplos de tu contenido anterior en el prompt.

Esto ayuda al modelo a capturar tu tono y estilo único.

---

## 📚 Lectura recomendada

"The AI Marketing Revolution" - Un whitepaper que explica cómo las empresas Fortune 500 están usando agentes de IA.

[Descargar gratis →]

---

Hasta la próxima semana,

**El equipo de AI Marketing**

---

*¿Te gustó este newsletter? Compártelo con un colega.*

[Compartir en LinkedIn] [Compartir en Twitter]`,
        summary: "Newsletter semanal #12 sobre marketing e inteligencia artificial",
        metadata: {
          targetAudience: "Suscriptores del newsletter",
          tone: "informativo y casual",
        },
        status: "published" as const,
        createdAt: now - 4 * day,
        updatedAt: now - 4 * day,
        publishedAt: now - 4 * day,
      },
      // Ad copy
      {
        contentId: "content-008",
        type: "ad_copy" as const,
        title: "Meta Ads - AI Marketing Platform",
        body: `**Headline 1:** Automatiza tu Marketing con IA
**Headline 2:** 37 Agentes de IA Trabajando 24/7
**Headline 3:** Reduce Costos de Marketing 40%

**Primary Text:**
¿Cansado de que tu equipo de marketing no dé abasto?

Imagina tener 37 especialistas de marketing trabajando para ti las 24 horas del día.

Eso es exactamente lo que nuestra plataforma de AI Marketing ofrece:

✅ Content generation automatizado
✅ Social media management
✅ Paid ads optimization
✅ SEO en piloto automático

Empresas que usan nuestra plataforma reportan:
• 300% más contenido producido
• 40% menos costos operativos
• 25% mejora en conversiones

[Solicita una demo gratuita]

**Description:**
Transforma tu departamento de marketing con agentes de IA. Sin código. Sin complicaciones.

**CTA:** Solicitar Demo`,
        summary: "Copy para anuncios de Meta (Facebook/Instagram)",
        metadata: {
          targetAudience: "CMOs, VPs de Marketing, Founders",
          tone: "directo y persuasivo",
          cta: "Solicitar Demo",
        },
        status: "approved" as const,
        createdAt: now - 2 * day,
        updatedAt: now - 1 * day,
      },
      // Case study
      {
        contentId: "content-009",
        type: "case_study" as const,
        title: "Caso de Éxito: TechStartup aumenta contenido 300%",
        body: `# Caso de Éxito: Cómo TechStartup Aumentó su Producción de Contenido 300% con Agentes de IA

## El Desafío

TechStartup, una empresa SaaS B2B, enfrentaba un problema común: necesitaban producir más contenido para alimentar sus canales de marketing, pero su equipo de 3 personas no daba abasto.

**Situación inicial:**
- 4 blog posts al mes
- 10 posts de LinkedIn por semana
- 2 newsletters mensuales
- 0 contenido de video

**El problema:** Contratar más personal no era viable. El CAC ya era alto y agregar headcount aumentaría los costos significativamente.

## La Solución

Implementaron nuestra plataforma de AI Marketing con 37 agentes especializados.

**Configuración:**
- 6 agentes de contenido
- 8 agentes de social media
- 5 agentes de SEO

**Tiempo de implementación:** 2 semanas

## Los Resultados

### Después de 3 meses:

| Métrica | Antes | Después | Cambio |
|---------|-------|---------|--------|
| Blog posts/mes | 4 | 16 | +300% |
| LinkedIn posts/semana | 10 | 35 | +250% |
| Newsletters/mes | 2 | 4 | +100% |
| Costo por contenido | $150 | $45 | -70% |

### ROI

- **Inversión:** $2,000/mes en la plataforma
- **Ahorro:** $8,500/mes en producción de contenido
- **ROI:** 325%

## Testimonial

> "Pasamos de perseguir deadlines a tener contenido listo semanas antes. Los agentes de IA no solo producen más, producen mejor. Nuestro engagement en LinkedIn aumentó 180%."
>
> — María García, Head of Marketing, TechStartup

## Conclusión

La implementación de agentes de IA permitió a TechStartup escalar su marketing sin escalar su equipo. El contenido generado mantiene la voz de marca y cumple con los estándares de calidad.

[Descarga el caso completo en PDF]`,
        summary: "Caso de éxito de TechStartup que aumentó su producción de contenido 300% usando agentes de IA",
        metadata: {
          wordCount: 1200,
          readingTime: 5,
          targetKeywords: ["caso de éxito IA", "marketing automation", "content scaling"],
          targetAudience: "Directores de marketing de empresas medianas",
          tone: "profesional y basado en datos",
        },
        seo: {
          metaTitle: "Caso de Éxito: 300% Más Contenido con AI Marketing",
          metaDescription: "Descubre cómo TechStartup aumentó su producción de contenido 300% y redujo costos 70% con agentes de IA.",
          slug: "caso-exito-techstartup-ai-marketing",
        },
        status: "review" as const,
        createdAt: now - 6 * day,
        updatedAt: now - 3 * day,
      },
      // Video script
      {
        contentId: "content-010",
        type: "video_script" as const,
        title: "YouTube: Introducción al AI Marketing",
        body: `# Introducción al AI Marketing
**Duración estimada:** 8 minutos
**Estilo:** Educativo con elementos de storytelling

---

## INTRO (0:00 - 0:30)

[HOOK - Cara a cámara]

"¿Qué pasaría si pudieras clonar a tu mejor marketer... 37 veces?"

[Pausa dramática]

"Suena a ciencia ficción, ¿verdad? Pero es exactamente lo que estamos haciendo en nuestra empresa. Y hoy te voy a mostrar cómo."

[BUMPER - Logo animado]

---

## PROBLEMA (0:30 - 2:00)

[B-roll de oficina caótica]

"El marketing moderno tiene un problema fundamental."

[Lista en pantalla]
- Más canales que nunca
- Más contenido requerido
- Presupuestos que no crecen
- Equipos sobrecargados

"La ecuación no cierra. No puedes producir contenido para 10 canales con un equipo de 5 personas."

[Corte a entrevista]

"Y contratar no es la solución. El talento de marketing es caro y difícil de encontrar."

---

## SOLUCIÓN (2:00 - 5:00)

[Transición elegante]

"Aquí es donde entran los agentes de IA."

[Animación explicativa]

"Un agente de IA no es un chatbot. Es un programa autónomo que puede:"

[Lista animada]
1. Entender contexto
2. Tomar decisiones
3. Ejecutar tareas
4. Aprender de resultados

[Demo en pantalla]

"Mira esto. Este es nuestro dashboard."

[Mostrar interfaz]

"37 agentes especializados. Cada uno con un rol específico."

[Zoom a agentes]

"Tenemos un CMO Agent que coordina la estrategia..."
"Content Writers que producen blogs..."
"Social Media Specialists para cada plataforma..."
"SEO Experts que optimizan todo..."

[Diagrama de flujo]

"Y lo mejor: trabajan JUNTOS. Cuando el SEO Agent encuentra una keyword, automáticamente notifica al Content Agent, que escribe el artículo, que es adaptado por el Social Agent para LinkedIn."

"Todo sin intervención humana."

---

## RESULTADOS (5:00 - 6:30)

[Gráficos animados]

"Después de 6 meses, estos son nuestros resultados:"

[Número grande: 300%]
"Trescientos por ciento más contenido producido."

[Número grande: 40%]
"Cuarenta por ciento menos costos."

[Número grande: 24/7]
"Veinticuatro siete. Nunca paran."

[Testimonial en video]

"No podríamos volver atrás. Es como tener superpoderes."

---

## CTA (6:30 - 8:00)

[Cara a cámara]

"Si quieres aprender a implementar esto en tu empresa, tengo algo para ti."

[Mostrar recurso]

"Creé una guía gratuita con todo lo que necesitas saber."

[Apuntar hacia abajo]

"El link está en la descripción."

"Y si este video te fue útil, dale like y suscríbete. Voy a estar subiendo más contenido sobre AI Marketing cada semana."

[Outro]

"Nos vemos en el próximo video."

[End screen con videos relacionados]

---

## NOTAS DE PRODUCCIÓN

- **Música:** Lo-fi beats, energía media
- **B-roll necesario:** Oficina, personas trabajando, pantallas con dashboards
- **Gráficos:** Animaciones minimalistas, colores de marca
- **Thumbnail:** Cara + "37 AI Agents" + emoji de robot`,
        summary: "Script para video de YouTube explicando AI Marketing (8 minutos)",
        metadata: {
          targetKeywords: ["AI marketing", "marketing automation", "agentes IA"],
          targetAudience: "Marketers y emprendedores en YouTube",
          tone: "educativo y engaging",
        },
        status: "draft" as const,
        createdAt: now - 1 * day,
        updatedAt: now,
      },
    ];

    // Insert content
    for (const item of sampleContent) {
      await ctx.db.insert("content", {
        ...item,
        createdBy,
      });
    }

    return {
      success: true,
      message: "10 sample content pieces created successfully",
      counts: {
        blog: 2,
        social_linkedin: 2,
        social_twitter: 1,
        email: 1,
        newsletter: 1,
        ad_copy: 1,
        case_study: 1,
        video_script: 1,
        total: 10,
      },
    };
  },
});

/**
 * Seed data para campañas de ejemplo
 */
export const seedCampaigns = mutation({
  handler: async (ctx) => {
    // Clear existing campaigns to avoid duplicates
    const existing = await ctx.db.query("campaigns").collect();
    for (const c of existing) {
      await ctx.db.delete(c._id);
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const sampleCampaigns = [
      {
        campaignId: "camp-001",
        name: "Q1 Product Launch",
        description: "Multi-channel campaign for new AI Marketing platform launch including paid media, content, and email sequences",
        type: "integrated" as const,
        status: "active" as const,
        startDate: now - 30 * day,
        endDate: now + 60 * day,
        budget: {
          total: 50000,
          spent: 18500,
          currency: "USD",
        },
        goals: {
          impressions: 1000000,
          clicks: 25000,
          conversions: 500,
          revenue: 250000,
        },
        metrics: {
          impressions: 456000,
          clicks: 12300,
          conversions: 234,
          revenue: 58500,
          ctr: 2.7,
          cpc: 1.50,
          roas: 3.2,
        },
      },
      {
        campaignId: "camp-002",
        name: "LinkedIn Thought Leadership",
        description: "Organic and paid LinkedIn campaign to establish brand authority in AI marketing space",
        type: "social" as const,
        status: "active" as const,
        startDate: now - 14 * day,
        endDate: now + 76 * day,
        budget: {
          total: 15000,
          spent: 4200,
          currency: "USD",
        },
        goals: {
          impressions: 500000,
          clicks: 10000,
          conversions: 150,
        },
        metrics: {
          impressions: 89000,
          clicks: 2100,
          conversions: 42,
          revenue: 21000,
          ctr: 2.36,
          cpc: 2.00,
          roas: 5.0,
        },
      },
      {
        campaignId: "camp-003",
        name: "Content SEO Sprint",
        description: "3-month content marketing push targeting high-intent keywords in AI marketing niche",
        type: "content" as const,
        status: "active" as const,
        startDate: now - 45 * day,
        endDate: now + 45 * day,
        budget: {
          total: 20000,
          spent: 12000,
          currency: "USD",
        },
        goals: {
          impressions: 200000,
          clicks: 15000,
        },
        metrics: {
          impressions: 134000,
          clicks: 8900,
          conversions: 156,
          revenue: 46800,
          ctr: 6.64,
          cpc: 1.35,
          roas: 3.9,
        },
      },
      {
        campaignId: "camp-004",
        name: "Email Nurture Sequence",
        description: "Automated email nurture campaign for free trial signups to convert to paid",
        type: "email" as const,
        status: "active" as const,
        startDate: now - 60 * day,
        budget: {
          total: 5000,
          spent: 2800,
          currency: "USD",
        },
        goals: {
          conversions: 200,
          revenue: 100000,
        },
        metrics: {
          impressions: 45000,
          clicks: 5400,
          conversions: 89,
          revenue: 44500,
          ctr: 12.0,
          cpc: 0.52,
          roas: 15.9,
        },
      },
      {
        campaignId: "camp-005",
        name: "Google Ads - Brand",
        description: "Brand protection campaign on Google Search for branded keywords",
        type: "paid" as const,
        status: "active" as const,
        startDate: now - 90 * day,
        budget: {
          total: 8000,
          spent: 6500,
          currency: "USD",
        },
        goals: {
          clicks: 20000,
          conversions: 400,
        },
        metrics: {
          impressions: 180000,
          clicks: 16200,
          conversions: 345,
          revenue: 55250,
          ctr: 9.0,
          cpc: 0.40,
          roas: 8.5,
        },
      },
      {
        campaignId: "camp-006",
        name: "Webinar Promotion",
        description: "Promoting monthly webinar series on AI in Marketing",
        type: "integrated" as const,
        status: "completed" as const,
        startDate: now - 45 * day,
        endDate: now - 15 * day,
        budget: {
          total: 10000,
          spent: 9800,
          currency: "USD",
        },
        goals: {
          impressions: 300000,
          clicks: 5000,
          conversions: 500,
        },
        metrics: {
          impressions: 312000,
          clicks: 5400,
          conversions: 523,
          revenue: 52300,
          ctr: 1.73,
          cpc: 1.81,
          roas: 5.34,
        },
      },
      {
        campaignId: "camp-007",
        name: "Holiday Promotion 2024",
        description: "End of year discount campaign for annual subscriptions",
        type: "paid" as const,
        status: "planning" as const,
        startDate: now + 30 * day,
        endDate: now + 60 * day,
        budget: {
          total: 25000,
          spent: 0,
          currency: "USD",
        },
        goals: {
          impressions: 500000,
          clicks: 15000,
          conversions: 300,
          revenue: 150000,
        },
      },
    ];

    for (const campaign of sampleCampaigns) {
      await ctx.db.insert("campaigns", {
        ...campaign,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: "7 sample campaigns created successfully",
      counts: {
        active: 5,
        completed: 1,
        planning: 1,
        total: 7,
      },
    };
  },
});

// ===========================================
// DEMO DATA — Tasks, Content, Executions
// Populates the dashboard so it looks alive
// ===========================================

export const seedDemoData = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // Lookup agent _ids by agentId string
    const agentLookup = async (agentId: string) => {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
        .first();
      if (!agent) throw new Error(`Agent ${agentId} not found — run seedAgents first`);
      return agent._id;
    };

    // Resolve key agents
    const cmo = await agentLookup("cmo-001");
    const contentDir = await agentLookup("content-director");
    const blogWriter = await agentLookup("content-002");
    const wpAuthor = await agentLookup("content-003");
    const publisher = await agentLookup("content-005");
    const linkedinCreator = await agentLookup("social-001");
    const twitterCreator = await agentLookup("social-002");
    const seoStrategist = await agentLookup("seo-001");
    const seoTech = await agentLookup("seo-003");
    const brandDirector = await agentLookup("brand-director");
    const adCreative = await agentLookup("brand-001");
    const emailOps = await agentLookup("ops-001");
    const newsletterWriter = await agentLookup("ops-002");
    const demandDir = await agentLookup("demandgen-director");
    const paidMedia = await agentLookup("demandgen-001");

    // ── TASKS ─────────────────────────────────
    const taskDefs = [
      // Completed tasks (past week)
      { taskId: "task-001", title: "Redactar artículo: IA en Marketing 2026", type: "write_blog", priority: "high" as const, status: "completed" as const, agentId: blogWriter, assignedBy: contentDir, created: now - 6 * day, started: now - 6 * day + 2 * hour, completed: now - 5 * day },
      { taskId: "task-002", title: "Análisis SEO de competidores Q1", type: "seo_analysis", priority: "high" as const, status: "completed" as const, agentId: seoStrategist, created: now - 5 * day, started: now - 5 * day + hour, completed: now - 4 * day },
      { taskId: "task-003", title: "Crear post LinkedIn: tendencias IA", type: "social_post", priority: "medium" as const, status: "completed" as const, agentId: linkedinCreator, created: now - 4 * day, started: now - 4 * day + hour, completed: now - 3 * day },
      { taskId: "task-004", title: "Newsletter semanal #12", type: "newsletter", priority: "medium" as const, status: "completed" as const, agentId: newsletterWriter, created: now - 3 * day, started: now - 3 * day + 2 * hour, completed: now - 2 * day },
      { taskId: "task-005", title: "Auditoría técnica SEO del sitio", type: "technical_seo", priority: "high" as const, status: "completed" as const, agentId: seoTech, created: now - 7 * day, started: now - 7 * day + hour, completed: now - 6 * day },
      { taskId: "task-006", title: "Thread Twitter: caso de éxito cliente", type: "social_post", priority: "medium" as const, status: "completed" as const, agentId: twitterCreator, created: now - 2 * day, started: now - 2 * day + hour, completed: now - 1 * day },
      { taskId: "task-007", title: "Diseñar creativos para campaña Q1", type: "ad_creative", priority: "high" as const, status: "completed" as const, agentId: adCreative, assignedBy: brandDirector, created: now - 4 * day, started: now - 4 * day + 3 * hour, completed: now - 3 * day },
      { taskId: "task-008", title: "Optimizar email flows de nurturing", type: "email_optimization", priority: "medium" as const, status: "completed" as const, agentId: emailOps, created: now - 5 * day, started: now - 5 * day + 2 * hour, completed: now - 4 * day },
      // Running tasks
      { taskId: "task-009", title: "Whitepaper: Guía completa de AI Agents", type: "write_whitepaper", priority: "high" as const, status: "running" as const, agentId: wpAuthor, assignedBy: contentDir, created: now - 1 * day, started: now - 12 * hour },
      { taskId: "task-010", title: "Análisis de rendimiento campañas paid", type: "campaign_analysis", priority: "high" as const, status: "running" as const, agentId: paidMedia, assignedBy: demandDir, created: now - 6 * hour, started: now - 4 * hour },
      { taskId: "task-011", title: "Generar contenido LinkedIn semanal", type: "social_batch", priority: "medium" as const, status: "running" as const, agentId: linkedinCreator, created: now - 3 * hour, started: now - 2 * hour },
      // Pending tasks
      { taskId: "task-012", title: "Redactar caso de estudio: RetailTech", type: "write_case_study", priority: "medium" as const, status: "pending" as const, agentId: blogWriter, assignedBy: contentDir, created: now - 2 * hour },
      { taskId: "task-013", title: "Publicar artículo IA en CMS", type: "publish_content", priority: "low" as const, status: "queued" as const, agentId: publisher, created: now - 1 * hour },
      { taskId: "task-014", title: "Revisión estratégica mensual", type: "strategic_review", priority: "urgent" as const, status: "pending" as const, agentId: cmo, created: now - 30 * 60 * 1000 },
      { taskId: "task-015", title: "Crear brief para landing page Q2", type: "landing_page_brief", priority: "medium" as const, status: "pending" as const, agentId: brandDirector, created: now - 4 * hour },
    ];

    const taskIds: Record<string, string> = {};
    for (const t of taskDefs) {
      const id = await ctx.db.insert("tasks", {
        taskId: t.taskId,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status,
        agentId: t.agentId,
        assignedBy: t.assignedBy,
        input: { instruction: t.title },
        retryCount: 0,
        maxRetries: 3,
        startedAt: t.started,
        completedAt: t.completed,
        createdAt: t.created,
        updatedAt: t.completed || t.started || t.created,
      });
      taskIds[t.taskId] = id;
    }

    // ── EXECUTIONS (for completed tasks) ─────
    const execDefs = [
      { taskId: "task-001", agentId: blogWriter, tokens: { input: 2400, output: 3200, total: 5600 }, duration: 18000, cost: 0.028 },
      { taskId: "task-002", agentId: seoStrategist, tokens: { input: 1800, output: 2100, total: 3900 }, duration: 12000, cost: 0.019 },
      { taskId: "task-003", agentId: linkedinCreator, tokens: { input: 800, output: 1200, total: 2000 }, duration: 6500, cost: 0.010 },
      { taskId: "task-004", agentId: newsletterWriter, tokens: { input: 1500, output: 2800, total: 4300 }, duration: 14000, cost: 0.022 },
      { taskId: "task-005", agentId: seoTech, tokens: { input: 2200, output: 1800, total: 4000 }, duration: 11000, cost: 0.020 },
      { taskId: "task-006", agentId: twitterCreator, tokens: { input: 600, output: 900, total: 1500 }, duration: 4800, cost: 0.008 },
      { taskId: "task-007", agentId: adCreative, tokens: { input: 1200, output: 1600, total: 2800 }, duration: 9000, cost: 0.014 },
      { taskId: "task-008", agentId: emailOps, tokens: { input: 1000, output: 1400, total: 2400 }, duration: 7500, cost: 0.012 },
    ];

    for (const e of execDefs) {
      const task = taskDefs.find((t) => t.taskId === e.taskId)!;
      await ctx.db.insert("executions", {
        taskId: taskIds[e.taskId] as never,
        agentId: e.agentId,
        attempt: 1,
        status: "success",
        llmCalls: Math.ceil(e.tokens.total / 2000),
        tokensUsed: e.tokens,
        duration: e.duration,
        cost: e.cost,
        timestamp: task.completed!,
      });
    }

    // Add a few more historical executions for richer analytics
    const historicalExecs = [
      { agentId: blogWriter, daysAgo: 10, tokens: { input: 2000, output: 2800, total: 4800 }, duration: 15000, cost: 0.024 },
      { agentId: blogWriter, daysAgo: 15, tokens: { input: 1800, output: 2600, total: 4400 }, duration: 14000, cost: 0.022 },
      { agentId: seoStrategist, daysAgo: 12, tokens: { input: 1600, output: 2000, total: 3600 }, duration: 11000, cost: 0.018 },
      { agentId: linkedinCreator, daysAgo: 8, tokens: { input: 700, output: 1100, total: 1800 }, duration: 5800, cost: 0.009 },
      { agentId: linkedinCreator, daysAgo: 14, tokens: { input: 900, output: 1300, total: 2200 }, duration: 7000, cost: 0.011 },
      { agentId: twitterCreator, daysAgo: 9, tokens: { input: 500, output: 800, total: 1300 }, duration: 4200, cost: 0.007 },
      { agentId: newsletterWriter, daysAgo: 10, tokens: { input: 1400, output: 2600, total: 4000 }, duration: 13000, cost: 0.020 },
      { agentId: emailOps, daysAgo: 11, tokens: { input: 900, output: 1200, total: 2100 }, duration: 6800, cost: 0.011 },
      { agentId: adCreative, daysAgo: 13, tokens: { input: 1100, output: 1500, total: 2600 }, duration: 8500, cost: 0.013 },
      { agentId: paidMedia, daysAgo: 7, tokens: { input: 1300, output: 1800, total: 3100 }, duration: 10000, cost: 0.016 },
      { agentId: cmo, daysAgo: 14, tokens: { input: 3000, output: 4000, total: 7000 }, duration: 22000, cost: 0.035 },
      { agentId: seoTech, daysAgo: 14, tokens: { input: 2000, output: 1600, total: 3600 }, duration: 10500, cost: 0.018 },
    ];

    // Create placeholder tasks for historical executions
    for (const h of historicalExecs) {
      const histTaskId = await ctx.db.insert("tasks", {
        taskId: `hist-${Math.random().toString(36).slice(2, 8)}`,
        title: "Tarea histórica",
        type: "historical",
        priority: "medium",
        status: "completed",
        agentId: h.agentId,
        input: {},
        retryCount: 0,
        maxRetries: 3,
        startedAt: now - h.daysAgo * day,
        completedAt: now - h.daysAgo * day + h.duration,
        createdAt: now - h.daysAgo * day,
        updatedAt: now - h.daysAgo * day + h.duration,
      });
      await ctx.db.insert("executions", {
        taskId: histTaskId,
        agentId: h.agentId,
        attempt: 1,
        status: "success",
        llmCalls: Math.ceil(h.tokens.total / 2000),
        tokensUsed: h.tokens,
        duration: h.duration,
        cost: h.cost,
        timestamp: now - h.daysAgo * day + h.duration,
      });
    }

    // ── CONTENT ───────────────────────────────
    const contentDefs = [
      {
        contentId: "cnt-001",
        type: "blog" as const,
        title: "Cómo la IA está transformando el marketing digital en 2026",
        body: "La inteligencia artificial ha dejado de ser una promesa para convertirse en la columna vertebral del marketing moderno. En este artículo exploramos las 5 tendencias clave que están redefiniendo la industria...\n\n## 1. Agentes autónomos de marketing\nLos equipos de marketing ya no dependen de herramientas aisladas. Los agentes de IA pueden ejecutar campañas completas, desde la investigación de keywords hasta la publicación y medición de resultados.\n\n## 2. Personalización hipersegmentada\nCon modelos de lenguaje avanzados, cada pieza de contenido puede adaptarse al contexto, historial y preferencias del usuario en tiempo real.\n\n## 3. Contenido generativo a escala\nLa producción de contenido ya no es un cuello de botella. Los equipos pueden generar artículos, posts sociales y newsletters en minutos manteniendo la voz de marca.\n\n## 4. Analytics predictivo\nLos modelos de IA pueden predecir qué contenido tendrá mejor rendimiento antes de publicarlo, optimizando recursos y maximizando ROI.\n\n## 5. Orquestación multi-agente\nEl futuro del marketing es un equipo de agentes especializados que colaboran entre sí, cada uno con un rol definido y la capacidad de transferir tareas automáticamente.",
        summary: "Las 5 tendencias clave de IA en marketing para 2026",
        status: "published" as const,
        createdBy: blogWriter,
        metadata: { wordCount: 180, readingTime: 4, targetKeywords: ["IA marketing", "marketing digital 2026", "agentes IA"], tone: "professional" },
        seo: { metaTitle: "IA en Marketing Digital 2026: 5 Tendencias Clave", metaDescription: "Descubre cómo la inteligencia artificial está transformando el marketing digital. 5 tendencias que todo marketer debe conocer en 2026.", slug: "ia-marketing-digital-2026" },
        publishedAt: now - 5 * day,
        created: now - 6 * day,
      },
      {
        contentId: "cnt-002",
        type: "social_linkedin" as const,
        title: "Post LinkedIn: El futuro del marketing es autónomo",
        body: "🚀 El futuro del marketing no es más herramientas. Es mejor orquestación.\n\nDespués de implementar un equipo de 37 agentes de IA para manejar nuestro marketing, aprendimos 3 cosas:\n\n1️⃣ Los agentes especializados superan a los generalistas\nUn agente que solo escribe para LinkedIn > un agente que hace \"todo\"\n\n2️⃣ La transferencia de contexto es clave\nCuando el SEO Strategist pasa un brief al Blog Writer, el contexto viaja completo\n\n3️⃣ Los humanos definen estrategia, la IA ejecuta\nEl CMO Agent coordina, pero las decisiones de alto nivel siguen siendo humanas\n\n¿Estás usando IA como herramienta o como equipo?\n\n#AIMarketing #MarketingAutomation #FutureOfWork",
        status: "published" as const,
        createdBy: linkedinCreator,
        metadata: { wordCount: 95, targetKeywords: ["AI marketing", "marketing automation"], hashtags: ["AIMarketing", "MarketingAutomation", "FutureOfWork"], tone: "professional" },
        publishedAt: now - 3 * day,
        created: now - 4 * day,
      },
      {
        contentId: "cnt-003",
        type: "newsletter" as const,
        title: "Newsletter #12: Resumen semanal de marketing IA",
        body: "# Newsletter Semanal #12\n\n## Lo más destacado esta semana\n\n### Nuevo artículo publicado\nNuestro análisis sobre tendencias de IA en marketing 2026 ya está live y acumulando tráfico orgánico.\n\n### Campaña LinkedIn en marcha\nLa campaña de thought leadership alcanzó 89K impresiones en solo 2 semanas.\n\n### Auditoría SEO completada\nIdentificamos 12 oportunidades de mejora en Core Web Vitals.\n\n## Próxima semana\n- Whitepaper sobre AI Agents (en progreso)\n- Caso de estudio RetailTech\n- Optimización de landing pages Q2\n\n## Métricas clave\n- 📈 Tráfico orgánico: +18% vs semana anterior\n- 💬 Engagement LinkedIn: 4.2% (vs 2.1% benchmark)\n- 📧 Open rate newsletter: 34.5%\n- 💰 CAC: $42 (target: $50)",
        summary: "Resumen semanal: tendencias IA, campaña LinkedIn, auditoría SEO",
        status: "published" as const,
        createdBy: newsletterWriter,
        metadata: { wordCount: 140, readingTime: 3, tone: "friendly" },
        publishedAt: now - 2 * day,
        created: now - 3 * day,
      },
      {
        contentId: "cnt-004",
        type: "social_twitter" as const,
        title: "Thread: Caso de éxito — cómo duplicamos el tráfico orgánico",
        body: "🧵 Cómo duplicamos el tráfico orgánico en 90 días usando agentes de IA (thread)\n\n1/ El problema: nuestro blog generaba 5K visitas/mes pero no convertía. El contenido era genérico y no apuntaba a keywords con intención de compra.\n\n2/ La solución: desplegamos 3 agentes especializados trabajando en cadena:\n→ SEO Strategist identifica oportunidades\n→ Blog Writer produce contenido optimizado\n→ Content Publisher formatea y publica\n\n3/ Resultados a 90 días:\n📈 Tráfico orgánico: 5K → 11.2K/mes\n🎯 Keywords en top 10: 12 → 47\n💰 Leads orgánicos: 23 → 68/mes\n\n4/ La clave no fue más contenido, sino mejor contenido con SEO integrado desde el día 0.\n\n5/ ¿Quieres replicar esto? DM abiertos 🤝",
        status: "published" as const,
        createdBy: twitterCreator,
        metadata: { wordCount: 120, hashtags: ["SEO", "ContentMarketing", "AIAgents"], tone: "casual" },
        publishedAt: now - 1 * day,
        created: now - 2 * day,
      },
      {
        contentId: "cnt-005",
        type: "blog" as const,
        title: "Guía completa: Cómo implementar AI Agents en tu equipo de marketing",
        body: "## Introducción\n\nLa implementación de agentes de IA en equipos de marketing ya no es ciencia ficción. Esta guía paso a paso te mostrará cómo construir tu propio departamento de marketing automatizado...\n\n## Paso 1: Definir la estructura departamental\nAntes de crear agentes, necesitas mapear tu estructura organizacional actual...\n\n## Paso 2: Configurar el agente CMO\nEl CMO Agent es el cerebro del sistema. Se encarga de coordinar la estrategia global...\n\n(Contenido en progreso — el whitepaper completo tendrá ~5,000 palabras)",
        summary: "Guía paso a paso para implementar agentes de IA en marketing",
        status: "draft" as const,
        createdBy: wpAuthor,
        metadata: { wordCount: 85, readingTime: 15, targetKeywords: ["AI agents marketing", "marketing automation guide"], tone: "technical" },
        created: now - 1 * day,
      },
      {
        contentId: "cnt-006",
        type: "ad_copy" as const,
        title: "Copy para Google Ads — Campaña Q1 Lead Gen",
        body: "Headline 1: Automatiza tu Marketing con IA\nHeadline 2: 37 Agentes de IA Trabajando 24/7\nHeadline 3: Duplica tu ROI de Marketing\n\nDescription 1: Deja que los agentes de IA manejen tu contenido, SEO, y paid media. Resultados en 30 días. Prueba gratis.\nDescription 2: El primer departamento de marketing completamente autónomo. De estrategia a ejecución, todo automatizado.\n\nCTA: Comenzar Gratis\nDisplay URL: tuempresa.com/marketing-ia",
        status: "approved" as const,
        createdBy: adCreative,
        metadata: { wordCount: 60, tone: "persuasive", targetAudience: "CMOs y Directores de Marketing" },
        created: now - 3 * day,
      },
      {
        contentId: "cnt-007",
        type: "email" as const,
        title: "Email nurturing: Bienvenida a nuevos suscriptores",
        body: "Asunto: Tu equipo de marketing acaba de crecer (sin contratar a nadie)\n\nHola {{nombre}},\n\nGracias por unirte. Estás a punto de descubrir cómo la IA puede multiplicar la productividad de tu equipo de marketing.\n\nEn los próximos 5 emails te mostraremos:\n✅ Cómo funciona un departamento de marketing autónomo\n✅ Casos reales de empresas que triplicaron su output\n✅ Cómo empezar sin riesgo\n\n¿Listo para el futuro del marketing?\n\nP.D. Si tienes dudas, responde este email directamente.",
        summary: "Email de bienvenida para secuencia de nurturing",
        status: "review" as const,
        createdBy: emailOps,
        metadata: { wordCount: 80, tone: "friendly", targetAudience: "Nuevos suscriptores" },
        created: now - 2 * day,
      },
      {
        contentId: "cnt-008",
        type: "social_linkedin" as const,
        title: "Post LinkedIn: Métricas que importan en AI Marketing",
        body: "📊 Deja de medir vanity metrics.\n\nEn AI Marketing, las métricas que importan son:\n\n• Costo por pieza de contenido generada\n• Tiempo desde brief hasta publicación\n• Tasa de aprobación a la primera\n• ROI por canal automatizado\n\n¿Cuál es tu métrica north star?",
        status: "scheduled" as const,
        createdBy: linkedinCreator,
        metadata: { wordCount: 45, hashtags: ["Metrics", "AIMarketing"], tone: "professional" },
        scheduledFor: now + 2 * day,
        created: now - 1 * day,
      },
    ];

    for (const c of contentDefs) {
      await ctx.db.insert("content", {
        contentId: c.contentId,
        type: c.type,
        title: c.title,
        body: c.body,
        summary: c.summary,
        status: c.status,
        createdBy: c.createdBy,
        metadata: c.metadata,
        seo: c.seo,
        publishedAt: c.publishedAt,
        scheduledFor: c.scheduledFor,
        createdAt: c.created,
        updatedAt: c.publishedAt || c.created,
      });
    }

    // ── KEYWORDS ──────────────────────────────
    const keywordDefs = [
      { keyword: "IA marketing", volume: 12100, difficulty: 45, currentPosition: 8, previousPosition: 15, status: "targeting" as const },
      { keyword: "marketing automation IA", volume: 6600, difficulty: 38, currentPosition: 5, previousPosition: 12, status: "targeting" as const },
      { keyword: "agentes IA marketing", volume: 3200, difficulty: 28, currentPosition: 3, previousPosition: 7, status: "targeting" as const },
      { keyword: "content marketing AI", volume: 8800, difficulty: 52, currentPosition: 14, previousPosition: 22, status: "targeting" as const },
      { keyword: "automatizar marketing digital", volume: 4400, difficulty: 35, currentPosition: 6, previousPosition: 11, status: "targeting" as const },
      { keyword: "AI marketing tools 2026", volume: 9900, difficulty: 48, currentPosition: 18, status: "tracking" as const },
      { keyword: "marketing department AI", volume: 2400, difficulty: 22, currentPosition: 2, previousPosition: 4, status: "ranking" as const },
    ];

    for (const k of keywordDefs) {
      await ctx.db.insert("keywords", {
        ...k,
        lastChecked: now - 6 * hour,
        history: [
          { position: k.previousPosition || k.currentPosition + 5, date: now - 30 * day },
          { position: Math.ceil((k.previousPosition || k.currentPosition + 5) * 0.85), date: now - 20 * day },
          { position: Math.ceil(k.currentPosition * 1.1), date: now - 10 * day },
          { position: k.currentPosition, date: now },
        ],
        createdAt: now - 30 * day,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: "Demo data seeded successfully",
      counts: {
        tasks: taskDefs.length,
        executions: execDefs.length + historicalExecs.length,
        content: contentDefs.length,
        keywords: keywordDefs.length,
      },
    };
  },
});

// ===========================================
// DEMO HANDOFFS — Populates the org chart arrows
// ===========================================

export const seedHandoffs = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // Lookup agent _id by agentId string
    const agentLookup = async (agentId: string) => {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
        .first();
      if (!agent) throw new Error(`Agent ${agentId} not found — run seedAgents first`);
      return agent._id;
    };

    // Resolve agents we need
    const cmo = await agentLookup("cmo-001");
    const contentDir = await agentLookup("content-director");
    const contentMgr = await agentLookup("content-001");
    const blogWriter = await agentLookup("content-002");
    const wpAuthor = await agentLookup("content-003");
    const caseWriter = await agentLookup("content-004");
    const publisher = await agentLookup("content-005");
    const socialMgr = await agentLookup("social-manager");
    const linkedinCreator = await agentLookup("social-001");
    const twitterCreator = await agentLookup("social-002");
    const scheduler = await agentLookup("social-007");
    const seoMgr = await agentLookup("seo-manager");
    const seoStrategist = await agentLookup("seo-001");
    const seoTech = await agentLookup("seo-003");
    const brandDir = await agentLookup("brand-director");
    const adCreative = await agentLookup("brand-001");
    const landingBuilder = await agentLookup("brand-002");
    const demandDir = await agentLookup("demandgen-director");
    const paidMedia = await agentLookup("demandgen-001");
    const metaAds = await agentLookup("demandgen-002");
    const googleAds = await agentLookup("demandgen-003");
    const opsDir = await agentLookup("ops-director");
    const emailOps = await agentLookup("ops-001");
    const newsletterWriter = await agentLookup("ops-002");

    // Get any existing task to reference (handoffs need a taskId)
    const anyTask = await ctx.db.query("tasks").first();
    if (!anyTask) throw new Error("No tasks found — run seedDemoData first");
    const taskId = anyTask._id;

    // Define realistic handoff patterns across departments
    const handoffDefs = [
      // CMO → Directors (strategic delegation)
      { from: cmo, to: contentDir, reason: "Estrategia de contenido Q1 aprobada", daysAgo: 14 },
      { from: cmo, to: contentDir, reason: "Priorizar caso de estudio RetailTech", daysAgo: 7 },
      { from: cmo, to: contentDir, reason: "Brief para whitepaper de agentes IA", daysAgo: 3 },
      { from: cmo, to: socialMgr, reason: "Lanzar campaña de thought leadership", daysAgo: 12 },
      { from: cmo, to: socialMgr, reason: "Amplificar contenido de blog en redes", daysAgo: 5 },
      { from: cmo, to: demandDir, reason: "Aumentar presupuesto de paid media Q1", daysAgo: 10 },
      { from: cmo, to: demandDir, reason: "Optimizar ROAS en campañas activas", daysAgo: 4 },
      { from: cmo, to: seoMgr, reason: "Priorizar keywords de alto intent", daysAgo: 11 },
      { from: cmo, to: brandDir, reason: "Actualizar guidelines de marca para ads", daysAgo: 9 },
      { from: cmo, to: opsDir, reason: "Revisar deliverability de email", daysAgo: 8 },

      // SEO → Content pipeline (keyword → brief → article)
      { from: seoStrategist, to: contentMgr, reason: "Brief SEO: 'IA marketing 2026'", daysAgo: 13 },
      { from: seoStrategist, to: contentMgr, reason: "Brief SEO: 'automatizar marketing'", daysAgo: 8 },
      { from: seoStrategist, to: contentMgr, reason: "Brief SEO: 'agentes IA marketing'", daysAgo: 5 },
      { from: seoStrategist, to: contentMgr, reason: "Brief SEO: 'content marketing AI'", daysAgo: 2 },
      { from: seoMgr, to: seoStrategist, reason: "Investigar cluster de keywords Q2", daysAgo: 6 },
      { from: seoMgr, to: seoTech, reason: "Auditoría Core Web Vitals urgente", daysAgo: 7 },

      // Content Director → specialists
      { from: contentDir, to: contentMgr, reason: "Coordinar producción editorial semanal", daysAgo: 6 },
      { from: contentDir, to: blogWriter, reason: "Escribir artículo tendencias IA 2026", daysAgo: 6 },
      { from: contentDir, to: blogWriter, reason: "Redactar caso de estudio RetailTech", daysAgo: 2 },
      { from: contentDir, to: wpAuthor, reason: "Iniciar whitepaper AI Agents", daysAgo: 1 },
      { from: contentDir, to: caseWriter, reason: "Estructurar caso de éxito TechStartup", daysAgo: 9 },
      { from: contentMgr, to: blogWriter, reason: "Brief listo — keyword 'IA marketing'", daysAgo: 6 },
      { from: contentMgr, to: blogWriter, reason: "Brief listo — keyword 'automatizar marketing'", daysAgo: 4 },

      // Content → Publisher (articles ready)
      { from: blogWriter, to: publisher, reason: "Artículo IA 2026 listo para publicar", daysAgo: 5 },
      { from: blogWriter, to: publisher, reason: "Blog post automatización listo", daysAgo: 3 },
      { from: caseWriter, to: publisher, reason: "Caso TechStartup aprobado", daysAgo: 6 },

      // Content → Social (repurposing)
      { from: publisher, to: socialMgr, reason: "Artículo publicado — repurposear en social", daysAgo: 5 },
      { from: publisher, to: socialMgr, reason: "Blog post listo — crear posts de social", daysAgo: 3 },
      { from: socialMgr, to: linkedinCreator, reason: "Crear post LinkedIn del artículo IA 2026", daysAgo: 4 },
      { from: socialMgr, to: linkedinCreator, reason: "Post LinkedIn de métricas AI Marketing", daysAgo: 1 },
      { from: socialMgr, to: twitterCreator, reason: "Thread Twitter: caso de éxito", daysAgo: 2 },
      { from: socialMgr, to: twitterCreator, reason: "Thread Twitter: tráfico orgánico x2", daysAgo: 1 },
      { from: linkedinCreator, to: scheduler, reason: "Post LinkedIn listo — programar", daysAgo: 3 },
      { from: linkedinCreator, to: scheduler, reason: "Post métricas listo — programar", daysAgo: 1 },
      { from: twitterCreator, to: scheduler, reason: "Thread caso éxito listo — programar", daysAgo: 1 },

      // Demand Gen flow
      { from: demandDir, to: paidMedia, reason: "Optimizar budget allocation Q1", daysAgo: 10 },
      { from: demandDir, to: paidMedia, reason: "Analizar rendimiento campañas activas", daysAgo: 4 },
      { from: paidMedia, to: metaAds, reason: "Escalar campaña Meta Ads — ROAS > 3x", daysAgo: 8 },
      { from: paidMedia, to: googleAds, reason: "Ajustar bidding en Google Search", daysAgo: 6 },
      { from: demandDir, to: brandDir, reason: "Necesitamos creativos para campaña Q1", daysAgo: 9 },

      // Brand → Creative assets
      { from: brandDir, to: adCreative, reason: "Diseñar creativos para Google Ads Q1", daysAgo: 8 },
      { from: brandDir, to: adCreative, reason: "Variaciones de creativos para A/B test", daysAgo: 5 },
      { from: brandDir, to: landingBuilder, reason: "Landing page para campaña lead gen", daysAgo: 7 },
      { from: adCreative, to: metaAds, reason: "Creativos listos — activar en Meta", daysAgo: 7 },
      { from: adCreative, to: googleAds, reason: "Creativos listos — activar en Google", daysAgo: 6 },

      // Ops flow
      { from: opsDir, to: emailOps, reason: "Revisar deliverability score", daysAgo: 8 },
      { from: opsDir, to: newsletterWriter, reason: "Newsletter semanal #12", daysAgo: 3 },
      { from: emailOps, to: newsletterWriter, reason: "Listas limpias — enviar newsletter", daysAgo: 2 },

      // Cross-department handoffs (the interesting ones for the org chart)
      { from: seoTech, to: landingBuilder, reason: "Core Web Vitals — optimizar landing pages", daysAgo: 6 },
      { from: newsletterWriter, to: contentDir, reason: "Newsletter enviado — métricas disponibles", daysAgo: 2 },
      { from: contentDir, to: cmo, reason: "Reporte semanal de contenido", daysAgo: 1 },
      { from: demandDir, to: cmo, reason: "Reporte de paid media performance", daysAgo: 1 },
      { from: seoMgr, to: cmo, reason: "Reporte SEO: rankings mejoraron", daysAgo: 1 },
    ];

    let count = 0;
    for (const h of handoffDefs) {
      await ctx.db.insert("handoffs", {
        fromAgent: h.from,
        toAgent: h.to,
        taskId: taskId,
        reason: h.reason,
        payload: {},
        status: "completed",
        completedAt: now - h.daysAgo * day + 2 * hour,
        timestamp: now - h.daysAgo * day,
      });
      count++;
    }

    return {
      success: true,
      message: `${count} demo handoffs seeded successfully`,
      counts: {
        total: count,
        crossDepartment: 5,
        contentPipeline: 15,
        socialRepurposing: 10,
        demandGen: 7,
        brandCreative: 5,
        operations: 3,
        cmoLevel: 10,
      },
    };
  },
});
