"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { BarChart3, Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ReportSettingsCard } from "@/components/reports/ReportSettingsCard";
import { LatestReportCard } from "@/components/reports/LatestReportCard";
import { ReportHistoryTable } from "@/components/reports/ReportHistoryTable";

export default function ReportsPage() {
  const generateReport = useAction(api.reportsActions.generateReportNow);
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReport({ type: "weekly" });
      toast.success("Reporte generado", "El reporte semanal fue generado exitosamente.");
    } catch (_error) {
      toast.error("Error", "No se pudo generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]">
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reportes</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Reportes automáticos de rendimiento y métricas
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generar Reporte
            </>
          )}
        </button>
      </div>

      {/* Latest Report */}
      <LatestReportCard />

      {/* Settings + History side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ReportSettingsCard />
        </div>
        <div className="lg:col-span-3">
          <ReportHistoryTable />
        </div>
      </div>
    </div>
  );
}
