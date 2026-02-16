"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Pause, Play, RefreshCw, Rss, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface FeedManagementPanelProps {
  onSelectFeed: (feedId: Id<"feeds">) => void;
}

export function FeedManagementPanel({ onSelectFeed }: FeedManagementPanelProps) {
  const { success, error: toastError } = useToast();
  const feeds = useQuery(api.feeds.publicQueries.listAllFeeds, {});
  const pauseFeed = useMutation(api.feeds.mutations.pauseFeed);
  const resumeFeed = useMutation(api.feeds.mutations.resumeFeed);
  const triggerSync = useMutation(api.feeds.scheduleFeedSync.triggerManualSync);

  const isLoading = feeds === undefined;

  function getHealthColor(feed: { status: string; consecutiveErrors: number }) {
    if (feed.status === "error") return "text-[var(--error)]";
    if (feed.consecutiveErrors > 0) return "text-amber-500";
    return "text-green-500";
  }

  function formatTime(ts?: number) {
    if (!ts) return "Nunca";
    return new Date(ts).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[var(--surface-2)]" />
              <div className="h-4 w-40 rounded bg-[var(--surface-2)]" />
              <div className="h-4 w-16 rounded bg-[var(--surface-2)] ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Rss className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">No hay feeds configurados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {feeds.map((feed) => (
        <button
          key={feed._id}
          onClick={() => onSelectFeed(feed._id)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-orange-200 hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <Circle className={cn("h-3 w-3 fill-current", getHealthColor(feed))} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {feed.name}
                </span>
                <Badge variant="info" className="text-[10px]">
                  {feed.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[var(--text-secondary)]">
                <span>{feed.itemCount} items</span>
                <span>Sync: {formatTime(feed.lastSyncAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {feed.status === "active" ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await pauseFeed({ feedId: feed._id });
                      success("Feed pausado", feed.name);
                    } catch (err: unknown) {
                      toastError("Error", err instanceof Error ? err.message : "Error");
                    }
                  }}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                  title="Pausar"
                >
                  <Pause className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await resumeFeed({ feedId: feed._id });
                      success("Feed reanudado", feed.name);
                    } catch (err: unknown) {
                      toastError("Error", err instanceof Error ? err.message : "Error");
                    }
                  }}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--success)] hover:bg-[var(--badge-green-bg)] transition-colors"
                  title="Reanudar"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await triggerSync({ feedId: feed._id });
                    success("Sync iniciado", feed.name);
                  } catch (err: unknown) {
                    toastError("Error", err instanceof Error ? err.message : "Error");
                  }
                }}
                className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                title="Sync manual"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
