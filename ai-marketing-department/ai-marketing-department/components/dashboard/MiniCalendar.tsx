"use client";

import { useMemo } from "react";
import { addDays, format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

interface ScheduledItem {
  _id: string;
  title: string;
  type: string;
  scheduledFor?: number;
}

interface MiniCalendarProps {
  contentItems?: ScheduledItem[];
}

export function MiniCalendar({ contentItems }: MiniCalendarProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  // Group items by day
  const itemsByDay = useMemo(() => {
    if (!contentItems) return {};
    const map: Record<string, number> = {};
    for (const item of contentItems) {
      if (!item.scheduledFor) continue;
      const dateKey = format(new Date(item.scheduledFor), "yyyy-MM-dd");
      map[dateKey] = (map[dateKey] || 0) + 1;
    }
    return map;
  }, [contentItems]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-medium text-stone-700">{translate("miniCalendarTitle")}</h3>
        </div>
        <Link
          href="/content/pipeline"
          className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const count = itemsByDay[dateKey] || 0;
          const isTodayDate = isToday(day);

          return (
            <Link
              key={dateKey}
              href="/content/pipeline"
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors hover:bg-stone-50",
                isTodayDate && "bg-orange-50"
              )}
            >
              <span className={cn(
                "text-[10px] font-medium uppercase",
                isTodayDate ? "text-orange-600" : "text-stone-400"
              )}>
                {format(day, "EEE", { locale: es })}
              </span>
              <span className={cn(
                "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                isTodayDate
                  ? "bg-orange-500 text-white"
                  : "text-stone-700"
              )}>
                {format(day, "d")}
              </span>
              {/* Dots indicator */}
              <div className="flex gap-0.5 min-h-[6px]">
                {count > 0 && Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isTodayDate ? "bg-orange-400" : "bg-purple-400"
                    )}
                  />
                ))}
                {count > 3 && (
                  <span className="text-[8px] text-stone-400 font-bold">+</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Summary */}
      {contentItems && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-400">
            {contentItems.filter(c => c.scheduledFor).length} contenidos programados próximos 7 días
          </p>
        </div>
      )}
    </div>
  );
}

export function MiniCalendarSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded bg-stone-200 animate-pulse" />
        <div className="h-4 w-24 rounded bg-stone-200 animate-pulse" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-2">
            <div className="h-3 w-6 rounded bg-stone-200 animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-stone-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
