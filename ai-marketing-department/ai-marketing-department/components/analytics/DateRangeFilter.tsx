"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRange {
  startDate: number;
  endDate: number;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetKey = "7d" | "30d" | "90d" | "custom";

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const presets: Record<PresetKey, { label: string; days: number }> = {
    "7d": { label: "7 dias", days: 7 },
    "30d": { label: "30 dias", days: 30 },
    "90d": { label: "90 dias", days: 90 },
    custom: { label: "Personalizado", days: 0 },
  };

  const handlePresetClick = (key: PresetKey) => {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    const days = presets[key].days;
    const endDate = Date.now();
    const startDate = endDate - days * 24 * 60 * 60 * 1000;

    onChange({
      startDate,
      endDate,
      label: presets[key].label,
    });
  };

  const handleCustomDateChange = () => {
    if (!customStart || !customEnd) return;

    const startDate = new Date(customStart).getTime();
    const endDate = new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1; // End of day

    onChange({
      startDate,
      endDate,
      label: "Personalizado",
    });
  };

  const isActive = (key: PresetKey): boolean => {
    if (key === "custom") {
      return value.label === "Personalizado" && showCustom;
    }
    return value.label === presets[key].label;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(presets) as PresetKey[]).map((key) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              "border border-stone-200 hover:border-stone-300",
              isActive(key)
                ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/30"
                : "bg-stone-100 text-stone-300 hover:bg-stone-200"
            )}
          >
            {key === "custom" && <Calendar className="inline-block w-3.5 h-3.5 mr-1.5" />}
            {presets[key].label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg bg-stone-100/50 border border-stone-200">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-stone-500 font-medium">Fecha inicial</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                if (customEnd) {
                  setTimeout(() => handleCustomDateChange(), 50);
                }
              }}
              className="px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-stone-500 font-medium">Fecha final</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                if (customStart) {
                  setTimeout(() => handleCustomDateChange(), 50);
                }
              }}
              className="px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
