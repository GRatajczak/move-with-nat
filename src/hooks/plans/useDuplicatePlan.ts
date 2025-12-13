import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DuplicatePlanData, PlanDto, CreatePlanCommand, PlanViewModel } from "../../interface/plans";
import { toast } from "sonner";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { plansKeys } from "../queryKeys";

/**
 * Fetches single plan details (for duplication)
 */
async function fetchPlan(planId: string): Promise<PlanViewModel> {
  const response = await fetch(`/api/plans/${planId}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError("Plan not found");
    }
    throw new Error("Failed to fetch plan");
  }

  return response.json();
}

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
    const error = await response.json();
    if (response.status === 400) {
      throw new ValidationError(error.details || { message: error.error });
    }
    throw new Error("Failed to create plan");
  }

  return response.json();
}

/**
 * Duplicates an existing plan
 */
async function duplicatePlan(originalPlanId: string, data: DuplicatePlanData): Promise<PlanDto> {
  // First fetch the original plan
  const originalPlan = await fetchPlan(originalPlanId);

  // Create a new plan with copied exercises
  const createCommand: CreatePlanCommand = {
    name: data.name,
    clientId: data.clientId,
    trainerId: originalPlan.trainerId,
    isHidden: data.isHidden,
    description: originalPlan.description || "",
    exercises: originalPlan.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sortOrder: ex.sortOrder,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      defaultWeight: ex.defaultWeight || null,
    })),
  };

  return createPlan(createCommand);
}

export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: DuplicatePlanData }) => duplicatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
      toast.success("Plan zduplikowany");
    },
    onError: () => {
      toast.error("Nie udało się zduplikować planu");
    },
  });
}
