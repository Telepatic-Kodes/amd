"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const TAYA_CATEGORIES = [
  {
    key: "cost",
    label: "Costos",
    description: "¿Cuánto cuesta X? Comparaciones de precio, presupuestos",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "💰",
  },
  {
    key: "problems",
    label: "Problemas",
    description: "Problemas comunes, troubleshooting, soluciones",
    color: "bg-red-500",
    lightColor: "bg-red-50 text-red-700 border-red-200",
    icon: "🔧",
  },
  {
    key: "comparisons",
    label: "Comparaciones",
    description: "X vs Y, alternativas, pros/contras",
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "⚖️",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Análisis, opiniones honestas, ratings",
    color: "bg-purple-500",
    lightColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "⭐",
  },
  {
    key: "best",
    label: "Best-of",
    description: "Los mejores X, rankings, recomendaciones",
    color: "bg-amber-500",
    lightColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "🏆",
  },
] as const;

export function TAYACoverage() {
  const content = useQuery(api.functions.listContent, {});

  if (content === undefined) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando TAYA...
      </div>
    );
  }

  const categoryCounts = TAYA_CATEGORIES.map((cat) => {
    const count = (content || []).filter(
      (c: Record<string, unknown>) => c.tayaCategory === cat.key
    ).length;
    return { ...cat, count };
  });

  const totalTagged = categoryCounts.reduce((s, c) => s + c.count, 0);
  const coveredCategories = categoryCounts.filter((c) => c.count > 0).length;
  const coverage = Math.round((coveredCategories / TAYA_CATEGORIES.length) * 100);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-orange-600" />
          Cobertura TAYA
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">{coveredCategories}/5 categorías</span>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              coverage === 100
                ? "bg-green-100 text-green-700"
                : coverage >= 60
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            {coverage}%
          </span>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-2">
        {categoryCounts.map((cat) => {
          const hasContent = cat.count > 0;
          return (
            <div
              key={cat.key}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                hasContent ? "border-stone-200" : "border-dashed border-stone-300 bg-stone-50/50"
              )}
            >
              <span className="text-lg shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-900">{cat.label}</span>
                  {hasContent ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-stone-500 truncate">{cat.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={cn(
                  "text-sm font-bold",
                  hasContent ? "text-stone-900" : "text-stone-300"
                )}>
                  {cat.count}
                </span>
                <p className="text-[9px] text-stone-400">contenidos</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {totalTagged > 0 && coveredCategories < 5 && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-[11px] text-amber-700 font-medium mb-1">
            Categorías sin contenido:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categoryCounts
              .filter((c) => c.count === 0)
              .map((cat) => (
                <span
                  key={cat.key}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", cat.lightColor)}
                >
                  {cat.icon} {cat.label}
                </span>
              ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-1.5">
            El framework TAYA recomienda cubrir las 5 categorías para capturar todo el tráfico informacional.
          </p>
        </div>
      )}
    </div>
  );
}
