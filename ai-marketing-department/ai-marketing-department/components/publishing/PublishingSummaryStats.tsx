"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Linkedin, Twitter, Instagram, TrendingUp } from "lucide-react";

export function PublishingSummaryStats() {
  const summary = useQuery(api.crossPlatform.queries.getPublishingSummary);
  const isLoading = summary === undefined;

  const statCards = [
    {
      label: "Total Publicado",
      value: summary?.totalPublished ?? 0,
      icon: Send,
      color: "text-orange-500",
    },
    {
      label: "LinkedIn",
      value: summary?.byPlatform?.linkedin ?? 0,
      icon: Linkedin,
      color: "text-blue-600",
    },
    {
      label: "Twitter",
      value: summary?.byPlatform?.twitter ?? 0,
      icon: Twitter,
      color: "text-sky-500",
    },
    {
      label: "Tasa de Exito",
      value: summary ? `${Math.round(summary.successRate * 100)}%` : "0%",
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <stat.icon className={cn("h-5 w-5", stat.color)} />
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {isLoading ? "\u2014" : stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
