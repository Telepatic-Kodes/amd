"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  generated: "info",
  sent: "success",
  pending: "warning",
  failed: "error",
};

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "bg-[var(--badge-green-bg)] text-green-700 dark:bg-green-900/30 dark:text-[var(--success)]",
  neutral: "bg-[var(--surface-1)] text-[var(--text-secondary)] dark:bg-[var(--surface-2)] dark:text-[var(--text-tertiary)]",
  negative: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] dark:bg-red-900/30 dark:text-[var(--error)]",
};

interface DigestItem {
  feedItemId: string;
  title: string;
  relevanceScore: number;
  brandMentions: string[];
  competitorMentions: string[];
  sentiment: "positive" | "neutral" | "negative";
}

interface DigestCardProps {
  digest: {
    _id: string;
    createdAt: number;
    status: string;
    period: { start: number; end: number };
    items: DigestItem[];
    stats: {
      totalItems: number;
      highRelevance: number;
      brandMentionCount: number;
      competitorMentionCount: number;
    };
    summary?: string;
  };
}

export function DigestCard({ digest }: DigestCardProps) {
  const [expanded, setExpanded] = useState(false);

  const periodStart = new Date(digest.period.start).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
  const periodEnd = new Date(digest.period.end).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {periodStart} – {periodEnd}
              </p>
              <Badge variant={STATUS_VARIANT[digest.status] || "default"}>
                {digest.status}
              </Badge>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
            <span>{digest.stats.totalItems} items</span>
            <span>·</span>
            <span>{digest.stats.highRelevance} alta relevancia</span>
            <span>·</span>
            <span>{digest.stats.brandMentionCount} menciones marca</span>
            <span>·</span>
            <span>{digest.stats.competitorMentionCount} competidores</span>
          </div>

          {digest.summary && (
            <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">
              {digest.summary}
            </p>
          )}
        </button>

        {/* Expanded items */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
            {digest.items.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-2">
                Sin items en este digest
              </p>
            ) : (
              digest.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[var(--surface-1)] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                      {item.title}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${SENTIMENT_STYLE[item.sentiment]}`}
                    >
                      {item.sentiment}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <span>Relevancia: {item.relevanceScore.toFixed(1)}</span>
                    {item.brandMentions.length > 0 && (
                      <span>· Marca: {item.brandMentions.join(", ")}</span>
                    )}
                    {item.competitorMentions.length > 0 && (
                      <span>· Competidores: {item.competitorMentions.join(", ")}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
