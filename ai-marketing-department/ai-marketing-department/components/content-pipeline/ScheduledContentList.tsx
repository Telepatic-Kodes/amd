"use client";

import { useState, useEffect } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Calendar, FileText, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors, typeIcons } from "@/lib/contentTypes";
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

/**
 * Formats the remaining time until publication.
 * Returns an object with the formatted string and urgency level.
 */
function formatCountdown(scheduledFor: number, now: number): { text: string; urgency: "overdue" | "imminent" | "soon" | "normal" } {
  const diff = scheduledFor - now;

  // Already past due
  if (diff <= 0) {
    return { text: translate("overdue"), urgency: "overdue" };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  // More than 1 day away
  if (days > 0) {
    return {
      text: `${days}d ${remainingHours}h`,
      urgency: "normal",
    };
  }

  // Less than 1 hour - imminent
  if (hours === 0) {
    return {
      text: `${minutes}m`,
      urgency: minutes <= 15 ? "imminent" : "soon",
    };
  }

  // Less than 1 day
  return {
    text: `${hours}h ${minutes}m`,
    urgency: hours < 1 ? "soon" : "normal",
  };
}

export function ScheduledContentList({ scheduledContent, onPublishNow, onUnschedule }: ScheduledContentListProps) {
  // Tick every 30 seconds to update countdowns
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30_000); // Update every 30 seconds for smooth countdowns

    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
  if (scheduledContent === undefined) {
    return (
      <div className="bg-[var(--surface-0)]/30 border border-[var(--border)]/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{translate("scheduledContentTitle")}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--surface-2)]/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Count items publishing soon (within 1 hour)
  const imminentCount = scheduledContent.filter(
    (item) => item.scheduledFor && (item.scheduledFor - now) <= 60 * 60 * 1000 && (item.scheduledFor - now) > 0
  ).length;

  // Count overdue items (scheduledFor has passed but still in "scheduled" status)
  const overdueCount = scheduledContent.filter(
    (item) => item.scheduledFor && item.scheduledFor <= now
  ).length;

  return (
    <div className="bg-[var(--surface-0)]/30 border border-[var(--border)]/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{translate("scheduledContentTitle")}</h3>
          {scheduledContent.length > 0 && (
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">{scheduledContent.length}</span>
          )}
        </div>

        {/* Auto-publish indicator */}
        {scheduledContent.length > 0 && (
          <div className="flex items-center gap-1.5" title={translate("autoPublishInfo")}>
            <div className="flex items-center gap-1 text-xs text-[var(--success)] bg-[var(--badge-green-bg)] px-2 py-1 rounded-full border border-[var(--badge-green-bg)]/50">
              <Zap className="h-3 w-3" />
              <span className="font-medium">{translate("autoPublishEnabled")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Urgency summary badges */}
      {(imminentCount > 0 || overdueCount > 0) && (
        <div className="flex gap-2 mb-3">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-bg)]/50">
              <Clock className="h-3 w-3" />
              {overdueCount} {translate("overdue").toLowerCase()}
            </span>
          )}
          {imminentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] border border-amber-200/50">
              <Clock className="h-3 w-3" />
              {imminentCount} {translate("publishesSoon").toLowerCase()}
            </span>
          )}
        </div>
      )}

      {scheduledContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
          <Calendar className="h-8 w-8 mb-2" />
          <p className="text-sm">{translate("noScheduledContent")}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {scheduledContent.map((item) => {
            const TypeIcon = typeIcons[item.type] || FileText;
            const countdown = item.scheduledFor
              ? formatCountdown(item.scheduledFor, now)
              : null;

            return (
              <div key={item._id} className="flex items-center gap-3 py-3 border-b border-[var(--border)]/50 last:border-0">
                {/* Content type icon */}
                <div className={cn("flex h-8 w-8 items-center justify-center rounded shrink-0", typeColors[item.type] || "bg-[var(--surface-2)] text-[var(--text-tertiary)]")}>
                  <TypeIcon className="h-4 w-4" />
                </div>

                {/* Title and date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {item.scheduledFor
                      ? new Date(item.scheduledFor).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Sin fecha"}
                  </p>
                </div>

                {/* Countdown badge */}
                {countdown && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 min-w-[70px] justify-center",
                      countdown.urgency === "overdue" && "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] animate-pulse",
                      countdown.urgency === "imminent" && "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
                      countdown.urgency === "soon" && "bg-amber-100 text-[var(--badge-amber-text)]",
                      countdown.urgency === "normal" && "bg-[var(--surface-1)] text-[var(--text-secondary)]"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {countdown.text}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onPublishNow(item._id)}
                    className="text-xs px-2.5 py-1.5 rounded font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors min-h-[32px]"
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => onUnschedule(item._id)}
                    className="text-xs px-2.5 py-1.5 rounded font-medium border border-[var(--border-hover)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] transition-colors min-h-[32px]"
                  >
                    {translate("unschedule")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info about auto-publish cycle */}
      {scheduledContent.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]/30">
          <p className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" />
            {translate("autoPublishInfo")}
          </p>
        </div>
      )}
    </div>
  );
}
