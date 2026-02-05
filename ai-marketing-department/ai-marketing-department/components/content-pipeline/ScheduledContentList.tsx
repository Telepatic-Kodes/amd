"use client";

import { Id } from "@convex/_generated/dataModel";
import { Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors, typeIcons, formatTypeName } from "@/lib/contentTypes";
import { translate } from "@/lib/language";

interface ScheduledItem {
  _id: Id<"content">;
  contentId: string;
  title: string;
  type: string;
  scheduledFor?: number;
  createdAt: number;
  metadata: { wordCount?: number; readingTime?: number };
}

interface ScheduledContentListProps {
  scheduledContent: ScheduledItem[] | undefined;
  onPublishNow: (contentId: Id<"content">) => void;
  onUnschedule: (contentId: Id<"content">) => void;
}

export function ScheduledContentList({ scheduledContent, onPublishNow, onUnschedule }: ScheduledContentListProps) {
  // Loading skeleton
  if (scheduledContent === undefined) {
    return (
      <div className="bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">{translate("scheduledContentTitle")}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">{translate("scheduledContentTitle")}</h3>
        {scheduledContent.length > 0 && (
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{scheduledContent.length}</span>
        )}
      </div>

      {scheduledContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <Calendar className="h-8 w-8 mb-2" />
          <p className="text-sm">{translate("noScheduledContent")}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {scheduledContent.map((item) => {
            const TypeIcon = typeIcons[item.type] || FileText;
            return (
              <div key={item._id} className="flex items-center gap-3 py-3 border-b border-zinc-800/50 last:border-0">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded shrink-0", typeColors[item.type] || "bg-zinc-500/10 text-zinc-400")}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-indigo-400">
                    {item.scheduledFor
                      ? new Date(item.scheduledFor).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Sin fecha"}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onPublishNow(item._id)}
                    className="text-xs px-2.5 py-1.5 rounded font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors min-h-[32px]"
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => onUnschedule(item._id)}
                    className="text-xs px-2.5 py-1.5 rounded font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors min-h-[32px]"
                  >
                    {translate("unschedule")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
