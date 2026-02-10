import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions-client";

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const label = ROLE_LABELS[role] || role;
  const colorClass = ROLE_COLORS[role] || "bg-stone-500/10 text-stone-400 border-stone-500/20";

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
