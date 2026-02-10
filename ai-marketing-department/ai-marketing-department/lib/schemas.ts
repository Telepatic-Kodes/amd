import { z } from "zod";

// ─── Content ────────────────────────────────────────

const CONTENT_TYPES = [
  "blog",
  "social_linkedin",
  "social_twitter",
  "social_instagram",
  "social_tiktok",
  "email",
  "newsletter",
  "ad_copy",
  "landing_page",
  "whitepaper",
  "case_study",
  "video_script",
] as const;

export const contentSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(120, "El título no puede superar 120 caracteres"),
  body: z
    .string()
    .min(50, "El contenido debe tener al menos 50 caracteres"),
  type: z.enum(CONTENT_TYPES, {
    error: "Selecciona un tipo de contenido válido",
  }),
  summary: z
    .string()
    .max(300, "El resumen no puede superar 300 caracteres")
    .optional(),
  seo: z
    .object({
      metaTitle: z
        .string()
        .max(70, "El meta título no debe superar 70 caracteres")
        .optional(),
      metaDescription: z
        .string()
        .max(170, "La meta descripción no debe superar 170 caracteres")
        .optional(),
      slug: z
        .string()
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "El slug solo puede contener letras minúsculas, números y guiones"
        )
        .optional(),
      canonicalUrl: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
    })
    .optional(),
  metadata: z
    .object({
      targetKeywords: z.string().optional(),
      tone: z
        .enum(["professional", "casual", "friendly", "technical"], {
          error: "Selecciona un tono válido",
        })
        .optional(),
      targetAudience: z.string().optional(),
    })
    .optional(),
});

export type ContentFormData = z.infer<typeof contentSchema>;

// ─── Brand Source URL ───────────────────────────────

export const brandSourceUrlSchema = z.object({
  url: z
    .string()
    .min(1, "La URL es requerida")
    .url("Ingresa una URL válida (debe incluir https://)"),
  label: z.string().optional(),
});

// ─── Generate Content ───────────────────────────────

export const generateContentSchema = z.object({
  topic: z
    .string()
    .min(1, "El tema es requerido")
    .max(500, "El tema no puede superar 500 caracteres"),
  channels: z
    .array(z.string())
    .min(1, "Selecciona al menos un canal"),
  customInstructions: z
    .string()
    .max(2000, "Las instrucciones no pueden superar 2000 caracteres")
    .optional(),
});

// ─── Helpers ────────────────────────────────────────

/** Extract field-level errors from a ZodError into a Record<fieldName, message> */
export function zodFieldErrors(
  error: z.ZodError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
}
