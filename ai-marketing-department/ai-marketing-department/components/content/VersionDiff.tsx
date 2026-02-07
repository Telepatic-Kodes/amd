"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

interface VersionDiffProps {
  versionAId: Id<"contentVersions">;
  versionBId: Id<"contentVersions">;
  onClose: () => void;
}

// Helper: Format field label in Spanish
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    title: "Título",
    body: "Contenido",
    summary: "Resumen",
    status: "Estado",
    metadata: "Metadatos",
    seo: "SEO",
  };
  return labels[field] || field;
}

export function VersionDiff({ versionAId, versionBId, onClose }: VersionDiffProps) {
  const diff = useQuery(api.contentVersions.getVersionDiff, { versionAId, versionBId });

  if (!diff) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-6xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3" />
            <div className="h-64 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const { versionA, versionB, changes } = diff;
  const hasChanges = Object.values(changes).some((changed) => changed);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-6xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {translate("version")} {versionA.version} vs {translate("version")} {versionB.version}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasChanges ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Las versiones son idénticas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title */}
              {changes.titleChanged && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    {getFieldLabel("title")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-2">Versión {versionA.version}</p>
                      <p className="text-sm text-white">{versionA.title}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 p-4 border border-amber-500/20">
                      <p className="text-xs text-amber-400 mb-2">Versión {versionB.version}</p>
                      <p className="text-sm text-white">{versionB.title}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Body */}
              {changes.bodyChanged && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    {getFieldLabel("body")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700 max-h-96 overflow-y-auto">
                      <p className="text-xs text-zinc-500 mb-2">Versión {versionA.version}</p>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{versionA.body}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 p-4 border border-amber-500/20 max-h-96 overflow-y-auto">
                      <p className="text-xs text-amber-400 mb-2">Versión {versionB.version}</p>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{versionB.body}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {changes.summaryChanged && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    {getFieldLabel("summary")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-2">Versión {versionA.version}</p>
                      <p className="text-sm text-zinc-300">{versionA.summary || "(Sin resumen)"}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 p-4 border border-amber-500/20">
                      <p className="text-xs text-amber-400 mb-2">Versión {versionB.version}</p>
                      <p className="text-sm text-zinc-300">{versionB.summary || "(Sin resumen)"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              {changes.statusChanged && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    {getFieldLabel("status")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-2">Versión {versionA.version}</p>
                      <p className="text-sm text-white font-medium">{versionA.status}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 p-4 border border-amber-500/20">
                      <p className="text-xs text-amber-400 mb-2">Versión {versionB.version}</p>
                      <p className="text-sm text-white font-medium">{versionB.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile: Stack vertically */}
              <div className="md:hidden text-xs text-zinc-500 text-center">
                Desplázate hacia arriba/abajo para ver los cambios
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
