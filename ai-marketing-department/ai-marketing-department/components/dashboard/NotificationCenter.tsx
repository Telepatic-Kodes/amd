"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  FileCheck,
  FileX,
  Send,
  Calendar,
  Globe,
  Info,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Tab type for the notification panel
type NotificationTab = "todas" | "revisiones" | "sistema";

// Icon mapping per notification type
const notificationTypeConfig: Record<
  string,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  content_review: {
    icon: Send,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  content_approved: {
    icon: FileCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  content_rejected: {
    icon: FileX,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  content_published: {
    icon: Globe,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  content_scheduled: {
    icon: Calendar,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  agent_error: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  brand_update: {
    icon: Zap,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  strategy_insight: {
    icon: Info,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  system: {
    icon: Info,
    color: "text-stone-400",
    bgColor: "bg-stone-500/10",
  },
};

// Legacy activity item type for agent errors
interface ActivityItem {
  id: string;
  type: "execution" | "task";
  agentName: string;
  department: string;
  description: string;
  status: string;
  timestamp: number;
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  success: {
    icon: CheckCircle,
    color: "text-emerald-400",
    label: "Exitoso",
  },
  completed: {
    icon: CheckCircle,
    color: "text-emerald-400",
    label: "Completado",
  },
  failure: { icon: XCircle, color: "text-red-400", label: "Fallido" },
  failed: { icon: XCircle, color: "text-red-400", label: "Fallido" },
  running: { icon: Zap, color: "text-amber-400", label: "En curso" },
};

// Notification record type from the database
interface NotificationRecord {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  contentId?: string;
  linkUrl?: string;
  read: boolean;
  readAt?: number;
  createdAt: number;
}

// Review-related notification types
const reviewTypes = new Set([
  "content_review",
  "content_approved",
  "content_rejected",
]);

// System-related notification types
const systemTypes = new Set([
  "agent_error",
  "brand_update",
  "strategy_insight",
  "system",
]);

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("todas");
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Legacy queries (agent errors + failed executions)
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const agents = useQuery(api.functions.listAgents, {});

  // P2: New notification queries
  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 30,
  });
  const unreadCount = useQuery(api.notifications.countUnread);

  // P2: Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filter legacy alerts (failures + errors)
  const legacyAlerts: ActivityItem[] = (activity || [])
    .filter(
      (a: ActivityItem) =>
        a.status === "failure" || a.status === "failed"
    )
    .slice(0, 10);

  const errorAgents =
    agents?.filter(
      (a: Record<string, unknown>) => a.status === "error"
    ) || [];

  // Total badge count: unread notifications + legacy alerts
  const legacyAlertCount = legacyAlerts.length + errorAgents.length;
  const totalBadge = (unreadCount ?? 0) + legacyAlertCount;

  // Filter notifications by active tab
  const filteredNotifications = ((notifications || []) as NotificationRecord[]).filter((n: NotificationRecord) => {
    if (activeTab === "todas") return true;
    if (activeTab === "revisiones") return reviewTypes.has(n.type);
    if (activeTab === "sistema") return systemTypes.has(n.type);
    return true;
  });

  // Handle clicking on a notification
  const handleNotificationClick = async (notification: {
    _id: Id<"notifications">;
    read: boolean;
    linkUrl?: string;
  }) => {
    if (!notification.read) {
      await markAsRead({ notificationId: notification._id });
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
      setOpen(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const tabs: { key: NotificationTab; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "revisiones", label: "Revisiones" },
    { key: "sistema", label: "Sistema" },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-1.5 rounded-md transition-colors",
          "text-stone-400 hover:text-stone-600 hover:bg-white/[0.05]"
        )}
      >
        <Bell className="h-4 w-4" />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full ml-2 top-0 w-80 rounded-lg border border-[var(--border)] bg-stone-50 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Notificaciones
            </span>
            <div className="flex items-center gap-2">
              {(unreadCount ?? 0) > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors"
                  title="Marcar todas como leidas"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Leer todas</span>
                </button>
              )}
              {totalBadge > 0 && (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                  {totalBadge}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors",
                  activeTab === tab.key
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-stone-400 hover:text-stone-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[360px] overflow-y-auto">
            {/* Workflow Notifications */}
            {filteredNotifications.length === 0 &&
            (activeTab !== "sistema" || legacyAlertCount === 0) &&
            (activeTab !== "todas" || legacyAlertCount === 0) ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-stone-400">
                  {activeTab === "todas"
                    ? "Sin notificaciones"
                    : activeTab === "revisiones"
                      ? "Sin revisiones pendientes"
                      : "Sin alertas del sistema"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {/* P2: Workflow notifications */}
                {filteredNotifications.map((notification) => {
                  const typeConf =
                    notificationTypeConfig[notification.type] ||
                    notificationTypeConfig.system;
                  const Icon = typeConf.icon;
                  const timeAgo = formatDistanceToNow(
                    new Date(notification.createdAt),
                    {
                      addSuffix: true,
                      locale: es,
                    }
                  );

                  return (
                    <button
                      key={notification._id}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      className={cn(
                        "flex items-start gap-2.5 px-3 py-2.5 w-full text-left transition-colors hover:bg-stone-100",
                        !notification.read && "bg-orange-50/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          typeConf.bgColor
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3 w-3",
                            typeConf.color
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              notification.read
                                ? "text-[var(--text-secondary)]"
                                : "font-medium text-[var(--text-primary)]"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {timeAgo}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Legacy: Agent errors (show in "sistema" and "todas" tabs) */}
                {(activeTab === "todas" || activeTab === "sistema") &&
                  errorAgents.map(
                    (agent: Record<string, unknown>) => (
                      <div
                        key={agent._id as string}
                        className="flex items-start gap-2.5 px-3 py-2.5"
                      >
                        <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-500/10">
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            {agent.name as string}
                          </p>
                          <p className="text-[11px] text-red-400">
                            Agente en estado de error
                          </p>
                        </div>
                      </div>
                    )
                  )}

                {/* Legacy: Failed executions (show in "sistema" and "todas" tabs) */}
                {(activeTab === "todas" || activeTab === "sistema") &&
                  legacyAlerts.map((item) => {
                    const config =
                      statusConfig[item.status] ||
                      statusConfig.failure;
                    const LegacyIcon = config.icon;
                    const timeAgo = formatDistanceToNow(
                      new Date(item.timestamp),
                      {
                        addSuffix: true,
                        locale: es,
                      }
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 px-3 py-2.5"
                      >
                        <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-500/10">
                          <LegacyIcon
                            className={cn(
                              "h-3 w-3",
                              config.color
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                            {item.agentName}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                            {config.label} · {timeAgo}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
