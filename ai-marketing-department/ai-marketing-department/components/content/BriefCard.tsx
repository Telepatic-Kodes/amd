"use client";

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Check,
  Edit2,
  X,
  Loader2,
  Eye,
  RefreshCw,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Mail,
  Video,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const channelIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  blog: BookOpen,
  email: Mail,
  newsletter: Mail,
  youtube: Video,
  tiktok: Video,
};

const tierColors: Record<string, string> = {
  hero: "bg-amber-50 text-amber-700 border-amber-200",
  hub: "bg-sky-50 text-sky-700 border-sky-200",
  hygiene: "bg-green-50 text-green-700 border-green-200",
};

const funnelColors: Record<string, string> = {
  reach: "bg-purple-50 text-purple-700",
  act: "bg-blue-50 text-blue-700",
  convert: "bg-orange-50 text-orange-700",
  engage: "bg-green-50 text-green-700",
};

interface BriefData {
  _id: Id<"contentBriefs">;
  title: string;
  description: string;
  channel: string;
  contentType: string;
  pillarName?: string;
  contentTier?: "hero" | "hub" | "hygiene";
  funnelStage?: "reach" | "act" | "convert" | "engage";
  tayaCategory?: string;
  dayOfWeek?: string;
  successProbability?: number;
  status: string;
  generatedContentId?: Id<"content">;
  userFeedback?: string;
}

interface BriefCardProps {
  brief: BriefData;
  onApprove?: (id: Id<"contentBriefs">) => Promise<void>;
  onEdit?: (brief: BriefData) => void;
  onDismiss?: (id: Id<"contentBriefs">) => Promise<void>;
  onViewContent?: (contentId: Id<"content">) => void;
  onRequestChanges?: (id: Id<"contentBriefs">) => void;
}

export function BriefCard({ brief, onApprove, onEdit, onDismiss, onViewContent, onRequestChanges }: BriefCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const ChannelIcon = channelIcons[brief.channel] || Sparkles;
  const prob = brief.successProbability ?? 0;

  const probColor = prob >= 70 ? "bg-green-500" : prob >= 50 ? "bg-yellow-500" : "bg-red-400";

  const handleAction = async (action: string, fn?: () => Promise<void>) => {
    if (!fn) return;
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  const isSuggested = brief.status === "suggested";
  const isInProgress = brief.status === "approved" || brief.status === "generating";
  const isGenerated = brief.status === "generated";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[var(--border-hover)] transition-colors"
    >
      {/* Header: icon + title + day */}
      <div className="flex items-start gap-3 mb-2">
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          "bg-[var(--accent-subtle)] text-[var(--accent)]"
        )}>
          <ChannelIcon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
            {brief.title}
          </h4>
          <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mt-0.5">
            {brief.description}
          </p>
        </div>
        {brief.dayOfWeek && (
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-0)] px-2 py-0.5 rounded-full shrink-0">
            {brief.dayOfWeek}
          </span>
        )}
      </div>

      {/* Badges: pillar + tier + funnel + TAYA */}
      <div className="flex flex-wrap gap-1 mb-3">
        {brief.pillarName && (
          <Badge variant="default" className="text-[10px]">
            {brief.pillarName}
          </Badge>
        )}
        {brief.contentTier && (
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", tierColors[brief.contentTier])}>
            {brief.contentTier}
          </span>
        )}
        {brief.funnelStage && (
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", funnelColors[brief.funnelStage])}>
            {brief.funnelStage}
          </span>
        )}
        {brief.tayaCategory && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-0)] text-[var(--text-tertiary)] font-medium">
            TAYA: {brief.tayaCategory}
          </span>
        )}
      </div>

      {/* Success probability bar */}
      {brief.successProbability != null && isSuggested && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--text-tertiary)]">Prob. éxito</span>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{prob}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-1)] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", probColor)}
              style={{ width: `${prob}%` }}
            />
          </div>
        </div>
      )}

      {/* In-progress spinner */}
      {isInProgress && (
        <div className="flex items-center gap-2 py-2 text-[var(--accent)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">
            {brief.status === "approved" ? "En cola..." : "Generando contenido..."}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-1">
        {isSuggested && (
          <>
            <button
              onClick={() => handleAction("approve", () => onApprove?.(brief._id) ?? Promise.resolve())}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Aprobar
            </button>
            <button
              onClick={() => onEdit?.(brief)}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-0)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Editar antes de aprobar"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleAction("dismiss", () => onDismiss?.(brief._id) ?? Promise.resolve())}
              disabled={!!loading}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-50 text-[var(--text-tertiary)] hover:text-red-500 transition-colors disabled:opacity-50"
              title="Descartar"
            >
              {loading === "dismiss" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            </button>
          </>
        )}

        {isGenerated && (
          <>
            {brief.generatedContentId && (
              <button
                onClick={() => onViewContent?.(brief.generatedContentId!)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
              >
                <Eye className="h-3 w-3" />
                Ver Contenido
              </button>
            )}
            <button
              onClick={() => onRequestChanges?.(brief._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-0)] text-[var(--text-secondary)] text-xs font-medium transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Pedir Cambios
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
