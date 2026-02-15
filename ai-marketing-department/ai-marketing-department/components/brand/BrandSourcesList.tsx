"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Globe,
  Rss,
  FileText,
  StickyNote,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Props {
  brandProfileId: Id<"brandProfiles">;
  onAddSource: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  url: <Globe className="w-4 h-4" />,
  feed: <Rss className="w-4 h-4" />,
  upload: <FileText className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  url: "URL",
  feed: "Feed",
  upload: "Archivo",
  note: "Nota",
};

const statusConfig: Record<string, { variant: "success" | "warning" | "info" | "error" | "default"; label: string }> = {
  active: { variant: "success", label: "Activo" },
  pending: { variant: "warning", label: "Pendiente" },
  processing: { variant: "info", label: "Procesando" },
  error: { variant: "error", label: "Error" },
  paused: { variant: "default", label: "Pausado" },
};

export function BrandSourcesList({ brandProfileId, onAddSource }: Props) {
  const sources = useQuery(api.brandSources.listSources, { brandProfileId });
  const stats = useQuery(api.brandSources.getSourceStats, { brandProfileId });
  const deleteSource = useMutation(api.brandSources.deleteSource);
  const toggleStatus = useMutation(api.brandSources.toggleSourceStatus);
  const processSource = useAction(api.brandSourceProcessor.processSource);

  const handleDelete = async (sourceId: Id<"brandSources">) => {
    await deleteSource({ sourceId });
  };

  const handleToggle = async (sourceId: Id<"brandSources">, currentStatus: string) => {
    await toggleStatus({
      sourceId,
      status: currentStatus === "paused" ? "active" : "paused",
    });
  };

  const handleReprocess = async (sourceId: Id<"brandSources">) => {
    await processSource({ sourceId });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Fuentes
          {stats && stats.total > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs">
              {stats.active}/{stats.total}
            </span>
          )}
        </h3>
        <button
          onClick={onAddSource}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {/* Sources list */}
      {sources === undefined ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[var(--surface-1)] animate-pulse" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)]">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin fuentes externas</p>
          <p className="text-xs mt-1">Agrega URLs, feeds, archivos o notas para enriquecer tu KB</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => {
            const status = statusConfig[source.status] || statusConfig.pending;
            return (
              <div
                key={source._id}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)]">
                    {typeIcons[source.sourceType] || typeIcons.url}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">{source.name}</span>
                      <Badge variant={status.variant}>
                        {source.status === "processing" && <Loader2 className="w-3 h-3 animate-spin mr-0.5" />}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--text-tertiary)]">{typeLabels[source.sourceType]}</span>
                      {source.url && (
                        <span className="text-xs text-[var(--text-tertiary)] truncate max-w-[180px]">{source.url}</span>
                      )}
                      {source.sectionsCreated !== undefined && source.sectionsCreated > 0 && (
                        <span className="text-xs text-[var(--text-tertiary)]">{source.sectionsCreated} secciones</span>
                      )}
                    </div>
                    {source.processingError && (
                      <p className="text-xs text-[var(--error)] mt-1 truncate">{source.processingError}</p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {(source.status === "active" || source.status === "paused") && (
                      <button
                        onClick={() => handleToggle(source._id, source.status)}
                        className="p-1.5 rounded hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        title={source.status === "paused" ? "Reanudar" : "Pausar"}
                      >
                        {source.status === "paused" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {source.status === "error" && (
                      <button
                        onClick={() => handleReprocess(source._id)}
                        className="p-1.5 rounded hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        title="Re-procesar"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(source._id)}
                      className="p-1.5 rounded hover:bg-[var(--badge-red-bg)]0/10 text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
