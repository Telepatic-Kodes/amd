"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface ContentItem {
  _id: string;
  contentId?: string;
  title: string;
  type: string;
  status: string;
}

interface ContentPipelineProps {
  counts?: {
    draft: number;
    review: number;
    approved: number;
    scheduled: number;
    published: number;
  };
  contentItems?: ContentItem[];
}

const stages = [
  { key: "draft", label: "Borrador", color: "#5c5c5e" },
  { key: "review", label: "Revision", color: "#F5A623" },
  { key: "approved", label: "Aprobado", color: "#5B6AE8" },
  { key: "scheduled", label: "Programado", color: "#8b5cf6" },
  { key: "published", label: "Publicado", color: "#2FCC71" },
] as const;

const typeLabels: Record<string, string> = {
  blog: "Blog",
  social_linkedin: "LinkedIn",
  social_twitter: "Twitter",
  social_instagram: "Instagram",
  social_tiktok: "TikTok",
  email: "Email",
  newsletter: "Newsletter",
  ad_copy: "Ad Copy",
  landing_page: "Landing",
  whitepaper: "Whitepaper",
  case_study: "Case Study",
  video_script: "Video",
};

export function ContentPipeline({ counts, contentItems }: ContentPipelineProps) {
  const router = useRouter();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  if (!counts) return <ContentPipelineSkeleton />;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Group content items by status
  const itemsByStatus: Record<string, ContentItem[]> = {};
  if (contentItems) {
    for (const item of contentItems) {
      const status = item.status as string;
      if (!itemsByStatus[status]) itemsByStatus[status] = [];
      itemsByStatus[status].push(item);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Pipeline de Contenido
      </h3>

      <div className="rounded-xl bg-[var(--surface-1)] p-5 space-y-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-5 w-5 text-[var(--text-tertiary)] mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">Sin contenido en pipeline</p>
          </div>
        ) : (
          <>
            {/* Horizontal funnel bar */}
            <div className="flex h-8 rounded-lg overflow-hidden bg-[var(--surface-2)]">
              {stages.map((stage) => {
                const count = counts[stage.key] ?? 0;
                if (count === 0) return null;
                const pct = (count / total) * 100;
                const isExpanded = expandedStage === stage.key;

                return (
                  <button
                    key={stage.key}
                    onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                    className="relative h-full flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: stage.color,
                      minWidth: count > 0 ? "28px" : undefined,
                    }}
                    title={`${stage.label}: ${count}`}
                  >
                    {pct >= 12 && (
                      <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Funnel legend */}
            <div className="flex items-center gap-3 flex-wrap">
              {stages.map((stage) => {
                const count = counts[stage.key] ?? 0;
                const isExpanded = expandedStage === stage.key;

                return (
                  <button
                    key={stage.key}
                    onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] transition-colors",
                      isExpanded
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <span
                      className="shrink-0 h-2 w-2 rounded-sm"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.label}</span>
                    <span className="tabular-nums font-medium">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded items */}
            {expandedStage && (itemsByStatus[expandedStage]?.length ?? 0) > 0 && (
              <div className="border-t border-white/[0.04] pt-3 space-y-1">
                {itemsByStatus[expandedStage]!.slice(0, 4).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => router.push(`/content?status=${expandedStage}`)}
                    className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-white/[0.03] transition-colors group"
                  >
                    <span className="text-xs text-[var(--text-secondary)] truncate flex-1 group-hover:text-[var(--text-primary)] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                      {typeLabels[item.type] || item.type}
                    </span>
                  </button>
                ))}
                {(itemsByStatus[expandedStage]?.length ?? 0) > 4 && (
                  <button
                    onClick={() => router.push(`/content?status=${expandedStage}`)}
                    className="w-full text-center py-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    +{(itemsByStatus[expandedStage]?.length ?? 0) - 4} mas →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ContentPipelineSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-36 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="rounded-xl bg-[var(--surface-1)] p-5 space-y-4">
        <div className="h-8 rounded-lg bg-[var(--surface-2)] animate-pulse" />
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-14 rounded bg-[var(--surface-3)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
