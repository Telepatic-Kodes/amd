"use client";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

interface PipelineStatsProps {
  counts: {
    draft: number;
    review: number;
    revision_needed: number;
    approved: number;
    scheduled: number;
    published: number;
    archived: number;
    total: number;
  } | undefined;
}

const statConfig = [
  { key: "draft", label: "draftColumn", bg: "bg-[var(--surface-1)] text-[var(--text-tertiary)]" },
  { key: "review", label: "reviewColumn", bg: "bg-yellow-400/10 text-yellow-400" },
  { key: "revision_needed", label: "revisionColumn", bg: "bg-orange-400/10 text-[var(--accent)]" },
  { key: "approved", label: "approvedColumn", bg: "bg-green-400/10 text-[var(--success)]" },
  { key: "scheduled", label: "scheduledColumn", bg: "bg-orange-400/10 text-[var(--accent)]" },
  { key: "published", label: "publishedColumn", bg: "bg-emerald-400/10 text-emerald-400" },
];

export function PipelineStats({ counts }: PipelineStatsProps) {
  if (!counts) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-28 bg-[var(--surface-2)]/50 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statConfig.map(({ key, label, bg }) => {
        const count = counts[key as keyof typeof counts] || 0;
        return (
          <span key={key} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", bg)}>
            {count} {translate(label)}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--text-tertiary)]">
        {counts.total} Total
      </span>
    </div>
  );
}
