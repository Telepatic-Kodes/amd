"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Target } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CampaignKPIRow } from "@/components/campaigns/CampaignKPIRow";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignDetailPanel } from "@/components/campaigns/CampaignDetailPanel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CampaignDoc = any;

const TYPES = [
  { id: "all", label: "Todos" },
  { id: "content", label: "Content" },
  { id: "paid", label: "Paid" },
  { id: "email", label: "Email" },
  { id: "social", label: "Social" },
  { id: "integrated", label: "Integrated" },
];

const STATUSES = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Active" },
  { id: "planning", label: "Planning" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
];

export default function CampaignsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaigns = useQuery(
    api.functions.listCampaigns,
    typeFilter === "all" ? {} : { type: typeFilter as "content" | "paid" | "email" | "social" | "integrated" }
  );

  // Client-side status filter (listCampaigns only supports one index at a time)
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return undefined;
    if (statusFilter === "all") return campaigns;
    return campaigns.filter((c: CampaignDoc) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  const selectedCampaign = useMemo(() => {
    if (!selectedId || !campaigns) return null;
    return campaigns.find((c: CampaignDoc) => c._id === selectedId) || null;
  }, [selectedId, campaigns]);

  const stats = useMemo(() => {
    if (!campaigns) return { total: 0, active: 0 };
    const active = campaigns.filter((c: CampaignDoc) => c.status === "active").length;
    return { total: campaigns.length, active };
  }, [campaigns]);

  const isLoading = filteredCampaigns === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <Target className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campañas</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {stats.total} campañas · {stats.active} activas
          </p>
        </div>
      </div>

      {/* KPIs */}
      <CampaignKPIRow campaigns={campaigns as any} />

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setTypeFilter(type.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              typeFilter === type.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2">
        {STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
              statusFilter === status.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex gap-4">
        {/* Campaign Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-[var(--surface-1)] animate-pulse" />
              ))}
            </div>
          ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign: CampaignDoc) => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign as any}
                  isSelected={selectedId === campaign._id}
                  onClick={() =>
                    setSelectedId((prev) =>
                      prev === campaign._id ? null : campaign._id
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
              <p className="text-[var(--text-secondary)]">No se encontraron campañas</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Ajusta los filtros o crea una nueva campaña</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedCampaign && (
            <CampaignDetailPanel
              campaign={selectedCampaign as any}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
