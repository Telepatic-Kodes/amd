"use client";

import { useState, useMemo } from "react";
import { Id } from "@convex/_generated/dataModel";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
  isWeekend,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors, typeIcons } from "@/lib/contentTypes";
import { FileText } from "lucide-react";
import { translate } from "@/lib/language";
import { ContentChip } from "@/components/content/ContentChip";

interface CalendarItem {
  _id: Id<"content">;
  contentId: string;
  title: string;
  type: string;
  status: string;
  scheduledFor?: number;
  createdAt: number;
  metadata: { wordCount?: number; readingTime?: number };
  // Framework metadata
  contentTier?: "hero" | "hub" | "hygiene";
  funnelStage?: "reach" | "act" | "convert" | "engage";
  tayaCategory?: string;
  pillarName?: string;
}

const TIER_COLORS: Record<string, string> = {
  hero: "bg-orange-100 text-[var(--accent)] border-l-2 border-l-orange-500",
  hub: "bg-blue-100 text-[var(--badge-blue-text)] border-l-2 border-l-blue-500",
  hygiene: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-l-2 border-l-green-500",
};

interface CalendarGridProps {
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onReschedule: (contentId: Id<"content">, newDate: number) => void;
}

const MAX_ITEMS_PER_CELL = 3;
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarGrid({ items, onDayClick, onReschedule }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Build calendar days grid (Mon-Sun, filling previous/next month)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Start from Monday of the week containing the first day
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Group items by date string
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of items) {
      if (!item.scheduledFor) continue;
      const dateKey = format(new Date(item.scheduledFor), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    }
    return map;
  }, [items]);

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateKey);
  };

  const handleDragLeave = () => setDragOverDate(null);

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    const contentId = e.dataTransfer.getData("text/plain");
    if (!contentId) return;
    // Set time to noon to avoid timezone issues
    const scheduledTimestamp = new Date(date).setHours(12, 0, 0, 0);
    onReschedule(contentId as Id<"content">, scheduledTimestamp);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
      {/* Header: Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors"
          title={translate("prevMonth")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-[var(--text-primary)] capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] border border-[var(--border)] transition-colors flex items-center gap-1"
            title="Ir a hoy"
          >
            <CalendarDays className="h-3 w-3" />
            Hoy
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors"
          title={translate("nextMonth")}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {WEEKDAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-2",
              i >= 5 ? "text-[var(--text-tertiary)] bg-[var(--surface-0)]/50" : "text-[var(--text-tertiary)]"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isWeekendDay = isWeekend(day);
          const isDragTarget = dragOverDate === dateKey;
          const overflow = dayItems.length > MAX_ITEMS_PER_CELL ? dayItems.length - MAX_ITEMS_PER_CELL : 0;

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[100px] border-b border-r border-[var(--border)] p-1.5 transition-colors cursor-pointer",
                !isCurrentMonth && "bg-[var(--surface-0)]/40",
                isWeekendDay && isCurrentMonth && "bg-[var(--surface-0)]/30",
                isDragTarget && "bg-[var(--accent-subtle)] ring-2 ring-inset ring-orange-300",
              )}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    !isCurrentMonth && "text-[var(--text-tertiary)]",
                    isCurrentMonth && !isTodayDate && "text-[var(--text-secondary)]",
                    isTodayDate && "bg-[var(--accent)] text-white font-bold"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Content items */}
              <div className="space-y-0.5">
                {dayItems.slice(0, MAX_ITEMS_PER_CELL).map((item) => (
                  <ContentChip
                    key={item._id}
                    title={item.title}
                    type={item.type}
                    status={item.status}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", item._id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
                  />
                ))}
                {overflow > 0 && (
                  <div className="text-[10px] text-[var(--text-tertiary)] font-medium pl-1.5">
                    +{overflow} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
