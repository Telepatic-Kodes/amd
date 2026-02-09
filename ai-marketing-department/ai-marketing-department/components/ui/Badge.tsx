import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600 border-gray-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience components for common status badges
export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "success", label: "Active" },
    paused: { variant: "warning", label: "Paused" },
    error: { variant: "error", label: "Error" },
    maintenance: { variant: "info", label: "Maintenance" },
    // Task statuses
    pending: { variant: "default", label: "Pending" },
    queued: { variant: "info", label: "Queued" },
    running: { variant: "info", label: "Running" },
    waiting_review: { variant: "warning", label: "In Review" },
    completed: { variant: "success", label: "Completed" },
    failed: { variant: "error", label: "Failed" },
    cancelled: { variant: "default", label: "Cancelled" },
    // Content statuses
    draft: { variant: "default", label: "Draft" },
    review: { variant: "warning", label: "Review" },
    revision_needed: { variant: "error", label: "Needs Revision" },
    approved: { variant: "success", label: "Approved" },
    scheduled: { variant: "info", label: "Scheduled" },
    published: { variant: "success", label: "Published" },
    archived: { variant: "default", label: "Archived" },
    // Campaign statuses
    planning: { variant: "default", label: "Planning" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const roleConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    cmo: { variant: "info", label: "CMO" },
    director: { variant: "success", label: "Director" },
    specialist: { variant: "default", label: "Specialist" },
  };

  const config = roleConfig[role] || { variant: "default", label: role };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
