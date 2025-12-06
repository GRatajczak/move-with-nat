import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DuplicatePlanData } from "../../interface/plans";
import { toast } from "sonner";
import { duplicatePlan } from "../../lib/plans.client";

export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: DuplicatePlanData }) => duplicatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "list"] });
      toast.success("Plan zduplikowany");
    },
    onError: () => {
      toast.error("Nie udało się zduplikować planu");
    },
  });
}
