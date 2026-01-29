import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===========================================
  // AGENTS - Definición de cada agente de IA
  // ===========================================
  agents: defineTable({
    agentId: v.string(), // Identificador único: "content-001"
    name: v.string(), // Nombre legible: "Blog Content Writer"
    description: v.string(), // Descripción de la función
    department: v.union(
      v.literal("leadership"),
      v.literal("content"),
      v.literal("social"),
      v.literal("demandgen"),
      v.literal("seo"),
      v.literal("brand"),
      v.literal("ops")
    ),
    role: v.union(v.literal("cmo"), v.literal("director"), v.literal("specialist")),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error"),
      v.literal("maintenance")
    ),
    config: v.object({
      systemPrompt: v.string(),
      model: v.string(), // "claude-sonnet-4-20250514"
      temperature: v.number(),
      maxTokens: v.number(),
      tools: v.optional(v.array(v.string())), // Herramientas disponibles
    }),
    triggers: v.array(
      v.union(
        v.literal("manual"),
        v.literal("webhook"),
        v.literal("cron:hourly"),
        v.literal("cron:daily"),
        v.literal("cron:weekly"),
        v.literal("on:task_completed"),
        v.literal("on:handoff")
      )
    ),
    reportsTo: v.optional(v.id("agents")), // Agente superior jerárquico
    canDelegateTo: v.optional(v.array(v.id("agents"))), // Agentes a los que puede delegar
    metadata: v.optional(v.any()), // Datos adicionales flexibles
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_department", ["department"])
    .index("by_status", ["status"])
    .index("by_role", ["role"]),

  // ===========================================
  // TASKS - Tareas asignadas a agentes
  // ===========================================
  tasks: defineTable({
    taskId: v.string(), // UUID o ID secuencial
    title: v.string(), // Título descriptivo
    type: v.string(), // "write_blog", "analyze_keywords", etc.
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("queued"),
      v.literal("running"),
      v.literal("waiting_review"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    agentId: v.id("agents"), // Agente asignado
    assignedBy: v.optional(v.id("agents")), // Quién asignó (si aplica)
    input: v.any(), // Datos de entrada para el agente
    output: v.optional(v.any()), // Resultado del agente
    error: v.optional(
      v.object({
        message: v.string(),
        code: v.optional(v.string()),
        stack: v.optional(v.string()),
      })
    ),
    parentTaskId: v.optional(v.id("tasks")), // Para subtareas
    childTaskIds: v.optional(v.array(v.id("tasks"))), // Subtareas generadas
    retryCount: v.number(),
    maxRetries: v.number(),
    scheduledFor: v.optional(v.number()), // Timestamp para ejecución programada
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"])
    .index("by_priority_status", ["priority", "status"])
    .index("by_parent", ["parentTaskId"])
    .index("by_scheduled", ["scheduledFor"]),

  // ===========================================
  // EXECUTIONS - Log de ejecuciones de agentes
  // ===========================================
  executions: defineTable({
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    attempt: v.number(), // Número de intento (1, 2, 3...)
    status: v.union(v.literal("success"), v.literal("failure")),
    llmCalls: v.number(), // Cantidad de llamadas al LLM
    tokensUsed: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    duration: v.number(), // Duración en ms
    cost: v.number(), // Costo estimado en USD
    steps: v.optional(
      v.array(
        v.object({
          name: v.string(),
          duration: v.number(),
          tokensUsed: v.optional(v.number()),
        })
      )
    ),
    error: v.optional(v.string()),
    feedItemsUsed: v.optional(v.array(v.id("feedItems"))), // Feed items used during execution (Phase 3)
    timestamp: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent_timestamp", ["agentId", "timestamp"]),

  // ===========================================
  // HANDOFFS - Transferencias entre agentes
  // ===========================================
  handoffs: defineTable({
    fromAgent: v.id("agents"),
    toAgent: v.id("agents"),
    taskId: v.id("tasks"),
    reason: v.string(), // Por qué se transfiere
    payload: v.any(), // Datos transferidos
    instructions: v.optional(v.string()), // Instrucciones específicas
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index("by_from", ["fromAgent"])
    .index("by_to", ["toAgent"])
    .index("by_task", ["taskId"])
    .index("by_status", ["status"]),

  // ===========================================
  // CONTENT - Contenido generado por agentes
  // ===========================================
  content: defineTable({
    contentId: v.string(), // UUID
    type: v.union(
      v.literal("blog"),
      v.literal("social_linkedin"),
      v.literal("social_twitter"),
      v.literal("social_instagram"),
      v.literal("social_tiktok"),
      v.literal("email"),
      v.literal("newsletter"),
      v.literal("ad_copy"),
      v.literal("landing_page"),
      v.literal("whitepaper"),
      v.literal("case_study"),
      v.literal("video_script")
    ),
    title: v.string(),
    body: v.string(), // Contenido principal (puede ser markdown, HTML, etc.)
    summary: v.optional(v.string()),
    metadata: v.object({
      wordCount: v.optional(v.number()),
      readingTime: v.optional(v.number()), // minutos
      targetKeywords: v.optional(v.array(v.string())),
      targetAudience: v.optional(v.string()),
      tone: v.optional(v.string()),
      cta: v.optional(v.string()),
      hashtags: v.optional(v.array(v.string())),
    }),
    seo: v.optional(
      v.object({
        metaTitle: v.string(),
        metaDescription: v.string(),
        slug: v.string(),
        canonicalUrl: v.optional(v.string()),
      })
    ),
    assets: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video"), v.literal("document")),
          url: v.string(),
          alt: v.optional(v.string()),
        })
      )
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("revision_needed"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("archived")
    ),
    createdBy: v.id("agents"),
    reviewedBy: v.optional(v.id("agents")),
    approvedBy: v.optional(v.string()), // Puede ser humano
    sourceTaskId: v.optional(v.id("tasks")),
    parentContentId: v.optional(v.id("content")), // Para repurposed content
    publishedUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contentId", ["contentId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_type_status", ["type", "status"])
    .index("by_scheduled", ["scheduledFor"]),

  // ===========================================
  // CAMPAIGNS - Campañas de marketing
  // ===========================================
  campaigns: defineTable({
    campaignId: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("content"),
      v.literal("paid"),
      v.literal("email"),
      v.literal("social"),
      v.literal("integrated")
    ),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    budget: v.optional(
      v.object({
        total: v.number(),
        spent: v.number(),
        currency: v.string(),
      })
    ),
    goals: v.optional(
      v.object({
        impressions: v.optional(v.number()),
        clicks: v.optional(v.number()),
        conversions: v.optional(v.number()),
        revenue: v.optional(v.number()),
      })
    ),
    metrics: v.optional(
      v.object({
        impressions: v.number(),
        clicks: v.number(),
        conversions: v.number(),
        revenue: v.number(),
        ctr: v.number(),
        cpc: v.number(),
        roas: v.number(),
      })
    ),
    contentIds: v.optional(v.array(v.id("content"))),
    assignedAgents: v.optional(v.array(v.id("agents"))),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // ===========================================
  // KEYWORDS - Tracking de keywords SEO
  // ===========================================
  keywords: defineTable({
    keyword: v.string(),
    volume: v.optional(v.number()), // Búsquedas mensuales
    difficulty: v.optional(v.number()), // 0-100
    currentPosition: v.optional(v.number()),
    previousPosition: v.optional(v.number()),
    targetUrl: v.optional(v.string()),
    status: v.union(
      v.literal("tracking"),
      v.literal("targeting"),
      v.literal("ranking"),
      v.literal("archived")
    ),
    history: v.optional(
      v.array(
        v.object({
          position: v.number(),
          date: v.number(),
        })
      )
    ),
    lastChecked: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_keyword", ["keyword"])
    .index("by_status", ["status"])
    .index("by_position", ["currentPosition"]),

  // ===========================================
  // PROMPTS - Biblioteca de prompts
  // ===========================================
  prompts: defineTable({
    promptId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(), // "content", "analysis", "outreach", etc.
    template: v.string(), // El prompt con {{variables}}
    variables: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        required: v.boolean(),
        default: v.optional(v.string()),
      })
    ),
    usedByAgents: v.optional(v.array(v.id("agents"))),
    version: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_promptId", ["promptId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // ===========================================
  // METRICS - Métricas agregadas
  // ===========================================
  metrics: defineTable({
    type: v.union(
      v.literal("agent_performance"),
      v.literal("content_performance"),
      v.literal("campaign_performance"),
      v.literal("cost_tracking")
    ),
    entityId: v.string(), // ID del agente, contenido o campaña
    period: v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    periodStart: v.number(), // Timestamp del inicio del período
    data: v.any(), // Métricas específicas según el tipo
    createdAt: v.number(),
  })
    .index("by_type_entity", ["type", "entityId"])
    .index("by_period", ["period", "periodStart"])
    .index("by_type_period", ["type", "period", "periodStart"]),

  // ===========================================
  // SETTINGS - Configuración del sistema
  // ===========================================
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ===========================================
  // AUDIT_LOG - Log de auditoría
  // ===========================================
  auditLog: defineTable({
    action: v.string(), // "agent.created", "task.completed", etc.
    entityType: v.string(), // "agent", "task", "content", etc.
    entityId: v.string(),
    performedBy: v.union(v.literal("system"), v.literal("agent"), v.literal("user")),
    performerId: v.optional(v.string()), // ID del agente o usuario
    changes: v.optional(v.any()), // Cambios realizados
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"])
    .index("by_performer", ["performedBy", "performerId"]),

  // ===========================================
  // FEEDS - RSS/Atom feeds para sincronización
  // ===========================================
  feeds: defineTable({
    feedId: v.string(), // UUID identifier
    url: v.string(), // Feed URL (unique)
    name: v.string(), // Human-readable name
    category: v.string(), // Category: "industry", "competitor", "technical"
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error")
    ),
    syncFrequency: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    lastSyncAt: v.optional(v.number()), // Timestamp of last successful sync
    consecutiveErrors: v.number(), // Error count for health tracking (SYNC-06)
    lastErrorMessage: v.optional(v.string()), // Most recent error
    // HTTP Conditional GET caching (Phase 6 - HTTP Optimization)
    lastETag: v.optional(v.string()),            // ETag header from last 200 response
    lastModified: v.optional(v.string()),        // Last-Modified header from last 200 response
    consecutiveNotModified: v.optional(v.number()), // Count of consecutive 304 responses
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_feedId", ["feedId"])
    .index("by_url", ["url"])
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  // ===========================================
  // FEED_ITEMS - Entradas de feeds con deduplicación
  // ===========================================
  feedItems: defineTable({
    feedId: v.id("feeds"), // Reference to parent feed
    contentHash: v.string(), // SHA-256 composite key for deduplication (SYNC-02)
    guid: v.optional(v.string()), // Original GUID if present
    title: v.string(), // Item title
    link: v.string(), // Item URL
    content: v.optional(v.string()), // Full content/description
    summary: v.optional(v.string()), // Short summary (for truncated feeds)
    author: v.optional(v.string()), // Author name if available
    publishedAt: v.optional(v.number()), // Publication timestamp
    categories: v.optional(v.array(v.string())), // Item categories/tags
    createdAt: v.number(), // When we stored it
    updatedAt: v.number(), // Last update
    // Enrichment fields (Phase 4 - AI Enrichment)
    topics: v.optional(v.array(v.string())), // Topic tags from AI
    sentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative")
      )
    ),
    aiSummary: v.optional(v.string()), // AI-generated summary (distinct from feed summary)
    relevanceScore: v.optional(v.number()), // 0-100 marketing relevance
    processed: v.optional(v.boolean()), // Enrichment status flag
    processedAt: v.optional(v.number()), // Timestamp when enriched
    processingError: v.optional(v.string()), // Error message if failed
    brandMentions: v.optional(v.array(v.string())),
    competitorMentions: v.optional(v.array(v.string())),
  })
    .index("by_contentHash", ["contentHash"]) // For deduplication lookups (STOR-05)
    .index("by_feedId", ["feedId"])
    .index("by_feedId_publishedAt", ["feedId", "publishedAt"]) // For chronological queries
    .index("by_publishedAt", ["publishedAt"]) // For global timeline
    .searchIndex("search_content", {
      searchField: "title",
      filterFields: ["feedId"],
    }) // For agent feed queries (Phase 3)
    .index("by_processed", ["processed"]) // For enrichment queue queries (Phase 4)
    .index("by_relevanceScore", ["relevanceScore"]), // For high-relevance filtering (Phase 4)

  // ===========================================
  // FEED_SYNC_LOG - Historial de sincronizaciones
  // ===========================================
  feedSyncLog: defineTable({
    feedId: v.id("feeds"), // Reference to feed
    syncedAt: v.number(), // Execution timestamp
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ), // Sync outcome
    itemsFound: v.number(), // Total items in feed
    itemsAdded: v.number(), // New items stored
    itemsSkipped: v.number(), // Duplicates skipped
    duration: v.number(), // Sync duration in ms
    errorMessage: v.optional(v.string()), // Error details if failed
  })
    .index("by_feedId", ["feedId"])
    .index("by_syncedAt", ["syncedAt"])
    .index("by_feedId_syncedAt", ["feedId", "syncedAt"]),

  // ===========================================
  // ALERT_DIGESTS - Brand monitoring digests
  // ===========================================
  alertDigests: defineTable({
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("generated"), v.literal("sent"), v.literal("failed")),
    period: v.object({ start: v.number(), end: v.number() }),
    items: v.array(
      v.object({
        feedItemId: v.id("feedItems"),
        title: v.string(),
        relevanceScore: v.number(),
        brandMentions: v.array(v.string()),
        competitorMentions: v.array(v.string()),
        sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
      })
    ),
    summary: v.optional(v.string()),
    stats: v.optional(v.object({
      totalItems: v.number(),
      highRelevance: v.number(),
      brandMentionCount: v.number(),
      competitorMentionCount: v.number(),
    })),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"]),

  // ===========================================
  // ONBOARDING - Configuración inicial
  // ===========================================
  onboarding: defineTable({
    companyName: v.string(),
    industry: v.string(),
    description: v.string(),
    goals: v.array(v.string()),
    channels: v.array(v.string()),
    feeds: v.array(v.string()),
    departments: v.array(v.string()),
    completedAt: v.number(),
  }),

  // ===========================================
  // KNOWLEDGE BASES - Base de conocimiento de empresa
  // ===========================================
  knowledgeBases: defineTable({
    kbId: v.string(), // "kb-brand-001"
    name: v.string(), // "Acme Corp Brand Identity"
    description: v.string(),
    category: v.union(
      v.literal("brand"), // Brand Identity
      v.literal("products"), // Products/Services
      v.literal("personas"), // Buyer Personas
      v.literal("guidelines") // Content Guidelines
    ),
    status: v.union(
      v.literal("draft"), // Being created in wizard
      v.literal("processing"), // AI extracting
      v.literal("active"), // Ready for agents
      v.literal("archived")
    ),
    visibility: v.array(
      // Which agent types can see this
      v.union(
        v.literal("all"),
        v.literal("content"),
        v.literal("social"),
        v.literal("seo"),
        v.literal("demandgen"),
        v.literal("brand"),
        v.literal("ops"),
        v.literal("leadership")
      )
    ),
    metadata: v.object({
      documentCount: v.number(),
      totalSizeBytes: v.number(),
      lastProcessedAt: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_kbId", ["kbId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // ===========================================
  // KB_DOCUMENTS - Archivos cargados o URLs scrapeadas
  // ===========================================
  kbDocuments: defineTable({
    documentId: v.string(),
    kbId: v.id("knowledgeBases"),
    name: v.string(), // "Brand_Guidelines.pdf"
    sourceType: v.union(
      v.literal("url"), // Scraped from web
      v.literal("upload") // File upload
    ),
    sourceUrl: v.optional(v.string()),
    fileType: v.optional(
      v.union(
        v.literal("pdf"),
        v.literal("docx"),
        v.literal("pptx"),
        v.literal("txt"),
        v.literal("md")
      )
    ),
    storageId: v.optional(v.id("_storage")), // Convex storage
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
    metadata: v.object({
      sizeBytes: v.optional(v.number()),
      pageCount: v.optional(v.number()),
    }),
    processingError: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_documentId", ["documentId"])
    .index("by_kbId", ["kbId"])
    .index("by_status", ["status"]),

  // ===========================================
  // KB_SECTIONS - Contenido chunkeado para búsqueda eficiente
  // ===========================================
  kbSections: defineTable({
    sectionId: v.string(),
    kbId: v.id("knowledgeBases"),
    documentId: v.id("kbDocuments"),
    title: v.string(),
    content: v.string(), // Max 2000 chars per chunk
    contentHash: v.string(), // SHA-256 for deduplication
    order: v.number(), // Position in document
    metadata: v.object({
      wordCount: v.number(),
      pageNumbers: v.optional(v.array(v.number())),
    }),
    // AI enrichment
    topics: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    relevanceScore: v.optional(v.number()), // 0-100
    processed: v.optional(v.boolean()),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_kbId", ["kbId"])
    .index("by_documentId", ["documentId"])
    .index("by_contentHash", ["contentHash"])
    .index("by_processed", ["processed"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["kbId", "documentId"],
    }),

  // ===========================================
  // KB_AGENT_ACCESS - Audit trail de acceso de agentes
  // ===========================================
  kbAgentAccess: defineTable({
    agentId: v.id("agents"),
    kbId: v.id("knowledgeBases"),
    taskId: v.optional(v.id("tasks")),
    sectionsUsed: v.array(v.id("kbSections")),
    accessedAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_kb", ["kbId"])
    .index("by_task", ["taskId"]),
});
