"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformConnectionCard } from "@/components/publishing/PlatformConnectionCard";
import { PublishHistoryTable } from "@/components/publishing/PublishHistoryTable";
import { PublishingSummaryStats } from "@/components/publishing/PublishingSummaryStats";
import { ApprovalQueue } from "@/components/publishing/ApprovalQueue";
import { ChannelGroupManager } from "@/components/publishing/ChannelGroupManager";

const TABS = [
  { id: "connections", label: "Conexiones" },
  { id: "history", label: "Historial" },
  { id: "approvals", label: "Aprobaciones" },
  { id: "groups", label: "Grupos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PublishingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("connections");

  const linkedinStatus = useQuery(api.linkedin.queries.getConnectionStatus);
  const twitterStatus = useQuery(api.twitter.queries.getConnectionStatus);
  const instagramStatus = useQuery(api.instagram.queries.getConnectionStatus);
  const emailStatus = useQuery(api.email.queries.getConnectionStatus);

  const getStatus = (result: unknown): "connected" | "disconnected" | "error" => {
    if (result === undefined) return "disconnected";
    if (typeof result === "object" && result !== null && "status" in result) {
      const s = (result as { status: string }).status;
      if (s === "connected" || s === "error") return s;
    }
    return "disconnected";
  };

  const platforms = [
    { platform: "linkedin", connectionStatus: getStatus(linkedinStatus) },
    { platform: "twitter", connectionStatus: getStatus(twitterStatus) },
    { platform: "instagram", connectionStatus: getStatus(instagramStatus) },
    { platform: "email", connectionStatus: getStatus(emailStatus) },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <Send className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hub de Publicaciones</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Conexiones, historial, aprobaciones y grupos de canales
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "connections" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {platforms.map((p) => (
            <PlatformConnectionCard
              key={p.platform}
              platform={p.platform}
              connectionStatus={p.connectionStatus}
            />
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <PublishingSummaryStats />
          <PublishHistoryTable />
        </div>
      )}

      {activeTab === "approvals" && <ApprovalQueue />}

      {activeTab === "groups" && <ChannelGroupManager />}
    </div>
  );
}
