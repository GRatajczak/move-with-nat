import { Skeleton } from "@/components/ui/skeleton";

const DetailSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex justify-between">
      <Skeleton className="h-10 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

export default DetailSkeleton;
