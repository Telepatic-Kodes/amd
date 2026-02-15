"use client";

import { cn } from "@/lib/utils";

interface SectionScore {
  name: string;
  score: number;
  weight: number;
  weighted: number;
}

interface Props {
  score: number;
  level: "empty" | "partial" | "complete" | "enriched";
  breakdown: SectionScore[];
}

const levelLabels: Record<string, { label: string; color: string }> = {
  empty: { label: "Vacía", color: "text-red-400" },
  partial: { label: "Parcial", color: "text-yellow-400" },
  complete: { label: "Completa", color: "text-green-400" },
  enriched: { label: "Enriquecida", color: "text-orange-400" },
};

const sectionLabels: Record<string, string> = {
  basics: "Info",
  voice: "Voz",
  audience: "Audiencia",
  strategy: "Estrategia",
  competitors: "Competencia",
  visual: "Visual",
  sources: "Fuentes",
};

function getBarColor(score: number): string {
  if (score >= 80) return "bg-orange-500";
  if (score >= 60) return "bg-green-500";
  if (score >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

function getDotColor(score: number): string {
  if (score >= 75) return "bg-green-400";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-stone-300";
}

export function BrandMaturityBar({ score, level, breakdown }: Props) {
  const levelConfig = levelLabels[level] || levelLabels.empty;

  return (
    <div className="space-y-3">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-stone-900">{score}</span>
          <span className="text-stone-400 text-sm">/100</span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
              level === "empty" && "bg-red-500/10 border-red-500/20 text-red-400",
              level === "partial" && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
              level === "complete" && "bg-green-500/10 border-green-500/20 text-green-400",
              level === "enriched" && "bg-orange-500/10 border-orange-500/20 text-orange-400"
            )}
          >
            {levelConfig.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(score))}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>

      {/* Section dots */}
      <div className="flex items-center gap-1.5">
        {breakdown.map((section) => (
          <div key={section.name} className="flex-1 group relative">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn("w-full h-1.5 rounded-full transition-colors", getDotColor(section.score))}
              />
              <span className="text-[10px] text-stone-400 group-hover:text-stone-500 transition-colors truncate">
                {sectionLabels[section.name] || section.name}
              </span>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-stone-100 border border-stone-300 text-xs text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {sectionLabels[section.name]}: {section.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
