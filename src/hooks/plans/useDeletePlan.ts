import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { NotFoundError } from "../../lib/errors";
import { plansKeys } from "../queryKeys";

/**
 * Deletes a training plan
 */
async function deletePlan(planId: string, hard = false): Promise<void> {
  const params = hard ? "?hard=true" : "";
  const response = await fetch(`/api/plans/${planId}${params}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError("Plan not found");
    }
    throw new Error("Failed to delete plan");
  }
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, hard = false }: { planId: string; hard?: boolean }) => deletePlan(planId, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
      toast.success("Plan usunięty");
    },
    onError: () => {
      toast.error("Nie udało się usunąć planu");
    },
  });
}
