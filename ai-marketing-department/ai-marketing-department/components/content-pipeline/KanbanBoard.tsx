"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { translate, translateStatus } from "@/lib/language";
import { statusColors } from "@/lib/contentTypes";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { ScheduleModal } from "./ScheduleModal";

const PIPELINE_COLUMNS = [
  { status: "draft", label: "draftColumn", color: statusColors.draft },
  { status: "review", label: "reviewColumn", color: statusColors.review },
  { status: "revision_needed", label: "revisionColumn", color: statusColors.revision_needed },
  { status: "approved", label: "approvedColumn", color: statusColors.approved },
  { status: "scheduled", label: "scheduledColumn", color: statusColors.scheduled },
  { status: "published", label: "publishedColumn", color: statusColors.published },
];

interface KanbanBoardProps {
  columns: Record<string, Doc<"content">[]> | undefined;
  statusCounts: Record<string, number> | undefined;
}

export function KanbanBoard({ columns, statusCounts }: KanbanBoardProps) {
  const moveContent = useMutation(api.contentPipeline.moveContent);
  const approveContent = useMutation(api.contentPipeline.approveContent);
  const rejectContent = useMutation(api.contentPipeline.rejectContent);
  const scheduleContent = useMutation(api.contentPipeline.scheduleContent);
  const publishContent = useMutation(api.contentPipeline.publishContent);
  const moveContentToReview = useMutation(api.contentPipeline.moveContentToReview);
  const bulkMove = useMutation(api.contentPipeline.bulkMoveContent);
  const { success, error: showError } = useToast();

  const [scheduleModalContentId, setScheduleModalContentId] = useState<Id<"content"> | null>(null);

  // P6: Batch operations state
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  async function handleDrop(contentId: string, toStatus: string) {
    try {
      await moveContent({ id: contentId as Id<"content">, toStatus });
      success(translate("contentMoved"), `Estado cambiado a ${translateStatus(toStatus)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError(translate("invalidTransition"), message || "Error al mover contenido");
    }
  }

  async function handleAction(action: string, contentId: Id<"content">) {
    try {
      switch (action) {
        case "sendToReview":
          await moveContentToReview({ id: contentId });
          success(translate("contentMoved"), "Contenido enviado a revisión");
          break;
        case "approve":
          await approveContent({ id: contentId });
          success(translate("contentApproved"), "Contenido aprobado");
          break;
        case "reject":
          await rejectContent({ id: contentId });
          success(translate("contentRejected"), "Se solicitaron cambios");
          break;
        case "schedule":
          setScheduleModalContentId(contentId);
          break;
        case "publishNow":
          await publishContent({ id: contentId });
          success(translate("contentPublished"), "Contenido publicado");
          break;
        case "archive":
          await moveContent({ id: contentId, toStatus: "archived" });
          success(translate("contentMoved"), "Contenido archivado");
          break;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message || "Error al ejecutar acción");
    }
  }

  async function handleSchedule(contentId: Id<"content">, scheduledFor: number) {
    try {
      await scheduleContent({ id: contentId, scheduledFor });
      success(translate("contentScheduled"), "Contenido programado exitosamente");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message || "Error al programar contenido");
    }
  }

  // P6: Batch selection handlers
  function handleSelectItem(contentId: Id<"content">, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(contentId);
      } else {
        next.delete(contentId);
      }
      return next;
    });
  }

  function handleSelectAll(status: string, select: boolean) {
    if (!columns) return;
    const columnItems = columns[status] || [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of columnItems) {
        if (select) {
          next.add(item._id);
        } else {
          next.delete(item._id);
        }
      }
      return next;
    });
  }

  // P6: Bulk action handler
  async function handleBulkAction(targetStatus: string) {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      const ids = Array.from(selectedIds) as Id<"content">[];
      const result = await bulkMove({
        contentIds: ids,
        targetStatus: targetStatus as "draft" | "review" | "revision_needed" | "approved" | "scheduled" | "published" | "archived",
      });
      if (result.moved > 0) {
        success(
          `${result.moved} contenido(s) movido(s)`,
          `Estado cambiado a ${translateStatus(targetStatus)}`
        );
      }
      if (result.failed > 0) {
        showError(
          `${result.failed} error(es)`,
          result.errors.slice(0, 3).join("; ")
        );
      }
      setSelectedIds(new Set());
      setBatchMode(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error en operación masiva", message);
    } finally {
      setIsBulkLoading(false);
    }
  }

  // Loading skeleton
  if (!columns) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="min-w-[280px] max-w-[320px] w-full bg-stone-50/30 rounded-xl border border-stone-200/50">
            <div className="px-4 py-3 border-b border-stone-200/50">
              <div className="h-5 w-24 bg-stone-200/50 rounded animate-pulse" />
            </div>
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-28 bg-stone-200/30 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* P6: Batch mode toggle */}
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => {
            setBatchMode(!batchMode);
            setSelectedIds(new Set());
          }}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg border transition-colors",
            batchMode
              ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
              : "text-stone-400 border-stone-200 hover:border-stone-300"
          )}
        >
          {batchMode ? "Salir seleccion" : "Seleccion multiple"}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
        {PIPELINE_COLUMNS.map(({ status, label, color }) => (
          <KanbanColumn
            key={status}
            status={status}
            title={translate(label)}
            items={columns[status] || []}
            count={statusCounts?.[status] || 0}
            color={color}
            onDrop={handleDrop}
            onAction={handleAction}
            batchMode={batchMode}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
          />
        ))}
      </div>

      {/* P6: Floating batch action bar */}
      {batchMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-stone-700">
          <span className="text-sm font-medium">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <div className="w-px h-5 bg-stone-700" />
          <button
            onClick={() => handleBulkAction("review")}
            disabled={isBulkLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 transition-colors"
          >
            Enviar a revision
          </button>
          <button
            onClick={() => handleBulkAction("approved")}
            disabled={isBulkLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={() => handleBulkAction("scheduled")}
            disabled={isBulkLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
          >
            Programar
          </button>
          <button
            onClick={() => handleBulkAction("published")}
            disabled={isBulkLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
          >
            Publicar
          </button>
          <button
            onClick={() => {
              setSelectedIds(new Set());
            }}
            disabled={isBulkLoading}
            className="text-xs px-3 py-1.5 rounded-lg text-stone-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      <ScheduleModal
        contentId={scheduleModalContentId}
        isOpen={!!scheduleModalContentId}
        onClose={() => setScheduleModalContentId(null)}
        onSchedule={handleSchedule}
      />
    </>
  );
}
