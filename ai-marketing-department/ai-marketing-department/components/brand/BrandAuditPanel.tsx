"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Search,
  Loader2,
  RefreshCw,
  Users,
  UserPlus,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuditStatus = "idle" | "scraping" | "analyzing" | "done" | "error";

interface Props {
  brandProfileId: Id<"brandProfiles">;
  instagramHandle?: string;
  websiteUrl?: string;
}

const priorityConfig = {
  immediate: { color: "bg-red-500", label: "Inmediato", textColor: "text-red-700", bgColor: "bg-red-50" },
  short: { color: "bg-amber-500", label: "Corto plazo", textColor: "text-amber-700", bgColor: "bg-amber-50" },
  medium: { color: "bg-blue-500", label: "Medio plazo", textColor: "text-blue-700", bgColor: "bg-blue-50" },
  long: { color: "bg-green-500", label: "Largo plazo", textColor: "text-green-700", bgColor: "bg-green-50" },
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function BrandAuditPanel({ brandProfileId, instagramHandle, websiteUrl }: Props) {
  const latestAudit = useQuery(api.brandAudit.getLatest, { brandProfileId });
  const analyzeAction = useAction(api.brandAuditAction.analyze);

  const [status, setStatus] = useState<AuditStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    setStatus("scraping");
    setError(null);

    try {
      // Step 1: Scrape data via Next.js API route
      const params = new URLSearchParams();
      if (instagramHandle) params.set("handle", instagramHandle);
      if (websiteUrl) params.set("website", websiteUrl);

      if (!instagramHandle && !websiteUrl) {
        setError("Configura un handle de Instagram o website en tu perfil de marca para poder auditar.");
        setStatus("error");
        return;
      }

      const scrapeRes = await fetch(`/api/brand-audit?${params.toString()}`);
      if (!scrapeRes.ok) {
        const err = await scrapeRes.json();
        throw new Error(err.error || "Error scrapeando datos");
      }
      const scrapeData = await scrapeRes.json();

      if (!scrapeData.combinedContent || scrapeData.combinedContent.length < 20) {
        throw new Error("No se obtuvieron suficientes datos del scrape. Verifica el handle/URL.");
      }

      // Step 2: Send to Claude via Convex action
      setStatus("analyzing");
      await analyzeAction({
        brandProfileId,
        rawContent: scrapeData.combinedContent,
        instagramHandle: instagramHandle || undefined,
        websiteUrl: websiteUrl || undefined,
      });

      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setStatus("error");
    }
  };

  const audit = latestAudit;
  const hasAudit = audit !== null && audit !== undefined;

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-500" />
            Audit de Presencia Digital
          </h3>
          {hasAudit && (
            <p className="text-xs text-stone-400 mt-0.5">
              Ultimo: {formatTimeAgo(audit.createdAt)}
              {audit.tokensUsed && (
                <span className="ml-2 text-stone-500">
                  ({audit.tokensUsed.toLocaleString()} tokens)
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleAudit}
          disabled={status === "scraping" || status === "analyzing"}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            status === "scraping" || status === "analyzing"
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-orange-50 text-orange-600 hover:bg-orange-100"
          )}
        >
          {status === "scraping" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scrapeando Instagram...
            </>
          ) : status === "analyzing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando con IA...
            </>
          ) : hasAudit ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Re-auditar
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Auditar Presencia Digital
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {status === "error" && error && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              onClick={handleAudit}
              className="text-xs font-medium text-red-700 hover:text-red-800 mt-1 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {(status === "scraping" || status === "analyzing") && !hasAudit && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-stone-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-lg bg-stone-100 animate-pulse" />
            <div className="h-32 rounded-lg bg-stone-100 animate-pulse" />
          </div>
        </div>
      )}

      {/* Audit results */}
      {hasAudit && (
        <div className="p-5 space-y-5">
          {/* Summary */}
          <p className="text-sm text-stone-600 leading-relaxed">{audit.summary}</p>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              icon={<Users className="w-4 h-4 text-purple-500" />}
              value={audit.metrics.followers}
              label="Seguidores"
            />
            <MetricCard
              icon={<UserPlus className="w-4 h-4 text-blue-500" />}
              value={audit.metrics.following}
              label="Siguiendo"
            />
            <MetricCard
              icon={<FileText className="w-4 h-4 text-green-500" />}
              value={audit.metrics.posts}
              label="Posts"
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
              value={audit.metrics.engagementNote}
              label="Engagement"
              isNote
            />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Fortalezas
              </h4>
              <div className="space-y-1.5">
                {audit.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-green-50/50 border border-green-100"
                  >
                    <p className="text-sm font-medium text-stone-800">{s.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Debilidades
              </h4>
              <div className="space-y-1.5">
                {audit.weaknesses.map((w, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100"
                  >
                    <p className="text-sm font-medium text-stone-800">{w.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{w.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              Plan de Accion
            </h4>
            <div className="space-y-1.5">
              {audit.actionPlan.map((action, i) => {
                const config = priorityConfig[action.priority] || priorityConfig.medium;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-stone-100 hover:border-stone-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <div className={cn("w-2 h-2 rounded-full", config.color)} />
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", config.bgColor, config.textColor)}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{action.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{action.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      {action.timeframe}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state (no audit yet, idle) */}
      {!hasAudit && status === "idle" && latestAudit === null && (
        <div className="p-8 text-center">
          <Search className="w-8 h-8 mx-auto mb-3 text-stone-400" />
          <p className="text-sm text-stone-500">
            Analiza tu presencia digital con IA
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Scrapeamos tu Instagram y web para generar un audit completo
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
  isNote = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  isNote?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-stone-400">{label}</span>
      </div>
      <p className={cn(
        "font-semibold text-stone-900",
        isNote ? "text-xs leading-relaxed font-medium" : "text-lg"
      )}>
        {value}
      </p>
    </div>
  );
}
