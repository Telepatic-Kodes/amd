"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { LABELS } from "@/lib/language";

export function ReportSettings() {
  const settings = useQuery(api.reports.getUserReportSettings);
  const updateSettings = useMutation(api.reports.updateReportSettings);
  const generateReport = useAction(api.reportsActions.generateReportNow);
  const { success, error: showError } = useToast();

  const [generating, setGenerating] = useState<"weekly" | "monthly" | null>(null);

  const handleToggleEmail = async (enabled: boolean) => {
    try {
      await updateSettings({ emailEnabled: enabled });
      success(LABELS.settingsSaved);
    } catch (error) {
      showError(LABELS.reportError);
    }
  };

  const handleFrequencyChange = async (frequency: "weekly" | "monthly" | "both") => {
    try {
      await updateSettings({ frequency });
      success(LABELS.settingsSaved);
    } catch (error) {
      showError(LABELS.reportError);
    }
  };

  const handleToggleNarrative = async (enabled: boolean) => {
    try {
      await updateSettings({ includeNarrative: enabled });
      success(LABELS.settingsSaved);
    } catch (error) {
      showError(LABELS.reportError);
    }
  };

  const handleEmailChange = async (email: string) => {
    try {
      await updateSettings({ recipientEmail: email });
      success(LABELS.settingsSaved);
    } catch (error) {
      showError(LABELS.reportError);
    }
  };

  const handleGenerateNow = async (type: "weekly" | "monthly") => {
    setGenerating(type);
    try {
      await generateReport({ type });
      success(LABELS.reportGenerated);
    } catch (error) {
      showError(LABELS.reportError);
    } finally {
      setGenerating(null);
    }
  };

  if (!settings) {
    return (
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="h-6 bg-stone-200 rounded animate-pulse w-1/3" />
        <div className="h-12 bg-stone-200 rounded animate-pulse" />
        <div className="h-12 bg-stone-200 rounded animate-pulse" />
        <div className="h-12 bg-stone-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 space-y-6">
      {/* Title */}
      <h3 className="text-lg font-semibold text-stone-100">{LABELS.reportSettings}</h3>

      {/* Email Delivery Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-300">{LABELS.emailDelivery}</p>
          <p className="text-xs text-stone-500">{LABELS.emailDeliveryDesc}</p>
        </div>
        <button
          onClick={() => handleToggleEmail(!settings.emailEnabled)}
          className={`w-11 h-6 rounded-full transition-colors ${
            settings.emailEnabled ? "bg-orange-500" : "bg-stone-700"
          } relative`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              settings.emailEnabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Frequency Selector */}
      <div>
        <p className="text-sm font-medium text-stone-300 mb-2">{LABELS.reportFrequency}</p>
        <div className="flex gap-2">
          {(["weekly", "monthly", "both"] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => handleFrequencyChange(freq)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                settings.frequency === freq
                  ? "bg-orange-500/10 border-orange-500 text-orange-400"
                  : "bg-stone-200 border-stone-300 text-stone-400 hover:bg-stone-100"
              }`}
            >
              {LABELS[freq]}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-300">{LABELS.includeAiInsights}</p>
          <p className="text-xs text-stone-500">{LABELS.includeAiInsightsDesc}</p>
        </div>
        <button
          onClick={() => handleToggleNarrative(!settings.includeNarrative)}
          className={`w-11 h-6 rounded-full transition-colors ${
            settings.includeNarrative ? "bg-orange-500" : "bg-stone-700"
          } relative`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              settings.includeNarrative ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Recipient Email */}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">
          {LABELS.recipientEmail}
        </label>
        <input
          type="email"
          inputMode="email"
          value={settings.recipientEmail || ""}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={(e) => handleEmailChange(e.target.value)}
          placeholder={settings.recipientEmail || "tu@correo.com"}
          className="w-full bg-stone-200 border border-stone-300 text-stone-100 placeholder-stone-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <p className="text-xs text-stone-500 mt-1">{LABELS.recipientEmailDesc}</p>
      </div>

      {/* Manual Trigger Section */}
      <div className="border-t border-stone-200 pt-4 mt-4">
        <p className="text-sm font-medium text-stone-300 mb-3">{LABELS.generateNow}</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateNow("weekly")}
            disabled={generating === "weekly"}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {generating === "weekly" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {LABELS.generating}
              </>
            ) : (
              `Generar ${LABELS.weeklyReport}`
            )}
          </button>
          <button
            onClick={() => handleGenerateNow("monthly")}
            disabled={generating === "monthly"}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {generating === "monthly" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {LABELS.generating}
              </>
            ) : (
              `Generar ${LABELS.monthlyReport}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
