"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "execution" | "task";
  agentName: string;
  agentId: string;
  department: string;
  description: string;
  status: string;
  timestamp: number;
  tokensUsed?: number;
  duration?: number;
}

interface ActivityFeedProps {
  activities: ActivityItem[] | undefined;
  isLoading?: boolean;
}

// Status color configuration
const statusConfig: Record<string, { dot: string; text: string; pulse?: boolean }> = {
  success: { dot: "bg-green-500", text: "text-green-400" },
  completed: { dot: "bg-green-500", text: "text-green-400" },
  failure: { dot: "bg-red-500", text: "text-red-400" },
  failed: { dot: "bg-red-500", text: "text-red-400" },
  error: { dot: "bg-red-500", text: "text-red-400" },
  running: { dot: "bg-orange-500", text: "text-orange-400", pulse: true },
  pending: { dot: "bg-stone-500", text: "text-stone-500" },
  queued: { dot: "bg-stone-500", text: "text-stone-500" },
};

// Loading skeleton component
function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0 animate-pulse">
      <div className="w-16 h-4 bg-stone-100 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-stone-100 rounded w-3/4"></div>
        <div className="h-3 bg-stone-100 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-stone-100/50 p-4 mb-4">
        <Clock className="h-8 w-8 text-stone-400" />
      </div>
      <p className="text-sm text-stone-400">Sin actividad reciente</p>
    </div>
  );
}

// Individual activity item component
function ActivityItemRow({ activity }: { activity: ActivityItem }) {
  const config = statusConfig[activity.status] || {
    dot: "bg-stone-500",
    text: "text-stone-500"
  };

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      {/* Timestamp - Left column */}
      <div className="text-xs text-stone-400 whitespace-nowrap pt-0.5 w-20 shrink-0">
        {relativeTime}
      </div>

      {/* Status dot + Content - Center column */}
      <div className="flex-1 min-w-0 flex items-start gap-2">
        {/* Status indicator */}
        <div className="relative mt-1.5 shrink-0">
          <div className={`h-2 w-2 rounded-full ${config.dot}`} />
          {config.pulse && (
            <div className={`absolute inset-0 h-2 w-2 rounded-full ${config.dot} animate-ping opacity-75`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium text-stone-900">
              {activity.agentName}
            </span>
            <span className={`text-sm ${config.text}`}>
              {activity.description}
            </span>
          </div>

          {/* Metadata badges - tokens and duration */}
          {(activity.tokensUsed || activity.duration) && (
            <div className="flex items-center gap-2 mt-1.5">
              {activity.tokensUsed && (
                <Badge variant="default" className="text-xs">
                  {activity.tokensUsed.toLocaleString()} tokens
                </Badge>
              )}
              {activity.duration && (
                <Badge variant="default" className="text-xs">
                  {(activity.duration / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities, isLoading = false }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Activity className="h-5 w-5 text-stone-500" />
        <h3 className="text-lg font-semibold text-stone-900">Actividad Reciente</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto px-4 md:px-6">
          {/* Loading state */}
          {isLoading && (
            <>
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
            </>
          )}

          {/* Empty state */}
          {!isLoading && (!activities || activities.length === 0) && (
            <EmptyState />
          )}

          {/* Activity items */}
          {!isLoading && activities && activities.length > 0 && (
            <div>
              {activities.map((activity) => (
                <ActivityItemRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
