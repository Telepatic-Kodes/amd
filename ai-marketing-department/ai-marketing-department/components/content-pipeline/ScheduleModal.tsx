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
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{translate("schedulePublication")}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-[var(--text-tertiary)] mb-4">{translate("selectDateTime")}</p>

        {/* Date Input */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Fecha</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors font-medium text-sm">
            {translate("cancel")}
          </button>
          <button onClick={handleSchedule} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)] text-white transition-colors font-medium text-sm">
            {translate("schedule")}
          </button>
        </div>
      </div>
    </div>
  );
}
