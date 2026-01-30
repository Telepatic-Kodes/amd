"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";

const SETTING_CATEGORIES = [
  { id: "integrations", label: "Integrations", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "agents", label: "Agent Config", icon: Bot },
  { id: "system", label: "System", icon: Database },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("integrations");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const settings = useQuery(api.functions.listSettings);
  const updateSetting = useMutation(api.functions.updateSetting);
  const upgradeAllAgents = useMutation(api.functions.upgradeAllAgentsModel);

  const [formState, setFormState] = useState<Record<string, any>>({});

  const handleSave = async (key: string, value: any, description?: string) => {
    setSaveStatus("saving");
    try {
      await updateSetting({ key, value, description });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const getSetting = (key: string, defaultValue: any = "") => {
    const setting = settings?.find((s) => s.key === key);
    return formState[key] ?? setting?.value ?? defaultValue;
  };

  const updateFormState = (key: string, value: any) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  if (!settings) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-zinc-400 mt-2">
            Configure system preferences.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse" />
          <div className="md:col-span-3 h-64 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div data-tour="settings" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-500/20 to-slate-500/20 border border-zinc-500/30">
            <Settings className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-zinc-500 text-sm">
              Configure system preferences and integrations
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
                Saving...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 mr-1" />
                Saved
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Error saving
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
                {SETTING_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeCategory === category.id
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Key className="h-5 w-5 text-indigo-500" />
                    API Keys
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Anthropic API Key */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "anthropic_api_key",
                            getSetting("anthropic_api_key"),
                            "Anthropic API key for Claude"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Required for AI agent operations
                    </p>
                  </div>

                  {/* OpenAI API Key (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      OpenAI API Key (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={getSetting("openai_api_key", "")}
                        onChange={(e) =>
                          updateFormState("openai_api_key", e.target.value)
                        }
                        placeholder="sk-..."
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "openai_api_key",
                            getSetting("openai_api_key"),
                            "OpenAI API key for embeddings"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Used for embeddings and fallback operations
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    External Services
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Webhook URL */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={getSetting("webhook_url", "")}
                        onChange={(e) =>
                          updateFormState("webhook_url", e.target.value)
                        }
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "webhook_url",
                            getSetting("webhook_url"),
                            "Webhook URL for notifications"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Receive notifications about agent activities
                    </p>
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
                <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Notification Preferences
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-zinc-500">
                      Receive daily summaries via email
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
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Slack Notifications */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Slack Notifications
                    </p>
                    <p className="text-xs text-zinc-500">
                      Send alerts to Slack channel
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
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Error Alerts */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                  <div>
                    <p className="text-sm font-medium text-white">Error Alerts</p>
                    <p className="text-xs text-zinc-500">
                      Get notified when agents fail
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
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Task Completion */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Task Completion
                    </p>
                    <p className="text-xs text-zinc-500">
                      Notify when important tasks complete
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
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
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
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Bot className="h-5 w-5 text-purple-500" />
                    Default Agent Configuration
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {/* Default Model */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Default Model
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
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="claude-opus-4-5-20251101">Claude Opus 4.5 (Max Plan)</option>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Balanced)</option>
                      <option value="claude-opus-4-20250514">Claude Opus 4</option>
                      <option value="claude-haiku-3-20250514">Claude Haiku 3 (Fast & Cheap)</option>
                    </select>
                    <p className="text-xs text-zinc-500 mt-1">
                      Model used for new agents by default. Opus 4.5 is most capable but costs more.
                    </p>
                  </div>

                  {/* Default Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Default Temperature: {getSetting("default_temperature", 0.7)}
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
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>Precise (0)</span>
                      <span>Creative (1)</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Default Max Tokens
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="256"
                        max="100000"
                        value={getSetting("default_max_tokens", 4096)}
                        onChange={(e) =>
                          updateFormState("default_max_tokens", parseInt(e.target.value))
                        }
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "default_max_tokens",
                            getSetting("default_max_tokens"),
                            "Default max tokens for agent responses"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Maximum output length for agent responses
                    </p>
                  </div>

                  {/* Max Retries */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Default Max Retries
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={getSetting("default_max_retries", 3)}
                        onChange={(e) =>
                          updateFormState("default_max_retries", parseInt(e.target.value))
                        }
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() =>
                          handleSave(
                            "default_max_retries",
                            getSetting("default_max_retries"),
                            "Default max retries for failed tasks"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Number of retry attempts for failed tasks
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Max Plan Upgrade */}
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Max Plan - Claude Opus 4.5
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <p className="text-sm font-medium text-amber-400 mb-2">
                      Upgrade All Agents to Max Plan
                    </p>
                    <p className="text-xs text-zinc-400 mb-4">
                      Claude Opus 4.5 is the most powerful model with superior reasoning,
                      creativity, and accuracy. Best for complex marketing strategies and content.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (window.confirm("This will upgrade all 37 agents to Claude Opus 4.5 (Max Plan). This increases cost but improves quality. Continue?")) {
                            setSaveStatus("saving");
                            try {
                              await upgradeAllAgents({ model: "claude-opus-4-5-20251101" });
                              setSaveStatus("saved");
                              setTimeout(() => setSaveStatus("idle"), 2000);
                            } catch (error) {
                              setSaveStatus("error");
                              setTimeout(() => setSaveStatus("idle"), 3000);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                      >
                        <Zap className="h-4 w-4 inline mr-2" />
                        Upgrade All to Opus 4.5
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("This will set all agents to Claude Sonnet 4 (balanced cost/quality). Continue?")) {
                            setSaveStatus("saving");
                            try {
                              await upgradeAllAgents({ model: "claude-sonnet-4-20250514" });
                              setSaveStatus("saved");
                              setTimeout(() => setSaveStatus("idle"), 2000);
                            } catch (error) {
                              setSaveStatus("error");
                              setTimeout(() => setSaveStatus("idle"), 3000);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-zinc-700 text-white text-sm font-medium hover:bg-zinc-600 transition-colors"
                      >
                        Reset to Sonnet 4
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500">Opus 4.5 pricing:</span>
                        <span className="text-white ml-1">$15/M input, $75/M output</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500">Sonnet 4 pricing:</span>
                        <span className="text-white ml-1">$3/M input, $15/M output</span>
                      </div>
                    </div>
                  </div>
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
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Database className="h-5 w-5 text-green-500" />
                    System Information
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                      <p className="text-xs text-zinc-500">Version</p>
                      <p className="text-sm font-medium text-white">1.0.0</p>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                      <p className="text-xs text-zinc-500">Environment</p>
                      <p className="text-sm font-medium text-white">Production</p>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                      <p className="text-xs text-zinc-500">Total Settings</p>
                      <p className="text-sm font-medium text-white">
                        <SimpleCounter value={settings.length} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                      <p className="text-xs text-zinc-500">Last Updated</p>
                      <p className="text-sm font-medium text-white">
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
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
                    <Shield className="h-5 w-5 text-red-500" />
                    Danger Zone
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                    <p className="text-sm font-medium text-red-400 mb-2">
                      Reset All Settings
                    </p>
                    <p className="text-xs text-zinc-500 mb-4">
                      This will reset all settings to their default values. This action
                      cannot be undone.
                    </p>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to reset all settings? This cannot be undone."
                          )
                        ) {
                          // Would implement reset logic here
                          alert("Settings reset functionality would go here");
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Reset Settings
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
