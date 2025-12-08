import { useClientPlans } from "@/hooks/plans/useClientPlans";
import { PlanCardsGrid } from "./PlanCardsGrid";
import { PlanCardsSkeleton } from "./PlanCardsSkeleton";
import { EmptyPlansState } from "./EmptyPlansState";
import { ErrorPlansState } from "./ErrorPlansState";
import { QueryProvider } from "../../QueryProvider";

/**
 * Client Dashboard Page Component - Content
 * Displays all plans assigned to the client with sorting options
 */
function ClientDashboardPageContent() {
  // Fetch plans with current sort option
  const { data, isLoading, error, refetch } = useClientPlans({
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje plany</h1>
          <p className="text-muted-foreground mt-1">Przeglądaj swoje plany treningowe i śledź postępy</p>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Loading state */}
        {isLoading && <PlanCardsSkeleton count={4} />}

        {/* Error state */}
        {error && !isLoading && <ErrorPlansState onRetry={() => refetch()} />}

        {/* Empty state */}
        {!isLoading && !error && data?.plans && data.plans.length === 0 && <EmptyPlansState />}

        {/* Success state - display plans */}
        {!isLoading && !error && data?.plans && data.plans.length > 0 && <PlanCardsGrid plans={data.plans} />}
      </div>
    </div>
  );
}

/**
 * Client Dashboard Page Component with QueryProvider wrapper
 */
export function ClientDashboardPage() {
  return (
    <QueryProvider>
      <ClientDashboardPageContent />
    </QueryProvider>
  );
}
