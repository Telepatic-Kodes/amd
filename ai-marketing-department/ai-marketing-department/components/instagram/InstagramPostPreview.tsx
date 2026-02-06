"use client";

import { Image as ImageIcon, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramPostPreviewProps {
  imageUrl?: string;
  caption: string;
  authorUsername: string;
  authorAvatar?: string;
  isCarousel?: boolean;
  imageCount?: number;
}

export function InstagramPostPreview({
  imageUrl,
  caption,
  authorUsername,
  authorAvatar,
  isCarousel = false,
  imageCount = 1,
}: InstagramPostPreviewProps) {
  const truncatedCaption = caption.length > 125 ? caption.substring(0, 125) + "..." : caption;
  const charCount = caption.length;

  return (
    <div className="max-w-md mx-auto rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] p-[2px]">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorUsername}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-xs text-zinc-400">{authorUsername[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-white">{authorUsername}</span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-zinc-400" />
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-zinc-950">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Instagram post preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
            <ImageIcon className="h-16 w-16 mb-2" />
            <span className="text-sm">Sin imagen de vista previa</span>
          </div>
        )}

        {/* Carousel Indicators */}
        {isCarousel && imageCount > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {Array.from({ length: imageCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  i === 0 ? "bg-blue-500" : "bg-zinc-600"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-zinc-300 hover:text-red-500 cursor-pointer transition-colors" />
          <MessageCircle className="h-6 w-6 text-zinc-300 hover:text-zinc-100 cursor-pointer transition-colors" />
          <Send className="h-6 w-6 text-zinc-300 hover:text-zinc-100 cursor-pointer transition-colors" />
        </div>
        <Bookmark className="h-6 w-6 text-zinc-300 hover:text-zinc-100 cursor-pointer transition-colors" />
      </div>

      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{authorUsername}</span>{" "}
          {truncatedCaption}
          {caption.length > 125 && (
            <span className="text-zinc-500 ml-1 cursor-pointer hover:text-zinc-400">
              más
            </span>
          )}
        </p>

        {/* Character Count */}
        <div className="mt-2 text-xs text-zinc-500 text-right">
          {charCount}/2200 caracteres
        </div>
      </div>
    </div>
  );
}
