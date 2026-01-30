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
    approved: LABELS.approved,
    published: LABELS.published,
    archived: LABELS.archived,
    active: LABELS.active,
    paused: LABELS.paused,
    error: LABELS.error,
    syncing: LABELS.syncing,
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
    approved: "success",
    published: "success",
    archived: "default",
    active: "success",
    paused: "warning",
    error: "error",
    syncing: "info",
  };
  return variantMap[status] || "default";
}
