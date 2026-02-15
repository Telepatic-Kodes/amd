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
  ChevronDown,
  ChevronUp,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
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

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4 text-pink-500" />,
  linkedin: <Linkedin className="w-4 h-4 text-blue-600" />,
  twitter: <Twitter className="w-4 h-4 text-sky-500" />,
  website: <Globe className="w-4 h-4 text-green-500" />,
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  website: "Website",
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

export function BrandAuditPanel({ brandProfileId, instagramHandle: defaultIgHandle, websiteUrl: defaultWebsite }: Props) {
  const latestAudit = useQuery(api.brandAudit.getLatest, { brandProfileId });
  const analyzeAction = useAction(api.brandAuditAction.analyze);

  const [status, setStatus] = useState<AuditStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showInputs, setShowInputs] = useState(false);
  const [showPlatformDetails, setShowPlatformDetails] = useState(false);

  // B6: Multi-platform input state
  const [igHandle, setIgHandle] = useState(defaultIgHandle || "");
  const [linkedinHandle, setLinkedinHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [webUrl, setWebUrl] = useState(defaultWebsite || "");

  const handleAudit = async () => {
    setStatus("scraping");
    setError(null);

    const hasAnySource = igHandle.trim() || linkedinHandle.trim() || twitterHandle.trim() || webUrl.trim();

    if (!hasAnySource) {
      setError("Configura al menos una plataforma (Instagram, LinkedIn, Twitter o Website) para poder auditar.");
      setStatus("error");
      return;
    }

    try {
      // Step 1: Scrape data via Next.js API route (Instagram + Website)
      const params = new URLSearchParams();
      if (igHandle.trim()) params.set("handle", igHandle.trim());
      if (webUrl.trim()) params.set("website", webUrl.trim());

      let combinedContent = "";

      // Only call scrape API if we have Instagram or website
      if (igHandle.trim() || webUrl.trim()) {
        const scrapeRes = await fetch(`/api/brand-audit?${params.toString()}`);
        if (!scrapeRes.ok) {
          const err = await scrapeRes.json();
          throw new Error(err.error || "Error scrapeando datos");
        }
        const scrapeData = await scrapeRes.json();
        combinedContent = scrapeData.combinedContent || "";
      }

      // B6: Add LinkedIn context if provided (no scraping, just handle reference for AI)
      if (linkedinHandle.trim()) {
        combinedContent += `\n\n=== LINKEDIN DATA ===\nLinkedIn Company Page: ${linkedinHandle.trim()}\nNote: LinkedIn data is reference-only. Analyze based on the handle and general LinkedIn best practices for this industry.`;
      }

      // B6: Add Twitter context if provided
      if (twitterHandle.trim()) {
        let twitterUser = twitterHandle.trim();
        if (twitterUser.startsWith("@")) twitterUser = twitterUser.slice(1);
        combinedContent += `\n\n=== TWITTER/X DATA ===\nTwitter Handle: @${twitterUser}\nNote: Twitter data is reference-only. Analyze based on the handle and general Twitter/X best practices for this industry.`;
      }

      if (!combinedContent || combinedContent.length < 20) {
        throw new Error("No se obtuvieron suficientes datos. Verifica los handles/URLs.");
      }

      // Step 2: Send to Claude via Convex action
      setStatus("analyzing");
      await analyzeAction({
        brandProfileId,
        rawContent: combinedContent,
        instagramHandle: igHandle.trim() || undefined,
        websiteUrl: webUrl.trim() || undefined,
        linkedinHandle: linkedinHandle.trim() || undefined,
        twitterHandle: twitterHandle.trim() || undefined,
      });

      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setStatus("error");
    }
  };

  const audit = latestAudit;
  const hasAudit = audit !== null && audit !== undefined;

  // B6: Extract platform metrics from audit
  const auditPlatformMetrics = hasAudit
    ? (audit.platformMetrics as Record<string, {
        followers?: string;
        following?: string;
        connections?: string;
        posts?: string;
        tweets?: string;
        engagementNote?: string;
        score?: number;
        highlights?: string[];
      }> | undefined)
    : undefined;

  const auditedPlatforms = hasAudit ? (audit.platforms as string[] | undefined) : undefined;

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-500" />
            Audit de Presencia Digital
            {auditedPlatforms && auditedPlatforms.length > 0 && (
              <span className="flex items-center gap-1 ml-1">
                {auditedPlatforms.map((p) => (
                  <span key={p} title={platformLabels[p] || p}>
                    {platformIcons[p]}
                  </span>
                ))}
              </span>
            )}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInputs(!showInputs)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-50 transition border border-stone-200"
          >
            {showInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Plataformas
          </button>
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
                Scrapeando...
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
                Auditar
              </>
            )}
          </button>
        </div>
      </div>

      {/* B6: Multi-platform input fields */}
      {showInputs && (
        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-500 flex items-center gap-1.5 mb-1">
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                Instagram
              </label>
              <input
                type="text"
                placeholder="@tu_cuenta"
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 flex items-center gap-1.5 mb-1">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                LinkedIn (URL de empresa)
              </label>
              <input
                type="text"
                placeholder="https://linkedin.com/company/..."
                value={linkedinHandle}
                onChange={(e) => setLinkedinHandle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 flex items-center gap-1.5 mb-1">
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                Twitter/X
              </label>
              <input
                type="text"
                placeholder="@tu_cuenta"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-green-500" />
                Website
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-stone-300"
              />
            </div>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Selecciona las plataformas a auditar. Instagram y Website se scrapean directamente; LinkedIn y Twitter se analizan por referencia.
          </p>
        </div>
      )}

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

          {/* Overall Metrics row */}
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

          {/* B6: Per-platform metrics (collapsible) */}
          {auditPlatformMetrics && Object.keys(auditPlatformMetrics).length > 0 && (
            <div className="border border-stone-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPlatformDetails(!showPlatformDetails)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-stone-600 uppercase tracking-wider bg-stone-50/50 hover:bg-stone-50 transition"
              >
                <span className="flex items-center gap-1.5">
                  Detalle por Plataforma
                  <span className="text-stone-400 normal-case font-normal">
                    ({Object.keys(auditPlatformMetrics).length} plataformas)
                  </span>
                </span>
                {showPlatformDetails ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>
              {showPlatformDetails && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(auditPlatformMetrics).map(([platform, data]) => (
                    <PlatformMetricCard
                      key={platform}
                      platform={platform}
                      data={data}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
            Scrapeamos tu Instagram y web, y analizamos LinkedIn y Twitter para un audit multi-plataforma
          </p>
          <button
            onClick={() => setShowInputs(true)}
            className="mt-3 text-xs font-medium text-orange-600 hover:text-orange-700 underline"
          >
            Configurar plataformas
          </button>
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

// B6: Per-platform metric card component
function PlatformMetricCard({
  platform,
  data,
}: {
  platform: string;
  data: {
    followers?: string;
    following?: string;
    connections?: string;
    posts?: string;
    tweets?: string;
    engagementNote?: string;
    score?: number;
    highlights?: string[];
  };
}) {
  const icon = platformIcons[platform] || <Globe className="w-4 h-4 text-stone-400" />;
  const label = platformLabels[platform] || platform;
  const score = data.score ?? 0;

  const scoreColor =
    score >= 70 ? "text-green-600 bg-green-50" :
    score >= 40 ? "text-amber-600 bg-amber-50" :
    "text-red-600 bg-red-50";

  return (
    <div className="p-3 rounded-lg border border-stone-100 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-stone-800">{label}</span>
        </div>
        {score > 0 && (
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", scoreColor)}>
            {score}/100
          </span>
        )}
      </div>

      {/* Platform-specific stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {data.followers && data.followers !== "N/A" && (
          <div>
            <p className="text-[10px] text-stone-400">Seguidores</p>
            <p className="text-xs font-semibold text-stone-700">{data.followers}</p>
          </div>
        )}
        {data.following && data.following !== "N/A" && (
          <div>
            <p className="text-[10px] text-stone-400">Siguiendo</p>
            <p className="text-xs font-semibold text-stone-700">{data.following}</p>
          </div>
        )}
        {data.connections && data.connections !== "N/A" && (
          <div>
            <p className="text-[10px] text-stone-400">Conexiones</p>
            <p className="text-xs font-semibold text-stone-700">{data.connections}</p>
          </div>
        )}
        {data.posts && data.posts !== "N/A" && (
          <div>
            <p className="text-[10px] text-stone-400">Posts</p>
            <p className="text-xs font-semibold text-stone-700">{data.posts}</p>
          </div>
        )}
        {data.tweets && data.tweets !== "N/A" && (
          <div>
            <p className="text-[10px] text-stone-400">Tweets</p>
            <p className="text-xs font-semibold text-stone-700">{data.tweets}</p>
          </div>
        )}
      </div>

      {/* Engagement note */}
      {data.engagementNote && (
        <p className="text-[11px] text-stone-500 mb-2">{data.engagementNote}</p>
      )}

      {/* Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="space-y-1">
          {data.highlights.map((h, i) => (
            <p key={i} className="text-[11px] text-stone-500 flex items-start gap-1">
              <span className="text-stone-300 mt-px shrink-0">-</span>
              {h}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
