"use client";

import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Repeat2, Share, BarChart3 } from "lucide-react";

interface TwitterPostPreviewProps {
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  isThread?: boolean;
  tweetNumber?: number;
  totalTweets?: number;
  className?: string;
}

export function TwitterPostPreview({
  text,
  authorName,
  authorHandle,
  authorAvatar,
  isThread = false,
  tweetNumber = 1,
  totalTweets = 1,
  className,
}: TwitterPostPreviewProps) {
  const charCount = text.length;
  const isOverLimit = charCount > 280;
  const isNearLimit = charCount > 260 && charCount <= 280;

  return (
    <div className={cn("rounded-xl border border-[var(--border)]/50 bg-[var(--surface-1)]/80 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        {authorAvatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={authorAvatar}
            alt={authorName}
            loading="lazy"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{authorName}</p>
            {isThread && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 shrink-0">
                {tweetNumber}/{totalTweets}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">@{authorHandle}</p>
        </div>
        <div className="text-[var(--text-tertiary)] text-sm shrink-0">
          Ahora
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <div className="text-[15px] text-[var(--text-secondary)] whitespace-pre-wrap break-words leading-relaxed">
          {text}
        </div>
      </div>

      {/* Timestamp */}
      <div className="px-4 pb-2">
        <p className="text-sm text-[var(--text-tertiary)]">
          {new Date().toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {new Date().toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Engagement bar */}
      <div className="px-4 py-3 flex items-center gap-4 text-sm text-[var(--text-tertiary)] border-t border-[var(--border)]">
        <span className="flex items-center gap-1">
          <Heart className="h-5 w-5" />
          <span>0</span>
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span>0</span>
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="h-5 w-5" />
          <span>0</span>
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="h-5 w-5" />
          <span>0</span>
        </span>
        <span className="flex items-center gap-1">
          <Share className="h-5 w-5" />
        </span>
      </div>

      {/* Character count */}
      <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between">
        <span className={cn(
          "text-xs font-mono",
          isOverLimit ? "text-[var(--error)]" : isNearLimit ? "text-yellow-400" : "text-[var(--text-tertiary)]"
        )}>
          {charCount}/280 caracteres
        </span>
        {isOverLimit && (
          <span className="text-xs text-[var(--error)]">Excede el límite de Twitter</span>
        )}
      </div>
    </div>
  );
}
