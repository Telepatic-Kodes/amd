"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useBrandContext } from "@/hooks/useBrandContext";
import { Send, Linkedin, Twitter, Instagram, Mail, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const PLATFORM_ICONS: Record<string, typeof Send> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  email: Mail,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600 hover:bg-blue-500",
  twitter: "bg-cyan-600 hover:bg-cyan-500",
  instagram: "bg-pink-600 hover:bg-pink-500",
  email: "bg-amber-600 hover:bg-amber-500",
};

interface QuickPublishBarProps {
  contentTitle: string;
  onPublish: (platforms: string[]) => Promise<void>;
  isPublishing?: boolean;
}

export function QuickPublishBar({ contentTitle, onPublish, isPublishing }: QuickPublishBarProps) {
  const { activeBrandId } = useBrandContext();
  const { success } = useToast();
  const groups = useQuery(api.channelGroups.listChannelGroups, {
    brandProfileId: activeBrandId ?? undefined,
  });

  const handlePublish = async (platforms: string[], groupName: string) => {
    await onPublish(platforms);
    success("Publicado", `"${contentTitle}" enviado a ${groupName}`);
  };

  if (!groups || groups.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-56 z-30 bg-[var(--surface-0)] border-t border-[var(--border)] px-4 py-3 shadow-lg">
      <div className="container mx-auto max-w-7xl flex items-center gap-3">
        <Send className="h-4 w-4 text-[var(--brand-accent)] shrink-0" />
        <span className="text-xs text-[var(--text-secondary)] shrink-0">Publicar:</span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel groups */}
          {groups.map((group) => (
            <button
              key={group._id}
              onClick={() => handlePublish(group.platforms, group.name)}
              disabled={isPublishing}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50",
                group.isDefault ? "bg-[var(--brand-accent)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Layers className="h-3 w-3" />
              {group.name}
              <span className="text-[9px] opacity-70">({group.platforms.length})</span>
            </button>
          ))}

          {/* Individual platform buttons */}
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          {["linkedin", "twitter", "instagram", "email"].map((platformId) => {
            const Icon = PLATFORM_ICONS[platformId] || Send;
            const colorClass = PLATFORM_COLORS[platformId] || "bg-[var(--surface-2)]";
            return (
              <button
                key={platformId}
                onClick={() => handlePublish([platformId], platformId)}
                disabled={isPublishing}
                className={cn(
                  "p-1.5 rounded-lg text-white transition-colors disabled:opacity-50",
                  colorClass
                )}
                title={`Publicar en ${platformId}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
