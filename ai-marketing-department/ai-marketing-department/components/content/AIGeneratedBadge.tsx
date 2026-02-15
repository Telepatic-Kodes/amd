"use client";

import { Sparkles } from "lucide-react";

interface AIGeneratedBadgeProps {
  className?: string;
}

export function AIGeneratedBadge({ className }: AIGeneratedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--accent-subtle)] border border-orange-200 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)] ${className || ""}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      IA
    </span>
  );
}
