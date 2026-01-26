"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";

const CAMPAIGN_TYPES = [
  { value: "", label: "All Types" },
  { value: "content", label: "Content" },
  { value: "paid", label: "Paid" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
  { value: "integrated", label: "Integrated" },
];

const CAMPAIGN_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const typeColors: Record<string, string> = {
  content: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    return campaigns.find((c) => c.campaignId === selectedCampaign);
  }, [selectedCampaign, campaigns]);

  if (!campaigns) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <p className="text-zinc-400 mt-2">
            Manage and monitor your marketing campaigns.
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Campaigns
        </h1>
        <p className="text-zinc-400 mt-2">
          Manage and monitor your {campaigns.length} marketing campaigns.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CAMPAIGN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-4 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {campaigns.filter((c) => c.status === "active").length} Active
        </Badge>
        <Badge variant="default">
          {campaigns.filter((c) => c.status === "planning").length} Planning
        </Badge>
        <Badge variant="info">
          {campaigns.filter((c) => c.status === "completed").length} Completed
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 py-16">
              <Rocket className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No campaigns found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {campaigns.length === 0
                  ? "Create your first campaign to get started"
                  : "Try adjusting your filters or search query"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => {
                const TypeIcon = typeIcons[campaign.type] || Rocket;
                const isSelected = selectedCampaign === campaign.campaignId;
                const budgetPercent = campaign.budget
                  ? Math.round((campaign.budget.spent / campaign.budget.total) * 100)
                  : 0;

                return (
                  <Card
                    key={campaign._id}
                    hover
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    )}
                  >
                    <CardContent
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
                              : "bg-zinc-500/10 text-zinc-400"
                          )}
                        >
                          <TypeIcon className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-white">
                                {campaign.name}
                              </h3>
                              <p className="text-sm text-zinc-400 line-clamp-1 mt-1">
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
                                  <Eye className="h-4 w-4 text-zinc-500" />
                                  <div>
                                    <p className="text-xs text-zinc-500">Impressions</p>
                                    <p className="text-sm font-medium text-white">
                                      {formatNumber(campaign.metrics.impressions)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MousePointer className="h-4 w-4 text-zinc-500" />
                                  <div>
                                    <p className="text-xs text-zinc-500">Clicks</p>
                                    <p className="text-sm font-medium text-white">
                                      {formatNumber(campaign.metrics.clicks)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-zinc-500" />
                                  <div>
                                    <p className="text-xs text-zinc-500">Conversions</p>
                                    <p className="text-sm font-medium text-white">
                                      {formatNumber(campaign.metrics.conversions)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                                  <div>
                                    <p className="text-xs text-zinc-500">CTR</p>
                                    <p className="text-sm font-medium text-white">
                                      {campaign.metrics.ctr.toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-4">
                              <Badge className={typeColors[campaign.type]}>
                                {campaign.type}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
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
                                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full transition-all",
                                      budgetPercent > 90
                                        ? "bg-red-500"
                                        : budgetPercent > 70
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    )}
                                    style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-zinc-400">
                                  {formatCurrency(campaign.budget.spent, campaign.budget.currency)} /{" "}
                                  {formatCurrency(campaign.budget.total, campaign.budget.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Details Panel */}
        {selectedCampaignData && (
          <div className="hidden lg:block w-1/3">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Campaign Details
                  </h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Name</p>
                    <p className="text-white font-medium">
                      {selectedCampaignData.name}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Description</p>
                    <p className="text-zinc-300 text-sm">
                      {selectedCampaignData.description}
                    </p>
                  </div>

                  {/* Type & Status */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Type</p>
                      <Badge className={typeColors[selectedCampaignData.type]}>
                        {selectedCampaignData.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Status</p>
                      <StatusBadge status={selectedCampaignData.status} />
                    </div>
                  </div>

                  {/* Budget */}
                  {selectedCampaignData.budget && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Budget</p>
                      <div className="rounded-lg bg-zinc-900/50 p-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-zinc-400">Spent</span>
                          <span className="text-white font-medium">
                            {formatCurrency(
                              selectedCampaignData.budget.spent,
                              selectedCampaignData.budget.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-zinc-400">Total</span>
                          <span className="text-white font-medium">
                            {formatCurrency(
                              selectedCampaignData.budget.total,
                              selectedCampaignData.budget.currency
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                (selectedCampaignData.budget.spent /
                                  selectedCampaignData.budget.total) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {selectedCampaignData.goals && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Goals</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedCampaignData.goals.impressions && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Impressions</p>
                            <p className="text-zinc-300 font-mono">
                              {formatNumber(selectedCampaignData.goals.impressions)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.clicks && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Clicks</p>
                            <p className="text-zinc-300 font-mono">
                              {formatNumber(selectedCampaignData.goals.clicks)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.conversions && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Conversions</p>
                            <p className="text-zinc-300 font-mono">
                              {formatNumber(selectedCampaignData.goals.conversions)}
                            </p>
                          </div>
                        )}
                        {selectedCampaignData.goals.revenue && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Revenue</p>
                            <p className="text-zinc-300 font-mono">
                              {formatCurrency(selectedCampaignData.goals.revenue)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Timeline</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-300">
                        {formatDate(selectedCampaignData.startDate)}
                        {selectedCampaignData.endDate &&
                          ` - ${formatDate(selectedCampaignData.endDate)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
