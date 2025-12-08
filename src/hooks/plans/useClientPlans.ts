import { useQuery } from "@tanstack/react-query";
import type { ClientPlansQuery, ClientPlanCardVM, ClientPlanDto } from "@/interface/client-dashboard";
import type { PaginatedResponse, PlanViewModel } from "@/interface";
import { plansKeys } from "../queryKeys";
import { mapClientPlanDtoToVM } from "@/lib/mappers";

/**
 * Temporary adapter: converts PlanViewModel to ClientPlanDto format
 * TODO: Update backend to return proper ClientPlanDto format
 */
function adaptPlanViewModelToClientPlanDto(plan: PlanViewModel): ClientPlanDto {
  // Calculate completion stats from exercises
  const totalExercises = plan.exercises?.length || 0;
  const completedExercises = plan.completionStats?.completed || 0;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    createdAt: plan.createdAt,
    trainer: {
      id: plan.trainerId || "",
      firstName: "Trener", // TODO: Get from backend
      lastName: "",
      avatarUrl: undefined,
    },
    completedExercises,
    totalExercises,
  };
}

/**
 * Fetches client's plans with filtering and pagination
 * Used in client dashboard to display plan cards
 */
async function fetchClientPlans(query: ClientPlansQuery): Promise<{
  plans: ClientPlanCardVM[];
  meta: { page: number; limit: number; total: number };
}> {
  const params = new URLSearchParams();

  // Always filter for visible plans only (client can only see visible plans)
  params.set("visible", "true");

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await fetch(`/api/plans?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch client plans");
  }

  const data: PaginatedResponse<PlanViewModel> = await response.json();

  // Adapt and map data to ViewModels
  const clientPlans = data.data.map(adaptPlanViewModelToClientPlanDto);
  const plans = clientPlans.map(mapClientPlanDtoToVM);

  // Apply client-side sorting for progress (temporary until backend supports it)
  if (query.sort === "progress_desc") {
    plans.sort((a, b) => {
      const percentA = a.progressMax > 0 ? a.progressValue / a.progressMax : 0;
      const percentB = b.progressMax > 0 ? b.progressValue / b.progressMax : 0;
      return percentB - percentA;
    });
  } else if (query.sort === "progress_asc") {
    plans.sort((a, b) => {
      const percentA = a.progressMax > 0 ? a.progressValue / a.progressMax : 0;
      const percentB = b.progressMax > 0 ? b.progressValue / b.progressMax : 0;
      return percentA - percentB;
    });
  } else if (query.sort === "createdAt_asc") {
    plans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return {
    plans,
    meta: data.meta,
  };
}

/**
 * Hook for fetching client plans
 * @param query Query parameters (sort, page, limit)
 * @returns Query result with plans as ViewModels
 */
export function useClientPlans(query: ClientPlansQuery) {
  return useQuery({
    queryKey: plansKeys.list({ ...query, visible: true }),
    queryFn: () => fetchClientPlans(query),
    // staleTime: 60_000, // 1 minute
    // gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
}
