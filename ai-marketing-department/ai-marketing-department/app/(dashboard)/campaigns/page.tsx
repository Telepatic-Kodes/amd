"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Rocket,
  Search,
  Filter,
  ChevronDown,
  Target,
  DollarSign,
  TrendingUp,
  MousePointer,
  Eye,
  Calendar,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { EmptyCampaigns, EmptySearchResults } from "@/components/ui/EmptyState";
import dynamic from "next/dynamic";

const MiniDonut = dynamic(
  () => import("@/components/charts/DonutChart").then((m) => m.MiniDonut),
  { ssr: false }
);
const Sparkline = dynamic(
  () => import("@/components/charts/Sparkline").then((m) => m.Sparkline),
  { ssr: false }
);
import { chartColors } from "@/components/charts/theme";

const CAMPAIGN_TYPES = [
  { value: "", label: "Todos los Tipos" },
  { value: "content", label: "Contenido" },
  { value: "paid", label: "Pago" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
  { value: "integrated", label: "Integrada" },
];

const CAMPAIGN_STATUSES = [
  { value: "", label: "Todos los Estados" },
  { value: "planning", label: "Planificando" },
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

const typeColors: Record<string, string> = {
  content: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  email: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  social: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  integrated: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const typeIcons: Record<string, React.ElementType> = {
  content: Rocket,
  paid: DollarSign,
  email: Target,
  social: TrendingUp,
  integrated: Target,
};

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("es-CL", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Generate mock sparkline data for demo
function generateSparklineData(length: number = 7) {
  const data = [];
  let value = Math.random() * 100 + 50;
  for (let i = 0; i < length; i++) {
    value = Math.max(10, value + (Math.random() - 0.45) * 20);
    data.push({ value: Math.round(value) });
  }
  return data;
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const campaigns = useQuery(api.functions.listCampaigns, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];

    let filtered = [...campaigns];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(query) ||
          campaign.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [campaigns, searchQuery]);

  const selectedCampaignData = useMemo(() => {
    if (!selectedCampaign || !campaigns) return null;
    return campaigns.find((c: { campaignId: string }) => c.campaignId === selectedCampaign);
  }, [selectedCampaign, campaigns]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;

    const active = campaigns.filter((c: { status: string }) => c.status === "active").length;
    const totalBudget = campaigns.reduce((sum: number, c: { budget?: { total: number } }) =>
      sum + (c.budget?.total || 0), 0);
    const totalSpent = campaigns.reduce((sum: number, c: { budget?: { spent: number } }) =>
      sum + (c.budget?.spent || 0), 0);
    const totalImpressions = campaigns.reduce((sum: number, c: { metrics?: { impressions: number } }) =>
      sum + (c.metrics?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum: number, c: { metrics?: { clicks: number } }) =>
      sum + (c.metrics?.clicks || 0), 0);

    return {
      active,
      totalBudget,
      totalSpent,
      totalImpressions,
      totalClicks,
      avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    };
  }, [campaigns]);

  if (!campaigns) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            Campañas
          </h1>
          <p className="text-stone-400 mt-2">
            Gestiona y monitorea tus campañas de marketing.
          </p>
        </div>
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-stone-200 bg-white animate-pulse"
            />
          ))}
        </div>
        {/* Skeleton List */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-stone-200 bg-white animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Rocket className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Campañas
            </h1>
            <p className="text-stone-500 text-sm">
              {campaigns.length} campañas • {stats?.active || 0} activas
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Campaigns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <TrendIndicator value={12} size="sm" />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                <SimpleCounter value={stats.active} />
              </p>
              <p className="text-sm text-stone-500">Campañas Activas</p>
              <div className="mt-2 h-8">
                <Sparkline
                  data={generateSparklineData()}
                  height={32}
                  color={chartColors.success}
                  showTooltip={false}
                />
              </div>
            </Card>
          </motion.div>

          {/* Total Impressions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Eye className="w-5 h-5 text-orange-400" />
                </div>
                <TrendIndicator value={8.5} size="sm" />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                <SimpleCounter
                  value={stats.totalImpressions}
                  formatter={(v) => formatNumber(Math.round(v))}
                />
              </p>
              <p className="text-sm text-stone-500">Impresiones Totales</p>
              <div className="mt-2 h-8">
                <Sparkline
                  data={generateSparklineData()}
                  height={32}
                  color={chartColors.departments.social}
                  showTooltip={false}
                />
              </div>
            </Card>
          </motion.div>

          {/* Average CTR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MousePointer className="w-5 h-5 text-purple-400" />
                </div>
                <TrendIndicator value={-2.1} size="sm" />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                <SimpleCounter
                  value={stats.avgCtr}
                  formatter={(v) => `${v.toFixed(2)}%`}
                />
              </p>
              <p className="text-sm text-stone-500">CTR Promedio</p>
              <div className="mt-2 h-8">
                <Sparkline
                  data={generateSparklineData()}
                  height={32}
                  color={chartColors.departments.brand}
                  showTooltip={false}
                />
              </div>
            </Card>
          </motion.div>

          {/* Budget Used */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <MiniDonut
                  value={stats.totalSpent}
                  total={stats.totalBudget}
                  color={chartColors.departments.demandgen}
                  size={32}
                  strokeWidth={3}
                />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                <SimpleCounter
                  value={stats.totalSpent}
                  formatter={(v) => formatCurrency(Math.round(v))}
                />
              </p>
              <p className="text-sm text-stone-500">
                de {formatCurrency(stats.totalBudget)} presupuesto
              </p>
              <div className="mt-2 h-2 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.totalSpent / stats.totalBudget) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                />
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar campañas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {CAMPAIGN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-4 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {campaigns.filter((c: { status: string }) => c.status === "active").length} Activas
        </Badge>
        <Badge variant="default">
          {campaigns.filter((c: { status: string }) => c.status === "planning").length} En Planificación
        </Badge>
        <Badge variant="info">
          {campaigns.filter((c: { status: string }) => c.status === "completed").length} Completadas
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Campaigns List */}
        <div className={cn(
          "flex-1 transition-all",
          selectedCampaign ? "lg:w-2/3" : "w-full"
        )}>
          {filteredCampaigns.length === 0 ? (
            campaigns && campaigns.length === 0 ? (
              <EmptyCampaigns />
            ) : (
              <EmptySearchResults />
            )
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign, index) => {
                const TypeIcon = typeIcons[campaign.type] || Rocket;
                const isSelected = selectedCampaign === campaign.campaignId;
                const budgetPercent = campaign.budget
                  ? Math.round((campaign.budget.spent / campaign.budget.total) * 100)
                  : 0;

                return (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      hover
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && "border-orange-500 shadow-lg shadow-orange-500/20"
                      )}
                    >
                      <div
                        className="p-4"
                        onClick={() =>
                          setSelectedCampaign(isSelected ? null : campaign.campaignId)
                        }
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-lg shrink-0",
                              campaign.status === "active"
                                ? "bg-green-500/10 text-green-400"
                                : campaign.status === "paused"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-stone-500/10 text-stone-400"
                            )}
                          >
                            <TypeIcon className="h-6 w-6" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-stone-900">
                                  {campaign.name}
                                </h3>
                                <p className="text-sm text-stone-400 line-clamp-1 mt-1">
                                  {campaign.description}
                                </p>
                              </div>
                              <StatusBadge status={campaign.status} />
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              {campaign.metrics && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-stone-500" />
                                    <div>
                                      <p className="text-xs text-stone-500">Impresiones</p>
                                      <p className="text-sm font-medium text-stone-900">
                                        {formatNumber(campaign.metrics.impressions)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MousePointer className="h-4 w-4 text-stone-500" />
                                    <div>
                                      <p className="text-xs text-stone-500">Clicks</p>
                                      <p className="text-sm font-medium text-stone-900">
                                        {formatNumber(campaign.metrics.clicks)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-stone-500" />
                                    <div>
                                      <p className="text-xs text-stone-500">Conversiones</p>
                                      <p className="text-sm font-medium text-stone-900">
                                        {formatNumber(campaign.metrics.conversions)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-stone-500" />
                                    <div>
                                      <p className="text-xs text-stone-500">CTR</p>
                                      <p className="text-sm font-medium text-stone-900">
                                        {campaign.metrics.ctr.toFixed(2)}%
                                      </p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200">
                              <div className="flex items-center gap-4">
                                <Badge className={typeColors[campaign.type]}>
                                  {campaign.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-stone-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(campaign.startDate)}</span>
                                  {campaign.endDate && (
                                    <>
                                      <span>-</span>
                                      <span>{formatDate(campaign.endDate)}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Budget Progress */}
                              {campaign.budget && (
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                      transition={{ duration: 0.5, delay: index * 0.05 }}
                                      className={cn(
                                        "h-full transition-all",
                                        budgetPercent > 90
                                          ? "bg-red-500"
                                          : budgetPercent > 70
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                      )}
                                    />
                                  </div>
                                  <span className="text-xs text-stone-400">
                                    {formatCurrency(campaign.budget.spent, campaign.budget.currency)} /{" "}
                                    {formatCurrency(campaign.budget.total, campaign.budget.currency)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Details Panel */}
        {selectedCampaignData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-1/3"
          >
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-stone-900">
                    Detalles de Campaña
                  </h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-stone-500 hover:text-stone-900 text-sm"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Nombre</p>
                    <p className="text-stone-900 font-medium">
                      {selectedCampaignData.name}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Descripción</p>
                    <p className="text-stone-600 text-sm">
                      {selectedCampaignData.description}
                    </p>
                  </div>

                  {/* Type & Status */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Tipo</p>
                      <Badge className={typeColors[selectedCampaignData.type]}>
                        {selectedCampaignData.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Estado</p>
                      <StatusBadge status={selectedCampaignData.status} />
                    </div>
                  </div>

                  {/* Performance Sparkline */}
                  {selectedCampaignData.metrics && (
                    <div>
                      <p className="text-xs text-stone-500 mb-2">Rendimiento (7 dias)</p>
                      <div className="rounded-lg bg-stone-50 p-3">
                        <Sparkline
                          data={generateSparklineData()}
                          height={60}
                          color={chartColors.primary}
                          showArea
                        />
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {selectedCampaignData.budget && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Presupuesto</p>
                      <div className="rounded-lg bg-stone-50 p-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-stone-400">Gastado</span>
                          <span className="text-stone-900 font-medium">
                            {formatCurrency(
                              selectedCampaignData.budget.spent,
                              selectedCampaignData.budget.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-stone-400">Total</span>
                          <span className="text-stone-900 font-medium">
                            {formatCurrency(
                              selectedCampaignData.budget.total,
                              selectedCampaignData.budget.currency
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                (selectedCampaignData.budget.spent /
                                  selectedCampaignData.budget.total) *
                                  100,
                                100
                              )}%`,
                            }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {selectedCampaignData.goals && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Objetivos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedCampaignData.goals.impressions && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-500">Impresiones</p>
                            <p className="text-stone-600 font-mono">
                              {formatNumber(selectedCampaignData.goals.impressions)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.clicks && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-500">Clicks</p>
                            <p className="text-stone-600 font-mono">
                              {formatNumber(selectedCampaignData.goals.clicks)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.conversions && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-500">Conversiones</p>
                            <p className="text-stone-600 font-mono">
                              {formatNumber(selectedCampaignData.goals.conversions)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.revenue && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-500">Ingresos</p>
                            <p className="text-stone-600 font-mono">
                              {formatCurrency(selectedCampaignData.goals.revenue)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Periodo</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-600">
                        {formatDate(selectedCampaignData.startDate)}
                        {selectedCampaignData.endDate &&
                          ` - ${formatDate(selectedCampaignData.endDate)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
