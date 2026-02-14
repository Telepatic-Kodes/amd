"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { FileText, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { typeColors, typeIcons, formatTypeName } from "@/lib/contentTypes";
import { translate } from "@/lib/language";

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  hero: { label: "HERO", color: "bg-orange-100 text-orange-700 border-orange-300" },
  hub: { label: "HUB", color: "bg-blue-100 text-blue-700 border-blue-300" },
  hygiene: { label: "HYG", color: "bg-green-100 text-green-700 border-green-300" },
};

const FUNNEL_BADGE: Record<string, { label: string; icon: string }> = {
  reach: { label: "R", icon: "📡" },
  act: { label: "A", icon: "👆" },
  convert: { label: "C", icon: "💰" },
  engage: { label: "E", icon: "🤝" },
};

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
    sourceTaskId?: string;
    createdBy?: string;
    // Framework metadata
    contentTier?: string;
    funnelStage?: string;
    tayaCategory?: string;
    pillarName?: string;
  };
  onAction: (action: string, contentId: Id<"content">) => void;
  // P6: Batch operations
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (contentId: Id<"content">, selected: boolean) => void;
}

// B4: Brand consistency score badge — fetches analysis inline per card
function BrandScoreBadge({ contentId }: { contentId: Id<"content"> }) {
  const analysis = useQuery(api.contentAnalysis.getContentAnalysis, { contentId });
  if (!analysis) return null;
  const score = analysis.brandAlignment;
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-bold border inline-flex items-center gap-0.5",
        score >= 80
          ? "bg-green-50 text-green-700 border-green-200"
          : score >= 60
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-red-50 text-red-700 border-red-200"
      )}
      title={`Brand Alignment: ${score}/100`}
    >
      <Target className="h-2 w-2" />
      {score}
    </span>
  );
}

export function KanbanCard({ content, onAction, selectable, selected, onSelect }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const TypeIcon = typeIcons[content.type] || FileText;
  const isAIGenerated = !!content.sourceTaskId && content.createdBy !== "system";

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
        "bg-stone-100/80 border border-stone-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-stone-300 transition-all",
        isDragging && "opacity-50 scale-95 rotate-1",
        selected && "ring-2 ring-orange-500/40 border-orange-300 bg-orange-50/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-1.5">
        {/* P6: Batch selection checkbox */}
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(content._id, e.target.checked);
            }}
            className="h-3.5 w-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500 shrink-0 mt-1 cursor-pointer"
          />
        )}
        <div className={cn("flex h-6 w-6 items-center justify-center rounded shrink-0", typeColors[content.type] || "bg-stone-500/10 text-stone-400")}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-sm font-medium text-stone-900 line-clamp-1 flex-1 flex items-center gap-1">
          {content.title}
          {isAIGenerated && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 border border-orange-200 px-1 py-0.5 text-[9px] font-medium text-orange-600 shrink-0">
              <Sparkles className="h-2 w-2" />
              IA
            </span>
          )}
        </h4>
      </div>

      {/* Summary */}
      <p className="text-xs text-stone-400 line-clamp-2 mt-1 mb-2">
        {content.summary || content.body.slice(0, 120)}
      </p>

      {/* Footer info */}
      <div className="flex items-center gap-2 mb-2 border-t border-stone-200/50 pt-2">
        <Badge className={cn("text-[10px] px-1.5 py-0.5", typeColors[content.type])}>
          {formatTypeName(content.type)}
        </Badge>
        {content.metadata?.wordCount && (
          <span className="text-[10px] text-stone-500">{content.metadata.wordCount} palabras</span>
        )}
        {content.scheduledFor && (
          <span className="text-[10px] text-orange-400 ml-auto">
            {new Date(content.scheduledFor).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Framework metadata badges + B4 brand score */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        {content.contentTier && TIER_BADGE[content.contentTier] && (
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", TIER_BADGE[content.contentTier].color)}>
            {TIER_BADGE[content.contentTier].label}
          </span>
        )}
        {content.funnelStage && FUNNEL_BADGE[content.funnelStage] && (
          <span className="px-1 py-0.5 rounded bg-stone-100 text-[9px] font-medium text-stone-600" title={`Funnel: ${content.funnelStage}`}>
            {FUNNEL_BADGE[content.funnelStage].icon}{FUNNEL_BADGE[content.funnelStage].label}
          </span>
        )}
        {content.tayaCategory && (
          <span className="px-1.5 py-0.5 rounded bg-violet-50 text-[9px] font-medium text-violet-600 border border-violet-200">
            {content.tayaCategory}
          </span>
        )}
        {content.pillarName && (
          <span className="px-1.5 py-0.5 rounded bg-stone-50 text-[9px] font-medium text-stone-500 truncate max-w-[100px]" title={content.pillarName}>
            {content.pillarName}
          </span>
        )}
        {/* B4: Brand consistency score badge */}
        <BrandScoreBadge contentId={content._id} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        {content.status === "draft" && (
          <button onClick={() => onAction("sendToReview", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors min-h-[36px]">
            {translate("sendToReview")}
          </button>
        )}
        {content.status === "review" && (
          <>
            <button onClick={() => onAction("approve", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors min-h-[36px]">
              {translate("approve")}
            </button>
            <button onClick={() => onAction("reject", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-stone-300 text-stone-400 hover:bg-stone-200 transition-colors min-h-[36px]">
              {translate("reject")}
            </button>
          </>
        )}
        {content.status === "revision_needed" && (
          <button onClick={() => onAction("sendToReview", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors min-h-[36px]">
            {translate("sendToReview")}
          </button>
        )}
        {content.status === "approved" && (
          <>
            <button onClick={() => onAction("publishNow", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors min-h-[36px]">
              {translate("publishNow")}
            </button>
            <button onClick={() => onAction("schedule", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-stone-300 text-stone-400 hover:bg-stone-200 transition-colors min-h-[36px]">
              {translate("schedule")}
            </button>
          </>
        )}
        {content.status === "scheduled" && (
          <button onClick={() => onAction("publishNow", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors min-h-[36px]">
            {translate("publishNow")}
          </button>
        )}
        {content.status === "published" && (
          <button onClick={() => onAction("archive", content._id)} className="flex-1 text-xs px-2 py-1.5 rounded font-medium border border-stone-300 text-stone-400 hover:bg-stone-200 transition-colors min-h-[36px]">
            {translate("archive")}
          </button>
        )}
      </div>
    </div>
  );
}
