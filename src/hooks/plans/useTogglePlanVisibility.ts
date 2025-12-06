import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlanDto } from "../../interface/plans";
import { togglePlanVisibility } from "../../lib/plans.client";
import { plansKeys } from "../queryKeys";
import { toast } from "sonner";

export function useTogglePlanVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, isHidden }: { planId: string; isHidden: boolean }) => togglePlanVisibility(planId, isHidden),
    onMutate: async ({ planId, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: plansKeys.detail(planId) });

      const previous = queryClient.getQueryData(plansKeys.detail(planId));

      queryClient.setQueryData(plansKeys.detail(planId), (old: PlanDto | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isHidden,
        };
      });

      return { previous, planId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
      toast.success("Widoczność zmieniona");
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(plansKeys.detail(context.planId), context.previous);
      }
      toast.error("Nie udało się zmienić widoczności");
    },
  });
}
