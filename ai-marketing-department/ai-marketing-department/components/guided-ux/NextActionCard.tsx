"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  FileText,
  CheckCircle,
  Target,
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  X,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { getNextAction, type DashboardState, type NextAction } from "@/lib/next-action";
import { dismissNextAction, isNextActionDismissed } from "@/lib/guidance-state";
import { translate } from "@/lib/language";

const ICON_MAP = {
  rocket: Rocket,
  filetext: FileText,
  checkcircle: CheckCircle,
  target: Target,
  alertcircle: AlertCircle,
  activity: Activity,
  clock: Clock,
  trendingup: TrendingUp,
} as const;

const ICON_COLORS = {
  rocket: "text-green-400",
  filetext: "text-orange-400",
  checkcircle: "text-emerald-400",
  target: "text-purple-400",
  alertcircle: "text-yellow-400",
  activity: "text-cyan-400",
  clock: "text-orange-400",
  trendingup: "text-orange-400",
} as const;

const BG_COLORS = {
  rocket: "bg-green-500/10",
  filetext: "bg-orange-500/10",
  checkcircle: "bg-emerald-500/10",
  target: "bg-purple-500/10",
  alertcircle: "bg-yellow-500/10",
  activity: "bg-cyan-500/10",
  clock: "bg-orange-500/10",
  trendingup: "bg-orange-500/10",
} as const;

export function NextActionCard() {
  const campaigns = useQuery(api.functions.listCampaigns, {});
  const content = useQuery(api.functions.listContent, {});
  const agents = useQuery(api.functions.listAgents, {});
  const onboarding = useQuery(api.onboarding.get);
  const feeds = useQuery(api.feeds.publicQueries.listAllFeeds, {});

  const [dismissed, setDismissed] = useState(false);

  const dashboardState: DashboardState | null = useMemo(() => {
    if (!content || !campaigns || !agents) return null;

    const contentByStatus = content.reduce(
      (acc: Record<string, number>, c: Doc<"content">) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Find the most recent content creation
    const sortedContent = [...(content as Doc<"content">[])].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    const lastContentCreatedAt = sortedContent[0]?.createdAt;

    return {
      onboardingCompleted: !!onboarding,
      totalContent: content.length,
      draftContent: contentByStatus["draft"] || 0,
      reviewContent: contentByStatus["review"] || 0,
      approvedContent: contentByStatus["approved"] || 0,
      publishedContent: contentByStatus["published"] || 0,
      activeCampaigns: campaigns.filter((c: Doc<"campaigns">) => c.status === "active").length,
      totalCampaigns: campaigns.length,
      feedsWithErrors: feeds?.filter((f: Doc<"feeds">) => f.status === "error").length || 0,
      agentsInError: agents.filter((a: Doc<"agents">) => a.status === "error").length,
      totalAgents: agents.length,
      activeAgents: agents.filter((a: Doc<"agents">) => a.status === "active").length,
      lastContentCreatedAt,
    };
  }, [content, campaigns, agents, onboarding, feeds]);

  const action: NextAction | null = useMemo(() => {
    if (!dashboardState) return null;
    return getNextAction(dashboardState);
  }, [dashboardState]);

  // Don't render while loading
  if (!action || !dashboardState) return null;

  // Check if dismissed (24h localStorage)
  if (dismissed || isNextActionDismissed(action.id)) return null;

  const IconComponent = ICON_MAP[action.icon];
  const iconColor = ICON_COLORS[action.icon];
  const bgColor = BG_COLORS[action.icon];

  const handleDismiss = () => {
    dismissNextAction(action.id);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative group rounded-xl border border-stone-200 bg-gradient-to-r from-stone-100/80 to-stone-900/50 p-4 md:p-5 overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative flex items-center gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-lg ${bgColor} flex-shrink-0`}>
              <IconComponent className={`w-5 h-5 ${iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Lightbulb className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-xs text-stone-500 font-medium">
                  {translate("whatNext")}
                </span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {action.title}
              </p>
              <p className="text-xs text-stone-400 mt-0.5 truncate">
                {action.description}
              </p>
            </div>

            {/* Action button */}
            <Link
              href={action.href}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors flex-shrink-0"
            >
              Ir
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-400 hover:bg-stone-200 transition-colors flex-shrink-0"
              title="Ocultar por hoy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
