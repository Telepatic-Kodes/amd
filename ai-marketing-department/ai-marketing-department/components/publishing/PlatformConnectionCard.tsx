"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Linkedin, Twitter, Instagram, Mail, type LucideIcon } from "lucide-react";

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  email: Mail,
};

const PLATFORM_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  instagram: "Instagram",
  email: "Email",
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "text-[#0A66C2]",
  twitter: "text-[#1DA1F2]",
  instagram: "text-[#E4405F]",
  email: "text-amber-600",
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  connected: { color: "bg-green-500", label: "Conectado" },
  disconnected: { color: "bg-red-500", label: "Desconectado" },
  error: { color: "bg-amber-500", label: "Error" },
};

interface PlatformConnectionCardProps {
  platform: string;
  connectionStatus: "connected" | "disconnected" | "error";
}

export function PlatformConnectionCard({ platform, connectionStatus }: PlatformConnectionCardProps) {
  const Icon = PLATFORM_ICONS[platform] || Mail;
  const status = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.disconnected;

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-[var(--surface-1)]">
          <Icon className={cn("w-6 h-6", PLATFORM_COLORS[platform] ?? "text-orange-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {PLATFORM_NAMES[platform] ?? platform}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("w-2 h-2 rounded-full", status.color)} />
            <span className="text-xs text-[var(--text-secondary)]">{status.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
