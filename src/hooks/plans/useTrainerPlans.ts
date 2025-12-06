import { useQuery } from "@tanstack/react-query";
import type { ListPlansQuery } from "../../interface/plans";
import { fetchTrainerPlans } from "../../lib/plans.client";
import { plansKeys } from "../queryKeys";

export function useTrainerPlans(query: ListPlansQuery) {
  return useQuery({
    queryKey: plansKeys.list(query),
    queryFn: () => fetchTrainerPlans(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
