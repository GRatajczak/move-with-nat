import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlanDto } from "../../interface/plans";
import { plansKeys } from "../queryKeys";
import { toast } from "sonner";

/**
 * Toggles plan visibility for client
 */
async function togglePlanVisibility(planId: string, isHidden: boolean): Promise<PlanDto> {
  const response = await fetch(`/api/plans/${planId}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isHidden }),
  });

  if (!response.ok) {
    throw new Error("Failed to toggle visibility");
  }

  return response.json();
}

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
