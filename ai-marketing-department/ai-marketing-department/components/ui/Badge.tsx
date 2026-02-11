import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-stone-100 text-stone-600 border-stone-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-orange-50 text-orange-700 border-orange-200",
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
    active: { variant: "success", label: "Activo" },
    paused: { variant: "warning", label: "Pausado" },
    error: { variant: "error", label: "Error" },
    maintenance: { variant: "info", label: "Mantenimiento" },
    // Task statuses
    pending: { variant: "default", label: "Pendiente" },
    queued: { variant: "info", label: "En Cola" },
    running: { variant: "info", label: "Ejecutando" },
    waiting_review: { variant: "warning", label: "En Revision" },
    completed: { variant: "success", label: "Completado" },
    failed: { variant: "error", label: "Fallido" },
    cancelled: { variant: "default", label: "Cancelado" },
    // Content statuses
    draft: { variant: "default", label: "Borrador" },
    review: { variant: "warning", label: "Revision" },
    revision_needed: { variant: "error", label: "Requiere Cambios" },
    approved: { variant: "success", label: "Aprobado" },
    scheduled: { variant: "info", label: "Programado" },
    published: { variant: "success", label: "Publicado" },
    archived: { variant: "default", label: "Archivado" },
    // Campaign statuses
    planning: { variant: "default", label: "Planificando" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const roleConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    cmo: { variant: "info", label: "CMO" },
    director: { variant: "success", label: "Director" },
    specialist: { variant: "default", label: "Especialista" },
  };

  const config = roleConfig[role] || { variant: "default", label: role };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
