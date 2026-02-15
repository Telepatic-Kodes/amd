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
  hero: "bg-[var(--accent)]",
  hub: "bg-blue-500",
  hygiene: "bg-green-500",
};

export function PillarPerformance({ brandProfileId }: PillarPerformanceProps) {
  const pillars = useQuery(api.contentPillars.getPillarsByBrand, { brandProfileId });
  const content = useQuery(api.functions.listContent, {});

  if (pillars === undefined || content === undefined) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando rendimiento...
        </div>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1 rounded-md bg-[var(--surface-1)]">
            <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          </div>
          Rendimiento por Pilar
        </h3>
        <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-2 py-0.5 rounded-full">
          Promedio: {Math.round(avgScore)}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((pillar) => {
          const score = pillar.performanceScore ?? 0;
          const isAboveAvg = score > avgScore;
          const isBelowAvg = score > 0 && score < avgScore * 0.7;

          return (
            <div
              key={pillar._id}
              className={cn(
                "relative rounded-lg border p-3 transition-all",
                isBelowAvg
                  ? "border-[var(--badge-red-bg)] bg-[var(--badge-red-bg)]/30"
                  : "border-[var(--border)] hover:border-orange-200"
              )}
            >
              {/* Color accent */}
              {score > 0 && (
                <div className={cn(
                  "absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r",
                  score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
                )} />
              )}

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  {pillar.name}
                  {isAboveAvg && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                  {isBelowAvg && <TrendingDown className="w-3 h-3 text-[var(--error)]" />}
                  {!isAboveAvg && !isBelowAvg && score > 0 && <Minus className="w-3 h-3 text-[var(--text-tertiary)]" />}
                </h4>
                {score > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      score >= 70
                        ? "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]"
                        : score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]"
                    )}
                  >
                    {score}
                  </span>
                )}
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 text-[10px] text-[var(--text-tertiary)]">
                <span>
                  <span className="font-medium text-[var(--text-secondary)]">{pillar.totalCount}</span> contenidos
                </span>
                <span>
                  <span className="font-medium text-[var(--text-secondary)]">{pillar.publishedCount}</span> publicados
                </span>
                <span>
                  Tasa: <span className="font-medium text-[var(--text-secondary)]">{pillar.publicationRate}%</span>
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
                        <span className="text-[9px] text-[var(--text-tertiary)]">
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
