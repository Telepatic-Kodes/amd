"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Toast types
export type ToastType = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  /** If true, toast won't auto-dismiss */
  persistent?: boolean;
  /** Optional action button */
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string, action?: ToastAction) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Toast configuration
const toastConfig: Record<ToastType, {
  icon: typeof CheckCircle2;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-[var(--success)]",
    bgColor: "bg-[var(--badge-green-bg)]",
    borderColor: "border-[var(--success)]/30",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-[var(--error)]",
    bgColor: "bg-[var(--badge-red-bg)]",
    borderColor: "border-[var(--error)]/30",
  },
  info: {
    icon: Info,
    iconColor: "text-[var(--accent)]",
    bgColor: "bg-[var(--accent-muted)]",
    borderColor: "border-[var(--accent)]/30",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-[var(--warning)]",
    bgColor: "bg-[var(--badge-amber-bg)]",
    borderColor: "border-[var(--warning)]/30",
  },
};

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration (unless persistent)
    if (!toast.persistent) {
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "success", title, description });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, action?: ToastAction) => {
      addToast({ type: "error", title, description, persistent: true, action });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "info", title, description });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "warning", title, description });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container (renders at bottom right)
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual Toast
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg max-w-sm",
        "bg-[var(--surface-1)]/95",
        config.borderColor
      )}
    >
      <div className={cn("shrink-0 mt-0.5", config.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onRemove(toast.id);
            }}
            className="mt-2 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Custom hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
