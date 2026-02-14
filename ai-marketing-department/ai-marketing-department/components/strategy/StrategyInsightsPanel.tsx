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
    color: "text-red-500",
    label: "Pivote",
  },
};

export function StrategyInsightsPanel() {
  const insights = useQuery(api.strategyReview.getInsights, { limit: 10 });
  const acknowledge = useMutation(api.strategyReview.acknowledgeInsight);
  const dismiss = useMutation(api.strategyReview.dismissInsight);

  if (!insights || insights.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="text-center py-4">
          <Lightbulb className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Sin insights disponibles</p>
          <p className="text-xs text-stone-400 mt-1">
            Se generan automaticamente cada lunes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        Insights Estrategicos
        <span className="text-xs text-stone-400 font-normal">
          ({insights.length})
        </span>
      </h3>

      <div className="space-y-3">
        {insights.map((insight) => {
          const config =
            TYPE_CONFIG[insight.type] || TYPE_CONFIG.content_recommendation;
          const Icon = config.icon;

          return (
            <div
              key={insight._id}
              className="bg-stone-50 border border-stone-200 rounded-lg p-3 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        config.color,
                        "bg-white border border-stone-200"
                      )}
                    >
                      {config.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        insight.priority === "high"
                          ? "bg-red-100 text-red-600"
                          : insight.priority === "medium"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-stone-200 text-stone-500"
                      )}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-stone-900 mt-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {insight.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-stone-400">
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
                        className="p-1 rounded hover:bg-green-100 text-green-500 transition-colors"
                        title="Marcar como visto"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => dismiss({ insightId: insight._id })}
                        className="p-1 rounded hover:bg-red-100 text-red-400 transition-colors"
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
