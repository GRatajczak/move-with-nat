// src/services/plan-exercises.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  AddExerciseToPlanCommand,
  UpdateExerciseInPlanCommand,
  PlanExerciseDto,
  MarkExerciseCompletionCommand,
  CompletionRecordDto,
  PlanCompletionDto,
  AuthenticatedUser,
} from "../interface";
import { DatabaseError, ForbiddenError, NotFoundError, ValidationError, ConflictError } from "../lib/errors";
import { isValidUUID } from "../lib/api-helpers";
import type { PlanExerciseRow } from "@/types/db";

/**
 * Add a single exercise to an existing training plan
 *
 * Authorization:
 * - Admin: Can add to any plan
 * - Trainer: Can add to own plans only
 * - Client: No access
 */
export async function addExerciseToPlan(
  supabase: SupabaseClient,
  planId: string,
  command: AddExerciseToPlanCommand,
  currentUser: AuthenticatedUser
): Promise<PlanExerciseDto> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ planId: "Invalid UUID format" });
  }

  // Fetch plan and check authorization
  const { data: plan, error: planError } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (planError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization check
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot modify plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Validate exercise exists
  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", command.exerciseId)
    .single();

  if (exerciseError || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("plan_exercises")
    .select("id")
    .eq("plan_id", planId)
    .eq("exercise_id", command.exerciseId)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("Exercise already exists in this plan");
  }

  // Insert plan_exercise
  const { data: planExercise, error } = await supabase
    .from("plan_exercises")
    .insert({
      plan_id: planId,
      exercise_id: command.exerciseId,
      exercise_order: command.sortOrder,
      tempo: command.tempo || "3-0-3",
      default_weight: command.defaultWeight ?? null,
      is_completed: false,
    })
    .select()
    .single();

  if (error || !planExercise) {
    console.error("Failed to add exercise to plan:", error);
    throw new DatabaseError("Failed to add exercise to plan");
  }

  return mapPlanExerciseToDto(planExercise);
}

/**
 * Update parameters of an exercise in a plan (sortOrder, tempo, weight)
 *
 * Authorization:
 * - Admin: Can update any plan
 * - Trainer: Can update own plans only
 * - Client: No access
 */
export async function updatePlanExercise(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  command: UpdateExerciseInPlanCommand,
  currentUser: AuthenticatedUser
): Promise<PlanExerciseDto> {
  // Validate UUIDs
  if (!isValidUUID(planId)) {
    throw new ValidationError({ planId: "Invalid UUID format" });
  }
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ exerciseId: "Invalid UUID format" });
  }

  // Check plan ownership
  const { data: plan, error: planError } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (planError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization check
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot modify plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Build update object
  const updateData: Database["public"]["Tables"]["plan_exercises"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (command.sortOrder !== undefined) {
    updateData.exercise_order = command.sortOrder;
  }
  if (command.tempo !== undefined) {
    updateData.tempo = command.tempo;
  }
  if (command.defaultWeight !== undefined) {
    updateData.default_weight = command.defaultWeight;
  }

  // Update
  const { data: updated, error } = await supabase
    .from("plan_exercises")
    .update(updateData)
    .eq("plan_id", planId)
    .eq("exercise_id", exerciseId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("Exercise not found in this plan");
    }
    console.error("Failed to update plan exercise:", error);
    throw new DatabaseError("Failed to update plan exercise");
  }

  if (!updated) {
    throw new NotFoundError("Exercise not found in this plan");
  }

  return mapPlanExerciseToDto(updated);
}

/**
 * Remove an exercise from a training plan
 *
 * Authorization:
 * - Admin: Can remove from any plan
 * - Trainer: Can remove from own plans only
 * - Client: No access
 */
export async function removePlanExercise(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  currentUser: AuthenticatedUser
): Promise<void> {
  // Validate UUIDs
  if (!isValidUUID(planId)) {
    throw new ValidationError({ planId: "Invalid UUID format" });
  }
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ exerciseId: "Invalid UUID format" });
  }

  // Check plan ownership
  const { data: plan, error: planError } = await supabase.from("plans").select("trainer_id").eq("id", planId).single();

  if (planError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization check
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot modify plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only modify your own plans");
  }

  // Delete
  const { error } = await supabase.from("plan_exercises").delete().eq("plan_id", planId).eq("exercise_id", exerciseId);

  if (error) {
    console.error("Failed to remove exercise from plan:", error);
    throw new DatabaseError("Failed to remove exercise from plan");
  }

  // Check if plan still has exercises
  const { count } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  if (count === 0) {
    console.warn(`Plan ${planId} has no exercises after removal`);
    // Optionally: mark plan as incomplete or notify
  }
}

/**
 * Mark an exercise as completed or not completed (with optional reason)
 *
 * Authorization:
 * - Admin: Can mark completion for any plan
 * - Trainer: No access (can't mark completion for clients)
 * - Client: Can mark only for own plans
 */
export async function markExerciseCompletion(
  supabase: SupabaseClient,
  planId: string,
  exerciseId: string,
  command: MarkExerciseCompletionCommand,
  currentUser: AuthenticatedUser
): Promise<CompletionRecordDto> {
  // Validate UUIDs
  if (!isValidUUID(planId)) {
    throw new ValidationError({ planId: "Invalid UUID format" });
  }
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ exerciseId: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("client_id, trainer_id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization: only client (trainee) or admin
  if (currentUser.role === "trainer") {
    throw new ForbiddenError("Trainers cannot mark completion");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new ForbiddenError("Can only mark completion for your own plans");
  }

  // Validation: if not completed, require reason
  if (!command.completed && !command.reasonId && !command.customReason) {
    throw new ValidationError({
      reason: "Either reasonId or customReason is required when not completed",
    });
  }

  // Validate reasonId if provided
  if (command.reasonId) {
    const { data: reason, error: reasonError } = await supabase
      .from("standard_reasons")
      .select("id")
      .eq("id", command.reasonId)
      .single();

    if (reasonError || !reason) {
      throw new NotFoundError("Reason not found");
    }
  }

  // Update plan_exercise
  const completedAt = new Date().toISOString();
  const updateData: Database["public"]["Tables"]["plan_exercises"]["Update"] = {
    is_completed: command.completed,
    updated_at: completedAt,
  };

  if (!command.completed) {
    updateData.reason_id = command.reasonId || null;
    updateData.custom_reason = command.customReason || null;
  } else {
    // Clear reasons if completed
    updateData.reason_id = null;
    updateData.custom_reason = null;
  }

  const { error } = await supabase
    .from("plan_exercises")
    .update(updateData)
    .eq("plan_id", planId)
    .eq("exercise_id", exerciseId);

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("Exercise not found in plan");
    }
    console.error("Failed to mark completion:", error);
    throw new DatabaseError("Failed to mark completion");
  }

  return {
    planId,
    exerciseId,
    isCompleted: command.completed,
    reasonId: updateData.reason_id ?? null,
    customReason: updateData.custom_reason ?? null,
    completedAt,
  };
}

/**
 * Get completion status for all exercises in a plan
 *
 * Authorization:
 * - Admin: Can view any plan
 * - Trainer: Can view own plans
 * - Client: Can view own plans
 */
export async function getPlanCompletion(
  supabase: SupabaseClient,
  planId: string,
  currentUser: AuthenticatedUser
): Promise<PlanCompletionDto> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ planId: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("client_id, trainer_id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }

  // Fetch completion records
  const { data: planExercises, error } = await supabase
    .from("plan_exercises")
    .select("exercise_id, is_completed, reason_id, custom_reason, updated_at")
    .eq("plan_id", planId)
    .order("exercise_order");

  if (error) {
    console.error("Failed to fetch completion records:", error);
    throw new DatabaseError("Failed to fetch completion records");
  }

  const completionRecords: CompletionRecordDto[] = (planExercises || []).map((pe) => ({
    planId,
    exerciseId: pe.exercise_id,
    isCompleted: pe.is_completed,
    reasonId: pe.reason_id,
    customReason: pe.custom_reason,
    completedAt: pe.updated_at,
  }));

  return {
    planId,
    completionRecords,
  };
}

/**
 * Helper: Maps database plan_exercises row to DTO
 */
function mapPlanExerciseToDto(planExercise: PlanExerciseRow): PlanExerciseDto {
  return {
    id: planExercise.id,
    exerciseId: planExercise.exercise_id,
    sortOrder: planExercise.exercise_order,
    sets: 0, // These fields are not stored in DB yet, default to 0
    reps: 0,
    tempo: planExercise.tempo,
    defaultWeight: planExercise.default_weight,
  };
}
