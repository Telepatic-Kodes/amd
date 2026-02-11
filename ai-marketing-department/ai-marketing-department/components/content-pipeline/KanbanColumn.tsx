"use client";

import { useState, useRef } from "react";
import { Id, Doc } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { ALLOWED_TRANSITIONS } from "@/lib/contentTypes";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: string;
  title: string;
  items: Doc<"content">[];
  count: number;
  color: string;
  onDrop: (contentId: string, toStatus: string) => void;
  onAction: (action: string, contentId: Id<"content">) => void;
}

// Invert transitions: for each status, find which statuses can transition INTO it
function getAllowedFromStatuses(targetStatus: string): string[] {
  const allowed: string[] = [];
  for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
    if (targets.includes(targetStatus)) {
      allowed.push(from);
    }
  }
  return allowed;
}

export function KanbanColumn({ status, title, items, count, color, onDrop, onAction }: KanbanColumnProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isInvalidDrop, setIsInvalidDrop] = useState(false);
  const dragCounter = useRef(0);
  const _allowedFrom = getAllowedFromStatuses(status);

  const handleDragOver = (e: React.DragEvent) => {
    const _fromStatus = e.dataTransfer.types.includes("application/x-status")
      ? "unknown"
      : "";
    // Allow the drop - we validate on drop
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDropTarget(false);
      setIsInvalidDrop(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDropTarget(false);
    setIsInvalidDrop(false);

    const contentId = e.dataTransfer.getData("text/plain");
    if (contentId) {
      onDrop(contentId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col min-w-[280px] max-w-[320px] w-full bg-stone-50/30 rounded-xl border transition-colors snap-center",
        isDropTarget && !isInvalidDrop && "border-orange-500/50 bg-orange-500/5",
        isInvalidDrop && "border-red-500/30",
        !isDropTarget && "border-stone-200/50"
      )}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-stone-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
          <span className="text-sm font-medium text-stone-900">{title}</span>
        </div>
        <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">{count}</span>
      </div>

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-320px)]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[100px]">
            <p className="text-xs text-stone-600">{translate("noContent")}</p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard key={item._id} content={item} onAction={onAction} />
          ))
        )}

        {/* Drop zone hint */}
        {isDropTarget && (
          <div className="border-2 border-dashed border-orange-500/30 rounded-lg p-4 text-center">
            <p className="text-xs text-orange-400">{translate("dropHere")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
