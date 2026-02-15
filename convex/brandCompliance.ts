import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * getBrandRules — Extract structured brand voice rules from a brand profile.
 */
export const getBrandRules = query({
  args: {
    brandProfileId: v.id("brandProfiles"),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get(args.brandProfileId);
    if (!brand) return null;

    const voice = brand.voice;
    const rules: {
      tone: string;
      personality: string[];
      dos: string[];
      donts: string[];
      vocabulary: string[];
    } = {
      tone: voice?.tone || "profesional",
      personality: voice?.personality || [],
      dos: voice?.dos || [],
      donts: voice?.donts || [],
      vocabulary: voice?.vocabulary || [],
    };

    return {
      companyName: brand.companyName,
      industry: brand.industry,
      rules,
    };
  },
});

/**
 * checkBrandCompliance — Analyze content against brand voice rules using Claude.
 * Returns a compliance score (0-100), violations, and suggestions.
 */
export const checkBrandCompliance = action({
  args: {
    brandProfileId: v.id("brandProfiles"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get brand rules
    const brandRules = await ctx.runQuery(api.brandCompliance.getBrandRules, {
      brandProfileId: args.brandProfileId,
    });

    if (!brandRules) {
      return {
        score: 0,
        violations: [],
        suggestions: ["No se encontro el perfil de marca."],
        status: "error" as const,
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        score: 50,
        violations: [],
        suggestions: ["API key no configurada. No se pudo analizar compliance."],
        status: "error" as const,
      };
    }

    const systemPrompt = `Eres un experto en brand compliance. Analiza el siguiente contenido contra las reglas de marca y responde SOLO con JSON valido.

Marca: ${brandRules.companyName} (${brandRules.industry})
Tono de voz: ${brandRules.rules.tone}
Personalidad: ${brandRules.rules.personality.join(", ") || "No definida"}
Hacer: ${brandRules.rules.dos.join("; ") || "No definido"}
No hacer: ${brandRules.rules.donts.join("; ") || "No definido"}
Vocabulario preferido: ${brandRules.rules.vocabulary.join(", ") || "No definido"}

Responde con este formato JSON exacto:
{
  "score": <number 0-100>,
  "violations": [
    {
      "text": "<fragmento del contenido que viola la regla>",
      "rule": "<regla violada>",
      "suggestion": "<sugerencia de correccion>",
      "severity": "high" | "medium" | "low"
    }
  ],
  "suggestions": ["<sugerencia general 1>", "<sugerencia general 2>"]
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: `Contenido a analizar:\n\n${args.content}` }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          score: 50,
          violations: [],
          suggestions: ["No se pudo parsear la respuesta del analisis."],
          status: "error" as const,
        };
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, result.score || 50)),
        violations: (result.violations || []).map((v: Record<string, string>) => ({
          text: v.text || "",
          rule: v.rule || "",
          suggestion: v.suggestion || "",
          severity: (v.severity as "high" | "medium" | "low") || "medium",
        })),
        suggestions: result.suggestions || [],
        status: "success" as const,
      };
    } catch {
      return {
        score: 50,
        violations: [],
        suggestions: ["Error al analizar compliance. Intenta de nuevo."],
        status: "error" as const,
      };
    }
  },
});
