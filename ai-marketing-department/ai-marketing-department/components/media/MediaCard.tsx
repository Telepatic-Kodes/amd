"use client";

import { Image, Video, Music, FileText, Presentation, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/media-utils";
import type { Doc, Id } from "@convex/_generated/dataModel";

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  presentation: Presentation,
};

const TYPE_BG_MAP: Record<string, string> = {
  image: "bg-blue-50 dark:bg-blue-900/20 text-blue-500",
  video: "bg-purple-50 dark:bg-purple-900/20 text-purple-500",
  audio: "bg-pink-50 dark:bg-pink-900/20 text-pink-500",
  document: "bg-amber-50 dark:bg-amber-900/20 text-amber-500",
  presentation: "bg-teal-50 dark:bg-teal-900/20 text-teal-500",
};

const TYPE_BADGE_MAP: Record<string, string> = {
  image: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  video: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  audio: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  document: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  presentation: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

interface MediaCardProps {
  asset: Doc<"mediaAssets">;
  isSelected: boolean;
  onSelect: (id: Id<"mediaAssets">) => void;
  onClick: (asset: Doc<"mediaAssets">) => void;
}

export function MediaCard({ asset, isSelected, onSelect, onClick }: MediaCardProps) {
  const isImage = asset.type === "image";
  const IconComponent = TYPE_ICON_MAP[asset.type] || FileText;

  return (
    <button
      onClick={() => onClick(asset)}
      className={cn(
        "group relative w-full text-left rounded-xl border overflow-hidden transition-all",
        "hover:scale-[1.02] hover:shadow-md",
        isSelected
          ? "ring-2 ring-[var(--accent)] border-[var(--accent)] bg-[var(--accent-subtle)] dark:bg-orange-900/10 shadow-sm"
          : "border-[var(--border)] bg-[var(--card-bg)] dark:bg-[var(--surface-0)] hover:border-[var(--accent)] hover:shadow-sm"
      )}
    >
      {/* Selection checkbox overlay */}
      <div
        className={cn(
          "absolute top-2 right-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-[var(--accent)] border-[var(--accent)]"
            : "border-white/70 bg-black/20 opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(asset._id);
        }}
      >
        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>

      {/* Preview area — square aspect ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--bg-secondary)]">
        {isImage ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center",
              TYPE_BG_MAP[asset.type] || "bg-gray-50 dark:bg-gray-800 text-gray-500"
            )}
          >
            <IconComponent className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
          {asset.name}
        </h4>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {formatFileSize(asset.fileSize)}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
              TYPE_BADGE_MAP[asset.type] || "bg-[var(--surface-1)] text-[var(--text-primary)]"
            )}
          >
            {asset.type}
          </span>
        </div>
      </div>
    </button>
  );
}
