"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  FileText,
  Bot,
  Zap,
  Clock,
  MessageSquare,
  Send,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Activity types
export type ActivityType =
  | "task_completed"
  | "task_failed"
  | "task_started"
  | "content_generated"
  | "agent_activated"
  | "agent_paused"
  | "handoff"
  | "execution";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: number;
  agent?: string;
  metadata?: Record<string, any>;
}

const activityConfig: Record<ActivityType, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
}> = {
  task_completed: {
    icon: CheckCircle2,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  task_failed: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  task_started: {
    icon: PlayCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  content_generated: {
    icon: FileText,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  agent_activated: {
    icon: Bot,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  agent_paused: {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  handoff: {
    icon: Send,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  execution: {
    icon: Zap,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
};

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  });
}

interface ActivityItemProps {
  activity: ActivityItem;
  isLast?: boolean;
}

function ActivityItemComponent({ activity, isLast }: ActivityItemProps) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex gap-3 group"
    >
      {/* Icon and timeline */}
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
          config.bgColor
        )}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-zinc-800 mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white">
              {activity.title}
            </p>
            {activity.description && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {activity.description}
              </p>
            )}
            {activity.agent && (
              <p className="text-xs text-zinc-600 mt-1 font-mono">
                {activity.agent}
              </p>
            )}
          </div>
          <span className="text-xs text-zinc-600 shrink-0">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ActivityFeed({
  activities,
  maxItems = 10,
  showEmpty = true,
  emptyMessage = "No recent activity",
  className,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === displayedActivities.length - 1}
            />
          ))
        ) : showEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <RefreshCw className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">{emptyMessage}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Compact variant for sidebars or smaller spaces
interface CompactActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function CompactActivityFeed({
  activities,
  maxItems = 5,
}: CompactActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayedActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded",
                config.bgColor
              )}>
                <Icon className={cn("h-3 w-3", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">
                  {activity.title}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
