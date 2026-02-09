"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Eye,
  MousePointerClick,
  Heart,
  TrendingUp,
  Download,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { LineChart } from "@/components/charts/LineChart";
import { translate } from "@/lib/language";

// Generate mock chart data for last 7 days
function generateChartData() {
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const data = [];
  for (let i = 0; i < labels.length; i++) {
    data.push({
      name: labels[i],
      views: Math.floor(Math.random() * 5000) + 2000,
      clicks: Math.floor(Math.random() * 800) + 200,
      engagement: Math.floor(Math.random() * 400) + 50,
    });
  }
  return data;
}

// Generate top performing content
function generateTopContent() {
  return [
    {
      id: "1",
      title: "10 estrategias de marketing digital que funcionan",
      type: "Blog Post",
      views: 4234,
      clicks: 342,
      engagement: 89,
    },
    {
      id: "2",
      title: "Guía completa de SEO en 2025",
      type: "Guide",
      views: 3891,
      clicks: 321,
      engagement: 76,
    },
    {
      id: "3",
      title: "Las mejores herramientas de automatización",
      type: "Comparison",
      views: 3456,
      clicks: 289,
      engagement: 65,
    },
    {
      id: "4",
      title: "Cómo aumentar tu engagement en LinkedIn",
      type: "Tips",
      views: 2987,
      clicks: 234,
      engagement: 54,
    },
    {
      id: "5",
      title: "Tendencias de contenido para este año",
      type: "Report",
      views: 2654,
      clicks: 198,
      engagement: 42,
    },
  ];
}

export default function ResultsPage() {
  const campaigns = useQuery(api.functions.listCampaigns, {});
  const content = useQuery(api.functions.listContent, {});

  // Mock analytics data
  const analytics = {
    totalViews: 18622,
    totalClicks: 1384,
    totalEngagement: 326,
    viewsTrend: 15.3,
    clicksTrend: 8.2,
    engagementTrend: 12.1,
  };

  const chartData = generateChartData();
  const topContent = generateTopContent();

  const isLoading = !campaigns || !content;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Resultados
          </h1>
          <p className="text-gray-500 mt-2 md:mt-3 text-base md:text-lg">Cargando tus métricas...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-gray-200 bg-white animate-pulse" />
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
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Tus Resultados
          </h1>
          <p className="text-gray-500 mt-2 md:mt-3 text-base md:text-lg">
            Cómo está performando tu contenido en los últimos 7 días.
          </p>
        </div>
      </div>

      {/* Main KPIs - 3 Big Numbers */}
      <div data-tour="results-page" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Vistas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <TrendIndicator value={analytics.viewsTrend} size="sm" />
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              <SimpleCounter value={Math.round(analytics.totalViews / 1000)} />
              <span className="text-3xl text-gray-400">K</span>
            </p>
            <p className="text-base text-gray-500">Vistas totales</p>
          </Card>
        </motion.div>

        {/* Clicks */}
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
              <TrendIndicator value={analytics.clicksTrend} size="sm" />
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              <SimpleCounter value={analytics.totalClicks} />
            </p>
            <p className="text-base text-gray-500">Clicks</p>
          </Card>
        </motion.div>

        {/* Participación */}
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
              <TrendIndicator value={analytics.engagementTrend} size="sm" />
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              <SimpleCounter value={analytics.totalEngagement} />
            </p>
            <p className="text-base text-gray-500">Participación</p>
          </Card>
        </motion.div>
      </div>

      {/* Chart and Top Content */}
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
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Tendencia (últimos 7 días)
              </h3>
              <Badge variant="default">Vistas</Badge>
            </div>
            <div className="h-80">
              <LineChart
                data={chartData}
                dataKey="views"
                name="Vistas"
                showGrid={true}
                showTooltip={true}
              />
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
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">Resumen</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-500">Campañas activas</span>
                <span className="text-2xl font-bold text-green-600">
                  {campaigns?.filter((c: any) => c.status === "active").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-500">Contenido publicado</span>
                <span className="text-2xl font-bold text-blue-600">
                  {content?.filter((c: any) => c.status === "published").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CTR promedio</span>
                <span className="text-2xl font-bold text-purple-600">
                  7.4%
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
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900">Top 5 Contenido</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Título</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Vistas</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Participación</th>
                </tr>
              </thead>
              <tbody>
                {topContent.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{item.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-sm">
                      <Badge variant="default">{item.type}</Badge>
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-blue-600">
                      {item.views.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-green-600">
                      {item.clicks}
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-purple-600">
                      {item.engagement}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-4 md:p-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">Necesitas un reporte detallado?</h3>
              <p className="text-sm md:text-base text-gray-600">Descarga tu reporte completo de los últimos 30 días</p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors min-h-[44px] w-full md:w-auto">
              <Download className="w-4 h-4 inline mr-2" />
              Exportar Reporte
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
