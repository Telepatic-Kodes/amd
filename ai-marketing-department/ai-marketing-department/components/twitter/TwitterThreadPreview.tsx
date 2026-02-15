"use client";

import { TwitterPostPreview } from "./TwitterPostPreview";
import { cn } from "@/lib/utils";
import { Twitter } from "lucide-react";

interface TwitterThreadPreviewProps {
  tweets: string[];
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  className?: string;
}

export function TwitterThreadPreview({
  tweets,
  authorName,
  authorHandle,
  authorAvatar,
  className,
}: TwitterThreadPreviewProps) {
  if (tweets.length === 0) {
    return null;
  }

  // Calculate total characters across all tweets
  const totalChars = tweets.reduce((sum, tweet) => sum + tweet.length, 0);

  // Estimate reading time (200 words per minute, ~5 chars per word)
  const estimatedWords = totalChars / 5;
  const readingTimeMinutes = Math.ceil(estimatedWords / 200);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Thread header */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30">
        <Twitter className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--accent)]">
          Hilo de {tweets.length} tweets
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">·</span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {totalChars.toLocaleString()} caracteres
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">·</span>
        <span className="text-xs text-[var(--text-tertiary)]">
          ~{readingTimeMinutes} min de lectura
        </span>
      </div>

      {/* Thread tweets */}
      <div className="relative space-y-4">
        {tweets.map((tweet, index) => (
          <div key={index} className="relative">
            {/* Connecting line */}
            {index < tweets.length - 1 && (
              <div className="absolute left-[46px] top-[72px] bottom-[-16px] w-0.5 bg-[var(--surface-2)] z-0" />
            )}

            {/* Tweet card */}
            <div className="relative z-10">
              <TwitterPostPreview
                text={tweet}
                authorName={authorName}
                authorHandle={authorHandle}
                authorAvatar={authorAvatar}
                isThread={true}
                tweetNumber={index + 1}
                totalTweets={tweets.length}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
