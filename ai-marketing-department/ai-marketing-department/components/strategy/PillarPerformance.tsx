"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

interface PillarPerformanceProps {
  brandProfileId: Id<"brandProfiles">;
}

const TIER_DOT: Record<string, string> = {
  hero: "bg-orange-500",
  hub: "bg-blue-500",
  hygiene: "bg-green-500",
};

export function PillarPerformance({ brandProfileId }: PillarPerformanceProps) {
  const pillars = useQuery(api.contentPillars.getPillarsByBrand, { brandProfileId });
  const content = useQuery(api.functions.listContent, {});

  if (pillars === undefined || content === undefined) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando rendimiento...
      </div>
    );
  }

  const activePillars = pillars?.filter((p) => p.status === "active") || [];

  if (activePillars.length === 0) {
    return null;
  }

  // Calculate metrics per pillar
  const pillarMetrics = activePillars.map((pillar) => {
    const pillarContent = (content || []).filter(
      (c: Record<string, unknown>) => c.pillarId === pillar._id
    );

    const totalCount = pillarContent.length;
    const publishedCount = pillarContent.filter(
      (c: Record<string, unknown>) => c.status === "published"
    ).length;
    const draftCount = pillarContent.filter(
      (c: Record<string, unknown>) => c.status === "draft"
    ).length;
    const publicationRate = totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0;

    // Tier distribution within this pillar
    const tierCounts = {
      hero: pillarContent.filter((c: Record<string, unknown>) => c.contentTier === "hero").length,
      hub: pillarContent.filter((c: Record<string, unknown>) => c.contentTier === "hub").length,
      hygiene: pillarContent.filter((c: Record<string, unknown>) => c.contentTier === "hygiene").length,
    };

    return {
      ...pillar,
      totalCount,
      publishedCount,
      draftCount,
      publicationRate,
      tierCounts,
    };
  });

  // Sort by performance score (descending), then by content count
  const sorted = [...pillarMetrics].sort((a, b) => {
    const scoreA = a.performanceScore ?? 0;
    const scoreB = b.performanceScore ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.totalCount - a.totalCount;
  });

  const avgScore = sorted.reduce((s, p) => s + (p.performanceScore ?? 0), 0) / (sorted.length || 1);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-600" />
          Rendimiento por Pilar
        </h3>
        <span className="text-xs text-stone-500">
          Promedio: <span className="font-medium">{Math.round(avgScore)}</span>
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((pillar) => {
          const score = pillar.performanceScore ?? 0;
          const isAboveAvg = score > avgScore;
          const isBelowAvg = score > 0 && score < avgScore * 0.7;

          return (
            <div
              key={pillar._id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                isBelowAvg
                  ? "border-red-200 bg-red-50/50"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-stone-900 flex items-center gap-2">
                  {pillar.name}
                  {isAboveAvg && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {isBelowAvg && <TrendingDown className="w-3 h-3 text-red-500" />}
                  {!isAboveAvg && !isBelowAvg && score > 0 && <Minus className="w-3 h-3 text-stone-400" />}
                </h4>
                {score > 0 && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      score >= 70
                        ? "bg-green-100 text-green-700"
                        : score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    )}
                  >
                    {score}
                  </span>
                )}
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 text-[10px] text-stone-500">
                <span>
                  <span className="font-medium text-stone-700">{pillar.totalCount}</span> contenidos
                </span>
                <span>
                  <span className="font-medium text-stone-700">{pillar.publishedCount}</span> publicados
                </span>
                <span>
                  Tasa: <span className="font-medium text-stone-700">{pillar.publicationRate}%</span>
                </span>
              </div>

              {/* Tier mini distribution */}
              {pillar.totalCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {(["hero", "hub", "hygiene"] as const).map((tier) => {
                    const count = pillar.tierCounts[tier];
                    if (count === 0) return null;
                    return (
                      <div key={tier} className="flex items-center gap-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full", TIER_DOT[tier])} />
                        <span className="text-[9px] text-stone-500">
                          {count} {tier}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
