"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Columns3, Target, BarChart3, Loader2, Hash } from "lucide-react";

const TAYA_LABELS: Record<string, { label: string; color: string }> = {
  cost: { label: "Costos", color: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-[var(--badge-green-bg)]" },
  problems: { label: "Problemas", color: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border-[var(--badge-red-bg)]" },
  comparisons: { label: "Comparaciones", color: "bg-blue-50 text-blue-700 border-blue-200" },
  reviews: { label: "Reviews", color: "bg-purple-50 text-purple-700 border-purple-200" },
  best: { label: "Best-of", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const FUNNEL_LABELS: Record<string, { label: string; color: string }> = {
  reach: { label: "Reach", color: "text-sky-600" },
  act: { label: "Act", color: "text-[var(--accent)]" },
  convert: { label: "Convert", color: "text-[var(--success)]" },
  engage: { label: "Engage", color: "text-purple-600" },
};

const TIER_COLORS: Record<string, string> = {
  hero: "bg-[var(--accent)]",
  hub: "bg-blue-500",
  hygiene: "bg-green-500",
};

// Channel color map for strategy-derived pillars
const CHANNEL_COLORS: Record<string, string> = {
  Blog: "bg-blue-50 text-blue-700 border-blue-200",
  LinkedIn: "bg-sky-50 text-sky-700 border-sky-200",
  Instagram: "bg-pink-50 text-pink-700 border-pink-200",
  Twitter: "bg-cyan-50 text-cyan-700 border-cyan-200",
  YouTube: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border-[var(--badge-red-bg)]",
  Facebook: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Newsletter: "bg-amber-50 text-amber-700 border-amber-200",
  Email: "bg-amber-50 text-amber-700 border-amber-200",
  TikTok: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

interface StrategyPillar {
  name: string;
  description: string;
  channels: string[];
}

interface ContentPillarsPanelProps {
  brandProfileId: Id<"brandProfiles">;
  /** Fallback pillars from strategy document when contentPillars table is empty */
  strategyPillars?: StrategyPillar[];
}

export function ContentPillarsPanel({ brandProfileId, strategyPillars }: ContentPillarsPanelProps) {
  const pillars = useQuery(api.contentPillars.getPillarsByBrand, { brandProfileId });

  if (pillars === undefined) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando pilares...
        </div>
      </div>
    );
  }

  const activePillars = pillars?.filter((p) => p.status === "active") || [];

  // If contentPillars table has data, show those
  if (activePillars.length > 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <div className="p-1 rounded-md bg-[var(--surface-1)]">
              <Columns3 className="w-3.5 h-3.5 text-orange-500" />
            </div>
            Pilares de Contenido
          </h3>
          <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-2 py-0.5 rounded-full">
            {activePillars.length} pilares
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activePillars.map((pillar) => (
            <div
              key={pillar._id}
              className="relative rounded-lg border border-[var(--border)] p-4 hover:border-orange-200 transition-colors"
            >
              {/* Score accent */}
              {pillar.performanceScore !== undefined && pillar.performanceScore > 0 && (
                <div className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-r",
                  pillar.performanceScore >= 70 ? "bg-emerald-500" :
                  pillar.performanceScore >= 40 ? "bg-amber-500" : "bg-red-500"
                )} />
              )}

              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{pillar.name}</h4>
                {pillar.performanceScore !== undefined && pillar.performanceScore > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <BarChart3 className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className={cn(
                      "font-medium",
                      pillar.performanceScore >= 70 ? "text-[var(--success)]" :
                      pillar.performanceScore >= 40 ? "text-amber-600" : "text-red-600"
                    )}>
                      {pillar.performanceScore}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{pillar.description}</p>

              {pillar.tayaCategories && pillar.tayaCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {pillar.tayaCategories.map((cat) => {
                    const taya = TAYA_LABELS[cat];
                    return taya ? (
                      <span key={cat} className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", taya.color)}>
                        {taya.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {pillar.funnelStages && pillar.funnelStages.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-3 h-3 text-[var(--text-tertiary)]" />
                  {pillar.funnelStages.map((stage) => {
                    const funnel = FUNNEL_LABELS[stage];
                    return funnel ? (
                      <span key={stage} className={cn("text-[10px] font-semibold", funnel.color)}>
                        {funnel.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {pillar.contentTiers && pillar.contentTiers.length > 0 && (
                <div className="flex items-center gap-1">
                  {pillar.contentTiers.map((tier) => (
                    <div key={tier} className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", TIER_COLORS[tier])} />
                      <span className="text-[9px] text-[var(--text-tertiary)] capitalize">{tier}</span>
                    </div>
                  ))}
                </div>
              )}

              {pillar.contentCount !== undefined && pillar.contentCount > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {pillar.contentCount} contenidos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: show strategy-derived pillars if available
  if (strategyPillars && strategyPillars.length > 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <div className="p-1 rounded-md bg-[var(--surface-1)]">
              <Columns3 className="w-3.5 h-3.5 text-orange-500" />
            </div>
            Pilares de Contenido
          </h3>
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 bg-[var(--surface-1)] px-2 py-0.5 rounded-full">
            <Hash className="w-3 h-3" />
            Desde estrategia · {strategyPillars.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strategyPillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-lg border border-[var(--border)] p-4 hover:border-orange-200 transition-colors"
            >
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{pillar.name}</h4>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2.5">{pillar.description}</p>
              <div className="flex flex-wrap gap-1">
                {pillar.channels.map((ch) => (
                  <span
                    key={ch}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-medium border",
                      CHANNEL_COLORS[ch] || "bg-[var(--surface-1)] text-[var(--text-secondary)] border-[var(--border)]"
                    )}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No data at all
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] mx-auto mb-3 flex items-center justify-center">
        <Columns3 className="w-6 h-6 text-[var(--accent)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Sin pilares de contenido</p>
      <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
        Genera una estrategia para crear pilares automáticamente
      </p>
    </div>
  );
}
