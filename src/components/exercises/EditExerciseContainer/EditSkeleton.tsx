import { Skeleton } from "@/components/ui/skeleton";

const EditSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/3" />
    <div className="bg-card rounded-lg border p-6 space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-32" />
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  </div>
);

export default EditSkeleton;
