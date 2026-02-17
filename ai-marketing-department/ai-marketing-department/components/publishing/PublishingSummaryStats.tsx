"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Linkedin, Twitter, Instagram, TrendingUp } from "lucide-react";

export function PublishingSummaryStats() {
  const summary = useQuery(api.crossPlatform.queries.getPublishingSummary);
  const isLoading = summary === undefined;

  const totalPublished = summary?.total?.published ?? 0;
  const totalFailed = summary?.total?.failed ?? 0;
  const totalAll = totalPublished + totalFailed;
  const successRate = totalAll > 0 ? (totalPublished / totalAll) * 100 : 0;

  const statCards = [
    {
      label: "Total Publicado",
      value: totalPublished,
      icon: Send,
      color: "text-orange-500",
    },
    {
      label: "LinkedIn",
      value: summary?.linkedin?.published ?? 0,
      icon: Linkedin,
      color: "text-blue-600",
    },
    {
      label: "Twitter",
      value: summary?.twitter?.published ?? 0,
      icon: Twitter,
      color: "text-sky-500",
    },
    {
      label: "Instagram",
      value: summary?.instagram?.published ?? 0,
      icon: Instagram,
      color: "text-pink-500",
    },
    {
      label: "Tasa de Exito",
      value: summary ? `${Math.round(successRate)}%` : "0%",
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
