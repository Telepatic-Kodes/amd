"use client";

import { Heart, MessageCircle, Share2, Eye } from "lucide-react";
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

interface ContentPerformanceTableProps {
  data: ContentPerformanceData[];
  isLoading: boolean;
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getTypeColor(type: string): "default" | "success" | "warning" | "error" | "info" {
  const colorMap: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    blog: "info",
    social_linkedin: "success",
    social_twitter: "info",
    social_instagram: "warning",
    social_tiktok: "error",
    email: "default",
    newsletter: "info",
    ad_copy: "warning",
    landing_page: "success",
    whitepaper: "info",
    case_study: "success",
    video_script: "warning",
  };
  return colorMap[type] || "default";
}

function getEngagementRateColor(rate: number | null | undefined): string {
  if (!rate) return "text-zinc-500";
  if (rate > 3) return "text-green-400";
  if (rate >= 1) return "text-yellow-400";
  return "text-red-400";
}

export function ContentPerformanceTable({ data, isLoading }: ContentPerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 text-sm">
          No hay contenido publicado con datos de LinkedIn en este rango de fechas
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-3 pl-6 font-medium">Titulo</th>
            <th className="pb-3 font-medium">Tipo</th>
            <th className="pb-3 font-medium text-center">Likes</th>
            <th className="pb-3 font-medium text-center">Comentarios</th>
            <th className="pb-3 font-medium text-center">Compartidos</th>
            <th className="pb-3 font-medium text-center">Impresiones</th>
            <th className="pb-3 pr-6 font-medium text-center">Tasa de Engagement</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const hasEngagement = item.engagement !== null;
            const engagement = item.engagement;
            const totalEngagement = hasEngagement && engagement
              ? engagement.likes + engagement.comments + engagement.shares
              : 0;

            return (
              <tr
                key={item.contentId}
                className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors"
              >
                <td className="py-3 pl-6">
                  <div className="flex flex-col gap-1 max-w-md">
                    <span className="text-sm text-zinc-300 font-medium truncate">
                      {item.title.length > 50
                        ? item.title.substring(0, 50) + "..."
                        : item.title}
                    </span>
                    {!hasEngagement && (
                      <span className="text-xs text-zinc-600">Sin datos de LinkedIn</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <Badge variant={getTypeColor(item.type)} className="text-xs">
                    {item.type.replace("social_", "")}
                  </Badge>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-sm text-zinc-300 font-mono">
                      {hasEngagement && engagement ? formatNumber(engagement.likes) : "-"}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-sm text-zinc-300 font-mono">
                      {hasEngagement && engagement ? formatNumber(engagement.comments) : "-"}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-sm text-zinc-300 font-mono">
                      {hasEngagement && engagement ? formatNumber(engagement.shares) : "-"}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm text-zinc-300 font-mono">
                      {hasEngagement && engagement ? formatNumber(engagement.impressions) : "-"}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-6 text-center">
                  {hasEngagement && engagement && engagement.engagement_rate != null ? (
                    <span
                      className={cn(
                        "text-sm font-semibold font-mono",
                        getEngagementRateColor(engagement.engagement_rate)
                      )}
                    >
                      {engagement.engagement_rate.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-600">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
