"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, X, Loader2, Upload, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { FileImportModal } from "./FileImportModal";
import { contentSchema, zodFieldErrors } from "@/lib/schemas";
import { sanitizePlainText } from "@/lib/sanitize";
import { usePreference } from "@/hooks/usePreferences";

const CONTENT_TYPES = [
  { value: "blog", label: "Blog" },
  { value: "social_linkedin", label: "LinkedIn" },
  { value: "social_twitter", label: "Twitter" },
  { value: "social_instagram", label: "Instagram" },
  { value: "social_tiktok", label: "TikTok" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "ad_copy", label: "Texto Publicitario" },
  { value: "landing_page", label: "Landing Page" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "case_study", label: "Caso de Estudio" },
  { value: "video_script", label: "Guion de Video" },
];

export function UploadContentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [lastContentType, setLastContentType] = usePreference("lastContentType", "blog");
  const [type, setType] = useState(lastContentType);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");

  // Framework metadata (optional)
  const [showFramework, setShowFramework] = useState(false);
  const [contentTier, setContentTier] = useState<"" | "hero" | "hub" | "hygiene">("");
  const [funnelStage, setFunnelStage] = useState<"" | "reach" | "act" | "convert" | "engage">("");
  const [tayaCategory, setTayaCategory] = useState<"" | "cost" | "problems" | "comparisons" | "reviews" | "best">("");
  const [pillarId, setPillarId] = useState<string>("");

  // Fetch active pillars for dropdown
  const activePillars = useQuery(api.contentPillars.getActivePillars);

  const { success, error: showError } = useToast();
  const createContent = useMutation(api.functions.createContent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = contentSchema.safeParse({
      title: title.trim(),
      body: body.trim(),
      type,
      summary: summary.trim() || undefined,
    });

    if (!result.success) {
      const errors = zodFieldErrors(result.error);
      setFieldErrors(errors);
      setError(Object.values(errors)[0]);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate wordCount
      const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words/min

      await createContent({
        type: type as "blog" | "social_linkedin" | "social_twitter" | "social_instagram" | "social_tiktok" | "email" | "newsletter" | "ad_copy" | "landing_page" | "whitepaper" | "case_study" | "video_script",
        title: sanitizePlainText(title.trim()),
        body: body.trim(),
        summary: summary.trim() ? sanitizePlainText(summary.trim()) : undefined,
        metadata: {
          wordCount,
          readingTime,
        },
        createdBy: "system",
        // Framework metadata (only include if set)
        ...(contentTier ? { contentTier: contentTier as "hero" | "hub" | "hygiene" } : {}),
        ...(funnelStage ? { funnelStage: funnelStage as "reach" | "act" | "convert" | "engage" } : {}),
        ...(tayaCategory ? { tayaCategory: tayaCategory as "cost" | "problems" | "comparisons" | "reviews" | "best" } : {}),
        ...(pillarId ? { pillarId: pillarId as Id<"contentPillars"> } : {}),
      });

      success("Contenido creado", "Tu contenido ha sido agregado como borrador.");
      setLastContentType(type); // Remember for next time
      setTitle("");
      setBody("");
      setSummary("");
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear contenido";
      setError(message);
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file import - populate form fields with imported content
   */
  const handleFileImport = (imported: { title: string; body: string; metadata?: { wordCount?: number; readingTime?: number; sourceFile?: string } }) => {
    setTitle(imported.title);
    setBody(imported.body);

    // Close import modal
    setIsImportModalOpen(false);

    // Open the form to show imported content
    setIsOpen(true);

    // Show success toast
    success("Contenido importado", "Selecciona el tipo de contenido y guarda cuando estés listo");
  };

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Contenido
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[var(--text-primary)] font-medium">Crear Nuevo Contenido</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded text-xs font-medium text-white transition-colors"
                  title="Importar desde archivo"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="p-1 rounded hover:bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-[var(--badge-red-text)] bg-[var(--badge-red-bg)] rounded p-2">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Tipo de Contenido *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  required
                >
                  {CONTENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del contenido"
                  required
                  className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="text-xs mt-1">
                  {fieldErrors["title"] ? (
                    <span className="text-[var(--error)]">{fieldErrors["title"]}</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{title.length} caracteres</span>
                  )}
                </p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Contenido *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribe tu contenido aquí... (mínimo 50 caracteres)"
                  required
                  rows={8}
                  className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                />
                <p className="text-xs mt-1">
                  {fieldErrors["body"] ? (
                    <span className="text-[var(--error)]">{fieldErrors["body"]}</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{body.length} caracteres • {body.split(/\s+/).filter(w => w.length > 0).length} palabras</span>
                  )}
                </p>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Resumen (Opcional)</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Breve resumen del contenido..."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            {/* Framework Metadata (collapsible) */}
            <div className="border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => setShowFramework(!showFramework)}
                className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors w-full"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFramework ? "rotate-180" : ""}`} />
                Metadata de Estrategia (opcional)
              </button>

              {showFramework && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Content Tier */}
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Tier</label>
                    <select
                      value={contentTier}
                      onChange={(e) => setContentTier(e.target.value as typeof contentTier)}
                      className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-1.5 px-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">Sin tier</option>
                      <option value="hero">Hero (10%)</option>
                      <option value="hub">Hub (30%)</option>
                      <option value="hygiene">Hygiene (60%)</option>
                    </select>
                  </div>

                  {/* Funnel Stage */}
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Etapa del Funnel</label>
                    <select
                      value={funnelStage}
                      onChange={(e) => setFunnelStage(e.target.value as typeof funnelStage)}
                      className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-1.5 px-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">Sin etapa</option>
                      <option value="reach">Reach</option>
                      <option value="act">Act</option>
                      <option value="convert">Convert</option>
                      <option value="engage">Engage</option>
                    </select>
                  </div>

                  {/* TAYA Category */}
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">TAYA</label>
                    <select
                      value={tayaCategory}
                      onChange={(e) => setTayaCategory(e.target.value as typeof tayaCategory)}
                      className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-1.5 px-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">Sin categoría</option>
                      <option value="cost">Costos</option>
                      <option value="problems">Problemas</option>
                      <option value="comparisons">Comparaciones</option>
                      <option value="reviews">Reviews</option>
                      <option value="best">Best-of</option>
                    </select>
                  </div>

                  {/* Pillar */}
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Pilar</label>
                    <select
                      value={pillarId}
                      onChange={(e) => setPillarId(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-1.5 px-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">Sin pilar</option>
                      {activePillars?.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="flex-1 py-2 rounded-lg border border-[var(--border-hover)] text-[var(--text-tertiary)] hover:bg-[var(--surface-0)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear Contenido
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* File Import Modal */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleFileImport}
      />
    </div>
  );
}
