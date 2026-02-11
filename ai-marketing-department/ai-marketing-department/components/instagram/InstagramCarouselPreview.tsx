"use client";

import { useState } from "react";
import { Image as ImageIcon, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramCarouselPreviewProps {
  imageUrls: string[];
  caption: string;
  authorUsername: string;
  authorAvatar?: string;
}

export function InstagramCarouselPreview({
  imageUrls,
  caption,
  authorUsername,
  authorAvatar,
}: InstagramCarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const truncatedCaption = caption.length > 125 ? caption.substring(0, 125) + "..." : caption;
  const charCount = caption.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-stone-200 bg-stone-100/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] p-[2px]">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorUsername}
                loading="lazy"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-stone-200 flex items-center justify-center">
                <span className="text-xs text-stone-400">{authorUsername[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-stone-900">{authorUsername}</span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-stone-400" />
      </div>

      {/* Carousel Images */}
      <div className="relative aspect-square bg-stone-50 group">
        {imageUrls.length > 0 ? (
          <>
            <img
              src={imageUrls[currentIndex]}
              alt={`Instagram carousel image ${currentIndex + 1}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />

            {/* Navigation Arrows */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>

                {/* Image Counter */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
                  {currentIndex + 1} de {imageUrls.length}
                </div>
              </>
            )}

            {/* Dot Indicators */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {imageUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      i === currentIndex ? "bg-orange-500" : "bg-stone-600"
                    )}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-600">
            <ImageIcon className="h-16 w-16 mb-2" />
            <span className="text-sm">Sin imágenes de vista previa</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-stone-500 hover:text-red-500 cursor-pointer transition-colors" />
          <MessageCircle className="h-6 w-6 text-stone-500 hover:text-stone-700 cursor-pointer transition-colors" />
          <Send className="h-6 w-6 text-stone-500 hover:text-stone-700 cursor-pointer transition-colors" />
        </div>
        <Bookmark className="h-6 w-6 text-stone-500 hover:text-stone-700 cursor-pointer transition-colors" />
      </div>

      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-900">{authorUsername}</span>{" "}
          {truncatedCaption}
          {caption.length > 125 && (
            <span className="text-stone-500 ml-1 cursor-pointer hover:text-stone-400">
              más
            </span>
          )}
        </p>

        {/* Character Count */}
        <div className="mt-2 text-xs text-stone-500 text-right">
          {charCount}/2200 caracteres
        </div>
      </div>
    </div>
  );
}
