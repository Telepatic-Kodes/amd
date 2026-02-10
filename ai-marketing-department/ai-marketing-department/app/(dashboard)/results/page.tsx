"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Eye,
  MousePointerClick,
  Heart,
  TrendingUp,
  Download,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { LineChart } from "@/components/charts/LineChart";

export default function ResultsPage() {
  // Date range: last 30 days for engagement data
  const [dateRange] = useState(() => {
    const endDate = Date.now();
    const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
    return { startDate, endDate };
  });

  const campaigns = useQuery(api.functions.listCampaigns, {});
  const content = useQuery(api.functions.listContent, {});

  const analyticsData = useQuery(api.analytics.getAnalyticsWithDateRange, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const contentPerformance = useQuery(api.analytics.getContentPerformance, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    sortBy: "engagement",
  });

  const isLoading = !campaigns || !content || !analyticsData || !contentPerformance;

  // Compute engagement aggregates from real content performance data
  const engagementStats = (() => {
    if (!contentPerformance) return null;
    let totalImpressions = 0;
    let totalInteractions = 0;
    let totalShares = 0;

    for (const item of contentPerformance) {
      if (item.engagement) {
        totalImpressions += item.engagement.impressions;
        totalInteractions += item.engagement.likes + item.engagement.comments;
        totalShares += item.engagement.shares;
      }
    }

    const ctr =
      totalImpressions > 0
        ? ((totalInteractions / totalImpressions) * 100).toFixed(1)
        : "0.0";

    return { totalImpressions, totalInteractions, totalShares, ctr };
  })();

  const hasEngagementData = engagementStats && engagementStats.totalImpressions > 0;

  // Build chart data from real tasksByDay
  const chartData = (() => {
    if (!analyticsData) return [];
    const { tasksByDay } = analyticsData;
    return Object.entries(tasksByDay)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7)
      .map(([date, data]) => {
        const d = new Date(date);
        const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
        return {
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          tareas: data.completed + data.failed + (data.total - data.completed - data.failed),
        };
      });
  })();

  // Top 5 content from real engagement data
  const topContent = (() => {
    if (!contentPerformance) return [];
    return contentPerformance.slice(0, 5).map((item) => ({
      id: item.contentId,
      title: item.title,
      type: item.type,
      impressions: item.engagement?.impressions ?? 0,
      interactions: item.engagement
        ? item.engagement.likes + item.engagement.comments
        : 0,
      shares: item.engagement?.shares ?? 0,
    }));
  })();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900">
            Resultados
          </h1>
          <p className="text-stone-500 mt-2 md:mt-3 text-base md:text-lg">Cargando tus métricas...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-stone-200 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900">
            Tus Resultados
          </h1>
          <p className="text-stone-500 mt-2 md:mt-3 text-base md:text-lg">
            {hasEngagementData
              ? "Como esta performando tu contenido en LinkedIn."
              : "Sin datos — publica contenido en LinkedIn para ver metricas"}
          </p>
        </div>
      </div>

      {/* Main KPIs - 3 Big Numbers */}
      <div data-tour="results-page" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Impresiones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-5xl font-bold text-stone-900 mb-2">
              {engagementStats && engagementStats.totalImpressions >= 1000 ? (
                <>
                  <SimpleCounter value={Math.round(engagementStats.totalImpressions / 1000)} />
                  <span className="text-3xl text-stone-400">K</span>
                </>
              ) : (
                <SimpleCounter value={engagementStats?.totalImpressions ?? 0} />
              )}
            </p>
            <p className="text-base text-stone-500">Impresiones</p>
          </Card>
        </motion.div>

        {/* Interacciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50">
                <MousePointerClick className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-5xl font-bold text-stone-900 mb-2">
              <SimpleCounter value={engagementStats?.totalInteractions ?? 0} />
            </p>
            <p className="text-base text-stone-500">Interacciones</p>
          </Card>
        </motion.div>

        {/* Compartidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-5xl font-bold text-stone-900 mb-2">
              <SimpleCounter value={engagementStats?.totalShares ?? 0} />
            </p>
            <p className="text-base text-stone-500">Compartidos</p>
          </Card>
        </motion.div>
      </div>

      {/* Chart and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-stone-900 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                Tendencia (ultimos 7 dias)
              </h3>
              <Badge variant="default">Tareas</Badge>
            </div>
            <div className="h-80">
              {chartData.length > 0 ? (
                <LineChart
                  data={chartData}
                  dataKey="tareas"
                  name="Tareas"
                  showGrid={true}
                  showTooltip={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                    <p>Sin datos de tareas en este periodo</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-semibold text-stone-900 mb-4 md:mb-6">Resumen</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-stone-500">Campanas activas</span>
                <span className="text-2xl font-bold text-green-600">
                  {campaigns?.filter((c: { status: string }) => c.status === "active").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-stone-500">Contenido publicado</span>
                <span className="text-2xl font-bold text-orange-600">
                  {content?.filter((c: { status: string }) => c.status === "published").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">CTR promedio</span>
                <span className="text-2xl font-bold text-purple-600">
                  {engagementStats?.ctr ?? "0.0"}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3">
            <h3 className="text-xl md:text-2xl font-semibold text-stone-900">Top 5 Contenido</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {topContent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Titulo</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-stone-500">Tipo</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-stone-500">Impresiones</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-stone-500">Interacciones</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-stone-500">Compartidos</th>
                  </tr>
                </thead>
                <tbody>
                  {topContent.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-stone-900">
                        <div>
                          <p className="font-medium">{item.title}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-sm">
                        <Badge variant="default">{item.type}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-orange-600">
                        {item.impressions.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-green-600">
                        {item.interactions}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-purple-600">
                        {item.shares}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3" />
              <p className="text-base">Sin datos — publica contenido en LinkedIn para ver metricas</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-4 md:p-6 bg-orange-50 border-orange-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-stone-900 mb-2">Necesitas un reporte detallado?</h3>
              <p className="text-sm md:text-base text-stone-600">Descarga tu reporte completo de los ultimos 30 dias</p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors min-h-[44px] w-full md:w-auto">
              <Download className="w-4 h-4 inline mr-2" />
              Exportar Reporte
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
