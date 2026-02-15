"use client";

import { cn } from "@/lib/utils";
import { Linkedin, Twitter, Instagram, Mail, FileText, BookOpen, Video } from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  social_linkedin: "bg-blue-100 text-[var(--badge-blue-text)] border-l-2 border-l-blue-500",
  social_twitter: "bg-cyan-100 text-cyan-700 border-l-2 border-l-cyan-500",
  social_instagram: "bg-pink-100 text-pink-700 border-l-2 border-l-pink-500",
  email: "bg-amber-100 text-[var(--badge-amber-text)] border-l-2 border-l-amber-500",
  newsletter: "bg-amber-100 text-[var(--badge-amber-text)] border-l-2 border-l-amber-500",
  blog: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-l-2 border-l-green-500",
  ad_copy: "bg-purple-100 text-[var(--badge-purple-text)] border-l-2 border-l-purple-500",
  video_script: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border-l-2 border-l-red-500",
};

const PLATFORM_ICONS: Record<string, typeof FileText> = {
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_instagram: Instagram,
  email: Mail,
  newsletter: Mail,
  blog: BookOpen,
  video_script: Video,
};

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-[var(--text-tertiary)]",
  review: "bg-amber-400",
  revision_needed: "bg-amber-400",
  approved: "bg-green-400",
  scheduled: "bg-blue-400",
  published: "bg-blue-500",
  archived: "bg-[var(--border-hover)]",
};

interface ContentChipProps {
  title: string;
  type: string;
  status: string;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function ContentChip({
  title,
  type,
  status,
  className,
  onClick,
  draggable,
  onDragStart,
}: ContentChipProps) {
  const Icon = PLATFORM_ICONS[type] || FileText;
  const colorClass = PLATFORM_COLORS[type] || "bg-[var(--surface-1)] text-[var(--text-secondary)]";
  const statusDot = STATUS_DOTS[status] || "bg-[var(--text-tertiary)]";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer",
        colorClass,
        className
      )}
      title={`${title} · ${status}`}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate flex-1">{title}</span>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot)} />
    </div>
  );
}
