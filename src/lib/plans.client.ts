// src/lib/plans.client.ts

import type {
  CreatePlanCommand,
  DuplicatePlanData,
  ExerciseCompletionRecord,
  ListPlansQuery,
  PlanDto,
  PlanViewModel,
  UpdatePlanCommand,
} from "../interface/plans";
import type { PaginatedResponse } from "../interface/common";
import { NotFoundError, ValidationError } from "./errors";

/**
 * Fetches trainer's plans with filtering and pagination
 */
export async function fetchTrainerPlans(query: ListPlansQuery): Promise<PaginatedResponse<PlanViewModel>> {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.clientId) params.set("clientId", query.clientId);
  if (query.visible !== undefined) params.set("visible", String(query.visible));
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.includeExerciseDetails !== undefined) {
    params.set("includeExerciseDetails", String(query.includeExerciseDetails));
  }

  const response = await fetch(`/api/plans?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  return response.json();
}

/**
 * Fetches single plan details with exercises
 */
export async function fetchPlan(planId: string): Promise<PlanViewModel> {
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
export async function createPlan(data: CreatePlanCommand): Promise<PlanDto> {
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
 * Updates an existing training plan
 */
export async function updatePlan(planId: string, data: UpdatePlanCommand): Promise<PlanDto> {
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

/**
 * Deletes a training plan
 */
export async function deletePlan(planId: string, hard = false): Promise<void> {
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

/**
 * Toggles plan visibility for client
 */
export async function togglePlanVisibility(planId: string, isHidden: boolean): Promise<PlanDto> {
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

/**
 * Fetches exercise completion status for a plan
 */
export async function fetchPlanCompletion(planId: string): Promise<{
  planId: string;
  completionRecords: ExerciseCompletionRecord[];
}> {
  const response = await fetch(`/api/plans/${planId}/completion`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch completion");
  }

  return response.json();
}

/**
 * Duplicates an existing plan
 */
export async function duplicatePlan(originalPlanId: string, data: DuplicatePlanData): Promise<PlanDto> {
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
