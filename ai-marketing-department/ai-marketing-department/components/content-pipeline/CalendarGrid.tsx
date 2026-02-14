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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeColors, typeIcons } from "@/lib/contentTypes";
import { FileText } from "lucide-react";
import { translate } from "@/lib/language";

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
  hero: "bg-orange-100 text-orange-700 border-l-2 border-l-orange-500",
  hub: "bg-blue-100 text-blue-700 border-l-2 border-l-blue-500",
  hygiene: "bg-green-100 text-green-700 border-l-2 border-l-green-500",
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
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Header: Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          title={translate("prevMonth")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-stone-900 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          title={translate("nextMonth")}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-stone-200">
        {WEEKDAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-2",
              i >= 5 ? "text-stone-400 bg-stone-50/50" : "text-stone-500"
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
                "min-h-[100px] border-b border-r border-stone-100 p-1.5 transition-colors cursor-pointer",
                !isCurrentMonth && "bg-stone-50/40",
                isWeekendDay && isCurrentMonth && "bg-stone-50/30",
                isDragTarget && "bg-orange-50 ring-2 ring-inset ring-orange-300",
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
                    !isCurrentMonth && "text-stone-300",
                    isCurrentMonth && !isTodayDate && "text-stone-600",
                    isTodayDate && "bg-orange-500 text-white font-bold"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Content items */}
              <div className="space-y-0.5">
                {dayItems.slice(0, MAX_ITEMS_PER_CELL).map((item) => {
                  const TypeIcon = typeIcons[item.type] || FileText;
                  // Use tier color if available, fallback to type color
                  const tierStyle = item.contentTier ? TIER_COLORS[item.contentTier] : undefined;
                  return (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/plain", item._id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity",
                        tierStyle || typeColors[item.type] || "bg-stone-100 text-stone-600"
                      )}
                      title={`${item.title}${item.contentTier ? ` [${item.contentTier.toUpperCase()}]` : ""}${item.pillarName ? ` — ${item.pillarName}` : ""}`}
                    >
                      <TypeIcon className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="text-[10px] text-stone-400 font-medium pl-1.5">
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
