"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface-2)]",
        className
      )}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonStat({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-9 w-20 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function SkeletonChart({ className, height = 200 }: SkeletonProps & { height?: number }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div style={{ height }} className="relative">
        {/* Simulated chart bars */}
        <div className="absolute inset-0 flex items-end gap-2 px-4">
          {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t animate-pulse bg-[var(--surface-2)]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonDonut({ className, size = 200 }: SkeletonProps & { size?: number }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 flex items-center justify-center",
        className
      )}
    >
      <div
        className="rounded-full border-8 border-[var(--border)] animate-pulse"
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full rounded-full bg-[var(--surface-1)]/50" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-3 border-b border-[var(--border)]">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5, className }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)]/50"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({
  items = 6,
  columns = 3,
  className
}: SkeletonProps & { items?: number; columns?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({
  groups = 3,
  itemsPerGroup = 4,
  className,
}: SkeletonProps & { groups?: number; itemsPerGroup?: number }) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: groups }).map((_, g) => (
        <div key={g} className="space-y-2">
          {/* Group title */}
          <Skeleton className="h-4 w-24 mb-3" />
          {/* Group items */}
          <div className="space-y-1">
            {Array.from({ length: itemsPerGroup }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-lg"
              >
                <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-40" />
                <div className="ml-auto flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DrawerSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 space-y-6", className)}>
      {/* Title */}
      <Skeleton className="h-6 w-48" />
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Config card skeleton */}
      <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {/* List items */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
