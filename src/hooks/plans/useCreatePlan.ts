import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePlanCommand, PlanDto } from "../../interface/plans";
import { ValidationError } from "../../lib/errors";
import { plansKeys } from "../queryKeys";

/**
 * Creates a new training plan
 */
async function createPlan(data: CreatePlanCommand): Promise<PlanDto> {
  const response = await fetch("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      if (response.status === 400 && error.details) {
        throw new ValidationError(error.details);
      }
      throw new Error(error.message || error.error || "Failed to create plan");
    }
    const text = await response.text();
    throw new Error(text || "Failed to create plan");
  }

  return response.json();
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanCommand) => createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
    },
  });
}
