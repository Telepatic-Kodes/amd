"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Pencil, ArrowRight, RotateCcw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

interface VersionHistoryProps {
  contentId: Id<"content">;
  onCompare?: (versionAId: Id<"contentVersions">, versionBId: Id<"contentVersions">) => void;
  onRollback?: (versionId: Id<"contentVersions">, versionNumber: number) => void;
}

// Helper: Format relative time in Spanish
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "hace unos segundos";
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  return new Date(timestamp).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// Helper: Get icon for change type
function getChangeIcon(changeType: string) {
  switch (changeType) {
    case "created":
      return Plus;
    case "edited":
      return Pencil;
    case "status_change":
      return ArrowRight;
    case "rollback":
      return RotateCcw;
    default:
      return Pencil;
  }
}

// Helper: Get label for change type in Spanish
function getChangeLabel(changeType: string): string {
  switch (changeType) {
    case "created":
      return translate("createdVersion");
    case "edited":
      return translate("editedVersion");
    case "status_change":
      return translate("statusChanged");
    case "rollback":
      return translate("rolledBack");
    default:
      return changeType;
  }
}

export function VersionHistory({ contentId, onCompare, onRollback }: VersionHistoryProps) {
  const versions = useQuery(api.contentVersions.listContentVersions, { contentId });
  const [selectedVersions, setSelectedVersions] = useState<Id<"contentVersions">[]>([]);

  if (!versions) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-zinc-500">Sin historial de versiones</p>
      </div>
    );
  }

  const handleVersionSelect = (versionId: Id<"contentVersions">) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      } else {
        // Max 2 selections
        if (prev.length >= 2) {
          return [prev[1], versionId];
        }
        return [...prev, versionId];
      }
    });
  };

  const canCompare = selectedVersions.length === 2;

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative space-y-4">
        {versions.map((version, index) => {
          const isLatest = index === 0;
          const isSelected = selectedVersions.includes(version._id);
          const Icon = getChangeIcon(version.changeType);

          return (
            <div key={version._id} className="relative">
              {/* Vertical line (skip for last item) */}
              {index < versions.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-zinc-800" />
              )}

              {/* Version Entry */}
              <div
                onClick={() => handleVersionSelect(version._id)}
                className={cn(
                  "flex gap-4 p-3 rounded-lg cursor-pointer transition-all",
                  isSelected
                    ? "bg-indigo-500/10 border border-indigo-500/30"
                    : "bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/50"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10",
                    version.changeType === "created"
                      ? "bg-green-500/10 text-green-400"
                      : version.changeType === "edited"
                      ? "bg-blue-500/10 text-blue-400"
                      : version.changeType === "status_change"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-amber-500/10 text-amber-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-white">
                      {translate("version")} {version.version}
                      {isLatest && (
                        <span className="ml-2 text-xs text-emerald-400">(Actual)</span>
                      )}
                    </p>
                    <span className="text-xs text-zinc-500 shrink-0">
                      {formatRelativeTime(version.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-1">
                    {getChangeLabel(version.changeType)}
                  </p>
                  {version.changeSummary && (
                    <p className="text-xs text-zinc-500">{version.changeSummary}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {translate("editedBy")}: {version.editedByName}
                  </p>
                </div>

                {/* Rollback Button (only for non-latest) */}
                {!isLatest && onRollback && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback(version._id, version.version);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                  >
                    {translate("rollback")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare Button */}
      {onCompare && (
        <button
          onClick={() => {
            if (canCompare) {
              onCompare(selectedVersions[0], selectedVersions[1]);
            }
          }}
          disabled={!canCompare}
          className={cn(
            "w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            canCompare
              ? "bg-indigo-500 text-white hover:bg-indigo-600"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          )}
        >
          {canCompare
            ? translate("compareVersions")
            : "Selecciona 2 versiones para comparar"}
        </button>
      )}
    </div>
  );
}
