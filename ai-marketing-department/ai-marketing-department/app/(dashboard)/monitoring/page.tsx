"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Shield, Eye, Building2, Swords, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { DigestList } from "@/components/monitoring/DigestList";
import { FeedManagementPanel } from "@/components/monitoring/FeedManagementPanel";
import { FeedDetailModal } from "@/components/monitoring/FeedDetailModal";

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "generated", label: "Generados" },
  { id: "sent", label: "Enviados" },
  { id: "pending", label: "Pendientes" },
  { id: "failed", label: "Fallidos" },
];

type MonitoringView = "digests" | "feeds";

export default function MonitoringPage() {
  const [activeView, setActiveView] = useState<MonitoringView>("digests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFeedId, setSelectedFeedId] = useState<Id<"feeds"> | null>(null);

  const digests = useQuery(api.monitoring.queries.listDigests, { limit: 50 });

  const stats = useMemo(() => {
    if (!digests) return { total: 0, highRelevance: 0, brandMentions: 0, competitorMentions: 0 };
    return digests.reduce(
      (acc, d) => ({
        total: acc.total + 1,
        highRelevance: acc.highRelevance + (d.stats?.highRelevance || 0),
        brandMentions: acc.brandMentions + (d.stats?.brandMentionCount || 0),
        competitorMentions: acc.competitorMentions + (d.stats?.competitorMentionCount || 0),
      }),
      { total: 0, highRelevance: 0, brandMentions: 0, competitorMentions: 0 }
    );
  }, [digests]);

  const isLoading = digests === undefined;

  const statCards = [
    { label: "Total Digests", value: stats.total, icon: Eye, color: "text-blue-500" },
    { label: "Alta Relevancia", value: stats.highRelevance, icon: Shield, color: "text-orange-500" },
    { label: "Menciones Marca", value: stats.brandMentions, icon: Building2, color: "text-green-500" },
    { label: "Competidores", value: stats.competitorMentions, icon: Swords, color: "text-[var(--error)]" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <Shield className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Monitoreo</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Alertas de marca, competidores y menciones
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveView("digests")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            activeView === "digests"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Digests
        </button>
        <button
          onClick={() => setActiveView("feeds")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            activeView === "feeds"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
          )}
        >
          <Rss className="h-3.5 w-3.5" />
          Feeds
        </button>
      </div>

      {activeView === "digests" ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {isLoading ? "—" : stat.value.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  statusFilter === filter.id
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Digest List */}
          <DigestList statusFilter={statusFilter} />
        </>
      ) : (
        <FeedManagementPanel onSelectFeed={(id) => setSelectedFeedId(id)} />
      )}

      {/* Feed Detail Modal */}
      {selectedFeedId && (
        <FeedDetailModal
          feedId={selectedFeedId}
          isOpen={!!selectedFeedId}
          onClose={() => setSelectedFeedId(null)}
        />
      )}
    </div>
  );
}
