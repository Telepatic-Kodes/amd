"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Bell,
  Palette,
  Database,
  Shield,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Bot,
  Zap,
  Sparkles,
  Share2,
  Users,
  FileText,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { LinkedInConnectionCard } from "@/components/linkedin/LinkedInConnectionCard";
import { TwitterConnectionCard } from "@/components/twitter/TwitterConnectionCard";
import { InstagramConnectionCard } from "@/components/instagram/InstagramConnectionCard";
import { QuickModeToggle } from "@/components/guided-ux/QuickModeToggle";
import { TeamManagement } from "@/components/team/TeamManagement";
import { ReportSettings } from "@/components/reports/ReportSettings";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { useTheme } from "@/hooks/useTheme";
import { ApiTokenManager } from "@/components/settings/ApiTokenManager";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { Globe, Webhook } from "lucide-react";

const SETTING_CATEGORIES = [
  { id: "integrations", label: "Integraciones", icon: Key },
  { id: "platforms", label: "Plataformas", icon: Share2 },
  { id: "api", label: "API Pública", icon: Globe },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "team", label: "Equipo", icon: Users },
  { id: "appearance", label: "Apariencia", icon: Palette },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "reports", label: "Reportes", icon: FileText },
  { id: "guidance", label: "Guía UX", icon: Sparkles },
  { id: "system", label: "Sistema", icon: Database },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("integrations");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toast = useToast();
  const { theme, setTheme, resolved } = useTheme();
  const settings = useQuery(api.functions.listSettings);
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateSetting = useMutation(api.functions.updateSetting);
  const upgradeAllAgents = useMutation(api.functions.upgradeAllAgentsModel);
  const resetAllSettings = useMutation(api.functions.resetAllSettings);

  const completeStep = useMutation(api.guidance.completeSetupStep);
  const [formState, setFormState] = useState<Record<string, string | number | boolean>>({});

  // Filter categories based on user role
  const visibleCategories = SETTING_CATEGORIES.filter((category) => {
    // "team" tab only visible to owner/admin
    if (category.id === "team") {
      return currentUser?.role === "owner" || currentUser?.role === "admin";
    }
    return true;
  });

  // Auto-mark "settingsReviewed" setup step
  useEffect(() => {
    completeStep({ step: "settingsReviewed" }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (key: string, value: string | number | boolean, description?: string) => {
    setSaveStatus("saving");
    try {
      await updateSetting({ key, value, description });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (_error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const getSetting = <T extends string | number | boolean>(key: string, defaultValue: T = "" as T): T => {
    const setting = settings?.find((s) => s.key === key);
    return (formState[key] ?? setting?.value ?? defaultValue) as T;
  };

  const updateFormState = (key: string, value: string | number | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  if (!settings) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            Configuración
          </h1>
          <p className="text-stone-500 mt-2">
            Configura las preferencias del sistema.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-64 rounded-xl border border-stone-200 bg-white animate-pulse" />
          <div className="md:col-span-3 h-64 rounded-xl border border-stone-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div data-tour="settings" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-100">
            <Settings className="w-8 h-8 text-stone-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Configuración
            </h1>
            <p className="text-stone-500 text-sm">
              Configura preferencias del sistema e integraciones
            </p>
          </div>
        </div>
        {saveStatus !== "idle" && (
          <Badge
            variant={
              saveStatus === "saving"
                ? "info"
                : saveStatus === "saved"
                ? "success"
                : "error"
            }
          >
            {saveStatus === "saving" && (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Guardando...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 mr-1" />
                Guardado
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Error al guardar
              </>
            )}
          </Badge>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {visibleCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeCategory === category.id
                        ? "bg-orange-50 text-orange-600"
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                    )}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeCategory === "integrations" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Key className="h-5 w-5 text-orange-600" />
                    Claves API
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Anthropic API Key */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Anthropic API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={getSetting("anthropic_api_key", "")}
                        onChange={(e) =>
                          updateFormState("anthropic_api_key", e.target.value)
                        }
                        placeholder="sk-ant-..."
                        className="flex-1 rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "anthropic_api_key",
                            getSetting("anthropic_api_key"),
                            "Anthropic API key for Claude"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Requerida para operaciones de agentes IA
                    </p>
                  </div>

                  {/* OpenAI API Key (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      OpenAI API Key (Opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={getSetting("openai_api_key", "")}
                        onChange={(e) =>
                          updateFormState("openai_api_key", e.target.value)
                        }
                        placeholder="sk-..."
                        className="flex-1 rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "openai_api_key",
                            getSetting("openai_api_key"),
                            "OpenAI API key for embeddings"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Usado para embeddings y operaciones de respaldo
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Servicios Externos
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Webhook URL */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        inputMode="url"
                        value={getSetting("webhook_url", "")}
                        onChange={(e) =>
                          updateFormState("webhook_url", e.target.value)
                        }
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "webhook_url",
                            getSetting("webhook_url"),
                            "Webhook URL for notifications"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Recibe notificaciones sobre actividad de agentes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "platforms" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Share2 className="h-5 w-5 text-orange-600" />
                    Plataformas de Publicacion
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Conecta tus cuentas para publicar contenido directamente desde AMD.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <LinkedInConnectionCard
                    convexSiteUrl={
                      typeof window !== "undefined"
                        ? process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site")
                        : undefined
                    }
                  />
                  <TwitterConnectionCard
                    convexSiteUrl={
                      typeof window !== "undefined"
                        ? process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site")
                        : undefined
                    }
                  />
                  <InstagramConnectionCard
                    convexSiteUrl={
                      typeof window !== "undefined"
                        ? process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site")
                        : undefined
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "appearance" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Palette className="h-5 w-5 text-orange-600" />
                    Tema de la Aplicacion
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Elige entre modo claro, oscuro o automático según tu sistema.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Light */}
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === "light"
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-50 border border-stone-200 flex items-center justify-center">
                        <Sun className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-stone-900">Claro</span>
                      {theme === "light" && (
                        <span className="text-xs text-orange-600 font-medium">Activo</span>
                      )}
                    </button>

                    {/* Dark */}
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === "dark"
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-stone-300" />
                      </div>
                      <span className="text-sm font-medium text-stone-900">Oscuro</span>
                      {theme === "dark" && (
                        <span className="text-xs text-orange-600 font-medium">Activo</span>
                      )}
                    </button>

                    {/* System */}
                    <button
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === "system"
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-stone-800 border border-stone-300 flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-stone-500" />
                      </div>
                      <span className="text-sm font-medium text-stone-900">Sistema</span>
                      {theme === "system" && (
                        <span className="text-xs text-orange-600 font-medium">
                          Activo ({resolved === "dark" ? "oscuro" : "claro"})
                        </span>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
            <Card>
              <CardHeader>
                <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Preferencias de Notificaciones
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Notificaciones por Email
                    </p>
                    <p className="text-xs text-stone-500">
                      Recibe resúmenes diarios por correo
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getSetting("email_notifications", false)}
                      onChange={(e) => {
                        updateFormState("email_notifications", e.target.checked);
                        handleSave(
                          "email_notifications",
                          e.target.checked,
                          "Enable email notifications"
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                {/* Slack Notifications */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Notificaciones Slack
                    </p>
                    <p className="text-xs text-stone-500">
                      Envía alertas al canal de Slack
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getSetting("slack_notifications", false)}
                      onChange={(e) => {
                        updateFormState("slack_notifications", e.target.checked);
                        handleSave(
                          "slack_notifications",
                          e.target.checked,
                          "Enable Slack notifications"
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                {/* Error Alerts */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div>
                    <p className="text-sm font-medium text-stone-900">Alertas de Error</p>
                    <p className="text-xs text-stone-500">
                      Recibe alertas cuando los agentes fallan
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getSetting("error_alerts", true)}
                      onChange={(e) => {
                        updateFormState("error_alerts", e.target.checked);
                        handleSave(
                          "error_alerts",
                          e.target.checked,
                          "Enable error alerts"
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                {/* Task Completion */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Tareas Completadas
                    </p>
                    <p className="text-xs text-stone-500">
                      Notifica cuando se completan tareas importantes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getSetting("task_completion_alerts", false)}
                      onChange={(e) => {
                        updateFormState("task_completion_alerts", e.target.checked);
                        handleSave(
                          "task_completion_alerts",
                          e.target.checked,
                          "Enable task completion alerts"
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {activeCategory === "agents" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Bot className="h-5 w-5 text-purple-600" />
                    Configuración de Agentes
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Default Model */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Modelo por Defecto
                    </label>
                    <select
                      value={getSetting("default_model", "claude-sonnet-4-20250514")}
                      onChange={(e) => {
                        updateFormState("default_model", e.target.value);
                        handleSave(
                          "default_model",
                          e.target.value,
                          "Default AI model for agents"
                        );
                      }}
                      className="w-full rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="claude-opus-4-5-20251101">Claude Opus 4.5 (Plan Max)</option>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Equilibrado)</option>
                      <option value="claude-opus-4-20250514">Claude Opus 4</option>
                      <option value="claude-haiku-3-20250514">Claude Haiku 3 (Rápido y Económico)</option>
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Modelo usado para nuevos agentes. Opus 4.5 es el más capaz pero cuesta más.
                    </p>
                  </div>

                  {/* Default Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Temperatura por Defecto: {getSetting("default_temperature", 0.7)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={getSetting("default_temperature", 0.7)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateFormState("default_temperature", value);
                        handleSave(
                          "default_temperature",
                          value,
                          "Default temperature for agent responses"
                        );
                      }}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-stone-500 mt-1">
                      <span>Preciso (0)</span>
                      <span>Creativo (1)</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Máximo de Tokens
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="256"
                        max="100000"
                        value={getSetting("default_max_tokens", 4096)}
                        onChange={(e) =>
                          updateFormState("default_max_tokens", parseInt(e.target.value))
                        }
                        className="flex-1 rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "default_max_tokens",
                            getSetting("default_max_tokens"),
                            "Default max tokens for agent responses"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Largo máximo de respuesta de los agentes
                    </p>
                  </div>

                  {/* Max Retries */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Reintentos Máximos
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="10"
                        value={getSetting("default_max_retries", 3)}
                        onChange={(e) =>
                          updateFormState("default_max_retries", parseInt(e.target.value))
                        }
                        className="flex-1 rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "default_max_retries",
                            getSetting("default_max_retries"),
                            "Default max retries for failed tasks"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Número de reintentos para tareas fallidas
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Max Plan Upgrade */}
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Max Plan - Claude Opus 4.5
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      Actualizar Todos los Agentes al Plan Max
                    </p>
                    <p className="text-xs text-stone-500 mb-4">
                      Claude Opus 4.5 es el modelo más potente con razonamiento, creatividad
                      y precisión superiores. Ideal para estrategias de marketing complejas.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (window.confirm("Esto actualizará los 37 agentes a Claude Opus 4.5 (Plan Max). Aumenta el costo pero mejora la calidad. ¿Continuar?")) {
                            setSaveStatus("saving");
                            try {
                              await upgradeAllAgents({ model: "claude-opus-4-5-20251101" });
                              setSaveStatus("saved");
                              setTimeout(() => setSaveStatus("idle"), 2000);
                            } catch (_error) {
                              setSaveStatus("error");
                              setTimeout(() => setSaveStatus("idle"), 3000);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-all"
                      >
                        <Zap className="h-4 w-4 inline mr-2" />
                        Actualizar a Opus 4.5
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Esto configurará todos los agentes a Claude Sonnet 4 (costo/calidad equilibrado). ¿Continuar?")) {
                            setSaveStatus("saving");
                            try {
                              await upgradeAllAgents({ model: "claude-sonnet-4-20250514" });
                              setSaveStatus("saved");
                              setTimeout(() => setSaveStatus("idle"), 2000);
                            } catch (_error) {
                              setSaveStatus("error");
                              setTimeout(() => setSaveStatus("idle"), 3000);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300 transition-colors"
                      >
                        Resetear a Sonnet 4
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-stone-100">
                        <span className="text-stone-500">Opus 4.5:</span>
                        <span className="text-stone-900 ml-1">$15/M entrada, $75/M salida</span>
                      </div>
                      <div className="p-2 rounded bg-stone-100">
                        <span className="text-stone-500">Sonnet 4:</span>
                        <span className="text-stone-900 ml-1">$3/M entrada, $15/M salida</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "team" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <TeamManagement />
            </motion.div>
          )}

          {activeCategory === "reports" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Reportes Automáticos
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Configura reportes automáticos semanales y mensuales.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <ReportSettings />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "guidance" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                    Guía y Onboarding
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Configura la experiencia de guía del sistema.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <QuickModeToggle />

                  <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-3">
                    <h4 className="text-sm font-medium text-stone-700">Sobre el Modo Express</h4>
                    <div className="space-y-2 text-xs text-stone-500">
                      <p>El Modo Express se desbloquea después de completar el onboarding 3 veces.</p>
                      <p>Cuando está activado:</p>
                      <ul className="ml-4 space-y-1 list-disc">
                        <li>Se omiten textos explicativos en el wizard</li>
                        <li>Los pasos se simplifican</li>
                        <li>Las animaciones son más rápidas</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "api" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Globe className="h-5 w-5 text-blue-600" />
                    API Pública REST
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Accede a contenido, agentes, analítica y estrategias vía API.
                    Ideal para integraciones con Zapier, Make, n8n o apps propias.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <ApiTokenManager />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "webhooks" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Webhook className="h-5 w-5 text-violet-600" />
                    Webhooks
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Recibe notificaciones en tiempo real cuando ocurren eventos en AMD.
                    Ideal para integraciones con sistemas externos.
                  </p>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <WebhookManager />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeCategory === "system" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Database className="h-5 w-5 text-green-600" />
                    Información del Sistema
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-stone-50">
                      <p className="text-xs text-stone-500">Versión</p>
                      <p className="text-sm font-medium text-stone-900">5.0.0</p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50">
                      <p className="text-xs text-stone-500">Entorno</p>
                      <p className="text-sm font-medium text-stone-900">Producción</p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50">
                      <p className="text-xs text-stone-500">Configuraciones</p>
                      <p className="text-sm font-medium text-stone-900">
                        <SimpleCounter value={settings.length} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50">
                      <p className="text-xs text-stone-500">Última Actualización</p>
                      <p className="text-sm font-medium text-stone-900">
                        {settings.length > 0
                          ? new Date(
                              Math.max(...settings.map((s) => s.updatedAt))
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                    <Shield className="h-5 w-5 text-red-600" />
                    Zona de Peligro
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                    <p className="text-sm font-medium text-red-700 mb-2">
                      Restablecer Configuración
                    </p>
                    <p className="text-xs text-stone-500 mb-4">
                      Esto restablecerá todas las configuraciones a sus valores por defecto.
                      Esta acción no se puede deshacer.
                    </p>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "¿Estás seguro de restablecer toda la configuración? Esto no se puede deshacer."
                          )
                        ) {
                          try {
                            const result = await resetAllSettings();
                            setFormState({});
                            toast.success(
                              "Configuración restablecida",
                              `Se eliminaron ${result.deleted} configuraciones.`
                            );
                          } catch (_err: unknown) {
                            toast.error(
                              "Error al restablecer",
                              "No se pudo restablecer la configuración. Intenta de nuevo."
                            );
                          }
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-200"
                    >
                      Restablecer
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
