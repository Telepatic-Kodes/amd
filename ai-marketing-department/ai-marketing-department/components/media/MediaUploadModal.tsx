"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image,
  Video,
  Music,
  FileText,
  Presentation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  detectMediaType,
  validateMediaFile,
  formatFileSize,
  MEDIA_TYPE_CONFIG,
} from "@/lib/media-utils";
import type { MediaType } from "@/lib/media-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolder?: string;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  mediaType: MediaType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEDIA_TYPE_ICONS: Record<MediaType, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  presentation: Presentation,
};

function getFileIcon(mediaType: MediaType) {
  return MEDIA_TYPE_ICONS[mediaType] ?? FileText;
}

let fileIdCounter = 0;
function nextFileId(): string {
  fileIdCounter += 1;
  return `upload-${fileIdCounter}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaUploadModal({
  isOpen,
  onClose,
  defaultFolder = "",
}: MediaUploadModalProps) {
  // -- State ----------------------------------------------------------------
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [folder, setFolder] = useState(defaultFolder);
  const [tagsInput, setTagsInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Convex mutations -----------------------------------------------------
  const generateUploadUrl = useMutation(api.mediaLibrary.generateUploadUrl);
  const createAsset = useMutation(api.mediaLibrary.createAsset);

  // -- Derived state --------------------------------------------------------
  const doneCount = queue.filter((f) => f.status === "done").length;
  const hasActiveUploads = queue.some(
    (f) => f.status === "uploading" || f.status === "pending"
  );

  // -- Helpers --------------------------------------------------------------
  const parseTags = useCallback((): string[] => {
    return tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const resetState = useCallback(() => {
    setQueue([]);
    setFolder(defaultFolder);
    setTagsInput("");
    setIsDragOver(false);
    setIsUploading(false);
  }, [defaultFolder]);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    resetState();
    onClose();
  }, [isUploading, resetState, onClose]);

  // -- File selection -------------------------------------------------------
  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming: QueuedFile[] = Array.from(files).map((file) => ({
      id: nextFileId(),
      file,
      status: "pending" as FileStatus,
      mediaType: detectMediaType(file.type),
    }));
    setQueue((prev) => [...prev, ...incoming]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so re-selecting the same file works
      e.target.value = "";
    },
    [addFiles]
  );

  // -- Upload logic ---------------------------------------------------------
  const uploadSingleFile = useCallback(
    async (queued: QueuedFile) => {
      // Update status → uploading
      setQueue((prev) =>
        prev.map((f) =>
          f.id === queued.id ? { ...f, status: "uploading" as FileStatus, error: undefined } : f
        )
      );

      try {
        // 1. Validate
        const validation = validateMediaFile(queued.file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 2. Get upload URL
        const uploadUrl = await generateUploadUrl();

        // 3. Upload file to storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: queued.file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Error al subir archivo: ${uploadResponse.statusText}`);
        }

        const { storageId } = (await uploadResponse.json()) as { storageId: string };

        // 4. Create asset record
        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        await createAsset({
          storageId,
          name: queued.file.name,
          type: queued.mediaType,
          mimeType: queued.file.type,
          fileSize: queued.file.size,
          ...(tags.length > 0 ? { tags } : {}),
          ...(folder.trim() ? { folder: folder.trim() } : {}),
        });

        // 5. Mark done
        setQueue((prev) =>
          prev.map((f) =>
            f.id === queued.id ? { ...f, status: "done" as FileStatus } : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setQueue((prev) =>
          prev.map((f) =>
            f.id === queued.id
              ? { ...f, status: "error" as FileStatus, error: message }
              : f
          )
        );
      }
    },
    [generateUploadUrl, createAsset, tagsInput, folder]
  );

  const startUpload = useCallback(async () => {
    const pending = queue.filter((f) => f.status === "pending" || f.status === "error");
    if (pending.length === 0) return;

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const queued of pending) {
      await uploadSingleFile(queued);
    }

    setIsUploading(false);
  }, [queue, uploadSingleFile]);

  const retryFile = useCallback(
    async (fileId: string) => {
      const target = queue.find((f) => f.id === fileId);
      if (!target) return;
      setIsUploading(true);
      await uploadSingleFile(target);
      setIsUploading(false);
    },
    [queue, uploadSingleFile]
  );

  // -- Render ---------------------------------------------------------------
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
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Subir archivos
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Imágenes, videos, audio, documentos y presentaciones
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="p-2 hover:bg-[var(--surface-1)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* ---- Content (scrollable) ---- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                  ${
                    isDragOver
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50 bg-[var(--surface-1)]/30"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Image className="w-5 h-5" />
                  <Video className="w-5 h-5" />
                  <Music className="w-5 h-5" />
                  <FileText className="w-5 h-5" />
                  <Presentation className="w-5 h-5" />
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Imágenes hasta 10 MB · Videos hasta 100 MB · Audio hasta 50 MB
                  </p>
                </div>

                <Upload className="w-6 h-6 text-[var(--accent)] mt-1" />
              </div>

              {/* Optional metadata fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Carpeta (opcional)
                  </label>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="ej: campaña-verano-2026"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Tags (opcional, separados por coma)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="ej: social, producto, hero"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  />
                </div>
              </div>

              {/* Upload queue */}
              {queue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Archivos ({queue.length})
                    </p>
                    {queue.some((f) => f.status === "pending") && !isUploading && (
                      <button
                        onClick={startUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Subir archivos
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {queue.map((item) => {
                      const Icon = getFileIcon(item.mediaType);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]"
                        >
                          {/* File type icon */}
                          <Icon className="w-5 h-5 flex-shrink-0 text-[var(--text-secondary)]" />

                          {/* Name + size */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)] truncate">
                              {item.file.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {formatFileSize(item.file.size)} · {MEDIA_TYPE_CONFIG[item.mediaType].label}
                            </p>
                            {item.error && (
                              <p className="text-xs text-[var(--error)] mt-0.5">{item.error}</p>
                            )}
                          </div>

                          {/* Status indicator */}
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {item.status === "pending" && (
                              <span className="text-xs text-[var(--text-secondary)]">Pendiente</span>
                            )}
                            {item.status === "uploading" && (
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                            )}
                            {item.status === "done" && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {item.status === "error" && (
                              <>
                                <AlertCircle className="w-4 h-4 text-[var(--error)]" />
                                <button
                                  onClick={() => retryFile(item.id)}
                                  disabled={isUploading}
                                  className="p-1 rounded hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
                                  aria-label="Reintentar"
                                  title="Reintentar"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ---- Footer ---- */}
            <div className="flex items-center justify-between p-6 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)]">
                {queue.length > 0
                  ? `${doneCount} de ${queue.length} archivos subidos`
                  : "Sin archivos seleccionados"}
              </p>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
