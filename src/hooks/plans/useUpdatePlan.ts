import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UpdatePlanCommand, PlanDto } from "../../interface/plans";
import { ValidationError } from "../../lib/errors";
import { plansKeys } from "../queryKeys";

/**
 * Updates an existing training plan
 */
async function updatePlan(planId: string, data: UpdatePlanCommand): Promise<PlanDto> {
  const response = await fetch(`/api/plans/${planId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      throw new ValidationError(error.details || { message: error.error });
    }
    throw new Error("Failed to update plan");
  }

  return response.json();
}

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
