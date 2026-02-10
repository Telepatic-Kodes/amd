import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

export default function CampaignsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <SkeletonGrid items={4} columns={2} />
    </div>
  );
}
