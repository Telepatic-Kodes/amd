"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { BarChart3, TrendingUp, Coins, Zap } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

export function LatestReportCard() {
  const reports = useQuery(api.reports.getReportHistory, { limit: 1 });

  if (reports === undefined) {
    return (
      <Card>
        <CardContent>
          <div className="h-40 animate-pulse bg-[var(--surface-1)] rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const latest = reports[0];

  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            Último Reporte
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)] text-center py-6">
            Aún no se han generado reportes. Usa el botón para generar tu primer reporte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            Último Reporte
          </h3>
          <span className="text-xs text-[var(--text-secondary)]">
            {new Date(latest.generatedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Publicado</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.metrics.contentPublished}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
            <div className="p-2 rounded-lg bg-[var(--badge-green-bg)] dark:bg-green-900/30">
              <TrendingUp className="h-4 w-4 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Éxito</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.metrics.successRate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Tokens</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{Math.round(latest.metrics.totalTokens / 1000)}K</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Coins className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Costo</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">${latest.metrics.totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {latest.narrative && (
          <div className="p-4 rounded-lg bg-[var(--accent-subtle)] dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
            <p className="text-xs font-medium text-orange-700 dark:text-[var(--accent)] mb-1">Resumen ejecutivo</p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-line leading-relaxed">{latest.narrative}</p>
          </div>
        )}

        {latest.metrics.topPlatform && (
          <p className="text-xs text-[var(--text-secondary)] mt-3">
            Plataforma principal: <span className="font-medium text-[var(--text-primary)]">{latest.metrics.topPlatform}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
