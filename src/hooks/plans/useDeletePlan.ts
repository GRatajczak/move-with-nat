import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deletePlan } from "../../lib/plans.client";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, hard = false }: { planId: string; hard?: boolean }) => deletePlan(planId, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "list"] });
      toast.success("Plan usunięty");
    },
    onError: () => {
      toast.error("Nie udało się usunąć planu");
    },
  });
}
