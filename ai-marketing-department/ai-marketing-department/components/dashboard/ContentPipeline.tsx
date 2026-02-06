"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface ContentPipelineProps {
  counts?: {
    draft: number;
    review: number;
    approved: number;
    scheduled: number;
    published: number;
  };
}

const stages = [
  { key: "draft", label: "Borrador", color: "text-zinc-400", bar: "bg-zinc-500", hoverBg: "hover:bg-zinc-500/5" },
  { key: "review", label: "En Revision", color: "text-amber-400", bar: "bg-amber-500", hoverBg: "hover:bg-amber-500/5" },
  { key: "approved", label: "Aprobado", color: "text-blue-400", bar: "bg-blue-500", hoverBg: "hover:bg-blue-500/5" },
  { key: "scheduled", label: "Programado", color: "text-purple-400", bar: "bg-purple-500", hoverBg: "hover:bg-purple-500/5" },
  { key: "published", label: "Publicado", color: "text-emerald-400", bar: "bg-emerald-500", hoverBg: "hover:bg-emerald-500/5" },
] as const;

export function ContentPipeline({ counts }: ContentPipelineProps) {
  const router = useRouter();

  if (!counts) return <ContentPipelineSkeleton />;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Pipeline de Contenido
      </h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-2 space-y-1">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-6 w-6 text-zinc-600 mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">Sin contenido en pipeline</p>
          </div>
        ) : (
          stages.map((stage) => {
            const count = counts[stage.key] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <button
                key={stage.key}
                onClick={() => router.push(`/content?status=${stage.key}`)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2.5 transition-colors cursor-pointer",
                  stage.hoverBg
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-secondary)]">{stage.label}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", stage.color)}>
                    {count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className={cn("h-full rounded-full transition-all", stage.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ContentPipelineSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse" />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 w-6 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
