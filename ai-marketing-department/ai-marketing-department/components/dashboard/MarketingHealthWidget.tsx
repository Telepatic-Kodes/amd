"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Target,
  Columns3,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

const TIER_DOT: Record<string, string> = {
  hero: "bg-[var(--accent)]",
  hub: "bg-[var(--badge-blue-text)]",
  hygiene: "bg-[var(--success)]",
};

const FUNNEL_DOT: Record<string, string> = {
  reach: "bg-[var(--badge-blue-text)]",
  act: "bg-[var(--accent)]",
  convert: "bg-[var(--success)]",
  engage: "bg-[var(--badge-purple-text)]",
};

export function MarketingHealthWidget() {
  const content = useQuery(api.functions.listContent, {});
  const phaseProgress = useQuery(api.marketingPhases.getPhaseProgress);

  if (content === undefined || phaseProgress === undefined) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando métricas de marketing...
        </div>
      </div>
    );
  }

  const allContent = content || [];

  // Tier distribution
  const tierCounts = {
    hero: allContent.filter((c: Record<string, unknown>) => c.contentTier === "hero").length,
    hub: allContent.filter((c: Record<string, unknown>) => c.contentTier === "hub").length,
    hygiene: allContent.filter((c: Record<string, unknown>) => c.contentTier === "hygiene").length,
  };
  const tierTotal = tierCounts.hero + tierCounts.hub + tierCounts.hygiene;

  // Funnel distribution
  const funnelCounts = {
    reach: allContent.filter((c: Record<string, unknown>) => c.funnelStage === "reach").length,
    act: allContent.filter((c: Record<string, unknown>) => c.funnelStage === "act").length,
    convert: allContent.filter((c: Record<string, unknown>) => c.funnelStage === "convert").length,
    engage: allContent.filter((c: Record<string, unknown>) => c.funnelStage === "engage").length,
  };
  const funnelTotal = funnelCounts.reach + funnelCounts.act + funnelCounts.convert + funnelCounts.engage;

  // TAYA coverage
  const tayaCounts = {
    cost: allContent.filter((c: Record<string, unknown>) => c.tayaCategory === "cost").length,
    problems: allContent.filter((c: Record<string, unknown>) => c.tayaCategory === "problems").length,
    comparisons: allContent.filter((c: Record<string, unknown>) => c.tayaCategory === "comparisons").length,
    reviews: allContent.filter((c: Record<string, unknown>) => c.tayaCategory === "reviews").length,
    best: allContent.filter((c: Record<string, unknown>) => c.tayaCategory === "best").length,
  };
  const tayaCovered = Object.values(tayaCounts).filter((v) => v > 0).length;

  // Phase progress
  const phasePercent = phaseProgress?.progressPercent ?? 0;
  const phasesCompleted = phaseProgress?.completedCount ?? 0;
  const phasesTotal = phaseProgress?.totalPhases ?? 5;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Salud del Marketing</h3>
        <Link
          href="/strategy"
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium flex items-center gap-1 transition-colors"
        >
          Estrategia
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Phase Progress mini bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Fase de Marketing</span>
            <span className="text-xs font-medium text-[var(--text-primary)]">{phasesCompleted}/{phasesTotal}</span>
          </div>
          <div className="w-full h-2 bg-[var(--surface-1)] rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-[var(--accent)] to-[var(--success)] rounded-full transition-all duration-500"
              style={{ width: `${phasePercent}%` }}
            />
          </div>
        </div>

        {/* Tier Balance */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Columns3 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Balance de Tiers</span>
          </div>
          {tierTotal > 0 ? (
            <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden">
              {(["hero", "hub", "hygiene"] as const).map((tier) => {
                const percent = tierTotal > 0 ? (tierCounts[tier] / tierTotal) * 100 : 0;
                if (percent === 0) return null;
                return (
                  <div
                    key={tier}
                    className={cn("h-full transition-all", TIER_DOT[tier])}
                    style={{ width: `${percent}%` }}
                    title={`${tier}: ${tierCounts[tier]} (${Math.round(percent)}%)`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-3 bg-[var(--surface-1)] rounded-full" />
          )}
          <div className="flex items-center gap-3 mt-1">
            {(["hero", "hub", "hygiene"] as const).map((tier) => (
              <span key={tier} className="flex items-center gap-1 text-[9px] text-[var(--text-secondary)]">
                <span className={cn("w-1.5 h-1.5 rounded-full", TIER_DOT[tier])} />
                {tierCounts[tier]}
              </span>
            ))}
          </div>
        </div>

        {/* Funnel Health */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Funnel RACE</span>
          </div>
          <div className="flex items-center gap-1">
            {(["reach", "act", "convert", "engage"] as const).map((stage) => (
              <div key={stage} className="flex-1">
                <div className="w-full h-6 bg-[var(--surface-1)] rounded relative overflow-hidden">
                  <div
                    className={cn("absolute bottom-0 left-0 right-0 transition-all", FUNNEL_DOT[stage])}
                    style={{
                      height: funnelTotal > 0
                        ? `${Math.max((funnelCounts[stage] / Math.max(...Object.values(funnelCounts), 1)) * 100, funnelCounts[stage] > 0 ? 15 : 0)}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="text-[8px] text-[var(--text-tertiary)] text-center block mt-0.5 capitalize">{stage[0].toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TAYA Coverage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">TAYA</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              tayaCovered === 5 ? "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]"
                : tayaCovered >= 3 ? "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]"
                  : "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]"
            )}>
              {tayaCovered}/5
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(["cost", "problems", "comparisons", "reviews", "best"] as const).map((cat) => (
              <div
                key={cat}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  tayaCounts[cat] > 0 ? "bg-[var(--badge-purple-text)]" : "bg-[var(--surface-1)]"
                )}
                title={`${cat}: ${tayaCounts[cat]}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
