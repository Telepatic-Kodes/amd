"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Recycle,
  ChevronRight,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNEL_OPTIONS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "Twitter/X", icon: Twitter },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "blog", label: "Blog", icon: BookOpen },
] as const;

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RepurposePanel() {
  const recyclable = useQuery(api.contentRecycling.getRecyclableContent);
  const recycle = useMutation(api.contentRecycling.recycleContent);
  const [selectedContent, setSelectedContent] =
    useState<Id<"content"> | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [recycling, setRecycling] = useState(false);

  const handleRecycle = async () => {
    if (!selectedContent || selectedChannels.length === 0) return;
    setRecycling(true);
    try {
      await recycle({
        contentId: selectedContent,
        targetChannels: selectedChannels,
      });
      setSelectedContent(null);
      setSelectedChannels([]);
    } finally {
      setRecycling(false);
    }
  };

  if (!recyclable || recyclable.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <div className="text-center py-4">
          <Recycle className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">Sin contenido reciclable</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            El contenido publicado hace +30 dias aparecera aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <Recycle className="h-4 w-4 text-green-500" />
        Reciclar Contenido
        <span className="text-xs text-[var(--text-tertiary)] font-normal">
          ({recyclable.length} disponibles)
        </span>
      </h3>

      <div className="space-y-2">
        {recyclable.map((content) => (
          <div
            key={content._id}
            className={cn(
              "border rounded-lg p-3 cursor-pointer transition-all",
              selectedContent === content._id
                ? "border-green-400 bg-[var(--badge-green-bg)]/50"
                : "border-[var(--border)] hover:border-[var(--border-hover)]"
            )}
            onClick={() =>
              setSelectedContent(
                selectedContent === content._id ? null : content._id
              )
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {content.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase">
                    {content.type.replace("_", " ")}
                  </span>
                  {content.publishedAt && (
                    <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {formatDate(content.publishedAt)}
                    </span>
                  )}
                  {content.recycleCount > 0 && (
                    <span className="text-[10px] text-amber-500 font-medium">
                      {content.recycleCount}x reciclado
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-[var(--text-tertiary)] transition-transform shrink-0 ml-2",
                  selectedContent === content._id && "rotate-90"
                )}
              />
            </div>

            {selectedContent === content._id && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">
                  Reciclar para:
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = selectedChannels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChannels((prev) =>
                            isSelected
                              ? prev.filter((c) => c !== ch.id)
                              : [...prev, ch.id]
                          );
                        }}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors",
                          isSelected
                            ? "bg-[var(--badge-green-bg)] border-green-300 text-[var(--badge-green-text)]"
                            : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border-hover)]"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
                {selectedChannels.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecycle();
                    }}
                    disabled={recycling}
                    className="mt-2 w-full text-xs py-2 rounded-lg bg-[var(--success)] text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {recycling
                      ? "Reciclando..."
                      : `Reciclar en ${selectedChannels.length} canal(es)`}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
