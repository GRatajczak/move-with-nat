import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UpdatePlanCommand } from "../../interface/plans";
import { updatePlan } from "../../lib/plans.client";
import { plansKeys } from "../queryKeys";

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UpdatePlanCommand }) => updatePlan(planId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plansKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
      toast.success("Plan zaktualizowany pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować planu");
    },
  });
}
