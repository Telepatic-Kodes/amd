"use client";

import { useState, useRef } from "react";
import { Id, Doc } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: string;
  title: string;
  items: Doc<"content">[];
  count: number;
  color: string;
  onDrop: (contentId: string, toStatus: string) => void;
  onAction: (action: string, contentId: Id<"content">) => void;
  // P6: Batch operations
  batchMode?: boolean;
  selectedIds?: Set<string>;
  onSelectAll?: (status: string, select: boolean) => void;
  onSelectItem?: (contentId: Id<"content">, selected: boolean) => void;
}

export function KanbanColumn({ status, title, items, count, color, onDrop, onAction, batchMode, selectedIds, onSelectAll, onSelectItem }: KanbanColumnProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isInvalidDrop, setIsInvalidDrop] = useState(false);
  const dragCounter = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
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
          {/* P6: Select All checkbox */}
          {batchMode && items.length > 0 && (
            <input
              type="checkbox"
              checked={items.length > 0 && items.every((item) => selectedIds?.has(item._id))}
              onChange={(e) => onSelectAll?.(status, e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              title={`Seleccionar todos en ${title}`}
            />
          )}
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
            <KanbanCard
              key={item._id}
              content={item}
              onAction={onAction}
              selectable={batchMode}
              selected={selectedIds?.has(item._id)}
              onSelect={onSelectItem}
            />
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
