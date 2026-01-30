"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Rocket,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { Sparkline } from "@/components/charts/Sparkline";
import { chartColors } from "@/components/charts/theme";
import { translate } from "@/lib/language";
import { FeedHealthSummary } from "@/components/feeds/FeedHealthSummary";

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Generate mock sparkline data
function generateSparklineData(length: number = 7) {
  const data = [];
  let value = Math.random() * 100 + 50;
  for (let i = 0; i < length; i++) {
    value = Math.max(10, value + (Math.random() - 0.45) * 20);
    data.push({ value: Math.round(value) });
  }
  return data;
}

export default function DashboardPage() {
  const campaigns = useQuery(api.functions.listCampaigns, {});
  const content = useQuery(api.functions.listContent, {});
  const agents = useQuery(api.functions.listAgents, {});

  // Calculate summary stats
  const stats = {
    activeCampaigns: campaigns?.filter((c: any) => c.status === "active").length || 0,
    totalCampaigns: campaigns?.length || 0,
    generatedContent: content?.filter((c: any) => c.status !== "draft").length || 0,
    draftContent: content?.filter((c: any) => c.status === "draft").length || 0,
    totalAgents: agents?.length || 0,
    activeAgents: agents?.filter((a: any) => a.status === "active").length || 0,
  };

  // Calculate content by status
  const contentStats = {
    draft: content?.filter((c: any) => c.status === "draft").length || 0,
    review: content?.filter((c: any) => c.status === "review").length || 0,
    approved: content?.filter((c: any) => c.status === "approved").length || 0,
    published: content?.filter((c: any) => c.status === "published").length || 0,
  };

  const isLoading = !campaigns || !content || !agents;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Welcome back! Here's what's happening with your marketing.
          </p>
        </div>
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12">
      {/* Header with Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            ¡Buenos días! 👋
          </h1>
          <p className="text-zinc-400 mt-2 md:mt-3 text-base md:text-lg">
            Aquí está lo más importante de tu marketing hoy.
          </p>
        </div>
      </div>

      {/* Key Metrics - Simplified to 3 larger cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Campaigns Running */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Rocket className="w-6 h-6 text-green-400" />
              </div>
              <TrendIndicator value={12} size="sm" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              <SimpleCounter value={stats.activeCampaigns} />
            </p>
            <p className="text-base text-zinc-400">{translate("activeCampaigns")}</p>
            <div className="mt-4 h-10">
              <Sparkline
                data={generateSparklineData()}
                height={40}
                color={chartColors.success}
                showTooltip={false}
              />
            </div>
          </Card>
        </motion.div>

        {/* Content Listo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <TrendIndicator value={8.5} size="sm" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              <SimpleCounter value={contentStats.approved + contentStats.published} />
            </p>
            <p className="text-base text-zinc-400">{translate("approved")}</p>
            <div className="mt-4 h-10">
              <Sparkline
                data={generateSparklineData()}
                height={40}
                color={chartColors.primary}
                showTooltip={false}
              />
            </div>
          </Card>
        </motion.div>

        {/* En Revisión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <TrendIndicator value={-2.1} size="sm" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              <SimpleCounter value={contentStats.review} />
            </p>
            <p className="text-base text-zinc-400">{translate("review")}</p>
            <div className="mt-4 h-10">
              <Sparkline
                data={generateSparklineData()}
                height={40}
                color={chartColors.departments.demandgen}
                showTooltip={false}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Content Workflow Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Content Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              Estado del contenido
            </h3>
            <div className="space-y-4">
              {[
                { label: translate("draft"), count: contentStats.draft, color: "text-gray-400" },
                { label: translate("review"), count: contentStats.review, color: "text-yellow-400" },
                { label: translate("approved"), count: contentStats.approved, color: "text-blue-400" },
                { label: translate("published"), count: contentStats.published, color: "text-green-400" },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center justify-between">
                  <span className="text-base text-zinc-400">{stage.label}</span>
                  <span className={`text-lg font-semibold ${stage.color}`}>
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6 flex items-center gap-3">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              {translate("whatNext")}
            </h3>
            <div className="space-y-3">
              {contentStats.review > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-base font-medium text-white">
                      📝 Revisar contenido
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {contentStats.review} pendiente{contentStats.review > 1 ? "s" : ""} de aprobación
                    </p>
                  </div>
                </div>
              )}
              {contentStats.draft > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-base font-medium text-white">
                      ✍️ Crear más contenido
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {contentStats.draft} borrador{contentStats.draft > 1 ? "s" : ""} listos para mejorar
                    </p>
                  </div>
                </div>
              )}
              {stats.activeCampaigns === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Rocket className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-base font-medium text-white">
                      🚀 Lanzar campaña
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Sin campañas activas en este momento
                    </p>
                  </div>
                </div>
              )}
              {stats.activeCampaigns > 0 && contentStats.review === 0 && contentStats.draft === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-base font-medium text-white">
                      ✅ Todo en marcha
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Contenido publicado, campañas activas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Feed Health Summary Widget */}
      <FeedHealthSummary />
    </div>
  );
}
