/**
 * Next Action Rules Engine
 * Evaluates system state and returns the highest-priority recommended action.
 * Rules are ordered by priority - first matching rule wins.
 */

export interface NextAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: "rocket" | "filetext" | "checkcircle" | "target" | "alertcircle" | "activity" | "clock" | "trendingup";
  priority: number;
}

export interface DashboardState {
  onboardingCompleted: boolean;
  totalContent: number;
  draftContent: number;
  reviewContent: number;
  approvedContent: number;
  publishedContent: number;
  activeCampaigns: number;
  totalCampaigns: number;
  feedsWithErrors: number;
  agentsInError: number;
  totalAgents: number;
  activeAgents: number;
  lastContentCreatedAt?: number;
}

interface NextActionRule {
  id: string;
  priority: number;
  evaluate: (state: DashboardState) => NextAction | null;
}

const RULES: NextActionRule[] = [
  {
    id: "complete-onboarding",
    priority: 1,
    evaluate: (state) => {
      if (!state.onboardingCompleted) {
        return {
          id: "complete-onboarding",
          title: "Completa tu configuración inicial",
          description: "Configura tu empresa, objetivos y fuentes de contenido para empezar.",
          href: "/onboarding",
          icon: "rocket",
          priority: 1,
        };
      }
      return null;
    },
  },
  {
    id: "create-first-content",
    priority: 2,
    evaluate: (state) => {
      if (state.onboardingCompleted && state.totalContent === 0) {
        return {
          id: "create-first-content",
          title: "Crea tu primer contenido",
          description: "Tus 37 agentes están listos. Empieza creando un post de marketing.",
          href: "/content",
          icon: "filetext",
          priority: 2,
        };
      }
      return null;
    },
  },
  {
    id: "agents-need-attention",
    priority: 3,
    evaluate: (state) => {
      if (state.agentsInError > 0) {
        return {
          id: "agents-need-attention",
          title: `${state.agentsInError} agente${state.agentsInError > 1 ? "s" : ""} necesita${state.agentsInError > 1 ? "n" : ""} atención`,
          description: "Revisa los agentes con errores para restaurar las operaciones.",
          href: "/",
          icon: "alertcircle",
          priority: 3,
        };
      }
      return null;
    },
  },
  {
    id: "review-pending-content",
    priority: 4,
    evaluate: (state) => {
      if (state.reviewContent > 0) {
        return {
          id: "review-pending-content",
          title: `Aprueba ${state.reviewContent} contenido${state.reviewContent > 1 ? "s" : ""} en revisión`,
          description: "Hay contenido esperando tu aprobación para ser publicado.",
          href: "/content",
          icon: "checkcircle",
          priority: 4,
        };
      }
      return null;
    },
  },
  {
    id: "drafts-pending",
    priority: 5,
    evaluate: (state) => {
      if (state.draftContent > 3) {
        return {
          id: "drafts-pending",
          title: `Tienes ${state.draftContent} borradores pendientes`,
          description: "Revisa y envía tus borradores para aprobación.",
          href: "/content?status=draft",
          icon: "filetext",
          priority: 5,
        };
      }
      return null;
    },
  },
  {
    id: "feeds-unhealthy",
    priority: 6,
    evaluate: (state) => {
      if (state.feedsWithErrors > 0) {
        return {
          id: "feeds-unhealthy",
          title: `Verifica ${state.feedsWithErrors} fuente${state.feedsWithErrors > 1 ? "s" : ""} con problemas`,
          description: "Algunas fuentes de contenido tienen errores de sincronización.",
          href: "/settings",
          icon: "alertcircle",
          priority: 6,
        };
      }
      return null;
    },
  },
  {
    id: "create-campaign",
    priority: 7,
    evaluate: (state) => {
      if (state.activeCampaigns === 0 && state.totalContent > 0) {
        return {
          id: "create-campaign",
          title: "Crea tu primera campaña de marketing",
          description: "Ya tienes contenido. Organízalo en una campaña para maximizar el impacto.",
          href: "/strategy",
          icon: "target",
          priority: 7,
        };
      }
      return null;
    },
  },
  {
    id: "content-stale",
    priority: 8,
    evaluate: (state) => {
      if (state.lastContentCreatedAt) {
        const daysSinceLastContent = Math.floor(
          (Date.now() - state.lastContentCreatedAt) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastContent > 7) {
          return {
            id: "content-stale",
            title: `Han pasado ${daysSinceLastContent} días sin nuevo contenido`,
            description: "Mantén la consistencia creando contenido regularmente.",
            href: "/content",
            icon: "clock",
            priority: 8,
          };
        }
      }
      return null;
    },
  },
  {
    id: "all-good",
    priority: 99,
    evaluate: () => ({
      id: "all-good",
      title: "¡Todo al día!",
      description: "Tu marketing está funcionando bien. Revisa tus resultados.",
      href: "/",
      icon: "trendingup",
      priority: 99,
    }),
  },
];

/**
 * Evaluate all rules and return the highest-priority next action
 */
export function getNextAction(state: DashboardState): NextAction {
  for (const rule of RULES) {
    const result = rule.evaluate(state);
    if (result) return result;
  }
  // Fallback (should never reach here due to "all-good" rule)
  return RULES[RULES.length - 1].evaluate(state)!;
}
