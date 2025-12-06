import { useQuery } from "@tanstack/react-query";
import { fetchPlanCompletion } from "../../lib/plans.client";
import { plansKeys } from "../queryKeys";

export function usePlanCompletion(planId: string) {
  return useQuery({
    queryKey: plansKeys.completion(planId),
    queryFn: () => fetchPlanCompletion(planId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!planId,
  });
}
