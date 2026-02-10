import { Id } from "../_generated/dataModel";

/**
 * Calculate cost based on model and tokens.
 * Prices per million tokens (input/output).
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "claude-opus-4-5-20251101": { input: 15, output: 75 },
    "claude-opus-4-20250514": { input: 15, output: 75 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-haiku-3-20250514": { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"];

  return (
    (inputTokens * modelPricing.input) / 1_000_000 +
    (outputTokens * modelPricing.output) / 1_000_000
  );
}

/**
 * Extract search keywords from task input for feed querying.
 * Combines topic, keyword, title, and industry fields.
 */
export function extractKeywords(taskType: string, input: Record<string, unknown>): string {
  const parts: string[] = [];

  if (input.topic) parts.push(String(input.topic));
  if (input.keyword) parts.push(String(input.keyword));
  if (input.title) parts.push(String(input.title));
  if (input.industry) parts.push(String(input.industry));
  if (input.subject) parts.push(String(input.subject));
  if (input.query) parts.push(String(input.query));
  if (input.searchTerms) parts.push(String(input.searchTerms));

  if (taskType.includes("seo") || taskType.includes("keyword")) {
    if (input.targetKeyword) parts.push(String(input.targetKeyword));
    if (input.keywords && Array.isArray(input.keywords)) {
      parts.push(...input.keywords.slice(0, 3).map(String));
    }
  }

  return parts.join(" ").slice(0, 100).trim();
}

/**
 * Map agent department to relevant feed categories.
 */
export function mapDepartmentToCategories(department: string): string[] {
  const mapping: Record<string, string[]> = {
    content: ["industry", "technical", "trends"],
    social: ["industry", "competitor", "trends"],
    seo: ["technical", "competitor", "industry"],
    demandgen: ["competitor", "industry"],
    brand: ["industry", "trends"],
    ops: ["technical"],
    leadership: ["industry", "competitor", "trends"],
  };
  return mapping[department] || ["industry"];
}

/**
 * Enhance agent system prompt with relevant feed and KB context.
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  feedItems: Array<{
    title: string;
    link: string;
    summary: string | null;
    content: string | null;
    publishedAt: number | null;
    feedName: string;
  }>,
  kbSections?: Array<{
    title: string;
    content: string;
    kbName: string;
    kbCategory: string;
  }>
): string {
  let enhancedPrompt = basePrompt;

  if (feedItems && feedItems.length > 0) {
    const feedContext = feedItems
      .map(
        (item, i) =>
          `[${i + 1}] ${item.title}\n` +
          `Source: ${item.feedName} - ${item.link}\n` +
          `Published: ${item.publishedAt ? new Date(item.publishedAt).toISOString().split("T")[0] : "Unknown"}\n` +
          `Summary: ${item.summary || item.content || "No content available"}`
      )
      .join("\n\n---\n\n");

    enhancedPrompt += `

## Relevant Industry Context

The following recent feed items may be relevant to your task. Use this context when appropriate, but prioritize the user's specific request.

${feedContext}

---
End of feed context.`;
  }

  if (kbSections && kbSections.length > 0) {
    const kbContext = kbSections
      .map(
        (section, i) =>
          `[KB-${i + 1}] ${section.title}\n` +
          `Category: ${section.kbCategory} | Source: ${section.kbName}\n` +
          `Content:\n${section.content.substring(0, 1500)}${section.content.length > 1500 ? "..." : ""}`
      )
      .join("\n\n---\n\n");

    enhancedPrompt += `

## Company Knowledge Base

The following information comes from your company's knowledge base. Use this as the source of truth for brand voice, product details, and guidelines. Prioritize this information over general knowledge when applicable.

${kbContext}

---
End of knowledge base.`;
  }

  return enhancedPrompt;
}

/**
 * Build user message based on task type.
 */
export function buildUserMessage(taskType: string, input: Record<string, unknown>): string {
  switch (taskType) {
    case "write_blog":
      return `Escribe un artículo de blog basado en el siguiente brief:

Título: ${input.title || "Sin título"}
Keyword principal: ${input.keyword || "N/A"}
Palabras objetivo: ${input.wordCount || 1000}
Tono: ${input.tone || "profesional"}
Audiencia: ${input.audience || "general"}

${input.instructions ? `Instrucciones adicionales:\n${input.instructions}` : ""}

Devuelve el artículo completo en formato Markdown.`;

    case "create_linkedin_post":
      return `Crea un post de LinkedIn basado en:

Tema: ${input.topic || input.title}
Objetivo: ${input.objective || "engagement"}
Tono: ${input.tone || "profesional pero cercano"}

${input.sourceContent ? `Contenido fuente para adaptar:\n${input.sourceContent}` : ""}

El post debe:
- Tener un hook que capture atención en las primeras líneas
- Usar espaciado estratégico
- Incluir un CTA al final
- No usar hashtags excesivos (máximo 3-5)`;

    case "create_twitter_thread":
      return `Crea un thread de Twitter/X basado en:

Tema: ${input.topic || input.title}
Tweets objetivo: ${input.tweetCount || 5}
Estilo: ${input.style || "educativo con personalidad"}

${input.sourceContent ? `Contenido fuente:\n${input.sourceContent}` : ""}

Reglas:
- Primer tweet debe ser el hook más fuerte
- Cada tweet debe tener valor independiente
- Último tweet con CTA y potencial para RT`;

    case "create_instagram_post":
      return `Crea un post de Instagram basado en:

Tema: ${input.topic || input.title}
Objetivo: ${input.objective || "engagement y alcance"}
Tono: ${input.tone || "visual y atractivo"}

${input.customInstructions ? `Instrucciones adicionales:\n${input.customInstructions}` : ""}

El post debe incluir:
- Caption atractivo con hook inicial
- Emojis estratégicos (no excesivos)
- Call to action claro (guardar, compartir, comentar)
- Hashtags relevantes (10-15)
- Sugerencia de tipo de visual (foto, carrusel, reel)`;

    case "create_tiktok_script":
      return `Crea un script de TikTok/Reels basado en:

Tema: ${input.topic || input.title}
Duración objetivo: ${input.duration || "30-60 segundos"}
Estilo: ${input.style || "educativo y entretenido"}

${input.customInstructions ? `Instrucciones adicionales:\n${input.customInstructions}` : ""}

El script debe incluir:
- Hook en los primeros 3 segundos (texto en pantalla + voz)
- Estructura clara: Hook → Contexto → Valor → CTA
- Indicaciones de edición [CORTE], [TEXTO EN PANTALLA], [MÚSICA]
- Call to action final
- Sugerencia de trending audio si aplica`;

    case "keyword_research":
      return `Realiza investigación de keywords para:

Tema principal: ${input.topic}
Industria: ${input.industry || "general"}
Intención: ${input.intent || "informacional y transaccional"}

Proporciona:
1. 10 keywords principales con volumen estimado
2. 20 long-tail keywords relacionadas
3. Preguntas frecuentes sobre el tema
4. Sugerencias de clusters de contenido`;

    case "analyze_engagement":
      return `Analiza las siguientes métricas de engagement:

${JSON.stringify(input.metrics, null, 2)}

Proporciona:
1. Resumen ejecutivo
2. Tendencias identificadas
3. Top performing content
4. Áreas de mejora
5. Recomendaciones accionables`;

    default:
      return `Ejecuta la siguiente tarea: ${taskType}

Input:
${typeof input === "object" ? JSON.stringify(input, null, 2) : String(input)}

Proporciona un resultado estructurado y accionable.`;
  }
}

/**
 * Task types available per department for the RunAgentModal.
 */
export const TASK_TYPES_BY_DEPARTMENT: Record<string, Array<{ value: string; label: string }>> = {
  content: [
    { value: "write_blog", label: "Escribir Blog" },
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  social: [
    { value: "create_linkedin_post", label: "Post de LinkedIn" },
    { value: "create_twitter_thread", label: "Thread de Twitter" },
    { value: "create_instagram_post", label: "Post de Instagram" },
    { value: "create_tiktok_script", label: "Script de TikTok" },
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  seo: [
    { value: "keyword_research", label: "Investigación de Keywords" },
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  demandgen: [
    { value: "analyze_engagement", label: "Analizar Engagement" },
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  brand: [
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  ops: [
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
  leadership: [
    { value: "manual_execution", label: "Ejecución Manual" },
  ],
};

/**
 * Input field definitions per task type for the RunAgentModal.
 */
export interface InputFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  placeholder?: string;
  defaultValue?: string | number;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export const INPUT_FIELDS_BY_TASK_TYPE: Record<string, InputFieldDef[]> = {
  write_blog: [
    { key: "title", label: "Título", type: "text", placeholder: "Título del artículo", required: true },
    { key: "keyword", label: "Keyword Principal", type: "text", placeholder: "ej. marketing automation" },
    { key: "wordCount", label: "Palabras Objetivo", type: "number", defaultValue: 1000 },
    { key: "tone", label: "Tono", type: "select", options: [
      { value: "profesional", label: "Profesional" },
      { value: "casual", label: "Casual" },
      { value: "técnico", label: "Técnico" },
      { value: "friendly", label: "Amigable" },
    ]},
    { key: "audience", label: "Audiencia", type: "text", placeholder: "ej. CMOs de empresas B2B" },
    { key: "instructions", label: "Instrucciones Adicionales", type: "textarea", placeholder: "Instrucciones extra para el agente..." },
  ],
  create_linkedin_post: [
    { key: "topic", label: "Tema", type: "text", placeholder: "Tema del post", required: true },
    { key: "objective", label: "Objetivo", type: "select", options: [
      { value: "engagement", label: "Engagement" },
      { value: "thought_leadership", label: "Thought Leadership" },
      { value: "lead_generation", label: "Generación de Leads" },
      { value: "brand_awareness", label: "Brand Awareness" },
    ]},
    { key: "tone", label: "Tono", type: "text", placeholder: "profesional pero cercano" },
    { key: "sourceContent", label: "Contenido Fuente", type: "textarea", placeholder: "Pega contenido para adaptar (opcional)..." },
  ],
  create_twitter_thread: [
    { key: "topic", label: "Tema", type: "text", placeholder: "Tema del thread", required: true },
    { key: "tweetCount", label: "Cantidad de Tweets", type: "number", defaultValue: 5 },
    { key: "style", label: "Estilo", type: "text", placeholder: "educativo con personalidad" },
    { key: "sourceContent", label: "Contenido Fuente", type: "textarea", placeholder: "Contenido base (opcional)..." },
  ],
  create_instagram_post: [
    { key: "topic", label: "Tema", type: "text", placeholder: "Tema del post", required: true },
    { key: "objective", label: "Objetivo", type: "text", placeholder: "engagement y alcance" },
    { key: "tone", label: "Tono", type: "text", placeholder: "visual y atractivo" },
    { key: "customInstructions", label: "Instrucciones", type: "textarea", placeholder: "Instrucciones adicionales..." },
  ],
  create_tiktok_script: [
    { key: "topic", label: "Tema", type: "text", placeholder: "Tema del video", required: true },
    { key: "duration", label: "Duración", type: "text", placeholder: "30-60 segundos" },
    { key: "style", label: "Estilo", type: "text", placeholder: "educativo y entretenido" },
    { key: "customInstructions", label: "Instrucciones", type: "textarea", placeholder: "Instrucciones adicionales..." },
  ],
  keyword_research: [
    { key: "topic", label: "Tema Principal", type: "text", placeholder: "ej. AI marketing", required: true },
    { key: "industry", label: "Industria", type: "text", placeholder: "ej. SaaS B2B" },
    { key: "intent", label: "Intención", type: "select", options: [
      { value: "informacional", label: "Informacional" },
      { value: "transaccional", label: "Transaccional" },
      { value: "informacional y transaccional", label: "Ambas" },
    ]},
  ],
  analyze_engagement: [
    { key: "metrics", label: "Métricas (JSON)", type: "textarea", placeholder: '{"likes": 150, "comments": 23, ...}', required: true },
  ],
  manual_execution: [
    { key: "prompt", label: "Instrucciones", type: "textarea", placeholder: "Describe lo que quieres que haga el agente...", required: true },
  ],
};

/**
 * Map task type to content type for auto-save pipeline.
 */
export const TASK_TYPE_TO_CONTENT_TYPE: Record<string, string> = {
  write_blog: "blog",
  create_linkedin_post: "social_linkedin",
  create_twitter_thread: "social_twitter",
  create_instagram_post: "social_instagram",
  create_tiktok_script: "social_tiktok",
};

/**
 * Check if a task type produces content that should be auto-saved.
 */
export function isContentGenerativeTask(taskType: string): boolean {
  return taskType in TASK_TYPE_TO_CONTENT_TYPE;
}
