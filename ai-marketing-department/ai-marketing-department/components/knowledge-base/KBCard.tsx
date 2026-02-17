"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "lucide-react";

interface KBItem {
  _id: string;
  name: string;
  category: string;
  status: string;
  description?: string;
  visibility: string;
  documentCount?: number;
  metadata?: { documentCount?: number; totalSizeBytes?: number };
}

interface KBCardProps {
  kb: KBItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function KBCard({ kb, isSelected, onSelect }: KBCardProps) {
  return (
    <Card
      hover
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)]/30"
      )}
      onClick={() => onSelect(kb._id)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[var(--surface-1)] shrink-0">
              <FileText className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {kb.name}
            </h3>
          </div>
          <Badge variant={kb.status === "active" ? "success" : "default"}>
            {kb.status === "active" ? "Activa" : "Archivada"}
          </Badge>
        </div>

        {kb.description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {kb.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Badge>{kb.category}</Badge>
          <span className="text-xs text-[var(--text-tertiary)]">
            {kb.metadata?.documentCount ?? kb.documentCount ?? 0} documento{(kb.metadata?.documentCount ?? kb.documentCount ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
