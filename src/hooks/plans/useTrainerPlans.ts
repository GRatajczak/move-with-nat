import { useQuery } from "@tanstack/react-query";
import type { ListPlansQuery, PlanViewModel } from "../../interface/plans";
import type { PaginatedResponse } from "../../interface/common";
import { plansKeys } from "../queryKeys";

/**
 * Fetches trainer's plans with filtering and pagination
 */
async function fetchTrainerPlans(query: ListPlansQuery): Promise<PaginatedResponse<PlanViewModel>> {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.clientId) params.set("clientId", query.clientId);
  if (query.visible !== undefined) params.set("visible", String(query.visible));
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.includeExerciseDetails !== undefined) {
    params.set("includeExerciseDetails", String(query.includeExerciseDetails));
  }

  const response = await fetch(`/api/plans?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  return response.json();
}

export function useTrainerPlans(query: ListPlansQuery) {
  return useQuery({
    queryKey: plansKeys.list(query),
    queryFn: () => fetchTrainerPlans(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
