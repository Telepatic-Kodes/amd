"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Columns3, Target, BarChart3, Loader2 } from "lucide-react";

const TAYA_LABELS: Record<string, { label: string; color: string }> = {
  cost: { label: "Costos", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  problems: { label: "Problemas", color: "bg-red-50 text-red-700 border-red-200" },
  comparisons: { label: "Comparaciones", color: "bg-blue-50 text-blue-700 border-blue-200" },
  reviews: { label: "Reviews", color: "bg-purple-50 text-purple-700 border-purple-200" },
  best: { label: "Best-of", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const FUNNEL_LABELS: Record<string, { label: string; color: string }> = {
  reach: { label: "Reach", color: "text-sky-600" },
  act: { label: "Act", color: "text-orange-600" },
  convert: { label: "Convert", color: "text-green-600" },
  engage: { label: "Engage", color: "text-purple-600" },
};

const TIER_COLORS: Record<string, string> = {
  hero: "bg-orange-500",
  hub: "bg-blue-500",
  hygiene: "bg-green-500",
};

interface ContentPillarsPanelProps {
  brandProfileId: Id<"brandProfiles">;
}

export function ContentPillarsPanel({ brandProfileId }: ContentPillarsPanelProps) {
  const pillars = useQuery(api.contentPillars.getPillarsByBrand, { brandProfileId });

  if (pillars === undefined) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando pilares...
      </div>
    );
  }

  if (!pillars || pillars.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
        <Columns3 className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-sm text-stone-500">Sin pilares de contenido</p>
        <p className="text-xs text-stone-400 mt-1">
          Genera una estrategia para crear pilares automáticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-orange-600" />
          Pilares de Contenido
        </h3>
        <span className="text-xs text-stone-500">{pillars.length} pilares</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pillars.filter((p) => p.status === "active").map((pillar) => (
          <div
            key={pillar._id}
            className="rounded-lg border border-stone-200 bg-white p-4 hover:border-orange-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-stone-900">{pillar.name}</h4>
              {pillar.performanceScore !== undefined && pillar.performanceScore > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <BarChart3 className="w-3 h-3 text-stone-400" />
                  <span className={cn(
                    "font-medium",
                    pillar.performanceScore >= 70 ? "text-green-600" :
                    pillar.performanceScore >= 40 ? "text-amber-600" : "text-red-600"
                  )}>
                    {pillar.performanceScore}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-500 line-clamp-2 mb-3">{pillar.description}</p>

            {/* TAYA tags */}
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

            {/* Funnel indicators */}
            {pillar.funnelStages && pillar.funnelStages.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3 h-3 text-stone-400" />
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

            {/* Tier mini-bar */}
            {pillar.contentTiers && pillar.contentTiers.length > 0 && (
              <div className="flex items-center gap-1">
                {pillar.contentTiers.map((tier) => (
                  <div key={tier} className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", TIER_COLORS[tier])} />
                    <span className="text-[9px] text-stone-500 capitalize">{tier}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Content count */}
            {pillar.contentCount !== undefined && pillar.contentCount > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <span className="text-[10px] text-stone-400">
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
