import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePlanCommand } from "../../interface/plans";
import { createPlan } from "../../lib/plans.client";

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanCommand) => createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "list"] });
    },
  });
}
