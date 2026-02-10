"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Share2,
  Linkedin,
  Twitter,
  Instagram,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface UnifiedPublishHistoryProps {
  className?: string;
  limit?: number;
}

export function UnifiedPublishHistory({
  className,
  limit = 20,
}: UnifiedPublishHistoryProps) {
  const [currentLimit, setCurrentLimit] = useState(limit);

  // Query unified history
  const history = useQuery(api.crossPlatform.queries.getUnifiedPublishHistory, {
    limit: currentLimit,
  });

  // Query summary stats
  const summary = useQuery(api.crossPlatform.queries.getPublishingSummary);

  const loadMore = () => {
    setCurrentLimit((prev) => prev + 20);
  };

  // Platform configurations
  const platformConfigs = {
    linkedin: {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      bgColor: "bg-[#0A66C2]/10",
      borderColor: "border-[#0A66C2]",
    },
    twitter: {
      name: "Twitter/X",
      icon: Twitter,
      color: "text-[#1DA1F2]",
      bgColor: "bg-[#1DA1F2]/10",
      borderColor: "border-[#1DA1F2]",
    },
    instagram: {
      name: "Instagram",
      icon: Instagram,
      color: "text-[#E4405F]",
      bgColor: "bg-[#E4405F]/10",
      borderColor: "border-[#E4405F]",
    },
  };

  // Format relative time in Spanish
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} día${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    } else {
      return "ahora mismo";
    }
  };

  // Status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return {
          variant: "success" as const,
          label: translate("publishedStatus"),
          icon: CheckCircle,
        };
      case "failed":
        return {
          variant: "error" as const,
          label: translate("failedStatus"),
          icon: XCircle,
        };
      case "pending":
        return {
          variant: "warning" as const,
          label: translate("pendingStatus"),
          icon: Clock,
        };
      case "deleted":
        return {
          variant: "default" as const,
          label: translate("deletedStatus"),
          icon: XCircle,
        };
      default:
        return {
          variant: "default" as const,
          label: status,
          icon: Clock,
        };
    }
  };

  return (
    <Card className={cn("border-stone-200 bg-[#faf8f4]/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Share2 className="h-5 w-5 text-orange-500" />
            {translate("publishHistory")}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Summary Stats Bar */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            {/* LinkedIn Stats */}
            <div className="rounded-lg border border-[#0A66C2]/20 bg-[#0A66C2]/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                <span className="text-xs font-medium text-stone-400">
                  LinkedIn
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {summary.linkedin.published}
              </p>
              <p className="text-xs text-stone-500">
                {translate("publishedCount").replace(
                  "{N}",
                  summary.linkedin.published.toString()
                )}
              </p>
            </div>

            {/* Twitter Stats */}
            <div className="rounded-lg border border-[#1DA1F2]/20 bg-[#1DA1F2]/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                <span className="text-xs font-medium text-stone-400">
                  Twitter/X
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {summary.twitter.published}
              </p>
              <p className="text-xs text-stone-500">
                {translate("publishedCount").replace(
                  "{N}",
                  summary.twitter.published.toString()
                )}
              </p>
            </div>

            {/* Instagram Stats */}
            <div className="rounded-lg border border-[#E4405F]/20 bg-[#E4405F]/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Instagram className="h-4 w-4 text-[#E4405F]" />
                <span className="text-xs font-medium text-stone-400">
                  Instagram
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {summary.instagram.published}
              </p>
              <p className="text-xs text-stone-500">
                {translate("publishedCount").replace(
                  "{N}",
                  summary.instagram.published.toString()
                )}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!history && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-stone-100/30 animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-stone-200 rounded" />
                  <div className="h-3 w-1/2 bg-stone-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline List */}
        {history && history.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {history.map((entry, index) => {
                const platformConfig =
                  platformConfigs[entry.platform as keyof typeof platformConfigs];
                const Icon = platformConfig.icon;
                const statusBadge = getStatusBadge(entry.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-stone-100/30",
                      "border-stone-200",
                      `border-l-2 ${platformConfig.borderColor}`
                    )}
                  >
                    {/* Platform Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                        platformConfig.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", platformConfig.color)} />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {entry.contentTitle.length > 40
                            ? `${entry.contentTitle.slice(0, 40)}...`
                            : entry.contentTitle}
                        </h4>
                        {entry.platformUrl && (
                          <a
                            href={entry.platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs">
                        <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </Badge>
                        <span className="text-stone-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>

                      {/* Error Message */}
                      {entry.status === "failed" && entry.error && (
                        <p className="text-xs text-red-400 mt-2 line-clamp-2">
                          {entry.error}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {history && history.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-stone-100 p-6">
                <Share2 className="h-12 w-12 text-stone-700" />
              </div>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {translate("noPublicationsYet")}
            </h4>
            <p className="text-sm text-stone-500">
              {translate("publishFromDetail")}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {history && history.length > 0 && history.length === currentLimit && (
          <button
            onClick={loadMore}
            className="w-full px-4 py-2 rounded-lg border border-stone-200 bg-[#faf8f4]/50 text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            {translate("viewMore")}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
