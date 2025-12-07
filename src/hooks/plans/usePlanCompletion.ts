import { useQuery } from "@tanstack/react-query";
import type { ExerciseCompletionRecord } from "../../interface/plans";
import { plansKeys } from "../queryKeys";

/**
 * Fetches exercise completion status for a plan
 */
async function fetchPlanCompletion(planId: string): Promise<{
  planId: string;
  completionRecords: ExerciseCompletionRecord[];
}> {
  const response = await fetch(`/api/plans/${planId}/completion`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch completion");
  }

  return response.json();
}

export function usePlanCompletion(planId: string) {
  return useQuery({
    queryKey: plansKeys.completion(planId),
    queryFn: () => fetchPlanCompletion(planId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!planId,
  });
}
