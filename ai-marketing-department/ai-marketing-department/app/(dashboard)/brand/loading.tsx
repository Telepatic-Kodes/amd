import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";

export default function BrandLoading() {
  return (
    <div className="space-y-6">
      <SkeletonCard />
      <SkeletonList items={4} />
    </div>
  );
}
