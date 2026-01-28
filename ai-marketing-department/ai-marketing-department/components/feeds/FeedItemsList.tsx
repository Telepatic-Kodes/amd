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
          <div key={i} className="h-20 rounded-lg bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No items yet. Sync a feed to see items here.
      </div>
    );
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString(undefined, {
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
        <Card key={item._id} className="p-3 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white hover:text-indigo-400 transition-colors line-clamp-2"
              >
                {item.title}
              </a>
              {item.summary && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.summary}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                {item.feedName && (
                  <span className="text-indigo-400">{item.feedName}</span>
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
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
