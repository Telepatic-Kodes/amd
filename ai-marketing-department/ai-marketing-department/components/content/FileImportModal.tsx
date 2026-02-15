"use client";

import { useState } from "react";
import { X, FileText, Check, AlertCircle, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDropZone } from "./FileDropZone";
import { RichTextEditor } from "./RichTextEditor";
import { EditorPreview } from "./EditorPreview";
import type { ParsedContent } from "@/lib/file-parsers";
import { cn } from "@/lib/utils";

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: { title: string; body: string; metadata?: { wordCount?: number; readingTime?: number; sourceFile?: string } }) => void;
  defaultTitle?: string;
}

/**
 * FileImportModal - Modal para importar contenido desde archivos
 *
 * Flujo de dos pasos:
 * 1. Upload: Usuario arrastra/selecciona archivo (PDF, DOCX, TXT)
 * 2. Preview: Usuario ve contenido extraído, puede editar título y cuerpo antes de importar
 *
 * Features:
 * - Integra FileDropZone para drag-drop
 * - Integra RichTextEditor para preview editable
 * - Validación de título y contenido
 * - Animaciones suaves con Framer Motion
 * - Mobile-responsive (44x44px touch targets)
 * - Spanish labels
 */
export function FileImportModal({
  isOpen,
  onClose,
  onImport,
  defaultTitle: _defaultTitle = "",
}: FileImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const resetState = () => {
    setStep("upload");
    setParsedContent(null);
    setEditedTitle("");
    setEditedBody("");
    setError(null);
    setIsEditing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  /**
   * Handle file processed from FileDropZone
   */
  const handleFileProcessed = (content: ParsedContent) => {
    setParsedContent(content);

    // Pre-fill title from filename (remove extension)
    const titleFromFile = content.metadata.fileName.replace(/\.[^/.]+$/, "");
    setEditedTitle(titleFromFile);

    // Set body to HTML for TipTap
    setEditedBody(content.html);

    // Move to preview step
    setStep("preview");
    setError(null);
  };

  /**
   * Handle error from FileDropZone
   */
  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
  };

  /**
   * Validate and import content
   */
  const handleImport = () => {
    setError(null);

    // Validate title
    if (!editedTitle.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (editedTitle.trim().length < 5) {
      setError("El título debe tener al menos 5 caracteres");
      return;
    }

    // Validate body
    if (editedBody.trim().length < 50) {
      setError("El contenido debe tener al menos 50 caracteres");
      return;
    }

    // Call parent's import handler
    onImport({
      title: editedTitle.trim(),
      body: editedBody,
      metadata: parsedContent?.metadata || {},
    });

    resetState();
    onClose();
  };

  /**
   * Go back to upload step
   */
  const handleCancel = () => {
    resetState();
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[var(--surface-1)] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Importar desde archivo
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Upload */}
              {step === "upload" && (
                <div className="space-y-4">
                  <p className="text-[var(--text-secondary)] text-sm">
                    Arrastra un archivo PDF, DOCX o TXT para importar contenido.
                    El contenido extraído se mostrará para que puedas editarlo antes de importar.
                  </p>

                  <FileDropZone
                    onFileProcessed={handleFileProcessed}
                    onError={handleFileError}
                    maxSizeMB={10}
                  />

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--error)]">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Preview and Edit */}
              {step === "preview" && parsedContent && (
                <div className="space-y-6">
                  {/* File info */}
                  <div className="flex items-start gap-3 p-4 bg-[var(--surface-2)]/50 border border-[var(--border-hover)] rounded-lg">
                    <FileText className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {parsedContent.metadata.fileName}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {parsedContent.metadata.fileType} • {parsedContent.metadata.wordCount} palabras • {parsedContent.metadata.readingTime} min lectura • {formatFileSize(parsedContent.metadata.fileSize)}
                      </p>
                    </div>
                  </div>

                  {/* Title field */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Título
                      <span className="text-[var(--error)] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Título del contenido..."
                      className="w-full px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    />
                  </div>

                  {/* Content preview/edit */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Contenido
                        <span className="text-[var(--error)] ml-1">*</span>
                      </label>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          isEditing
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                        )}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isEditing ? "Editando" : "Editar"}
                      </button>
                    </div>

                    <div className="border border-[var(--border-hover)] rounded-lg overflow-hidden">
                      {isEditing ? (
                        <RichTextEditor
                          content={editedBody}
                          onChange={setEditedBody}
                          placeholder="Contenido importado..."
                          minHeight="400px"
                        />
                      ) : (
                        <EditorPreview content={editedBody} className="min-h-[400px] p-4" />
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                      {isEditing
                        ? "Edita el contenido según sea necesario antes de importar"
                        : "Haz clic en 'Editar' para modificar el contenido"
                      }
                    </p>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--error)]">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
              {step === "upload" ? (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-1)] text-[var(--text-secondary)] rounded-lg transition-colors font-medium min-h-[44px]"
                >
                  Cancelar
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-1)] text-[var(--text-secondary)] rounded-lg transition-colors font-medium min-h-[44px]"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors font-medium flex items-center gap-2 min-h-[44px]"
                  >
                    <Check className="w-5 h-5" />
                    Importar
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
