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

  // Twitter/X Integration
  twitterConnected: "Conectado",
  twitterDisconnected: "Desconectado",
  twitterExpired: "Token Expirado",
  connectTwitter: "Conectar Twitter/X",
  reconnectTwitter: "Reconectar",
  disconnectTwitter: "Desconectar",
  twitterDescription: "Publica contenido directamente en Twitter/X",
  twitterDailyLimit: "Publicaciones hoy",
  twitterTokenExpiring: "Token expira pronto",
  publishToTwitter: "Publicar en Twitter/X",
  publishingToTwitter: "Publicando...",
  twitterPublished: "Publicado en Twitter/X",
  twitterPostSuccess: "Contenido publicado exitosamente en Twitter/X",
  twitterPublishError: "Error al publicar",
  twitterNoConnection: "Conecta tu cuenta de Twitter/X primero",
  twitterRateLimit: "Límite diario alcanzado",
  twitterThreadInfo: "Se creará un thread automáticamente",
  twitterPreview: "Vista Previa Twitter/X",

  // Instagram Integration
  instagramConnected: "Conectado",
  instagramDisconnected: "Desconectado",
  instagramExpired: "Token Expirado",
  instagramPendingReview: "Pendiente de revisión",
  connectInstagram: "Conectar Instagram",
  reconnectInstagram: "Reconectar",
  disconnectInstagram: "Desconectar",
  instagramDescription: "Publica contenido directamente en Instagram",
  instagramDailyLimit: "Publicaciones hoy",
  instagramTokenExpiring: "Token expira pronto",
  publishToInstagram: "Publicar en Instagram",
  publishingToInstagram: "Publicando...",
  instagramPublished: "Publicado en Instagram",
  instagramPostSuccess: "Contenido publicado exitosamente en Instagram",
  instagramPublishError: "Error al publicar",
  instagramNoConnection: "Conecta tu cuenta de Instagram primero",
  instagramRateLimit: "Límite diario alcanzado",
  instagramImageRequired: "Se requiere imagen para Instagram",
  instagramPreview: "Vista Previa Instagram",
  instagramFacebookRequired: "Requiere cuenta de Facebook Business vinculada",

  // Platform Publishing (multi-platform)
  platformsHeader: "Plataformas de Publicación",
  platformsDescription: "Conecta tus cuentas para publicar contenido directamente desde AMD",
  publishToPlatforms: "Publicar en plataformas",
  publishedTo: "Publicado en",
  notPublishedYet: "No publicado aún",

  // Cross-Platform Publishing
  crossPlatformPublish: "Publicar en Múltiples Plataformas",
  selectPlatforms: "Seleccionar Plataformas",
  publishToSelected: "Publicar en {N} plataformas",
  publishingToMultiple: "Publicando...",
  platformPreview: "Previsualización por Plataforma",
  selectPlatformsPreview: "Selecciona plataformas para ver previsualización",
  notConnected: "No conectado",
  twitterThread: "Hilo de {N} tweets",
  instagramCaption: "Subtítulo",
  linkedinPost: "Publicación",
  charactersUsed: "{N}/{MAX} caracteres",
  publishSuccess: "Publicado correctamente en {platform}",
  publishError: "Error al publicar en {platform}",
  publishResults: "Resultados de Publicación",
  allPlatformsSuccess: "Contenido publicado en todas las plataformas",
  someFailures: "{N} plataforma(s) fallaron",
  imageUrlRequired: "URL de imagen requerida para Instagram",
  suggestedHashtags: "Hashtags sugeridos",
  hashtagsFromKeywords: "Extraídos de palabras clave del contenido",

  // Unified Publishing History
  publishHistory: "Historial de Publicaciones",
  publishedCount: "{N} publicadas",
  failedCount: "{N} fallidas",
  pendingCount: "{N} pendientes",
  noPublicationsYet: "No hay publicaciones aún",
  publishFromDetail: "Publica contenido desde la vista de detalle",
  viewMore: "Ver más",
  publishedStatus: "Publicado",
  failedStatus: "Fallido",
  pendingStatus: "Pendiente",
  deletedStatus: "Eliminado",

  // Guided UX
  setupProgress: "Progreso de Configuración",
  setupComplete: "Configuración completada",
  nextRecommendedAction: "Siguiente paso recomendado",
  dismissForToday: "Ocultar por hoy",
  quickMode: "Modo Express",
  quickModeEnabled: "Modo Express activado",
  quickModeDescription: "Configuración rápida sin explicaciones",
  guidanceSettings: "Guía y Onboarding",
  contextualHelp: "Ayuda contextual",
  stepCompleted: "Paso completado",
  stepsRemaining: "pasos restantes",

  // Template-related
  templates: "Plantillas",
  template: "Plantilla",
  bundleFeeds: "Paquetes de fuentes",
  selectTemplate: "Selecciona un paquete",
  addManual: "Agregar manualmente",
  feedsAdded: "fuentes agregadas",
  feedsSkipped: "fuentes omitidas",

  // Auth translations
  auth_iniciar_sesion: "Iniciar sesión",
  auth_registrarse: "Registrarse",
  auth_cerrar_sesion: "Cerrar sesión",
  auth_mi_cuenta: "Mi cuenta",
  auth_perfil: "Perfil",
  auth_bienvenido: "Bienvenido",
  auth_no_autenticado: "No autenticado",
  auth_migracion_titulo: "Migrar datos existentes",
  auth_migracion_descripcion: "Asignar todos los datos existentes a tu cuenta como propietario del sistema.",
  auth_migracion_boton: "Ejecutar migración",
  auth_migracion_completada: "Migración completada",
  auth_migracion_error: "Error en la migración",

  // Team & Roles
  team: "Equipo",
  teamManagement: "Gestión de equipo",
  roleUpdated: "Rol actualizado",
  roleUpdateError: "Error al actualizar rol",
  owner: "Propietario",
  admin: "Administrador",
  editor: "Editor",
  reviewer: "Revisor",
  publisher: "Publicador",
  viewer: "Lector",
  noPermission: "No tienes permiso para esta acción",

  // Version History
  versionHistory: "Historial de versiones",
  version: "Versión",
  rollback: "Revertir",
  rollbackConfirm: "¿Revertir a esta versión?",
  rollbackSuccess: "Contenido revertido exitosamente",
  changes: "Cambios",
  noChanges: "Sin cambios",
  compareVersions: "Comparar versiones",
  editedBy: "Editado por",
  createdVersion: "Creado",
  editedVersion: "Editado",
  statusChanged: "Estado cambiado",
  rolledBack: "Revertido",

  // Reports
  reports: "Reportes",
  reportSettings: "Configuración de reportes",
  emailDelivery: "Envío por correo",
  emailDeliveryDesc: "Recibe reportes automáticos por correo electrónico",
  reportFrequency: "Frecuencia",
  weekly: "Semanal",
  monthly: "Mensual",
  both: "Ambos",
  includeAiInsights: "Incluir análisis de IA",
  includeAiInsightsDesc: "El CMO genera un resumen ejecutivo con recomendaciones",
  recipientEmail: "Correo de destino",
  recipientEmailDesc: "Dejar vacío para usar tu correo de cuenta",
  generateNow: "Generar ahora",
  generating: "Generando...",
  reportGenerated: "Reporte generado exitosamente",
  reportError: "Error al generar reporte",
  reportHistory: "Historial de reportes",
  noReports: "Aún no hay reportes generados",
  viewReport: "Ver reporte",
  downloadReport: "Descargar reporte",
  weeklyReport: "Reporte semanal",
  monthlyReport: "Reporte mensual",
  emailSent: "Correo enviado",
  emailNotSent: "Correo no enviado",
  period: "Período",
  settingsSaved: "Configuración guardada",
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
