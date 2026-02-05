/**
 * Language Dictionary - Simple, User-Friendly Labels
 * Maps technical terms to simple Spanish labels for non-technical users
 */

export const LABELS = {
  // Navigation
  dashboard: "Inicio",
  home: "Inicio",
  agents: "Automatización",
  feeds: "Fuentes",
  content: "Contenido",
  generated: "Generado",
  campaigns: "Campañas",
  analytics: "Resultados",
  metrics: "Resultados",
  org: "Equipo",
  settings: "Configuración",
  onboarding: "Primeros pasos",

  // Content Status
  draft: "Borrador",
  review: "En revisión",
  approved: "Listo",
  published: "Publicado",
  archived: "Archivado",

  // Feed Status
  active: "Activo",
  paused: "Pausado",
  error: "Problemas",
  syncing: "Actualizando",

  // Feed-related
  feedItems: "Artículos",
  feedItem: "Artículo",
  feedsPage: "Fuentes",
  feed: "Fuente",
  sync: "Actualizar",
  syncFrequency: "Revisar cada",
  lastSync: "Última actualización",
  consecutiveErrors: "Errores continuos",
  feedUrl: "Enlace del sitio",

  // Agent-related
  agentsPage: "Automatización",
  agent: "Automatización",
  agentExecution: "Ejecutar automatización",
  mutations: "Acciones",
  mutation: "Acción",
  department: "Departamento",
  departments: "Departamentos",
  role: "Rol",

  // Campaign-related
  campaignsPage: "Campañas",
  campaign: "Campaña",
  activeCampaigns: "Activo ahora",
  campaignStatus: "Estado de campaña",

  // General actions
  add: "Agregar",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  save: "Guardar",
  cancel: "Cancelar",
  close: "Cerrar",
  back: "Atrás",
  next: "Siguiente",
  finish: "Finalizar",
  submit: "Enviar",
  search: "Buscar",
  filter: "Filtrar",
  export: "Exportar",
  import: "Importar",

  // Common metrics
  views: "Vistas",
  clicks: "Clicks",
  engagement: "Participación",
  reach: "Alcance",
  impressions: "Impresiones",
  followers: "Seguidores",
  leads: "Leads",

  // Time-related
  today: "Hoy",
  thisWeek: "Esta semana",
  thisMonth: "Este mes",
  lastWeek: "Semana pasada",
  lastMonth: "Mes pasado",
  last7Days: "Últimos 7 días",
  last30Days: "Últimos 30 días",

  // Messages
  loading: "Cargando...",
  errorMessage: "Error",
  success: "¡Éxito!",
  warning: "Advertencia",
  info: "Información",
  noData: "Sin datos",
  empty: "Vacío",

  // Onboarding
  skipForNow: "Saltar por ahora",
  skipTour: "Saltar tutorial",
  startTour: "Ver tutorial",
  learnMore: "Saber más",
  whatNext: "¿Qué sigue?",

  // Feed health
  feedHealth: "Salud de fuentes",
  feedHealthSummary: "Resumen de fuentes",
  allFeedsHealthy: "✅ Todo funcionando",
  feedNeedsAttention: "⚠️ Fuente necesita atención",
  feedsNeedAttention: "⚠️ Algunas fuentes necesitan atención",
  newArticles: "artículos nuevos hoy",
  nextSyncIn: "Próxima actualización en",
  minutes: "minutos",

  // Control Center
  controlCenter: "Centro de Control",
  controlCenterDescription: "Monitorea todos los agentes en tiempo real",
  agentStatus: "Estado de agentes",
  allDepartments: "Todos",
  tokensUsed: "Tokens usados",
  tasksCompleted: "Tareas completadas",
  successRateLabel: "Tasa de éxito",
  totalCost: "Costo total",
  agentsActive: "agentes activos",
  agentsError: "con errores",
  agentsPaused: "pausados",
  agentsMaintenance: "en mantenimiento",
  noActivity: "Sin actividad reciente",
  recentActivity: "Actividad reciente",

  // Content Pipeline
  contentPipeline: "Pipeline de Contenido",
  pipelineDescription: "Gestiona el flujo de trabajo de tu contenido",
  kanbanView: "Vista Kanban",
  listView: "Vista Lista",
  draftColumn: "Borrador",
  reviewColumn: "En Revisión",
  revisionColumn: "Necesita Cambios",
  approvedColumn: "Aprobado",
  scheduledColumn: "Programado",
  publishedColumn: "Publicado",
  archivedColumn: "Archivado",
  sendToReview: "Enviar a Revisión",
  approve: "Aprobar",
  reject: "Solicitar Cambios",
  schedule: "Programar",
  publishNow: "Publicar Ahora",
  archive: "Archivar",
  reactivate: "Reactivar",
  unschedule: "Desprogramar",
  scheduledFor: "Programado para",
  schedulePublication: "Programar Publicación",
  selectDateTime: "Selecciona fecha y hora",
  scheduledContentTitle: "Contenido Programado",
  noScheduledContent: "No hay contenido programado",
  dragToMove: "Arrastra para mover",
  dropHere: "Suelta aquí",
  invalidTransition: "Movimiento no permitido",
  contentMoved: "Contenido movido",
  contentScheduled: "Contenido programado",
  contentPublished: "Contenido publicado",
  contentApproved: "Contenido aprobado",
  contentRejected: "Cambios solicitados",
  pipelineEmpty: "No hay contenido en el pipeline",
  noContent: "Sin contenido",

  // LinkedIn Integration
  linkedinIntegration: "Integración LinkedIn",
  linkedinDescription: "Publica contenido directamente en LinkedIn",
  connectLinkedIn: "Conectar LinkedIn",
  disconnectLinkedIn: "Desconectar",
  linkedinConnected: "Conectado",
  linkedinExpired: "Token Expirado",
  linkedinDisconnected: "Desconectado",
  reconnectLinkedIn: "Reconectar",
  publishToLinkedIn: "Publicar en LinkedIn",
  publishingToLinkedIn: "Publicando...",
  linkedinPublished: "Publicado en LinkedIn",
  linkedinPublishError: "Error al publicar",
  linkedinPreview: "Vista Previa LinkedIn",
  linkedinCharCount: "caracteres",
  linkedinCharLimit: "Máximo 3.000 caracteres",
  linkedinDailyLimit: "Publicaciones hoy",
  linkedinTokenExpiring: "Token expira pronto",
  linkedinTokenExpired: "Token expirado, reconecta tu cuenta",
  linkedinRateLimit: "Límite diario alcanzado",
  linkedinNoConnection: "Conecta tu cuenta de LinkedIn primero",
  linkedinPostSuccess: "Contenido publicado exitosamente en LinkedIn",
  linkedinSeeMore: "...ver más",
  linkedinPublishHistory: "Historial de Publicaciones",

  // Template-related
  templates: "Plantillas",
  template: "Plantilla",
  bundleFeeds: "Paquetes de fuentes",
  selectTemplate: "Selecciona un paquete",
  addManual: "Agregar manualmente",
  feedsAdded: "fuentes agregadas",
  feedsSkipped: "fuentes omitidas",
} as const;

/**
 * Translate a key to its user-friendly label
 * @param key - The key to translate (must be a valid LABELS key)
 * @returns The translated label, or the key itself if not found
 */
export function translate(key: string): string {
  return LABELS[key as keyof typeof LABELS] || key;
}

/**
 * Get a translated label for a status value
 * Handles various status types: content, feed, etc.
 */
export function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: LABELS.draft,
    review: LABELS.review,
    revision_needed: "Necesita cambios",
    approved: LABELS.approved,
    scheduled: "Programado",
    published: LABELS.published,
    archived: LABELS.archived,
    active: LABELS.active,
    paused: LABELS.paused,
    error: LABELS.error,
    syncing: LABELS.syncing,
    maintenance: "Mantenimiento",
    running: "Ejecutando",
    completed: "Completado",
    failed: "Fallido",
    pending: "Pendiente",
  };
  return statusMap[status] || status;
}

/**
 * Get color variant for a status
 * Used for badges and status indicators
 */
export function getStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  const variantMap: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    draft: "default",
    review: "warning",
    revision_needed: "warning",
    approved: "success",
    scheduled: "info",
    published: "success",
    archived: "default",
    active: "success",
    paused: "warning",
    error: "error",
    syncing: "info",
    maintenance: "warning",
    running: "info",
    completed: "success",
    failed: "error",
    pending: "default",
  };
  return variantMap[status] || "default";
}
