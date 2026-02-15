"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Zap, ZapOff } from "lucide-react";
import { setQuickModePreference } from "@/lib/guidance-state";

export function QuickModeToggle() {
  const setupProgress = useQuery(api.guidance.getSetupProgress);
  const toggleQuickMode = useMutation(api.guidance.toggleQuickMode);

  if (!setupProgress) return null;

  // Only show after 3+ onboarding completions
  if (setupProgress.onboardingCompletions < 3) return null;

  const { quickModeEnabled } = setupProgress;

  const handleToggle = async () => {
    const newValue = !quickModeEnabled;
    setQuickModePreference(newValue);
    await toggleQuickMode({ enabled: newValue });
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-1)]/50 border border-[var(--border)]">
      <div className="flex items-center gap-3">
        {quickModeEnabled ? (
          <Zap className="w-4 h-4 text-amber-400" />
        ) : (
          <ZapOff className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Modo Express</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {quickModeEnabled
              ? "Configuración rápida activada"
              : "Activa para omitir explicaciones"}
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={quickModeEnabled}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[var(--surface-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--card-bg)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
      </label>
    </div>
  );
}
