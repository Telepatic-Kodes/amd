"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Lightbulb,
  TrendingUp,
  Target,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Lightbulb; color: string; label: string }
> = {
  pillar_performance: {
    icon: Target,
    color: "text-blue-500",
    label: "Pilar",
  },
  channel_performance: {
    icon: TrendingUp,
    color: "text-green-500",
    label: "Canal",
  },
  content_recommendation: {
    icon: Lightbulb,
    color: "text-amber-500",
    label: "Recomendacion",
  },
  pivot_suggestion: {
    icon: AlertTriangle,
    color: "text-[var(--error)]",
    label: "Pivote",
  },
};

export function StrategyInsightsPanel() {
  const insights = useQuery(api.strategyReview.getInsights, { limit: 10 });
  const acknowledge = useMutation(api.strategyReview.acknowledgeInsight);
  const dismiss = useMutation(api.strategyReview.dismissInsight);

  if (!insights || insights.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-6">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 mx-auto mb-3 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Aun sin recomendaciones</p>
          <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto leading-relaxed">
            La IA analiza tu contenido y estrategia cada lunes para darte sugerencias concretas:
            que pilares mejorar, que canales reforzar y que tipo de contenido crear.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <div className="p-1 rounded-md bg-[var(--surface-1)]">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        </div>
        Insights Estrategicos
        <span className="text-[10px] text-[var(--text-tertiary)] font-normal bg-[var(--surface-1)] px-2 py-0.5 rounded-full">
          {insights.length}
        </span>
      </h3>

      <div className="space-y-2">
        {insights.map((insight) => {
          const config =
            TYPE_CONFIG[insight.type] || TYPE_CONFIG.content_recommendation;
          const Icon = config.icon;

          return (
            <div
              key={insight._id}
              className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/30 p-3 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded border border-[var(--border)]",
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        insight.priority === "high"
                          ? "bg-[var(--badge-red-bg)] text-red-600"
                          : insight.priority === "medium"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                      )}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mt-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {insight.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {formatDistanceToNow(new Date(insight.generatedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          acknowledge({ insightId: insight._id })
                        }
                        className="p-1 rounded hover:bg-[var(--badge-green-bg)] text-emerald-500 transition-colors"
                        title="Marcar como visto"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => dismiss({ insightId: insight._id })}
                        className="p-1 rounded hover:bg-[var(--badge-red-bg)] text-[var(--error)] transition-colors"
                        title="Descartar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
