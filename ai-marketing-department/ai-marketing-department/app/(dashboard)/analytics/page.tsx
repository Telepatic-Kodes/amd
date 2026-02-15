"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TrendingUp, Download } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { AnalyticsKPIRow } from "@/components/analytics/AnalyticsKPIRow";
import { AgentPerformanceTable } from "@/components/analytics/AgentPerformanceTable";
import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

export default function AnalyticsPage() {
  const [daysBack, setDaysBack] = useState(30);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const agentAnalytics = useQuery(api.dataExport.getAgentAnalytics, { daysBack });
  const exportContent = useQuery(api.dataExport.exportContent, { limit: 500 });

  const handleExport = () => {
    if (!exportContent) return;
    setExporting(true);
    try {
      const json = JSON.stringify(exportContent, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amd-content-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportado", `${exportContent.length} items exportados como JSON.`);
    } catch (_error) {
      toast.error("Error", "No se pudo exportar el contenido.");
    } finally {
      setExporting(false);
    }
  };

  const isLoading = agentAnalytics === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]">
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analíticas</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Rendimiento de agentes y métricas de ejecución
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDaysBack(range.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  daysBack === range.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse" />
          ))}
        </div>
      ) : (
        <AnalyticsKPIRow stats={agentAnalytics} />
      )}

      {/* Agent Performance Table */}
      {isLoading ? (
        <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse" />
      ) : (
        <AgentPerformanceTable stats={agentAnalytics} />
      )}

      {/* Export Section */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)]">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Exportar Contenido</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Descarga todo tu contenido como archivo JSON ({exportContent?.length ?? "..."} items)
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !exportContent}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar JSON"}
        </button>
      </div>
    </div>
  );
}
