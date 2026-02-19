"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ActionItem {
  id: string;
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  timestamp: number;
  badge?: {
    label: string;
    variant: "default" | "success" | "warning" | "error";
  };
  actions: {
    label: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    onClick: () => void;
    loading?: boolean;
  }[];
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Ahora";
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
}

export function ActionFeedItem({ item }: { item: ActionItem }) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border)]",
        "bg-[var(--card-bg)] p-3 transition-shadow hover:shadow-sm"
      )}
    >
      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: item.iconColor
            ? `${item.iconColor}1A`
            : "var(--accent-muted)",
        }}
      >
        <Icon
          className="h-4 w-4"
          style={{
            color: item.iconColor ?? "var(--accent)",
          }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">
            {item.title}
          </span>
          {item.badge && (
            <Badge variant={item.badge.variant} className="shrink-0">
              {item.badge.label}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {item.description}
          </p>
        )}
        <span className="text-xs text-[var(--text-tertiary)]">
          {formatTimeAgo(item.timestamp)}
        </span>
      </div>

      {/* Action buttons */}
      {item.actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          {item.actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? "outline"}
              size="sm"
              className="text-xs"
              onClick={action.onClick}
              disabled={action.loading}
            >
              {action.loading ? "..." : action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
