// src/lib/mappers/planMappers.ts

import type { PlanViewModel, PlanFormData } from "@/interface/plans";

/**
 * Maps PlanDto/PlanViewModel to form data for editing
 */
export function mapPlanToFormData(plan: PlanViewModel): PlanFormData {
  return {
    name: plan.name,
    description: plan.description || "",
    clientId: plan.clientId,
    isHidden: plan.isHidden,
    exercises: plan.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sortOrder: ex.sortOrder,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo || "3-0-3",
      defaultWeight: ex.defaultWeight || null,
      exercise: undefined, // Will be populated from API if needed
    })),
  };
}
