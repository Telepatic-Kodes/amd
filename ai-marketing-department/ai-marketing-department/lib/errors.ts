/**
 * Centralized error classification and Spanish error messages.
 * Maps raw errors into actionable, user-friendly messages.
 */

export type ErrorCode =
  | "NETWORK"
  | "AUTH_EXPIRED"
  | "AUTH_UNAUTHORIZED"
  | "VALIDATION"
  | "CONVEX"
  | "AI_AGENT"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "UNKNOWN";

export interface ClassifiedError {
  code: ErrorCode;
  title: string;
  description: string;
  action?: string;
  retryable: boolean;
  original?: unknown;
}

const ERROR_MESSAGES: Record<
  ErrorCode,
  { title: string; description: string; action?: string; retryable: boolean }
> = {
  NETWORK: {
    title: "Sin conexión",
    description:
      "No se pudo conectar al servidor. Verifica tu conexión a internet.",
    action: "Reintentar",
    retryable: true,
  },
  AUTH_EXPIRED: {
    title: "Sesión expirada",
    description: "Tu sesión ha expirado. Inicia sesión de nuevo para continuar.",
    action: "Iniciar sesión",
    retryable: false,
  },
  AUTH_UNAUTHORIZED: {
    title: "Sin permisos",
    description: "No tienes permisos para realizar esta acción.",
    retryable: false,
  },
  VALIDATION: {
    title: "Datos inválidos",
    description: "Revisa los campos marcados e intenta de nuevo.",
    retryable: false,
  },
  CONVEX: {
    title: "Error del servidor",
    description:
      "Ocurrió un problema procesando tu solicitud. Intenta de nuevo.",
    action: "Reintentar",
    retryable: true,
  },
  AI_AGENT: {
    title: "Error del agente IA",
    description:
      "El agente de IA no pudo completar la tarea. Intenta de nuevo o simplifica tu solicitud.",
    action: "Reintentar",
    retryable: true,
  },
  NOT_FOUND: {
    title: "No encontrado",
    description: "El recurso que buscas no existe o fue eliminado.",
    retryable: false,
  },
  RATE_LIMIT: {
    title: "Demasiadas solicitudes",
    description: "Has realizado muchas solicitudes. Espera un momento e intenta de nuevo.",
    action: "Reintentar",
    retryable: true,
  },
  UNKNOWN: {
    title: "Error inesperado",
    description: "Ocurrió un problema. Intenta recargar la página.",
    action: "Reintentar",
    retryable: true,
  },
};

/** Check if an error is a network/connection failure */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return false; // intentional abort, not network
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("load failed")
  );
}

/** Classify a raw error into a structured, user-friendly error */
export function classifyError(error: unknown): ClassifiedError {
  // Network errors
  if (isNetworkError(error)) {
    return { ...ERROR_MESSAGES.NETWORK, code: "NETWORK", original: error };
  }

  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const messageLower = message.toLowerCase();

  // Auth errors
  if (
    messageLower.includes("not authenticated") ||
    messageLower.includes("unauthenticated") ||
    messageLower.includes("session expired") ||
    messageLower.includes("token expired")
  ) {
    return { ...ERROR_MESSAGES.AUTH_EXPIRED, code: "AUTH_EXPIRED", original: error };
  }

  if (
    messageLower.includes("unauthorized") ||
    messageLower.includes("forbidden") ||
    messageLower.includes("no tienes permiso") ||
    messageLower.includes("not authorized")
  ) {
    return {
      ...ERROR_MESSAGES.AUTH_UNAUTHORIZED,
      code: "AUTH_UNAUTHORIZED",
      original: error,
    };
  }

  // Rate limiting
  if (
    messageLower.includes("rate limit") ||
    messageLower.includes("too many requests") ||
    messageLower.includes("429")
  ) {
    return { ...ERROR_MESSAGES.RATE_LIMIT, code: "RATE_LIMIT", original: error };
  }

  // AI agent errors
  if (
    messageLower.includes("anthropic") ||
    messageLower.includes("claude") ||
    messageLower.includes("overloaded") ||
    messageLower.includes("context_length") ||
    messageLower.includes("api key")
  ) {
    return { ...ERROR_MESSAGES.AI_AGENT, code: "AI_AGENT", original: error };
  }

  // Not found
  if (
    messageLower.includes("not found") ||
    messageLower.includes("no encontrado") ||
    messageLower.includes("does not exist")
  ) {
    return { ...ERROR_MESSAGES.NOT_FOUND, code: "NOT_FOUND", original: error };
  }

  // Validation
  if (
    messageLower.includes("validation") ||
    messageLower.includes("invalid") ||
    messageLower.includes("required")
  ) {
    return { ...ERROR_MESSAGES.VALIDATION, code: "VALIDATION", original: error };
  }

  // Convex-specific
  if (
    messageLower.includes("convex") ||
    messageLower.includes("server error") ||
    messageLower.includes("internal error")
  ) {
    return { ...ERROR_MESSAGES.CONVEX, code: "CONVEX", original: error };
  }

  // Unknown fallback
  return { ...ERROR_MESSAGES.UNKNOWN, code: "UNKNOWN", original: error };
}

/** Get error message for a specific code */
export function getErrorMessage(code: ErrorCode) {
  return ERROR_MESSAGES[code];
}
