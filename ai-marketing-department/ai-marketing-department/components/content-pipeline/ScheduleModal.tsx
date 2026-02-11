"use client";

import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Calendar, X } from "lucide-react";
import { translate } from "@/lib/language";

interface ScheduleModalProps {
  contentId: Id<"content"> | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (contentId: Id<"content">, scheduledFor: number) => void;
}

export function ScheduleModal({ contentId, isOpen, onClose, onSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !contentId) return null;

  const handleSchedule = () => {
    setError("");

    if (!date || !time) {
      setError("Fecha y hora son requeridos");
      return;
    }

    const timestamp = new Date(`${date}T${time}`).getTime();
    if (timestamp <= Date.now()) {
      setError("La fecha debe ser futura");
      return;
    }

    onSchedule(contentId, timestamp);
    setDate("");
    setTime("");
    onClose();
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-stone-900">{translate("schedulePublication")}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-stone-400 mb-4">{translate("selectDateTime")}</p>

        {/* Date Input */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Fecha</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-200 transition-colors font-medium text-sm">
            {translate("cancel")}
          </button>
          <button onClick={handleSchedule} className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors font-medium text-sm">
            {translate("schedule")}
          </button>
        </div>
      </div>
    </div>
  );
}
