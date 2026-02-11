import { Skeleton } from "@/components/ui/Skeleton";

export default function OrgLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="space-y-8 w-full max-w-3xl">
          <div className="flex justify-center">
            <Skeleton className="h-20 w-48 rounded-xl" />
          </div>
          <div className="flex justify-center gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-36 rounded-xl" />
            ))}
          </div>
          <div className="flex justify-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
