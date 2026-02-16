"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { X, Loader2, ChevronDown, Eye, Edit3, Upload, ImageIcon, X as XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";
import { EditorPreview } from "./EditorPreview";
import { FileImportModal } from "./FileImportModal";
import { MediaPicker } from "@/components/media/MediaPicker";
import { stripHtmlTags, countWords, validateContent } from "@/lib/editor-utils";

const TONES = [
  { value: "professional", label: "Profesional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Amigable" },
  { value: "technical", label: "Técnico" },
];

interface EditContentModalProps {
  content: Doc<"content">;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditContentModal({
  content,
  isOpen,
  onClose,
  onSuccess,
}: EditContentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    seo: false,
    metadata: false,
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [attachedAssets, setAttachedAssets] = useState<Array<{
    mediaId: string;
    type: string;
    url: string;
    alt?: string;
  }>>([]);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    summary: "",
    seoTitle: "",
    seoDescription: "",
    slug: "",
    keywords: "",
    tone: "",
    targetAudience: "",
  });

  const { success, error: showError } = useToast();
  const updateContent = useMutation(api.functions.updateContent);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && content) {
      setFormData({
        title: content.title || "",
        body: content.body || "",
        summary: content.summary || "",
        seoTitle: content.seo?.metaTitle || "",
        seoDescription: content.seo?.metaDescription || "",
        slug: content.seo?.slug || "",
        keywords: (content.metadata?.targetKeywords || []).join(", "),
        tone: content.metadata?.tone || "",
        targetAudience: content.metadata?.targetAudience || "",
      });
      setAttachedAssets(
        (content.assets || []).map((a: { mediaId?: string; type: string; url: string; alt?: string }) => ({
          mediaId: a.mediaId || "",
          type: a.type,
          url: a.url,
          alt: a.alt,
        }))
      );
      setError(null);
      setActiveTab("write"); // Reset to write tab when opening
    }
  }, [isOpen, content]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const updates: {
        id: Doc<"content">["_id"];
        title?: string;
        body?: string;
        summary?: string;
        seo?: { metaTitle: string; metaDescription: string; slug: string; canonicalUrl?: string };
        metadata?: { targetKeywords: string[]; tone: string; targetAudience: string };
        assets?: Array<{ mediaId?: any; type: any; url: string; alt?: string }>;
      } = {
        id: content._id,
      };

      if (formData.title !== content.title) {
        updates.title = formData.title;
      }
      if (formData.body !== content.body) {
        updates.body = formData.body;
      }
      if (formData.summary !== content.summary) {
        updates.summary = formData.summary;
      }

      if (
        formData.seoTitle !== content.seo?.metaTitle ||
        formData.seoDescription !== content.seo?.metaDescription ||
        formData.slug !== content.seo?.slug
      ) {
        updates.seo = {
          metaTitle: formData.seoTitle,
          metaDescription: formData.seoDescription,
          slug: formData.slug,
          canonicalUrl: content.seo?.canonicalUrl,
        };
      }

      if (
        formData.keywords !== (content.metadata?.targetKeywords || []).join(", ") ||
        formData.tone !== content.metadata?.tone ||
        formData.targetAudience !== content.metadata?.targetAudience
      ) {
        updates.metadata = {
          targetKeywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          tone: formData.tone,
          targetAudience: formData.targetAudience,
        };
      }

      // Include attached assets if changed
      const currentAssets = (content.assets || []).map((a: any) => `${a.mediaId || ""}:${a.type}:${a.url}`).join(",");
      const newAssetsKey = attachedAssets.map(a => `${a.mediaId || ""}:${a.type}:${a.url}`).join(",");
      if (currentAssets !== newAssetsKey) {
        updates.assets = attachedAssets.map(a => ({
          mediaId: a.mediaId || undefined,
          type: a.type as any,
          url: a.url,
          alt: a.alt,
        }));
      }

      if (Object.keys(updates).length === 1) {
        // Only id, no changes
        success("Sin cambios", "No se realizaron cambios.");
        onClose();
        return;
      }

      // Validate content before saving
      const contentValidation = validateContent(formData.body, 50);
      if (!contentValidation.isValid) {
        setError(contentValidation.error || "Contenido inválido");
        showError("Error de Validación", contentValidation.error || "Contenido inválido");
        return;
      }

      await updateContent(updates);

      success("Contenido actualizado", "Los cambios se han guardado correctamente.");
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar contenido";
      setError(message);
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  // Use stripHtmlTags to get accurate word count from HTML content
  const wordCount = countWords(formData.body);
  const readingTime = Math.ceil(wordCount / 200);

  // Validate content
  const validation = validateContent(formData.body, 50);

  /**
   * Handle file import - update formData with imported content
   */
  const handleFileImport = (imported: { title: string; body: string; metadata?: { wordCount?: number; readingTime?: number; sourceFile?: string } }) => {
    setFormData((prev) => ({
      ...prev,
      title: imported.title,
      body: imported.body,
    }));

    // Close import modal
    setIsImportModalOpen(false);

    // Switch to write tab to show imported content
    setActiveTab("write");

    // Show success toast
    success("Contenido importado", "Edita el contenido y guarda cuando estés listo");
  };

  const handleMediaSelect = (selected: Array<{ _id: any; url: string; type: string; alt?: string }>) => {
    const newAssets = selected.map(a => ({
      mediaId: a._id,
      type: a.type,
      url: a.url,
      alt: a.alt,
    }));
    setAttachedAssets(prev => [...prev, ...newAssets]);
    setIsMediaPickerOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[var(--surface-1)] border border-[var(--border)] rounded-lg my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Editar Contenido</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">{content?.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] hover:bg-[var(--surface-1)] transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Adjuntar Media
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg transition-colors text-sm font-medium text-white min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Importar archivo</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="text-sm text-[var(--error)] bg-red-500/10 rounded p-3">
                  {error}
                </div>
              )}

              {/* Basic Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Contenido</h3>

                  {/* Write/Preview Tabs */}
                  <div role="tablist" aria-label="Modo de editor" className="flex gap-2 bg-[var(--card-bg)] rounded-lg p-1 border border-[var(--border)]">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "write"}
                      aria-label="Modo de escritura"
                      onClick={() => setActiveTab("write")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        activeTab === "write"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Edit3 className="h-3 w-3" />
                      Escribir
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "preview"}
                      aria-label="Modo de vista previa"
                      onClick={() => setActiveTab("preview")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        activeTab === "preview"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      Vista Previa
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs text-[var(--text-tertiary)] mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {formData.title.length} caracteres
                  </p>
                </div>

                {/* Body - Tab Content */}
                <div>
                  <label className="block text-xs text-[var(--text-tertiary)] mb-2">Contenido</label>

                  <AnimatePresence mode="wait">
                    {activeTab === "write" ? (
                      <motion.div
                        key="write"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <RichTextEditor
                          content={formData.body}
                          onChange={(html) => handleInputChange("body", html)}
                          placeholder="Comienza a escribir tu contenido..."
                          minHeight="400px"
                          title={formData.title}
                          showExport={true}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <EditorPreview content={formData.body} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {stripHtmlTags(formData.body).length} caracteres • {wordCount} palabras •{" "}
                      {readingTime} min lectura
                    </p>
                    {!validation.isValid && (
                      <p className="text-xs text-[var(--error)]">
                        {validation.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attached Assets */}
                {attachedAssets.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Assets adjuntos ({attachedAssets.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attachedAssets.map((asset, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-sm">
                          {asset.type === "image" ? (
                            <img src={asset.url} alt={asset.alt || ""} className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <span className="text-xs">{asset.type}</span>
                          )}
                          <span className="max-w-[120px] truncate">{asset.alt || asset.type}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedAssets(prev => prev.filter((_, j) => j !== i))}
                            className="text-[var(--text-secondary)] hover:text-red-500"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <label className="block text-xs text-[var(--text-tertiary)] mb-2">Resumen</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                    rows={3}
                    placeholder="Breve resumen del contenido..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>

              {/* SEO Section - Accordion */}
              <div className="border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => toggleSection("seo")}
                  className="flex items-center gap-3 w-full text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.seo && "rotate-180"
                    )}
                  />
                  Configuración SEO
                </button>

                {expandedSections.seo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Meta Title */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">Meta Title</label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                        placeholder="Título de página para motores de búsqueda (55-60 caracteres)"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {formData.seoTitle.length} / 60 caracteres
                        {formData.seoTitle.length >= 55 &&
                          formData.seoTitle.length <= 60 &&
                          " ✓"}
                      </p>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.seoDescription}
                        onChange={(e) =>
                          handleInputChange("seoDescription", e.target.value)
                        }
                        placeholder="Meta descripción para resultados de búsqueda (150-160 caracteres)"
                        rows={3}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {formData.seoDescription.length} / 160 caracteres
                        {formData.seoDescription.length >= 150 &&
                          formData.seoDescription.length <= 160 &&
                          " ✓"}
                      </p>
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        placeholder="url-friendly-slug"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Metadata Section - Accordion */}
              <div className="border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => toggleSection("metadata")}
                  className="flex items-center gap-3 w-full text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.metadata && "rotate-180"
                    )}
                  />
                  Metadata
                </button>

                {expandedSections.metadata && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Keywords */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">
                        Palabras Clave Objetivo (separadas por comas)
                      </label>
                      <textarea
                        value={formData.keywords}
                        onChange={(e) => handleInputChange("keywords", e.target.value)}
                        placeholder="palabra1, palabra2, palabra3"
                        rows={2}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    {/* Tone */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">Tono</label>
                      <select
                        value={formData.tone}
                        onChange={(e) => handleInputChange("tone", e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      >
                        <option value="">Selecciona un tono...</option>
                        {TONES.map((tone) => (
                          <option key={tone.value} value={tone.value}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-2">
                        Audiencia Objetivo
                      </label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) =>
                          handleInputChange("targetAudience", e.target.value)
                        }
                        placeholder="ej., ejecutivos C-level, desarrolladores"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-[var(--border)] bg-[var(--card-bg)]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </motion.div>

          {/* File Import Modal */}
          <FileImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleFileImport}
            defaultTitle={formData.title}
          />

          {/* Media Picker Modal */}
          <MediaPicker
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={handleMediaSelect}
            multiple={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
