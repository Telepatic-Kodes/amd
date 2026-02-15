"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceBadgeProps {
  score: number | null;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function ComplianceBadge({ score, size = "sm", showLabel, className }: ComplianceBadgeProps) {
  if (score === null) return null;

  const isGood = score >= 80;
  const isWarning = score >= 50 && score < 80;

  const Icon = isGood ? CheckCircle2 : isWarning ? AlertTriangle : XCircle;
  const label = isGood ? "Aprobado" : isWarning ? "Revisar" : "Alerta";
  const colorClass = isGood
    ? "text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]"
    : isWarning
      ? "text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]"
      : "text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]";

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        colorClass,
        className
      )}
      title={`Brand compliance: ${score}% — ${label}`}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{score}%</span>}
    </div>
  );
}
