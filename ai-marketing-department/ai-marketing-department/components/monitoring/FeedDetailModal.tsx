"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { X, Rss, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface FeedDetailModalProps {
  feedId: Id<"feeds">;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedDetailModal({ feedId, isOpen, onClose }: FeedDetailModalProps) {
  const feed = useQuery(api.feeds.publicQueries.getFeedDetails, isOpen ? { feedId } : "skip");
  const items = useQuery(api.feeds.publicQueries.listFeedItems, isOpen ? { feedId, limit: 10 } : "skip");

  if (!isOpen) return null;

  function formatTime(ts?: number) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 max-h-[80vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {feed?.name ?? "Cargando..."}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!feed ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-48 rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-full rounded bg-[var(--surface-1)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--surface-1)]" />
            </div>
          ) : (
            <>
              {/* Feed Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)]">URL</span>
                  <p className="text-[var(--text-primary)] truncate mt-0.5">{feed.url}</p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Categoría</span>
                  <div className="mt-0.5">
                    <Badge variant="outline">{feed.category}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Frecuencia sync</span>
                  <p className="text-[var(--text-primary)] mt-0.5">{feed.syncFrequency}</p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Total items</span>
                  <p className="text-[var(--text-primary)] mt-0.5">{feed.itemCount}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--text-secondary)]">Último sync</span>
                  <p className="text-[var(--text-primary)] mt-0.5">{formatTime(feed.lastSyncedAt)}</p>
                </div>
              </div>

              {/* Recent Items */}
              <div>
                <h3 className="text-xs font-medium text-[var(--text-primary)] mb-2">
                  Items recientes
                </h3>
                {items === undefined ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 rounded bg-[var(--surface-1)] animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">Sin items aún</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 rounded-lg p-2 hover:bg-[var(--surface-0)] transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-primary)] font-medium truncate group-hover:text-[var(--accent)] transition-colors">
                            {item.title}
                          </p>
                          {item.summary && (
                            <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                              {item.summary}
                            </p>
                          )}
                          {item.publishedAt && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              {formatTime(item.publishedAt)}
                            </span>
                          )}
                        </div>
                        <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)] shrink-0 mt-0.5 group-hover:text-orange-500" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
