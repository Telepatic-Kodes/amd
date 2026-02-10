import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";

export default function FeedsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <SkeletonList items={5} />
    </div>
  );
}
