"use client";

import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { typeColors, typeIcons, formatTypeName } from "@/lib/contentTypes";
import { translate } from "@/lib/language";

interface KanbanCardProps {
  content: {
    _id: Id<"content">;
    contentId: string;
    title: string;
    type: string;
    status: string;
    summary?: string;
    body: string;
    metadata: { wordCount?: number; readingTime?: number };
    createdAt: number;
    updatedAt: number;
    scheduledFor?: number;
  };
  onAction: (action: string, contentId: Id<"content">) => void;
}

export function KanbanCard({ content, onAction }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const TypeIcon = typeIcons[content.type] || FileText;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", content._id);
        e.dataTransfer.setData("application/x-status", content.status);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-all",
        isDragging && "opacity-50 scale-95 rotate-1"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded shrink-0", typeColors[content.type] || "bg-zinc-500/10 text-zinc-400")}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-sm font-medium text-white line-clamp-1 flex-1">{content.title}</h4>
      </div>

      {/* Summary */}
      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-2">
        {content.summary || content.body.slice(0, 120)}
      </p>

      {/* Footer info */}
      <div className="flex items-center gap-2 mb-2 border-t border-zinc-800/50 pt-2">
        <Badge className={cn("text-[10px] px-1.5 py-0.5", typeColors[content.type])}>
          {formatTypeName(content.type)}
        </Badge>
        {content.metadata?.wordCount && (
          <span className="text-[10px] text-zinc-500">{content.metadata.wordCount} palabras</span>
        )}
        {content.scheduledFor && (
          <span className="text-[10px] text-indigo-400 ml-auto">
            {new Date(content.scheduledFor).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        {content.status === "draft" && (
          <button onClick={() => onAction("sendToReview", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors min-h-[36px]">
            {translate("sendToReview")}
          </button>
        )}
        {content.status === "review" && (
          <>
            <button onClick={() => onAction("approve", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors min-h-[36px]">
              {translate("approve")}
            </button>
            <button onClick={() => onAction("reject", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors min-h-[36px]">
              {translate("reject")}
            </button>
          </>
        )}
        {content.status === "revision_needed" && (
          <button onClick={() => onAction("sendToReview", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors min-h-[36px]">
            {translate("sendToReview")}
          </button>
        )}
        {content.status === "approved" && (
          <>
            <button onClick={() => onAction("publishNow", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors min-h-[36px]">
              {translate("publishNow")}
            </button>
            <button onClick={() => onAction("schedule", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors min-h-[36px]">
              {translate("schedule")}
            </button>
          </>
        )}
        {content.status === "scheduled" && (
          <button onClick={() => onAction("publishNow", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors min-h-[36px]">
            {translate("publishNow")}
          </button>
        )}
        {content.status === "published" && (
          <button onClick={() => onAction("archive", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors min-h-[36px]">
            {translate("archive")}
          </button>
        )}
      </div>
    </div>
  );
}
