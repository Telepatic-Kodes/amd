"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { X, Download, Sparkles } from "lucide-react";
import { LABELS } from "@/lib/language";
import { Badge } from "@/components/ui/Badge";

interface ReportPreviewProps {
  reportId: Id<"reports">;
  onClose: () => void;
}

export function ReportPreview({ reportId, onClose }: ReportPreviewProps) {
  const report = useQuery(api.reports.getReportById, { id: reportId });

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {report ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{report.title}</h2>
                <Badge
                  variant={report.type === "weekly" ? "info" : "default"}
                  className={
                    report.type === "weekly"
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }
                >
                  {report.type === "weekly" ? LABELS.weeklyReport : LABELS.monthlyReport}
                </Badge>
              </>
            ) : (
              <div className="h-6 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {!report ? (
          // Loading state
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-[var(--surface-2)] rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-32 bg-[var(--surface-2)] rounded-lg animate-pulse" />
            <div className="h-96 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Contenido publicado</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{report.metrics.contentPublished}</p>
              </div>
              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Tokens</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {Math.round(report.metrics.totalTokens / 1000)}K
                </p>
              </div>
              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Costo</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  ${report.metrics.totalCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Tasa de éxito</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {report.metrics.successRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Narrative (AI Analysis) */}
            {report.narrative && (
              <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-lg p-4 mx-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--accent)]">Análisis del CMO</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{report.narrative}</p>
              </div>
            )}

            {/* HTML Content in Iframe */}
            <div className="overflow-y-auto flex-1 p-4">
              <iframe
                sandbox=""
                srcDoc={report.htmlContent}
                className="w-full min-h-[400px] rounded-lg border border-[var(--border)]"
                title="Report Preview"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                {LABELS.downloadReport}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-sm font-medium rounded-lg transition-colors"
              >
                {LABELS.close}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
