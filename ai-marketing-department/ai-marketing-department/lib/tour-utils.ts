/**
 * Tour Utilities - State management and step definitions for product tour
 *
 * Manages localStorage persistence for tour completion/skip state
 * Defines all 7 tour steps with targets, titles, and placements
 */

export interface TourStep {
  id: number;
  target: string | null; // CSS selector for [data-tour="..."] or null for centered
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

/**
 * 7-step product tour definition
 * Each step highlights a key AMD dashboard feature
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    target: '[data-tour="sidebar"]',
    title: "Navegación Principal",
    content: "Usa la barra lateral para moverte entre las 4 secciones principales: Inicio, Contenido, Resultados y Configuración.",
    placement: "right",
  },
  {
    id: 2,
    target: '[data-tour="home-metrics"]',
    title: "Métricas Clave",
    content: "Aquí ves las 3 métricas principales de tu departamento de marketing: contenido generado, campañas activas y rendimiento.",
    placement: "bottom",
  },
  {
    id: 3,
    target: '[data-tour="content-section"]',
    title: "Gestión de Contenido",
    content: "Crea, edita y publica contenido en múltiples formatos: blogs, redes sociales, emails y más.",
    placement: "left",
  },
  {
    id: 4,
    target: '[data-tour="results-page"]',
    title: "Resultados y Analytics",
    content: "Monitorea el rendimiento de tus campañas con KPIs en tiempo real y gráficos de tendencias.",
    placement: "top",
  },
  {
    id: 5,
    target: '[data-tour="feed-health"]',
    title: "Salud de Feeds",
    content: "Verifica el estado de tus feeds RSS y conexiones de contenido para asegurar flujo continuo.",
    placement: "bottom",
  },
  {
    id: 6,
    target: '[data-tour="settings"]',
    title: "Configuración",
    content: "Ajusta preferencias de tu cuenta, API keys y configuración de agentes de IA.",
    placement: "left",
  },
  {
    id: 7,
    target: null, // No specific target, centered modal
    title: "¡Listo para comenzar!",
    content: "Ya conoces las principales funciones. Puedes volver a este tour desde la sección de Ayuda en cualquier momento.",
    placement: "center",
  },
];

// LocalStorage key for tour state persistence
const TOUR_STORAGE_KEY = "amd-product-tour";

export interface TourState {
  completed: boolean;
  skipped: boolean;
  lastShown?: string; // ISO timestamp
}

/**
 * Get current tour state from localStorage
 * @returns Tour state object with completed and skipped flags
 */
export function getTourState(): TourState {
  if (typeof window === "undefined") {
    return { completed: false, skipped: false };
  }

  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!stored) {
      return { completed: false, skipped: false };
    }

    const state = JSON.parse(stored) as TourState;
    return state;
  } catch (error) {
    console.error("Error reading tour state:", error);
    return { completed: false, skipped: false };
  }
}

/**
 * Mark tour as completed in localStorage
 */
export function setTourCompleted(): void {
  if (typeof window === "undefined") return;

  try {
    const state: TourState = {
      completed: true,
      skipped: false,
      lastShown: new Date().toISOString(),
    };
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving tour completion:", error);
  }
}

/**
 * Mark tour as skipped in localStorage
 */
export function setTourSkipped(): void {
  if (typeof window === "undefined") return;

  try {
    const state: TourState = {
      completed: false,
      skipped: true,
      lastShown: new Date().toISOString(),
    };
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving tour skip:", error);
  }
}

/**
 * Reset tour state (for re-triggering from help section)
 */
export function resetTour(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting tour:", error);
  }
}

/**
 * Determine if tour should be shown to user
 * @returns true if user hasn't completed or skipped the tour
 */
export function shouldShowTour(): boolean {
  // DEV BYPASS: disable tour for preview
  // TODO: restore before production
  return false;
  // const state = getTourState();
  // return !state.completed && !state.skipped;
}

/**
 * Find DOM element for a tour step
 * @param selector CSS selector for tour target
 * @returns HTMLElement or null if not found
 */
export function findTourElement(selector: string): HTMLElement | null {
  if (typeof window === "undefined") return null;

  try {
    return document.querySelector(selector) as HTMLElement;
  } catch (error) {
    console.error(`Error finding tour element: ${selector}`, error);
    return null;
  }
}

/**
 * Calculate tooltip position relative to target element
 * @param element Target element
 * @param placement Desired placement direction
 * @returns Position object with top, left, and arrow direction
 */
export function calculateTooltipPosition(
  element: HTMLElement,
  placement: TourStep["placement"]
): { top: number; left: number; arrowDirection: string } {
  const rect = element.getBoundingClientRect();
  const tooltipWidth = 400; // max-w-md
  const tooltipHeight = 200; // estimated
  const offset = 16; // gap from target

  let top = 0;
  let left = 0;
  let arrowDirection = "";

  switch (placement) {
    case "right":
      top = rect.top + rect.height / 2;
      left = rect.right + offset;
      arrowDirection = "left";
      break;
    case "left":
      top = rect.top + rect.height / 2;
      left = rect.left - tooltipWidth - offset;
      arrowDirection = "right";
      break;
    case "bottom":
      top = rect.bottom + offset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowDirection = "top";
      break;
    case "top":
      top = rect.top - tooltipHeight - offset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowDirection = "bottom";
      break;
    case "center":
    default:
      // Centered on screen
      top = window.innerHeight / 2 - tooltipHeight / 2;
      left = window.innerWidth / 2 - tooltipWidth / 2;
      arrowDirection = "none";
      break;
  }

  return { top, left, arrowDirection };
}
