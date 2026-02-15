"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ChevronDown, ChevronRight, Mail, MailX, FileText } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LABELS } from "@/lib/language";

export function ReportHistoryTable() {
  const reports = useQuery(api.reports.getReportHistory, { limit: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (reports === undefined) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            {LABELS.reportHistory}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[var(--surface-1)] animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            {LABELS.reportHistory}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{LABELS.noReports}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          {LABELS.reportHistory}
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--border)]">
          {reports.map((report) => {
            const isExpanded = expandedId === report._id;
            return (
              <div key={report._id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report._id)}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--surface-1)] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--text-secondary)] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {report.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(report.periodStart).toLocaleDateString("es-ES")} — {new Date(report.periodEnd).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge variant={report.type === "weekly" ? "info" : "default"}>
                    {report.type === "weekly" ? LABELS.weekly : LABELS.monthly}
                  </Badge>
                  {report.emailSent ? (
                    <Mail className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <MailX className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4 space-y-3">
                    {/* Metrics summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-[var(--surface-1)]">
                        <p className="text-xs text-[var(--text-secondary)]">Contenido publicado</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{report.metrics.contentPublished}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--surface-1)]">
                        <p className="text-xs text-[var(--text-secondary)]">Tokens</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{Math.round(report.metrics.totalTokens / 1000)}K</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--surface-1)]">
                        <p className="text-xs text-[var(--text-secondary)]">Costo</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">${report.metrics.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--surface-1)]">
                        <p className="text-xs text-[var(--text-secondary)]">Tasa de éxito</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{report.metrics.successRate.toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Narrative */}
                    {report.narrative && (
                      <div className="p-4 rounded-lg bg-[var(--accent-subtle)] dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                        <p className="text-xs font-medium text-orange-700 dark:text-[var(--accent)] mb-1">Análisis IA</p>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{report.narrative}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
