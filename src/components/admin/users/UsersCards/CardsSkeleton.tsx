import { Skeleton } from "@/components/ui/skeleton";

export const CardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:px-0 px-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    ))}
  </div>
);
