"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import {
  X,
  Save,
  Trash2,
  Image,
  Video,
  Music,
  FileText,
  Presentation,
  Loader2,
  Info,
} from "lucide-react";
import { formatFileSize } from "@/lib/media-utils";
import { useToast } from "@/components/ui/Toast";

interface MediaDetailPanelProps {
  asset: Doc<"mediaAssets">;
  onClose: () => void;
  onDeleted?: () => void;
}

const TYPE_ICONS: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  presentation: Presentation,
};

const TYPE_LABELS: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  document: "Documento",
  presentation: "Presentación",
};

export function MediaDetailPanel({
  asset,
  onClose,
  onDeleted,
}: MediaDetailPanelProps) {
  const { success, error: showError } = useToast();
  const updateAsset = useMutation(api.mediaLibrary.updateAsset);
  const deleteAsset = useMutation(api.mediaLibrary.deleteAsset);

  const [name, setName] = useState(asset.name);
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [description, setDescription] = useState(asset.description ?? "");
  const [tags, setTags] = useState((asset.tags ?? []).join(", "));
  const [folder, setFolder] = useState(asset.folder ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const TypeIcon = TYPE_ICONS[asset.type] ?? FileText;
  const isImage = asset.type === "image";
  const usedInCount = asset.usedIn?.length ?? 0;
  const isInUse = usedInCount > 0;

  async function handleSave() {
    setSaving(true);
    try {
      await updateAsset({
        id: asset._id,
        name: name.trim(),
        alt: alt.trim() || undefined,
        description: description.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        folder: folder.trim() || undefined,
      });
      success("Asset actualizado", "Los cambios se guardaron correctamente");
    } catch (err) {
      showError(
        "Error al guardar",
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isInUse) return;

    const confirmed = window.confirm(
      `¿Eliminar "${asset.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteAsset({ id: asset._id });
      success("Asset eliminado", `"${asset.name}" fue eliminado`);
      onDeleted?.();
      onClose();
    } catch (err) {
      showError(
        "Error al eliminar",
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm sticky top-8">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-[var(--text-primary)] truncate">
              {asset.name}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {TYPE_LABELS[asset.type] ?? asset.type} &middot; {asset.mimeType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors shrink-0 ml-2"
          >
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Preview */}
        <div className="rounded-lg bg-[var(--surface-1)] overflow-hidden flex items-center justify-center min-h-[180px]">
          {isImage ? (
            <img
              src={asset.url}
              alt={asset.alt ?? asset.name}
              className="w-full h-auto max-h-[300px] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <TypeIcon className="h-16 w-16 text-[var(--text-secondary)] opacity-50" />
              <span className="text-xs text-[var(--text-secondary)]">
                {TYPE_LABELS[asset.type] ?? asset.type}
              </span>
            </div>
          )}
        </div>

        {/* Editable Fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Propiedades
          </h4>

          <div className="space-y-2">
            <label className="block">
              <span className="text-xs text-[var(--text-secondary)]">Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-secondary)]">
                Texto alternativo
              </span>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Descripción breve para accesibilidad"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-secondary)]">
                Descripción
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descripción detallada del asset"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-secondary)]">
                Etiquetas
              </span>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-secondary)]">Carpeta</span>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. campañas/2026"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
          </div>
        </div>

        {/* Read-only Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Información
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-[var(--surface-1)]">
              <p className="text-[10px] text-[var(--text-secondary)]">Tamaño</p>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {formatFileSize(asset.fileSize)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--surface-1)]">
              <p className="text-[10px] text-[var(--text-secondary)]">Tipo</p>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {TYPE_LABELS[asset.type] ?? asset.type}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--surface-1)]">
              <p className="text-[10px] text-[var(--text-secondary)]">
                Fecha de subida
              </p>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {new Date(asset.createdAt).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--surface-1)]">
              <p className="text-[10px] text-[var(--text-secondary)]">Subido por</p>
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                {asset.uploadedBy}
              </p>
            </div>
          </div>
        </div>

        {/* Used In Section */}
        {isInUse && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/20">
            <Info className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Este asset está en uso
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                Utilizado en {usedInCount}{" "}
                {usedInCount === 1 ? "contenido" : "contenidos"}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </button>

          <div className="relative group">
            <button
              onClick={handleDelete}
              disabled={deleting || isInUse}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </button>
            {isInUse && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] shadow-lg text-[10px] text-[var(--text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                No se puede eliminar: asset en uso
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
