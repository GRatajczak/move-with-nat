import { useQuery } from "@tanstack/react-query";
import { fetchPlan } from "../../lib/plans.client";
import { plansKeys } from "../queryKeys";

export function usePlan(planId: string) {
  return useQuery({
    queryKey: plansKeys.detail(planId),
    queryFn: () => fetchPlan(planId),
    staleTime: 2 * 60 * 1000,
    enabled: !!planId,
  });
}
