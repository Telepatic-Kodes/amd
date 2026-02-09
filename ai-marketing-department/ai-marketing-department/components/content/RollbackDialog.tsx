"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { translate } from "@/lib/language";

interface RollbackDialogProps {
  contentId: Id<"content">;
  versionId: Id<"contentVersions">;
  versionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function RollbackDialog({
  contentId,
  versionId,
  versionNumber,
  onClose,
  onSuccess,
}: RollbackDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const rollbackToVersion = useMutation(api.contentVersions.rollbackToVersion);
  const { success, error: showError } = useToast();

  const handleRollback = async () => {
    setIsLoading(true);
    try {
      const result = await rollbackToVersion({ contentId, versionId });
      success(
        translate("rollbackSuccess"),
        `Contenido revertido a versión ${versionNumber}. Nueva versión: ${result.newVersion}`
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      showError("Error", message || "No se pudo revertir el contenido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Revertir a versión {versionNumber}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-zinc-300">
            Esta acción restaurará el contenido a la versión {versionNumber}. Se creará una nueva
            entrada en el historial. ¿Deseas continuar?
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRollback}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {translate("rollback")}
          </button>
        </div>
      </div>
    </div>
  );
}
