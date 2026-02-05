"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Columns3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { translate } from "@/lib/language";
import { KanbanBoard } from "@/components/content-pipeline/KanbanBoard";
import { PipelineStats } from "@/components/content-pipeline/PipelineStats";
import { ScheduledContentList } from "@/components/content-pipeline/ScheduledContentList";

export default function PipelinePage() {
  const contentByStatus = useQuery(api.contentPipeline.getContentByStatus);
  const statusCounts = useQuery(api.contentPipeline.getContentStatusCounts);
  const scheduledContent = useQuery(api.contentPipeline.getScheduledContent);

  const publishContent = useMutation(api.contentPipeline.publishContent);
  const moveContent = useMutation(api.contentPipeline.moveContent);
  const { success, error: showError } = useToast();

  const handlePublishNow = async (id: Id<"content">) => {
    try {
      await publishContent({ id });
      success(translate("contentPublished"), "El contenido ha sido publicado");
    } catch (err: any) {
      showError("Error", err.message);
    }
  };

  const handleUnschedule = async (id: Id<"content">) => {
    try {
      await moveContent({ id, toStatus: "approved" });
      success(translate("unschedule"), "El contenido ha vuelto a estado aprobado");
    } catch (err: any) {
      showError("Error", err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 md:space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <Columns3 className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {translate("contentPipeline")}
            </h1>
            <p className="text-zinc-400 mt-1">
              {translate("pipelineDescription")}
            </p>
          </div>
        </div>
        <Link
          href="/content"
          className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {translate("listView")}
        </Link>
      </div>

      {/* Pipeline Stats */}
      <PipelineStats counts={statusCounts} />

      {/* Kanban Board */}
      <KanbanBoard columns={contentByStatus?.columns} statusCounts={statusCounts} />

      {/* Scheduled Content */}
      <ScheduledContentList
        scheduledContent={scheduledContent}
        onPublishNow={handlePublishNow}
        onUnschedule={handleUnschedule}
      />
    </motion.div>
  );
}
