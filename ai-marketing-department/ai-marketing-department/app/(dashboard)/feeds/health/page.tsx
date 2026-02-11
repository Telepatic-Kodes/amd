"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Download,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/language";

// Mock feed performance data
function generateFeedPerformance() {
  return [
    {
      id: "1",
      name: "HubSpot Blog",
      url: "https://blog.hubspot.com",
      status: "active",
      uptime: 99.8,
      itemsThisMonth: 125,
      lastError: null,
      syncSuccess: 98,
    },
    {
      id: "2",
      name: "Content Marketing Institute",
      url: "https://contentmarketinginstitute.com",
      status: "active",
      uptime: 99.5,
      itemsThisMonth: 87,
      lastError: null,
      syncSuccess: 97,
    },
    {
      id: "3",
      name: "Neil Patel Blog",
      url: "https://neilpatel.com",
      status: "paused",
      uptime: 95.2,
      itemsThisMonth: 156,
      lastError: "SSL cert issue",
      syncSuccess: 92,
    },
    {
      id: "4",
      name: "Marketing Dive",
      url: "https://marketingdive.com",
      status: "active",
      uptime: 99.9,
      itemsThisMonth: 98,
      lastError: null,
      syncSuccess: 99,
    },
    {
      id: "5",
      name: "Copyblogger",
      url: "https://copyblogger.com",
      status: "error",
      uptime: 87.3,
      itemsThisMonth: 45,
      lastError: "Timeout - 10 consecutive",
      syncSuccess: 73,
    },
  ];
}

// Mock recommendations
function generateRecommendations() {
  return [
    {
      type: "warning",
      title: "Copyblogger tiene problemas",
      message: "10 sincronizaciones consecutivas fallidas. Requiere revisión manual.",
      action: "Investigar",
    },
    {
      type: "info",
      title: "Neil Patel está pausado",
      message: "Revisa si aún deseas monitorear esta fuente. Ha generado 156 artículos este mes.",
      action: "Reactivar",
    },
    {
      type: "success",
      title: "4 de 5 fuentes funcionando bien",
      message: "Tu setup general está en buena salud. Mantén el monitoreo regular.",
      action: "Cerrar",
    },
  ];
}

export default function FeedsHealthPage() {
  const feeds = generateFeedPerformance();
  const recommendations = generateRecommendations();

  const stats = {
    totalFeeds: feeds.length,
    activeFeeds: feeds.filter((f) => f.status === "active").length,
    errorFeeds: feeds.filter((f) => f.status === "error").length,
    avgUptime: (feeds.reduce((sum, f) => sum + f.uptime, 0) / feeds.length).toFixed(1),
    totalArticles: feeds.reduce((sum, f) => sum + f.itemsThisMonth, 0),
  };

  return (
    <div className="space-y-12">
      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
              Salud de Fuentes
            </h1>
            <p className="text-stone-400 mt-2 text-lg">
              Reporte mensual detallado de todas tus fuentes RSS
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Total Feeds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalFeeds}</p>
            <p className="text-sm text-stone-400">Fuentes totales</p>
          </Card>
        </motion.div>

        {/* Active Feeds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeFeeds}</p>
            <p className="text-sm text-stone-400">Activas ahora</p>
          </Card>
        </motion.div>

        {/* Problem Feeds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.errorFeeds}</p>
            <p className="text-sm text-stone-400">Con problemas</p>
          </Card>
        </motion.div>

        {/* Average Uptime */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgUptime}%</p>
            <p className="text-sm text-stone-400">Disponibilidad promedio</p>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Recomendaciones
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const bgColor =
                rec.type === "warning"
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : rec.type === "error"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-green-500/10 border-green-500/20";

              const iconColor =
                rec.type === "warning"
                  ? "text-yellow-400"
                  : rec.type === "error"
                    ? "text-red-400"
                    : "text-green-400";

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor}`}
                >
                  <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className="font-medium text-white">{rec.title}</p>
                    <p className="text-sm text-stone-400 mt-1">{rec.message}</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg text-sm font-medium text-orange-400 hover:bg-orange-500/20 transition-colors flex-shrink-0">
                    {rec.action}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Feed Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-white mb-4">Rendimiento de fuentes</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-400">
                    Fuente
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-stone-400">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-stone-400">
                    Disponibilidad
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-stone-400">
                    Artículos
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-stone-400">
                    Sincronización
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-stone-400">
                    Últimos problemas
                  </th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr
                    key={feed.id}
                    className="border-b border-stone-200/50 hover:bg-stone-100/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm">
                      <div>
                        <p className="font-medium text-white">{feed.name}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{feed.url}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Badge
                        variant={
                          feed.status === "active"
                            ? "success"
                            : feed.status === "paused"
                              ? "warning"
                              : "error"
                        }
                      >
                        {feed.status === "active"
                          ? "Activa"
                          : feed.status === "paused"
                            ? "Pausada"
                            : "Error"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p
                        className={`font-semibold ${
                          feed.uptime >= 99
                            ? "text-green-400"
                            : feed.uptime >= 95
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {feed.uptime.toFixed(1)}%
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-semibold text-orange-400">
                        {feed.itemsThisMonth}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-semibold text-green-400">
                        {feed.syncSuccess}%
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-stone-400">
                      {feed.lastError ? (
                        <span className="text-red-400 font-medium">
                          {feed.lastError}
                        </span>
                      ) : (
                        <span className="text-green-400">Ninguno</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/30">
          <h3 className="text-2xl font-semibold text-white mb-2">¿Cómo mejoro la salud?</h3>
          <ul className="space-y-2 text-stone-300">
            <li>✓ Revisa regularmente fuentes con bajo rendimiento</li>
            <li>✓ Elimina fuentes pausadas que ya no uses</li>
            <li>✓ Aumenta el intervalo de sincronización para fuentes lentas</li>
            <li>✓ Monitorea errores SSL o cambios de URL en fuentes externas</li>
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}
