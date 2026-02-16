/**
 * Shared LLM helper — calls OpenAI Chat Completions API.
 *
 * Single function used by all LLM call sites (callClaude action,
 * brandAuditAction, brandExtractor, enrichment/processItems).
 *
 * @module convex/lib/llm
 */

// Map Anthropic model IDs to OpenAI equivalents
const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-20250514": "gpt-4o",
  "claude-3-5-haiku-20241022": "gpt-4o-mini",
  "claude-haiku-3-20250514": "gpt-4o-mini",
};

const DEFAULT_MODEL = "gpt-4o";

export interface CallLLMArgs {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface CallLLMResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  stopReason: string;
}

/**
 * Call OpenAI Chat Completions API.
 *
 * Translates the Anthropic-style arguments used across the codebase
 * into OpenAI format, keeping return shape identical so callers
 * don't need changes.
 */
export async function callLLM(args: CallLLMArgs): Promise<CallLLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = args.model
    ? MODEL_MAP[args.model] || DEFAULT_MODEL
    : DEFAULT_MODEL;

  // OpenAI requires "json" in messages when using response_format json_object
  const systemContent = args.jsonMode && !args.system.toLowerCase().includes("json")
    ? `${args.system}\n\nRespond with valid JSON.`
    : args.system;

  const body: Record<string, unknown> = {
    model,
    max_tokens: args.maxTokens || 4096,
    temperature: args.temperature ?? 0.7,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: args.user },
    ],
  };

  if (args.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const choice = data.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error("OpenAI API returned empty response — no content");
  }

  return {
    content: choice.message.content,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    model: data.model,
    stopReason: choice.finish_reason ?? "unknown",
  };
}
