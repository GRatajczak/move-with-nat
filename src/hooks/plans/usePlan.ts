import { useQuery } from "@tanstack/react-query";
import type { PlanViewModel } from "../../interface/plans";
import { NotFoundError } from "../../lib/errors";
import { plansKeys } from "../queryKeys";

/**
 * Fetches single plan details with exercises
 */
async function fetchPlan(planId: string): Promise<PlanViewModel> {
  const response = await fetch(`/api/plans/${planId}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError("Plan not found");
    }
    throw new Error("Failed to fetch plan");
  }

  return response.json();
}

export function usePlan(planId: string) {
  return useQuery({
    queryKey: plansKeys.detail(planId),
    queryFn: () => fetchPlan(planId),
    staleTime: 2 * 60 * 1000,
    enabled: !!planId,
  });
}
