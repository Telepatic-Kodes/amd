import { SkeletonStat, SkeletonTable } from "@/components/ui/Skeleton";

export default function ControlCenterLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
