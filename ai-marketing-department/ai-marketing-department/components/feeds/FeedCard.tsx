"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Rss,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FeedCardProps {
  feed: {
    _id: Id<"feeds">;
    feedId: string;
    name: string;
    url: string;
    category: string;
    status: "active" | "paused" | "error";
    syncFrequency: "hourly" | "daily" | "weekly";
    lastSyncAt?: number;
    consecutiveErrors: number;
    lastErrorMessage?: string;
    itemCount?: number;
  };
  onSelect?: () => void;
  isSelected?: boolean;
}

const statusConfig = {
  active: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  paused: { icon: Pause, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export function FeedCard({ feed, onSelect, isSelected }: FeedCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const pauseFeed = useMutation(api.feeds.mutations.pauseFeed);
  const resumeFeed = useMutation(api.feeds.mutations.resumeFeed);
  const deleteFeed = useMutation(api.feeds.mutations.deleteFeed);
  const triggerSync = useMutation(api.feeds.scheduleFeedSync.triggerManualSync);

  const StatusIcon = statusConfig[feed.status].icon;

  const handlePauseResume = async () => {
    setIsLoading(true);
    try {
      if (feed.status === "active") {
        await pauseFeed({ feedId: feed._id });
      } else {
        await resumeFeed({ feedId: feed._id });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await triggerSync({ feedId: feed._id });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${feed.name}" and all its items?`)) return;
    setIsLoading(true);
    try {
      await deleteFeed({ feedId: feed._id });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        hover
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "border-indigo-500 shadow-lg shadow-indigo-500/20"
        )}
        onClick={onSelect}
      >
        <div className="p-3 md:p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                statusConfig[feed.status].bg
              )}>
                <Rss className={cn("h-5 w-5", statusConfig[feed.status].color)} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{feed.name}</h3>
                <p className="text-xs text-zinc-500 truncate max-w-[200px]">{feed.url}</p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              statusConfig[feed.status].bg,
              statusConfig[feed.status].color
            )}>
              <StatusIcon className="h-3 w-3" />
              {feed.status}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="rounded-lg bg-zinc-900/50 p-2 border border-zinc-800/50">
              <p className="text-zinc-500">Items</p>
              <p className="text-white font-mono">{feed.itemCount ?? 0}</p>
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-2 border border-zinc-800/50">
              <p className="text-zinc-500">Frequency</p>
              <p className="text-white font-mono">{feed.syncFrequency}</p>
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-2 border border-zinc-800/50">
              <p className="text-zinc-500">Errors</p>
              <p className={cn("font-mono", feed.consecutiveErrors > 0 ? "text-red-400" : "text-white")}>
                {feed.consecutiveErrors}
              </p>
            </div>
          </div>

          {/* Last Sync */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
            <Clock className="h-3 w-3" />
            Last sync: {formatLastSync(feed.lastSyncAt)}
          </div>

          {/* Error message if any */}
          {feed.lastErrorMessage && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3 truncate">
              {feed.lastErrorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <Badge className="bg-zinc-800 text-zinc-400">{feed.category}</Badge>
            <div className="flex gap-1 ml-auto">
              <button
                onClick={(e) => { e.stopPropagation(); handleSync(); }}
                disabled={isLoading || feed.status === "paused"}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title="Sync now"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePauseResume(); }}
                disabled={isLoading}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title={feed.status === "active" ? "Pause" : "Resume"}
              >
                {feed.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <a
                href={feed.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Open feed URL"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={isLoading}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title="Delete feed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
