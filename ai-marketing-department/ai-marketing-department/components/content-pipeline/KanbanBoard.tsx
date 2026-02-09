"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { translate, translateStatus } from "@/lib/language";
import { statusColors } from "@/lib/contentTypes";
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
  columns: Record<string, any[]> | undefined;
  statusCounts: Record<string, number> | undefined;
}

export function KanbanBoard({ columns, statusCounts }: KanbanBoardProps) {
  const moveContent = useMutation(api.contentPipeline.moveContent);
  const approveContent = useMutation(api.contentPipeline.approveContent);
  const rejectContent = useMutation(api.contentPipeline.rejectContent);
  const scheduleContent = useMutation(api.contentPipeline.scheduleContent);
  const publishContent = useMutation(api.contentPipeline.publishContent);
  const moveContentToReview = useMutation(api.contentPipeline.moveContentToReview);
  const { success, error: showError } = useToast();

  const [scheduleModalContentId, setScheduleModalContentId] = useState<Id<"content"> | null>(null);

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

  // Loading skeleton
  if (!columns) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="min-w-[280px] max-w-[320px] w-full bg-zinc-950/30 rounded-xl border border-zinc-800/50">
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <div className="h-5 w-24 bg-zinc-800/50 rounded animate-pulse" />
            </div>
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-28 bg-zinc-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
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
          />
        ))}
      </div>

      <ScheduleModal
        contentId={scheduleModalContentId}
        isOpen={!!scheduleModalContentId}
        onClose={() => setScheduleModalContentId(null)}
        onSchedule={handleSchedule}
      />
    </>
  );
}
