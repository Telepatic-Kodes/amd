"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ExternalLink, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface FeedItemsListProps {
  feedId?: Id<"feeds">;
  limit?: number;
}

export function FeedItemsList({ feedId, limit = 10 }: FeedItemsListProps) {
  // Use different query based on whether we're showing items for a specific feed or all feeds
  const feedItems = useQuery(
    feedId ? api.feeds.publicQueries.listFeedItems : api.feeds.publicQueries.listRecentItems,
    feedId ? { feedId, limit } : { limit }
  );

  if (!feedItems) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[var(--surface-1)]/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        Sin elementos aún. Sincroniza un feed para ver elementos aquí.
      </div>
    );
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Desconocido";
    return new Date(timestamp).toLocaleDateString("es-CL", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-2">
      {feedItems.map((item: {
        _id: Id<"feedItems">;
        title: string;
        link: string;
        publishedAt?: number;
        author?: string;
        feedName?: string;
        summary?: string;
      }) => (
        <Card key={item._id} className="p-3 hover:border-[var(--border)] transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors line-clamp-2"
              >
                {item.title}
              </a>
              {item.summary && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{item.summary}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
                {item.feedName && (
                  <span className="text-[var(--accent)]">{item.feedName}</span>
                )}
                {item.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.publishedAt)}
                </span>
              </div>
            </div>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
