"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  ChevronRight,
  Loader2,
  Check,
  ArrowLeft,
  HardDrive,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

interface BreadcrumbEntry {
  id: string;
  name: string;
}

export interface DriveFilePickerProps {
  open: boolean;
  onClose: () => void;
  onImport: (fileIds: string[]) => Promise<void>;
  /** MIME type prefixes to filter server-side (e.g. ["image/"]). */
  acceptTypes?: string[];
  /** Maximum number of files that can be selected. */
  maxFiles?: number;
  /** Modal title override. */
  title?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FOLDER_MIME = "application/vnd.google-apps.folder";

function isFolder(file: DriveFile): boolean {
  return file.mimeType === FOLDER_MIME;
}

function mimeIcon(mime: string) {
  if (mime === FOLDER_MIME) return Folder;
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("audio/")) return Music;
  return FileText;
}

function formatFileSize(sizeStr?: string): string {
  if (!sizeStr) return "—";
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DriveFilePicker({
  open,
  onClose,
  onImport,
  acceptTypes,
  maxFiles,
  title = "Importar desde Google Drive",
}: DriveFilePickerProps) {
  // Connection check
  const connection = useQuery(api.googledrive.queries.getConnection);
  const listFiles = useAction(api.googledrive.actions.listFiles);

  // State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<BreadcrumbEntry[]>([
    { id: "root", name: "Mi Drive" },
  ]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);

  const currentFolderId = folderStack[folderStack.length - 1].id;

  // -------------------------------------------------------------------------
  // Load files when folder changes or modal opens
  // -------------------------------------------------------------------------

  const loadFiles = useCallback(
    async (folderId: string) => {
      setLoading(true);
      setError(null);
      try {
        const mimeTypeFilter = acceptTypes?.join(",");
        const result = await listFiles({
          folderId: folderId === "root" ? undefined : folderId,
          mimeTypeFilter,
        });
        setFiles(result.files);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al cargar archivos";
        setError(message);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    },
    [listFiles, acceptTypes]
  );

  useEffect(() => {
    if (!open) return;
    if (!connection || connection.status !== "connected") return;
    loadFiles(currentFolderId);
    // Reset selection & search on folder change
    setSelected(new Set());
    setSearchQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentFolderId, connection?.status]);

  // Reset state fully when modal closes
  useEffect(() => {
    if (!open) {
      setFolderStack([{ id: "root", name: "Mi Drive" }]);
      setSelected(new Set());
      setSearchQuery("");
      setFiles([]);
      setError(null);
    }
  }, [open]);

  // -------------------------------------------------------------------------
  // Filtered files (client-side search)
  // -------------------------------------------------------------------------

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const navigateToFolder = (file: DriveFile) => {
    setFolderStack((prev) => [...prev, { id: file.id, name: file.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
  };

  const goBack = () => {
    if (folderStack.length > 1) {
      setFolderStack((prev) => prev.slice(0, -1));
    }
  };

  const toggleSelect = (fileId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        if (maxFiles && next.size >= maxFiles) return prev;
        next.add(fileId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      await onImport(Array.from(selected));
      onClose();
    } catch {
      // Parent handles errors
    } finally {
      setImporting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const isConnected =
    connection !== undefined &&
    connection !== null &&
    connection.status === "connected";
  const isLoadingConnection = connection === undefined;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden"
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {isLoadingConnection ? (
                // Loading connection state
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
              ) : !isConnected ? (
                // Not connected state
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="p-4 rounded-2xl bg-blue-500/10">
                    <HardDrive className="h-10 w-10 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">
                      Google Drive no conectado
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1 max-w-sm">
                      Conecta tu cuenta de Google Drive desde{" "}
                      <span className="text-[var(--accent)] font-medium">
                        Configuración → Integraciones
                      </span>{" "}
                      para importar archivos.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {/* Breadcrumbs + Search */}
                  <div className="px-6 py-3 border-b border-[var(--border)] space-y-3 shrink-0">
                    {/* Breadcrumb navigation */}
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                      {folderStack.length > 1 && (
                        <button
                          onClick={goBack}
                          className="p-1 rounded hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors shrink-0"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                      )}
                      {folderStack.map((entry, idx) => (
                        <div key={entry.id} className="flex items-center gap-1 shrink-0">
                          {idx > 0 && (
                            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          )}
                          <button
                            onClick={() => navigateToBreadcrumb(idx)}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              idx === folderStack.length - 1
                                ? "text-[var(--text-primary)] font-medium"
                                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                            }`}
                          >
                            {entry.name}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        placeholder="Buscar archivos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* File list */}
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                        <span className="ml-2 text-sm text-[var(--text-tertiary)]">
                          Cargando archivos...
                        </span>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                        <p className="text-sm text-[var(--error)]">{error}</p>
                        <button
                          onClick={() => loadFiles(currentFolderId)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        <Folder className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {searchQuery
                            ? "No se encontraron archivos"
                            : "Esta carpeta está vacía"}
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[var(--border)]">
                        {filteredFiles.map((file) => {
                          const folder = isFolder(file);
                          const isSelected = selected.has(file.id);
                          const Icon = mimeIcon(file.mimeType);

                          return (
                            <li key={file.id}>
                              <button
                                onClick={() =>
                                  folder
                                    ? navigateToFolder(file)
                                    : toggleSelect(file.id)
                                }
                                className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-[var(--surface-1)] transition-colors group"
                              >
                                {/* Checkbox (files only) */}
                                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                  {folder ? (
                                    <Folder className="h-5 w-5 text-blue-400" />
                                  ) : (
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                        isSelected
                                          ? "bg-[var(--accent)] border-[var(--accent)]"
                                          : "border-[var(--text-tertiary)] group-hover:border-[var(--text-secondary)]"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Icon */}
                                {!folder && (
                                  <Icon className="h-5 w-5 text-[var(--text-tertiary)] shrink-0" />
                                )}

                                {/* File name */}
                                <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                                  {file.name}
                                </span>

                                {/* Metadata */}
                                {!folder && (
                                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                                    <span className="text-xs text-[var(--text-tertiary)] w-16 text-right">
                                      {formatFileSize(file.size)}
                                    </span>
                                    <span className="text-xs text-[var(--text-tertiary)] w-24 text-right">
                                      {formatDate(file.modifiedTime)}
                                    </span>
                                  </div>
                                )}

                                {/* Folder arrow */}
                                {folder && (
                                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────── */}
            {isConnected && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] shrink-0">
                <span className="text-xs text-[var(--text-tertiary)]">
                  {selected.size === 0
                    ? "Ningún archivo seleccionado"
                    : `${selected.size} archivo${selected.size > 1 ? "s" : ""} seleccionado${selected.size > 1 ? "s" : ""}`}
                  {maxFiles ? ` (máx. ${maxFiles})` : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0 || importing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {importing && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Importar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
