// src/services/plans.service.ts

import { z } from "zod";
import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  CreatePlanCommand,
  PlanDto,
  PlanExerciseDto,
  ListPlansQuery,
  PaginatedResponse,
  AuthenticatedUser,
} from "../interface";
import type { UpdatePlanCommand } from "../types/plans";
import { DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { isValidUUID } from "../lib/api-helpers";
import { mapPlanToDTO, mapPlanWithExercisesToDTO, mapPlanExerciseToDTO } from "../lib/mappers";

/**
 * Validation schema for creating a plan
 * Both trainerId and clientId are optional (can be null in DB)
 */
export const CreatePlanCommandSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  trainerId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  isHidden: z.boolean().default(false),
  description: z.string().max(1000).trim().optional().or(z.literal("")).nullable(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        sortOrder: z.number().int().min(1),
        sets: z.number().int().min(1),
        reps: z.number().int().min(1),
        tempo: z
          .string()
          .regex(/^\d{4}$|^\d+-\d+-\d+$/, "Tempo must be in format XXXX or X-X-X")
          .default("3-0-3"),
        defaultWeight: z.number().min(0).optional().nullable(),
      })
    )
    .min(1, "At least one exercise is required"),
});

/**
 * Validation schema for updating a plan
 * trainerId and clientId can be set to null to unassign
 */
export const UpdatePlanCommandSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional().nullable(),
    isHidden: z.boolean().optional(),
    trainerId: z.string().uuid().optional().nullable(),
    clientId: z.string().uuid().optional().nullable(),
    exercises: z
      .array(
        z.object({
          exerciseId: z.string().uuid(),
          sortOrder: z.number().int().min(1),
          sets: z.number().int().min(1),
          reps: z.number().int().min(1),
          tempo: z
            .string()
            .regex(/^\d{4}$|^\d+-\d+-\d+$/, "Tempo must be in format XXXX or X-X-X")
            .default("3-0-3"),
          defaultWeight: z.number().min(0).optional().nullable(),
        })
      )
      .min(1, "At least one exercise is required")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Validation schema for toggling plan visibility
 */
export const TogglePlanVisibilityCommandSchema = z.object({
  isHidden: z.boolean(),
});

/**
 * Helper: Validates that a user exists and has trainer role
 */
async function validateTrainer(supabase: SupabaseClient, trainerId: string): Promise<void> {
  const { data: trainer, error } = await supabase.from("users").select("id, role").eq("id", trainerId).single();

  if (error || !trainer) {
    throw new NotFoundError("Trainer not found");
  }

  if (trainer.role !== "trainer") {
    throw new ValidationError({ trainerId: "User is not a trainer" });
  }
}

/**
 * Helper: Validates that a user exists and has client role
 */
async function validateClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  const { data: client, error } = await supabase.from("users").select("id, role").eq("id", clientId).single();

  if (error || !client) {
    throw new NotFoundError("Client not found");
  }

  if (client.role !== "client") {
    throw new ValidationError({ clientId: "User is not a client" });
  }
}

/**
 * Helper: Validates that an exercise exists
 */
async function validateExerciseExists(supabase: SupabaseClient, exerciseId: string): Promise<void> {
  const { data: exercise, error } = await supabase.from("exercises").select("id").eq("id", exerciseId).single();

  if (error || !exercise) {
    throw new NotFoundError(`Exercise with id ${exerciseId} not found`);
  }
}

/**
 * List plans with pagination and filtering
 *
 * Authorization:
 * - Admin: All plans
 * - Trainer: Own plans (trainer_id = user.id)
 * - Client: Own plans (client_id = user.id)
 */
export async function listPlans(
  supabase: SupabaseClient,
  query: ListPlansQuery,
  currentUser: AuthenticatedUser
): Promise<PaginatedResponse<PlanDto>> {
  const {
    trainerId,
    clientId,
    visible,
    page = 1,
    limit = 20,
    sortBy = "created_at",
    includeExerciseDetails = false,
  } = query;

  // Build query
  let dbQuery = supabase.from("plans").select("*", { count: "exact", head: false });

  // Force filters based on role
  if (currentUser.role === "trainer") {
    dbQuery = dbQuery.eq("trainer_id", currentUser.id);
  } else if (currentUser.role === "client") {
    dbQuery = dbQuery.eq("client_id", currentUser.id);
  }

  // Apply additional filters
  if (trainerId) {
    dbQuery = dbQuery.eq("trainer_id", trainerId);
  }
  if (clientId) {
    dbQuery = dbQuery.eq("client_id", clientId);
  }
  if (visible !== undefined) {
    dbQuery = dbQuery.eq("is_hidden", !visible);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order(sortBy, { ascending: false });

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listPlans:", error);
    throw new DatabaseError("Failed to fetch plans");
  }

  // Fetch exercises for all plans
  const planIds = (data || []).map((plan) => plan.id);
  const exercisesByPlan: Record<string, PlanExerciseDto[]> = {};

  if (planIds.length > 0) {
    // Build select query based on includeExerciseDetails flag
    const selectQuery = includeExerciseDetails ? "*, exercise:exercises(*)" : "*";

    const { data: planExercises, error: exError } = await supabase
      .from("plan_exercises")
      .select(selectQuery)
      .in("plan_id", planIds)
      .order("exercise_order");

    if (exError) {
      console.error("Failed to fetch plan exercises:", exError);
    } else {
      // Group exercises by plan ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (planExercises || []).forEach((pe: any) => {
        if (!exercisesByPlan[pe.plan_id]) {
          exercisesByPlan[pe.plan_id] = [];
        }
        exercisesByPlan[pe.plan_id].push(mapPlanExerciseToDTO(pe));
      });
    }
  }

  // Fetch client data for all plans with clientId
  const clientIds = [...new Set((data || []).map((plan) => plan.client_id).filter(Boolean))] as string[];
  const clientsByIds: Record<string, { first_name: string | null; last_name: string | null }> = {};

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", clientIds);

    if (clientsError) {
      console.error("Failed to fetch client data:", clientsError);
    } else {
      (clients || []).forEach((client) => {
        clientsByIds[client.id] = {
          first_name: client.first_name,
          last_name: client.last_name,
        };
      });
    }
  }

  // Map to DTOs with exercises and client data
  const planDTOs = (data || []).map((plan) => ({
    ...mapPlanToDTO(plan, plan.client_id ? clientsByIds[plan.client_id] : null),
    exercises: exercisesByPlan[plan.id] || [],
  }));

  return {
    data: planDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}

/**
 * Create a new plan with exercises
 *
 * Authorization:
 * - Admin: Can create for any trainer/client
 * - Trainer: Can create only for self and own clients
 * - Client: No access
 */
export async function createPlan(
  supabase: SupabaseClient,
  command: CreatePlanCommand,
  currentUser: AuthenticatedUser
): Promise<PlanDto> {
  // Check authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot create plans");
  }

  if (currentUser.role === "trainer") {
    // Trainer must set themselves as the trainer
    if (command.trainerId && command.trainerId !== currentUser.id) {
      throw new ForbiddenError("Trainers can only create plans for themselves");
    }

    // If clientId is provided, validate it's a client
    if (command.clientId) {
      const { data: client } = await supabase.from("users").select("id, role").eq("id", command.clientId).single();

      if (!client) {
        throw new NotFoundError("Client not found");
      }

      if (client.role !== "client") {
        throw new ValidationError({ clientId: "User is not a client" });
      }

      // TODO: Add trainer_id check when client-trainer relationship is implemented
      // For now, we skip the client ownership check
    }
  }

  // Validate trainer and client exist (admin can create for anyone, but only if provided)
  if (currentUser.role === "admin") {
    if (command.trainerId) {
      await validateTrainer(supabase, command.trainerId);
    }
    if (command.clientId) {
      await validateClient(supabase, command.clientId);
    }
  }

  // Validate exercises exist
  for (const ex of command.exercises) {
    await validateExerciseExists(supabase, ex.exerciseId);
  }

  // Create plan
  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      trainer_id: command.trainerId || null,
      client_id: command.clientId || null,
      name: command.name,
      description: command.description || null,
      is_hidden: command.isHidden ?? false,
    })
    .select()
    .single();

  if (error || !plan) {
    console.error("Failed to create plan:", error);
    throw new DatabaseError("Failed to create plan");
  }

  // Create plan_exercises
  const planExercises = command.exercises.map((ex) => ({
    plan_id: plan.id,
    exercise_id: ex.exerciseId,
    exercise_order: ex.sortOrder,
    sets: ex.sets,
    reps: ex.reps,
    tempo: ex.tempo || "3-0-3",
    default_weight: ex.defaultWeight ?? null,
    is_completed: false,
  }));

  const { data: insertedExercises, error: exError } = await supabase
    .from("plan_exercises")
    .insert(planExercises)
    .select();

  if (exError || !insertedExercises) {
    // Rollback plan
    await supabase.from("plans").delete().eq("id", plan.id);
    console.error("Failed to add exercises to plan:", exError);
    throw new DatabaseError("Failed to add exercises to plan");
  }

  // Fetch client data if clientId is provided
  let clientData: { first_name: string | null; last_name: string | null } | null = null;
  if (plan.client_id) {
    const { data: client } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", plan.client_id)
      .single();
    clientData = client || null;
  }

  // TODO: Send email notification to client if clientId is provided

  return {
    ...mapPlanToDTO(plan, clientData),
    exercises: insertedExercises.map(mapPlanExerciseToDTO),
  };
}

/**
 * Get a single plan by ID with exercises
 *
 * Authorization:
 * - Admin: Can view any plan
 * - Trainer: Can view own plans only
 * - Client: Can view own plans only
 */
export async function getPlan(
  supabase: SupabaseClient,
  planId: string,
  currentUser: AuthenticatedUser
): Promise<PlanDto> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (error || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization check
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }
  if (currentUser.role === "client" && plan.client_id !== currentUser.id) {
    throw new NotFoundError("Plan not found");
  }

  // Fetch plan exercises with exercise details (always include full details in getPlan)
  const { data: planExercises, error: exError } = await supabase
    .from("plan_exercises")
    .select(
      `
      *,
      exercise:exercises(*)
    `
    )
    .eq("plan_id", planId)
    .order("exercise_order");

  if (exError) {
    console.error("Failed to fetch plan exercises:", exError);
    throw new DatabaseError("Failed to fetch plan exercises");
  }

  // Fetch client data if clientId is provided
  let clientData: { first_name: string | null; last_name: string | null } | null = null;
  if (plan.client_id) {
    const { data: client } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", plan.client_id)
      .single();
    clientData = client || null;
  }

  return mapPlanWithExercisesToDTO(plan, planExercises || [], clientData);
}

/**
 * Update an existing plan (metadata and/or exercises)
 *
 * Authorization:
 * - Admin: Can update any plan
 * - Trainer: Can update own plans only
 * - Client: No access
 */
export async function updatePlan(
  supabase: SupabaseClient,
  planId: string,
  command: UpdatePlanCommand,
  currentUser: AuthenticatedUser
): Promise<PlanDto> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot update plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only update your own plans");
  }

  // Build update object
  const updateData: Database["public"]["Tables"]["plans"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (command.name !== undefined) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description;
  if (command.isHidden !== undefined) updateData.is_hidden = command.isHidden;
  if (command.trainerId !== undefined) updateData.trainer_id = command.trainerId || null;
  if (command.clientId !== undefined) updateData.client_id = command.clientId || null;

  // Update plan
  const { data: updated, error } = await supabase.from("plans").update(updateData).eq("id", planId).select().single();

  if (error || !updated) {
    console.error("Failed to update plan:", error);
    throw new DatabaseError("Failed to update plan");
  }

  // Update exercises if provided
  if (command.exercises) {
    // Validate exercises exist
    for (const ex of command.exercises) {
      await validateExerciseExists(supabase, ex.exerciseId);
    }

    // Delete existing
    await supabase.from("plan_exercises").delete().eq("plan_id", planId);

    // Insert new
    const planExercises = command.exercises.map((ex) => ({
      plan_id: planId,
      exercise_id: ex.exerciseId,
      exercise_order: ex.sortOrder,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo || "3-0-3",
      default_weight: ex.defaultWeight ?? null,
      is_completed: false,
    }));

    const { data: insertedExercises, error: insertError } = await supabase
      .from("plan_exercises")
      .insert(planExercises)
      .select();

    if (insertError || !insertedExercises) {
      console.error("Failed to update plan exercises:", insertError);
      throw new DatabaseError("Failed to update plan exercises");
    }

    // Fetch client data if clientId is provided
    let clientData: { first_name: string | null; last_name: string | null } | null = null;
    if (updated.client_id) {
      const { data: client } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", updated.client_id)
        .single();
      clientData = client || null;
    }

    // TODO: Send email notification if exercises changed

    return {
      ...mapPlanToDTO(updated, clientData),
      exercises: insertedExercises.map(mapPlanExerciseToDTO),
    };
  }

  // Fetch exercises for the response if not updated
  const { data: planExercises } = await supabase
    .from("plan_exercises")
    .select("*")
    .eq("plan_id", planId)
    .order("exercise_order");

  // Fetch client data if clientId is provided
  let clientData: { first_name: string | null; last_name: string | null } | null = null;
  if (updated.client_id) {
    const { data: client } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", updated.client_id)
      .single();
    clientData = client || null;
  }

  return {
    ...mapPlanToDTO(updated, clientData),
    exercises: (planExercises || []).map(mapPlanExerciseToDTO),
  };
}

/**
 * Delete a plan (soft delete by default, hard delete if specified)
 *
 * Authorization:
 * - Admin: Can delete any plan
 * - Trainer: Can delete own plans only
 * - Client: No access
 */
export async function deletePlan(
  supabase: SupabaseClient,
  planId: string,
  currentUser: AuthenticatedUser,
  hard = false
): Promise<void> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot delete plans");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only delete your own plans");
  }

  if (hard) {
    // Hard delete (CASCADE will delete plan_exercises)
    const { error } = await supabase.from("plans").delete().eq("id", planId);
    if (error) {
      console.error("Failed to delete plan:", error);
      throw new DatabaseError("Failed to delete plan");
    }
  } else {
    // Soft delete
    const { error } = await supabase
      .from("plans")
      .update({ is_hidden: true, updated_at: new Date().toISOString() })
      .eq("id", planId);
    if (error) {
      console.error("Failed to soft delete plan:", error);
      throw new DatabaseError("Failed to delete plan");
    }
  }
}

/**
 * Toggle plan visibility
 *
 * Authorization:
 * - Admin: Can toggle any plan
 * - Trainer: Can toggle own plans only
 * - Client: No access
 */
export async function togglePlanVisibility(
  supabase: SupabaseClient,
  planId: string,
  isHidden: boolean,
  currentUser: AuthenticatedUser
): Promise<PlanDto> {
  // Validate UUID
  if (!isValidUUID(planId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch plan
  const { data: plan, error: fetchError } = await supabase.from("plans").select("*").eq("id", planId).single();

  if (fetchError || !plan) {
    throw new NotFoundError("Plan not found");
  }

  // Authorization
  if (currentUser.role === "client") {
    throw new ForbiddenError("Clients cannot change plan visibility");
  }
  if (currentUser.role === "trainer" && plan.trainer_id !== currentUser.id) {
    throw new ForbiddenError("Can only update visibility of your own plans");
  }

  // Update visibility
  const { data: updated, error } = await supabase
    .from("plans")
    .update({
      is_hidden: isHidden,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .select()
    .single();

  if (error || !updated) {
    console.error("Failed to update plan visibility:", error);
    throw new DatabaseError("Failed to update plan visibility");
  }

  // Fetch exercises for the response
  const { data: planExercises } = await supabase
    .from("plan_exercises")
    .select("*")
    .eq("plan_id", planId)
    .order("exercise_order");

  // Fetch client data if clientId is provided
  let clientData: { first_name: string | null; last_name: string | null } | null = null;
  if (updated.client_id) {
    const { data: client } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", updated.client_id)
      .single();
    clientData = client || null;
  }

  return {
    ...mapPlanToDTO(updated, clientData),
    exercises: (planExercises || []).map(mapPlanExerciseToDTO),
  };
}
