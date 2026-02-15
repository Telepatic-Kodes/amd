"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { DigestCard } from "./DigestCard";

interface DigestListProps {
  statusFilter: string;
}

export function DigestList({ statusFilter }: DigestListProps) {
  const queryArgs = statusFilter === "all"
    ? { limit: 20 }
    : { status: statusFilter as "pending" | "generated" | "sent" | "failed", limit: 20 };

  const digests = useQuery(api.monitoring.queries.listDigests, queryArgs);

  if (digests === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] dark:bg-[var(--surface-0)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--text-secondary)]">No hay digests disponibles</p>
        <a
          href="/settings"
          className="text-xs text-orange-500 hover:text-[var(--accent)] mt-2 inline-block"
        >
          Configurar Feeds →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {digests.map((digest) => (
        <DigestCard key={digest._id} digest={digest as any} />
      ))}
    </div>
  );
}
