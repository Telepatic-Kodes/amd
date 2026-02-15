"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface AgentStat {
  agentId: string;
  total: number;
  successful: number;
  failed: number;
  totalTokens: number;
  totalDuration: number;
  totalCost: number;
  successRate: number;
  avgDuration: number;
  avgTokens: number;
}

interface AgentPerformanceTableProps {
  stats: AgentStat[];
}

type SortKey = "agentId" | "total" | "successRate" | "avgTokens" | "avgDuration" | "totalCost";

export function AgentPerformanceTable({ stats }: AgentPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...stats].sort((a, b) => {
    const multiplier = sortAsc ? 1 : -1;
    if (sortKey === "agentId") {
      return multiplier * a.agentId.localeCompare(b.agentId);
    }
    return multiplier * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const columns: { key: SortKey; label: string }[] = [
    { key: "agentId", label: "Agente" },
    { key: "total", label: "Ejecuciones" },
    { key: "successRate", label: "Éxito %" },
    { key: "avgTokens", label: "Tokens prom." },
    { key: "avgDuration", label: "Duración prom." },
    { key: "totalCost", label: "Costo total" },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-lg text-[var(--text-primary)]">
          Rendimiento por Agente
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className={cn(
                        "h-3 w-3",
                        sortKey === col.key ? "text-orange-500" : "opacity-40"
                      )} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((stat) => (
                <tr
                  key={stat.agentId}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-1)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {stat.agentId}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {stat.total}
                    <span className="text-xs text-[var(--text-secondary)] ml-1">
                      ({stat.failed} fail)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-medium",
                      stat.successRate >= 90 ? "text-[var(--success)]" :
                      stat.successRate >= 70 ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      {stat.successRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {stat.avgTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {(stat.avgDuration / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    ${stat.totalCost.toFixed(3)}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                    Sin datos de ejecución en este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
