"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { Button } from "@/components/ui/Button";
import { CalendarDays, FileText, Play, TrendingUp, Users } from "lucide-react";

interface QuickSummaryProps {
  publishedToday: number;
  publishedTrend: number;
  activeAgents: number;
  totalAgents: number;
  successRate: number;
  successRateTrend: number;
  scheduledNext7Days: { title: string; date: string; type: string }[];
  onExecuteAgent: () => void;
}

function KpiCompact({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-muted)]">
            <Icon className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--text-secondary)]">{label}</p>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {value}
              </span>
              {suffix && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {suffix}
                </span>
              )}
              {trend !== undefined && (
                <TrendIndicator value={trend} size="sm" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickSummary({
  publishedToday,
  publishedTrend,
  activeAgents,
  totalAgents,
  successRate,
  successRateTrend,
  scheduledNext7Days,
  onExecuteAgent,
}: QuickSummaryProps) {
  return (
    <div className="space-y-4">
      {/* KPIs compactos */}
      <div className="space-y-3">
        <KpiCompact
          icon={FileText}
          label="Publicado hoy"
          value={publishedToday}
          trend={publishedTrend}
        />
        <KpiCompact
          icon={Users}
          label="Agentes activos"
          value={activeAgents}
          suffix={`/ ${totalAgents}`}
        />
        <KpiCompact
          icon={TrendingUp}
          label="Tasa de éxito"
          value={successRate}
          suffix="%"
          trend={successRateTrend}
        />
      </div>

      {/* Mini-calendario */}
      <Card>
        <CardContent className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-medium">Próximos 7 días</span>
          </div>
          {scheduledNext7Days.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">
              Sin contenido programado
            </p>
          ) : (
            <div className="space-y-2">
              {scheduledNext7Days.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className="shrink-0 text-[var(--text-tertiary)]">
                    {item.date}
                  </span>
                  <span className="truncate text-[var(--text-primary)]">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action button */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        onClick={onExecuteAgent}
      >
        <Play className="mr-2 h-4 w-4" />
        Ejecutar agente
      </Button>
    </div>
  );
}
