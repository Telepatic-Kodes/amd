"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { GitBranch } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

export function ActiveChainsPanel() {
  const chains = useQuery(api.handoffEngine.listActiveChains);

  if (chains === undefined) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <GitBranch className="h-5 w-5 text-purple-500" />
            Cadenas Activas
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[var(--surface-1)] animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <GitBranch className="h-5 w-5 text-purple-500" />
            Cadenas Activas
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            No hay cadenas de handoff activas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <GitBranch className="h-5 w-5 text-purple-500" />
          Cadenas Activas
          <span className="ml-auto text-xs font-normal text-[var(--text-secondary)]">
            {chains.length} activa{chains.length !== 1 ? "s" : ""}
          </span>
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {chains.map((chain) => {
          const progress = chain.totalTasks > 0
            ? Math.round((chain.completedTasks / chain.totalTasks) * 100)
            : 0;

          return (
            <div
              key={chain.rootTaskId}
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-0)]"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {chain.rootTaskType.replace(/_/g, " ")}
                </p>
                <span className="text-xs text-[var(--text-secondary)]">
                  {chain.completedTasks}/{chain.totalTasks} tareas
                </span>
              </div>
              <div className="w-full bg-[var(--surface-1)] rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {chain.runningTasks > 0 && `${chain.runningTasks} ejecutando`}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {progress}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
