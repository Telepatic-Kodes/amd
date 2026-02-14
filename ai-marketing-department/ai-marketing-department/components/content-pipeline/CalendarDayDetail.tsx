"use client";

import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Sparkles, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors, typeIcons, formatTypeName } from "@/lib/contentTypes";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { translate, translateStatus, getStatusVariant } from "@/lib/language";
import { motion, AnimatePresence } from "framer-motion";

interface ContentItem {
  _id: Id<"content">;
  contentId: string;
  title: string;
  type: string;
  status: string;
  summary?: string;
  body: string;
  scheduledFor?: number;
  createdAt: number;
  createdBy: string;
  sourceTaskId?: string;
  metadata: { wordCount?: number; readingTime?: number };
}

interface CalendarDayDetailProps {
  date: Date | null;
  items: ContentItem[];
  onClose: () => void;
  onPublishNow: (id: Id<"content">) => void;
  onUnschedule: (id: Id<"content">) => void;
}

export function CalendarDayDetail({
  date,
  items,
  onClose,
  onPublishNow,
  onUnschedule,
}: CalendarDayDetailProps) {
  if (!date) return null;

  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-stone-200 shadow-xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 capitalize">{dateLabel}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {items.length} {items.length === 1 ? "contenido" : "contenidos"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-8 w-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-400">{translate("noContentForDay")}</p>
              <p className="text-xs text-stone-300 mt-1">{translate("dragToSchedule")}</p>
            </div>
          ) : (
            items.map((item) => {
              const TypeIcon = typeIcons[item.type] || FileText;
              const isAIGenerated = !!item.sourceTaskId && item.createdBy !== "system";

              return (
                <div
                  key={item._id}
                  className="rounded-lg border border-stone-200 bg-stone-50/50 p-3.5 space-y-2.5"
                >
                  {/* Header */}
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                      typeColors[item.type] || "bg-stone-100 text-stone-500"
                    )}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-stone-900 line-clamp-2 flex items-center gap-1.5">
                        {item.title}
                        {isAIGenerated && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 border border-orange-200 px-1.5 py-0.5 text-[9px] font-medium text-orange-600 shrink-0">
                            <Sparkles className="h-2 w-2" />
                            IA
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px]", typeColors[item.type])}>
                          {formatTypeName(item.type)}
                        </Badge>
                        <Badge variant={getStatusVariant(item.status)} className="text-[10px]">
                          {translateStatus(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {(item.summary || item.body) && (
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {item.summary || item.body.slice(0, 150)}
                    </p>
                  )}

                  {/* AI lineage */}
                  {isAIGenerated && (
                    <div className="flex items-center gap-1.5 text-[10px] text-orange-500 bg-orange-50/50 rounded px-2 py-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{translate("generatedBy")}: Agente IA</span>
                    </div>
                  )}

                  {/* Scheduled time */}
                  {item.scheduledFor && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.scheduledFor), "HH:mm", { locale: es })}
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-2 pt-1">
                    {(item.status === "scheduled" || item.status === "approved") && (
                      <button
                        onClick={() => onPublishNow(item._id)}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg font-medium bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Zap className="h-3 w-3" />
                        {translate("publishNow")}
                      </button>
                    )}
                    {item.status === "scheduled" && (
                      <button
                        onClick={() => onUnschedule(item._id)}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg font-medium border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
                      >
                        {translate("unschedule")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
