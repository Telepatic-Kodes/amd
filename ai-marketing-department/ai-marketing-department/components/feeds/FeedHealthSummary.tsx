"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { translate } from "@/lib/language";

export interface FeedHealthStatus {
  totalFeeds: number;
  activeFeeds: number;
  pausedFeeds: number;
  errorFeeds: number;
  totalArticlesToday: number;
  lastSyncTime?: number;
  nextSyncTime?: number;
}

interface FeedHealthSummaryProps {
  status?: FeedHealthStatus;
  loading?: boolean;
}

export function FeedHealthSummary({ status, loading = false }: FeedHealthSummaryProps) {
  // Default mock data
  const defaultStatus: FeedHealthStatus = {
    totalFeeds: 12,
    activeFeeds: 10,
    pausedFeeds: 1,
    errorFeeds: 1,
    totalArticlesToday: 45,
    lastSyncTime: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    nextSyncTime: Date.now() + 50 * 60 * 1000, // 50 minutes from now
  };

  const feedStatus = status || defaultStatus;

  // Determine health status
  const healthStatus = {
    isHealthy: feedStatus.errorFeeds === 0,
    message:
      feedStatus.errorFeeds === 0
        ? translate("allFeedsHealthy")
        : feedStatus.errorFeeds === 1
          ? `${translate("feedNeedsAttention")}`
          : `${feedStatus.errorFeeds} ${translate("feedsNeedAttention")}`,
    icon: feedStatus.errorFeeds === 0 ? "✅" : "⚠️",
  };

  // Calculate minutes until next sync
  const minutesUntilSync = feedStatus.nextSyncTime ? Math.round((feedStatus.nextSyncTime - Date.now()) / 60000) : 0;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 animate-pulse">
          <div className="h-32 rounded-lg bg-zinc-800" />
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Link href="/feeds/health" className="block">
        <Card className="p-6 hover:bg-zinc-900/70 transition-colors cursor-pointer">
          <div className="space-y-4">
            {/* Health Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{healthStatus.icon}</div>
                <div>
                  <h3 className="text-2xl font-semibold text-white">
                    {translate("feedHealthSummary")}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">{healthStatus.message}</p>
                </div>
              </div>
              <Activity className={`w-5 h-5 ${feedStatus.errorFeeds === 0 ? "text-green-400" : "text-yellow-400"}`} />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-800">
              {/* Articles Today */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-blue-400">{feedStatus.totalArticlesToday}</p>
                  <p className="text-xs text-zinc-400">{translate("newArticles")}</p>
                </div>
              </div>

              {/* Next Sync */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {minutesUntilSync > 0 ? minutesUntilSync : "<1"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {translate("nextSyncIn")} {translate("minutes")}
                  </p>
                </div>
              </div>

              {/* Active Feeds */}
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{feedStatus.activeFeeds}</p>
                  <p className="text-xs text-zinc-400">Activas</p>
                </div>
              </div>
            </div>

            {/* Error Alert if any */}
            {feedStatus.errorFeeds > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span className="text-sm text-yellow-300">
                  {feedStatus.errorFeeds} fuente{feedStatus.errorFeeds > 1 ? "s necesita" : " necesita"} atención
                </span>
              </div>
            )}

            {/* CTA */}
            <p className="text-xs text-indigo-400 pt-2 font-medium">Ver detalles →</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
