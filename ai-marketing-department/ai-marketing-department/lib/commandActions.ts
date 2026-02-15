import {
  Home,
  FileText,
  Settings,
  Brain,
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  ListTodo,
  Send,
  BookOpen,
  Plus,
  Zap,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Download,
  Search,
  Filter,
  Eye,
  type LucideIcon,
} from "lucide-react";

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  section: "Recientes" | "Páginas" | "Acciones" | "Agentes";
  keywords: string[];
  shortcut?: string;
  contextPages?: string[];
  action: "navigate" | "callback";
  href?: string;
}

// Page navigation commands
export const PAGE_COMMANDS: CommandAction[] = [
  { id: "nav-home", label: "Inicio", description: "Dashboard ejecutivo", icon: Home, section: "Páginas", keywords: ["dashboard", "home", "inicio", "principal"], action: "navigate", href: "/" },
  { id: "nav-content", label: "Contenido", description: "Pipeline, lista y calendario", icon: FileText, section: "Páginas", keywords: ["contenido", "content", "posts", "blog", "articulos"], action: "navigate", href: "/content" },
  { id: "nav-strategy", label: "Estrategia", description: "Autopilot y marca", icon: Brain, section: "Páginas", keywords: ["estrategia", "strategy", "campanas", "marca", "brand"], action: "navigate", href: "/strategy" },
  { id: "nav-reports", label: "Reportes", description: "Reportes y metricas", icon: BarChart3, section: "Páginas", keywords: ["reportes", "reports", "metricas", "informes"], action: "navigate", href: "/reports" },
  { id: "nav-analytics", label: "Analiticas", description: "Rendimiento de agentes", icon: TrendingUp, section: "Páginas", keywords: ["analiticas", "analytics", "rendimiento", "kpi"], action: "navigate", href: "/analytics" },
  { id: "nav-agents", label: "Agentes", description: "37 agentes IA", icon: Users, section: "Páginas", keywords: ["agentes", "agents", "ia", "bots"], action: "navigate", href: "/agents" },
  { id: "nav-monitoring", label: "Monitoreo", description: "Alertas y menciones", icon: Shield, section: "Páginas", keywords: ["monitoreo", "alertas", "menciones", "feeds"], action: "navigate", href: "/monitoring" },
  { id: "nav-tasks", label: "Tareas", description: "Cola de tareas", icon: ListTodo, section: "Páginas", keywords: ["tareas", "tasks", "cola", "ejecuciones"], action: "navigate", href: "/tasks" },
  { id: "nav-publishing", label: "Publicaciones", description: "Hub de publicacion", icon: Send, section: "Páginas", keywords: ["publicaciones", "publishing", "publicar", "redes"], action: "navigate", href: "/publishing" },
  { id: "nav-kb", label: "Base de Conocimiento", description: "Documentos y contexto IA", icon: BookOpen, section: "Páginas", keywords: ["conocimiento", "knowledge", "documentos", "kb"], action: "navigate", href: "/knowledge-base" },
  { id: "nav-settings", label: "Configuracion", description: "API keys y apariencia", icon: Settings, section: "Páginas", keywords: ["configuracion", "settings", "ajustes", "api"], action: "navigate", href: "/settings" },
];

// Action commands
export const ACTION_COMMANDS: CommandAction[] = [
  { id: "act-create-content", label: "Crear contenido", description: "Nuevo post o articulo", icon: Plus, section: "Acciones", keywords: ["crear", "nuevo", "contenido", "post", "articulo", "blog"], action: "navigate", href: "/content" },
  { id: "act-create-linkedin", label: "Crear post para LinkedIn", description: "Nuevo contenido profesional", icon: Plus, section: "Acciones", keywords: ["linkedin", "post", "profesional", "red social"], action: "navigate", href: "/content" },
  { id: "act-execute-agent", label: "Ejecutar agente", description: "Lanzar un agente IA", icon: Zap, section: "Acciones", keywords: ["ejecutar", "agente", "run", "lanzar", "ia"], action: "callback" },
  { id: "act-sync-feeds", label: "Sincronizar feeds", description: "Actualizar feeds manualmente", icon: RefreshCw, section: "Acciones", keywords: ["sincronizar", "feeds", "sync", "actualizar", "rss"], action: "callback" },
  { id: "act-generate-strategy", label: "Generar nueva estrategia", description: "CMO autopilot", icon: Brain, section: "Acciones", keywords: ["generar", "estrategia", "nueva", "cmo", "autopilot"], action: "navigate", href: "/strategy" },
  { id: "act-export-report", label: "Exportar reporte", description: "Descargar reporte PDF/CSV", icon: Download, section: "Acciones", keywords: ["exportar", "descargar", "reporte", "pdf", "csv"], action: "navigate", href: "/reports" },
];

// Context-specific commands (shown only on certain pages)
export const CONTEXT_COMMANDS: CommandAction[] = [
  // Content page
  { id: "ctx-new-draft", label: "Nuevo borrador", description: "Crear contenido desde cero", icon: Plus, section: "Acciones", keywords: ["borrador", "draft", "nuevo"], contextPages: ["/content"], action: "callback" },
  { id: "ctx-filter-status", label: "Filtrar por estado", description: "Filtrar contenido por estado", icon: Filter, section: "Acciones", keywords: ["filtrar", "estado", "filter", "status"], contextPages: ["/content"], action: "callback" },
  { id: "ctx-view-calendar", label: "Vista calendario", description: "Cambiar a vista calendario", icon: FileText, section: "Acciones", keywords: ["calendario", "calendar", "vista"], contextPages: ["/content"], action: "callback" },

  // Agents page
  { id: "ctx-run-agent", label: "Ejecutar agente", description: "Seleccionar y ejecutar agente", icon: Zap, section: "Acciones", keywords: ["ejecutar", "agente", "run"], contextPages: ["/agents"], action: "callback" },
  { id: "ctx-agent-metrics", label: "Ver metricas de agentes", description: "Dashboard de rendimiento", icon: Eye, section: "Acciones", keywords: ["metricas", "rendimiento", "agentes"], contextPages: ["/agents"], action: "navigate", href: "/analytics" },

  // Strategy page
  { id: "ctx-pause-strategy", label: "Pausar estrategia activa", description: "Pausar ejecucion", icon: PauseCircle, section: "Acciones", keywords: ["pausar", "detener", "estrategia"], contextPages: ["/strategy"], action: "callback" },
  { id: "ctx-resume-strategy", label: "Reanudar estrategia", description: "Continuar ejecucion", icon: PlayCircle, section: "Acciones", keywords: ["reanudar", "continuar", "estrategia"], contextPages: ["/strategy"], action: "callback" },
  { id: "ctx-strategy-tasks", label: "Ver tareas de estrategia", description: "Lista de tareas pendientes", icon: ListTodo, section: "Acciones", keywords: ["tareas", "pendientes", "estrategia"], contextPages: ["/strategy"], action: "navigate", href: "/tasks" },

  // Publishing page
  { id: "ctx-publish-approved", label: "Publicar contenido aprobado", description: "Publicar todo lo aprobado", icon: Send, section: "Acciones", keywords: ["publicar", "aprobado", "enviar"], contextPages: ["/publishing"], action: "callback" },
];

// Fuzzy match helper
export function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Direct substring match
  if (lower.includes(queryLower)) return true;

  // Character-by-character fuzzy match
  let qi = 0;
  for (let i = 0; i < lower.length && qi < queryLower.length; i++) {
    if (lower[i] === queryLower[qi]) qi++;
  }
  return qi === queryLower.length;
}

// Recent commands storage key
export const RECENT_COMMANDS_KEY = "amd_recent_commands";
export const MAX_RECENT = 5;

export function getRecentCommands(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentCommand(commandId: string): void {
  try {
    const recent = getRecentCommands().filter((id) => id !== commandId);
    recent.unshift(commandId);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Silently fail
  }
}
