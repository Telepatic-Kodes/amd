"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const TAYA_CATEGORIES = [
  {
    key: "cost",
    label: "Precios y costos",
    description: "Presupuestos, guias de precio, cuanto cuesta",
    color: "bg-emerald-500",
    badgeStyle: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-[var(--badge-green-bg)]",
    icon: "💰",
  },
  {
    key: "problems",
    label: "Problemas y soluciones",
    description: "Dudas frecuentes y como resolverlas",
    color: "bg-red-500",
    badgeStyle: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border-[var(--badge-red-bg)]",
    icon: "🔧",
  },
  {
    key: "comparisons",
    label: "Comparaciones",
    description: "Tu servicio vs alternativas",
    color: "bg-blue-500",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "⚖️",
  },
  {
    key: "reviews",
    label: "Opiniones y testimonios",
    description: "Experiencias, casos de exito, resultados",
    color: "bg-purple-500",
    badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "⭐",
  },
  {
    key: "best",
    label: "Lo mejor de",
    description: "Rankings, recomendaciones, guias",
    color: "bg-amber-500",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "🏆",
  },
] as const;

export function TAYACoverage() {
  const content = useQuery(api.functions.listContent, {});

  if (content === undefined) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando TAYA...
        </div>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1 rounded-md bg-[var(--surface-1)]">
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
          </div>
          Temas que tu audiencia busca
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {coveredCategories}/5
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              coverage === 100
                ? "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]"
                : coverage >= 60
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]"
            )}
          >
            {coverage}%
          </span>
        </div>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] mb-4">
        Las 5 categorias que tus clientes buscan antes de comprar (framework TAYA).
      </p>

      {/* Category list */}
      <div className="space-y-2">
        {categoryCounts.map((cat) => {
          const hasContent = cat.count > 0;
          return (
            <div
              key={cat.key}
              className={cn(
                "relative flex items-center gap-3 rounded-lg border p-3 transition-all",
                hasContent
                  ? "border-[var(--border)] hover:border-orange-200"
                  : "border-dashed border-[var(--border)] bg-[var(--surface-1)]/30"
              )}
            >
              {/* Left color accent */}
              {hasContent && (
                <div className={cn("absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r", cat.color)} />
              )}

              <span className={cn("text-base shrink-0", hasContent ? "" : "opacity-40")}>
                {cat.icon}
              </span>

              <div className={cn("flex-1 min-w-0", hasContent ? "" : "pl-0")}>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-semibold",
                    hasContent ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                  )}>
                    {cat.label}
                  </span>
                  {hasContent ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  {cat.description}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  hasContent ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                )}>
                  {cat.count}
                </span>
                <p className="text-[9px] text-[var(--text-tertiary)]">contenidos</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missing categories */}
      {totalTagged > 0 && coveredCategories < 5 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="text-[11px] text-amber-700 font-medium mb-1.5">
            Categorías sin cubrir:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categoryCounts
              .filter((c) => c.count === 0)
              .map((cat) => (
                <span
                  key={cat.key}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", cat.badgeStyle)}
                >
                  {cat.icon} {cat.label}
                </span>
              ))}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">
            Cubrir las 5 categorías maximiza tu visibilidad en búsquedas informacionales.
          </p>
        </div>
      )}

      {/* Empty state */}
      {totalTagged === 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--text-tertiary)] text-center">
            El sistema clasificará tu contenido automáticamente según el framework TAYA.
          </p>
        </div>
      )}
    </div>
  );
}
