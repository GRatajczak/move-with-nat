import { Skeleton } from "@/components/ui/skeleton";

export const EditPlanLoading = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};
