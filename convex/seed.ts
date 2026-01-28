import { mutation } from "./_generated/server";

/**
 * Seed data para los 37 agentes del AI Marketing Department
 * Ejecutar una vez para inicializar la base de datos
 */

export const seedAgents = mutation({
  handler: async (ctx) => {
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
