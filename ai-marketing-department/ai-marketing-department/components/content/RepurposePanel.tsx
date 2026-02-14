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
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="text-center py-4">
          <Recycle className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Sin contenido reciclable</p>
          <p className="text-xs text-stone-400 mt-1">
            El contenido publicado hace +30 dias aparecera aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2 mb-4">
        <Recycle className="h-4 w-4 text-green-500" />
        Reciclar Contenido
        <span className="text-xs text-stone-400 font-normal">
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
                ? "border-green-400 bg-green-50/50"
                : "border-stone-200 hover:border-stone-300"
            )}
            onClick={() =>
              setSelectedContent(
                selectedContent === content._id ? null : content._id
              )
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {content.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-stone-400 uppercase">
                    {content.type.replace("_", " ")}
                  </span>
                  {content.publishedAt && (
                    <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
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
                  "h-4 w-4 text-stone-300 transition-transform shrink-0 ml-2",
                  selectedContent === content._id && "rotate-90"
                )}
              />
            </div>

            {selectedContent === content._id && (
              <div className="mt-3 pt-3 border-t border-stone-200">
                <p className="text-xs text-stone-500 mb-2">
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
                            ? "bg-green-100 border-green-300 text-green-700"
                            : "border-stone-200 text-stone-400 hover:border-stone-300"
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
                    className="mt-2 w-full text-xs py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
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
