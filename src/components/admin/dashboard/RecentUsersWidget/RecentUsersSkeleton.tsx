import { Skeleton } from "@/components/ui/skeleton";

export const RecentUsersSkeleton = () => (
  <ul className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <li key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </li>
    ))}
  </ul>
);
