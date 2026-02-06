"use client";

import { TrendingUp, TrendingDown, Clock, Star, Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagement_rate?: number | null;
}

interface ContentPerformanceData {
  contentId: string;
  title: string;
  type: string;
  publishedAt?: number;
  engagement: EngagementData | null;
}

interface ContentInsightsPanelProps {
  data: ContentPerformanceData[];
  isLoading: boolean;
}

function formatNumber(num: number) {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function calculateTotalEngagement(engagement: EngagementData | null): number {
  if (!engagement) return 0;
  return engagement.likes + engagement.comments + engagement.shares;
}

export function ContentInsightsPanel({ data, isLoading }: ContentInsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3 grid-cols-1">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-40 rounded-lg bg-zinc-900/50 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter only content with engagement data
  const contentWithEngagement = data.filter((item) => item.engagement !== null);

  if (contentWithEngagement.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 text-sm">
          Sin datos suficientes para generar insights. Necesitas contenido publicado con
          metricas de LinkedIn.
        </p>
      </div>
    );
  }

  // Insight 1: Performance by Content Type
  const typeStats: Record<
    string,
    { count: number; totalEngagement: number; totalImpressions: number }
  > = {};

  for (const item of contentWithEngagement) {
    if (!typeStats[item.type]) {
      typeStats[item.type] = { count: 0, totalEngagement: 0, totalImpressions: 0 };
    }
    typeStats[item.type].count += 1;
    typeStats[item.type].totalEngagement += calculateTotalEngagement(item.engagement);
    typeStats[item.type].totalImpressions += item.engagement?.impressions || 0;
  }

  const typePerformance = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      avgEngagement: stats.totalEngagement / stats.count,
      avgImpressions: stats.totalImpressions / stats.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  const bestType = typePerformance[0];

  // Insight 2: Performance by Time of Day
  const timeSlots = {
    morning: { label: "Mañana (6-12h)", count: 0, totalEngagement: 0 },
    afternoon: { label: "Tarde (12-18h)", count: 0, totalEngagement: 0 },
    evening: { label: "Noche (18-24h)", count: 0, totalEngagement: 0 },
    night: { label: "Madrugada (0-6h)", count: 0, totalEngagement: 0 },
  };

  for (const item of contentWithEngagement) {
    if (!item.publishedAt) continue;
    const hour = new Date(item.publishedAt).getHours();
    let slot: keyof typeof timeSlots;

    if (hour >= 6 && hour < 12) slot = "morning";
    else if (hour >= 12 && hour < 18) slot = "afternoon";
    else if (hour >= 18 && hour < 24) slot = "evening";
    else slot = "night";

    timeSlots[slot].count += 1;
    timeSlots[slot].totalEngagement += calculateTotalEngagement(item.engagement);
  }

  const timePerformance = Object.entries(timeSlots)
    .map(([key, data]) => ({
      slot: key,
      label: data.label,
      count: data.count,
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  const bestTime = timePerformance[0];

  // Insight 3: Trend Analysis (first half vs second half)
  const sortedByDate = [...contentWithEngagement].sort(
    (a, b) => (a.publishedAt || 0) - (b.publishedAt || 0)
  );

  const midpoint = Math.floor(sortedByDate.length / 2);
  const firstHalf = sortedByDate.slice(0, midpoint);
  const secondHalf = sortedByDate.slice(midpoint);

  const firstHalfAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, item) => sum + calculateTotalEngagement(item.engagement), 0) /
        firstHalf.length
      : 0;

  const secondHalfAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, item) => sum + calculateTotalEngagement(item.engagement), 0) /
        secondHalf.length
      : 0;

  const trendDirection = secondHalfAvg > firstHalfAvg ? "up" : "down";
  const trendChange =
    firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  // Type-specific trends
  const typeTrends = typePerformance.slice(0, 3).map((typeData) => {
    const typeContent = sortedByDate.filter((item) => item.type === typeData.type);
    const typeMidpoint = Math.floor(typeContent.length / 2);
    const typeFirstHalf = typeContent.slice(0, typeMidpoint);
    const typeSecondHalf = typeContent.slice(typeMidpoint);

    const typeFirstAvg =
      typeFirstHalf.length > 0
        ? typeFirstHalf.reduce((sum, item) => sum + calculateTotalEngagement(item.engagement), 0) /
          typeFirstHalf.length
        : 0;

    const typeSecondAvg =
      typeSecondHalf.length > 0
        ? typeSecondHalf.reduce(
            (sum, item) => sum + calculateTotalEngagement(item.engagement),
            0
          ) / typeSecondHalf.length
        : 0;

    return {
      type: typeData.type,
      trend: typeSecondAvg > typeFirstAvg ? "up" : "down",
      change: typeFirstAvg > 0 ? ((typeSecondAvg - typeFirstAvg) / typeFirstAvg) * 100 : 0,
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3 grid-cols-1">
      {/* Card 1: Performance by Content Type */}
      <Card>
        <CardHeader>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Rendimiento por Tipo de Contenido
          </h4>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {typePerformance.slice(0, 5).map((item, index) => (
              <div key={item.type} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Star className="w-3.5 h-3.5 text-yellow-400" />}
                    <span className="text-xs text-zinc-400">
                      {item.type.replace("social_", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{item.count} piezas</span>
                    <span className="text-xs font-semibold text-white">
                      {formatNumber(item.avgEngagement)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      index === 0 ? "bg-yellow-400" : "bg-indigo-500"
                    )}
                    style={{
                      width: `${
                        (item.avgEngagement /
                          Math.max(...typePerformance.map((t) => t.avgEngagement))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {bestType && (
              <div className="pt-3 border-t border-zinc-800 mt-4">
                <p className="text-xs text-zinc-500">
                  Mejor tipo:{" "}
                  <span className="text-indigo-400 font-semibold">
                    {bestType.type.replace("social_", "")}
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Performance by Time of Day */}
      <Card>
        <CardHeader>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Rendimiento por Hora de Publicacion
          </h4>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {timePerformance.map((item, index) => (
              <div key={item.slot} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Star className="w-3.5 h-3.5 text-yellow-400" />}
                    <span className="text-xs text-zinc-400">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{item.count} posts</span>
                    <span className="text-xs font-semibold text-white">
                      {formatNumber(item.avgEngagement)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      index === 0 ? "bg-cyan-400" : "bg-indigo-500"
                    )}
                    style={{
                      width: `${
                        (item.avgEngagement /
                          Math.max(...timePerformance.map((t) => t.avgEngagement))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {bestTime && (
              <div className="pt-3 border-t border-zinc-800 mt-4">
                <p className="text-xs text-zinc-500">
                  Mejor horario:{" "}
                  <span className="text-cyan-400 font-semibold">{bestTime.label}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Trend Analysis */}
      <Card>
        <CardHeader>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            {trendDirection === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            Tendencias por Tema
          </h4>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {/* Overall trend */}
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Tendencia general</span>
                <Badge variant={trendDirection === "up" ? "success" : "error"}>
                  {trendChange > 0 ? "+" : ""}
                  {trendChange.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                El engagement promedio esta{" "}
                {trendDirection === "up" ? "mejorando" : "disminuyendo"} en el periodo
                analizado
              </p>
            </div>

            {/* Type-specific trends */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Por tipo de contenido:</p>
              {typeTrends.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0"
                >
                  <span className="text-xs text-zinc-400">
                    {item.type.replace("social_", "")}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        item.trend === "up" ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {item.change > 0 ? "+" : ""}
                      {item.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
