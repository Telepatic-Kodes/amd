"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Mail,
  Video,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";

const TYPE_ICONS: Record<string, typeof Linkedin> = {
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_instagram: Instagram,
  social_tiktok: Video,
  blog: BookOpen,
  newsletter: Mail,
  email: Mail,
  video_script: Video,
};

const TYPE_COLORS: Record<string, string> = {
  social_linkedin: "text-blue-600",
  social_twitter: "text-sky-500",
  social_instagram: "text-pink-500",
  social_tiktok: "text-purple-500",
  blog: "text-green-600",
  newsletter: "text-amber-600",
  email: "text-amber-600",
  video_script: "text-red-500",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
  review: "bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
  approved: "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
  published: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
};

interface DerivedVersionsListProps {
  contentId: Id<"content">;
  onSelectContent: (id: string) => void;
}

export function DerivedVersionsList({ contentId, onSelectContent }: DerivedVersionsListProps) {
  const versions = useQuery(api.contentRepurpose.getRepurposedVersions, { contentId });

  if (!versions || versions.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Versiones ({versions.length})
          </p>
        </div>
        <div className="space-y-1.5">
          {versions.map((version) => {
            const Icon = TYPE_ICONS[version.type] || BookOpen;
            const color = TYPE_COLORS[version.type] || "text-[var(--text-tertiary)]";
            const statusStyle = STATUS_STYLES[version.status] || STATUS_STYLES.draft;

            return (
              <button
                key={version._id}
                onClick={() => onSelectContent(version._id)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface-1)] transition-colors text-left group"
              >
                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                <span className="text-xs text-[var(--text-primary)] truncate flex-1 group-hover:text-[var(--accent)]">
                  {version.title.replace(/^\[.*?\]\s*/, "")}
                </span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", statusStyle)}>
                  {version.status}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
