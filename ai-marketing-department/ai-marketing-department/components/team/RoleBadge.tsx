import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions-client";

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const label = ROLE_LABELS[role] || role;
  const colorClass = ROLE_COLORS[role] || "bg-[var(--surface-2)]/10 text-[var(--text-tertiary)] border-[var(--border)]/20";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {label}
    </span>
  );
}
