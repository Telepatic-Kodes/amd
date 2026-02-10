/**
 * Maps Claude API / AI agent errors to specific Spanish user messages.
 * More granular than the general error classifier for AI-specific failures.
 */

interface AgentErrorInfo {
  title: string;
  description: string;
  retryable: boolean;
  retryDelay?: number; // seconds
}

const AGENT_ERROR_PATTERNS: Array<{
  test: (msg: string) => boolean;
  info: AgentErrorInfo;
}> = [
  {
    test: (m) => m.includes("rate_limit") || m.includes("rate limit") || m.includes("429"),
    info: {
      title: "Servicio de IA saturado",
      description:
        "El servicio de IA está temporalmente saturado. Reintenta en unos segundos.",
      retryable: true,
      retryDelay: 30,
    },
  },
  {
    test: (m) => m.includes("overloaded") || m.includes("529"),
    info: {
      title: "Servicio de IA en mantenimiento",
      description:
        "El servicio de IA está temporalmente sobrecargado. Reintenta en unos minutos.",
      retryable: true,
      retryDelay: 60,
    },
  },
  {
    test: (m) => m.includes("timeout") || m.includes("timed out"),
    info: {
      title: "Tiempo de espera agotado",
      description:
        "La generación tomó demasiado tiempo. Intenta con un prompt más corto o menos canales.",
      retryable: true,
    },
  },
  {
    test: (m) =>
      m.includes("context_length") ||
      m.includes("too many tokens") ||
      m.includes("max_tokens"),
    info: {
      title: "Contenido demasiado largo",
      description:
        "El contenido es demasiado largo para procesar. Reduce el texto e intenta de nuevo.",
      retryable: false,
    },
  },
  {
    test: (m) =>
      m.includes("invalid_api_key") ||
      m.includes("authentication") ||
      m.includes("api key"),
    info: {
      title: "API key inválida",
      description:
        "La API key de IA no es válida. Revisa la configuración en Ajustes.",
      retryable: false,
    },
  },
  {
    test: (m) => m.includes("content_policy") || m.includes("safety"),
    info: {
      title: "Contenido no permitido",
      description:
        "El contenido solicitado no cumple con las políticas de uso. Modifica tu solicitud.",
      retryable: false,
    },
  },
];

/**
 * Classify an AI agent error into a specific Spanish message.
 * Returns null if the error doesn't match any known AI pattern.
 */
export function classifyAgentError(error: unknown): AgentErrorInfo | null {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  for (const pattern of AGENT_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return pattern.info;
    }
  }

  return null;
}

/**
 * Get a user-friendly message for an AI agent error.
 * Falls back to a generic message if no specific pattern matches.
 */
export function getAgentErrorMessage(error: unknown): AgentErrorInfo {
  return (
    classifyAgentError(error) ?? {
      title: "Error del agente IA",
      description:
        "El agente no pudo completar la tarea. Intenta de nuevo o simplifica tu solicitud.",
      retryable: true,
    }
  );
}
