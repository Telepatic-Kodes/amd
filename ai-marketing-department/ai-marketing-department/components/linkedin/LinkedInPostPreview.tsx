"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { ThumbsUp, MessageCircle, Repeat2, Send } from "lucide-react";

interface LinkedInPostPreviewProps {
  commentary: string;
  authorName?: string;
  authorTitle?: string;
  authorAvatar?: string;
  className?: string;
}

const TRUNCATE_LIMIT = 140;

export function LinkedInPostPreview({
  commentary,
  authorName = "Tu Nombre",
  authorTitle = "Tu Cargo · LinkedIn",
  authorAvatar,
  className,
}: LinkedInPostPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = commentary.length > TRUNCATE_LIMIT;
  const displayText = shouldTruncate && !expanded
    ? commentary.substring(0, TRUNCATE_LIMIT)
    : commentary;

  const charCount = commentary.length;
  const isOverLimit = charCount > 3000;

  return (
    <div className={cn("rounded-xl border border-stone-300/50 bg-stone-100/80 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {authorAvatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={authorAvatar}
            alt={authorName}
            loading="lazy"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-lg">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">{authorName}</p>
          <p className="text-xs text-stone-400 truncate">{authorTitle}</p>
          <p className="text-xs text-stone-500">Ahora · 🌐</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <div className="text-sm text-stone-700 whitespace-pre-wrap break-words leading-relaxed">
          {displayText}
          {shouldTruncate && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-stone-400 hover:text-orange-400 transition-colors ml-1"
            >
              {translate("linkedinSeeMore")}
            </button>
          )}
        </div>
      </div>

      {/* Engagement bar */}
      <div className="px-4 py-1 flex items-center gap-1 text-xs text-stone-500 border-b border-stone-200">
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px]">👍</span>
          <span>0</span>
        </span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        {[
          { icon: ThumbsUp, label: "Recomendar" },
          { icon: MessageCircle, label: "Comentar" },
          { icon: Repeat2, label: "Compartir" },
          { icon: Send, label: "Enviar" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-stone-400 hover:bg-stone-200 transition-colors cursor-default"
            disabled
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Character count */}
      <div className="px-4 py-2 border-t border-stone-200 flex items-center justify-between">
        <span className={cn(
          "text-xs font-mono",
          isOverLimit ? "text-red-400" : charCount > 2800 ? "text-yellow-400" : "text-stone-500"
        )}>
          {charCount.toLocaleString()}/3.000 {translate("linkedinCharCount")}
        </span>
        {isOverLimit && (
          <span className="text-xs text-red-400">{translate("linkedinCharLimit")}</span>
        )}
      </div>
    </div>
  );
}
