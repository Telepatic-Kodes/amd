import { SkeletonStat, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <SkeletonChart height={250} />
      <SkeletonTable rows={5} />
    </div>
  );
}
