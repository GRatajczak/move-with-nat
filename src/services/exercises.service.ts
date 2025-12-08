// src/services/exercises.service.ts

import { z } from "zod";
import { supabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  CreateExerciseCommand,
  ExerciseDto,
  ExerciseViewModel,
  ListExercisesQuery,
  PaginatedResponse,
  AuthenticatedUser,
} from "../interface";
import type { UpdateExerciseCommand } from "../types/exercises";
import { ConflictError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { isValidUUID } from "../lib/api-helpers";
import { mapExerciseToDTO } from "../lib/mappers";

/**
 * Validation schema for creating an exercise
 */
export const CreateExerciseCommandSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  vimeoToken: z.string().min(1).max(50).trim(),
  defaultWeight: z.number().min(0).optional(),
  tempo: z.string().optional().nullable(),
});

/**
 * Validation schema for updating an exercise
 */
export const UpdateExerciseCommandSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    vimeoToken: z.string().min(1).max(50).trim().optional(),
    defaultWeight: z.number().min(0).optional(),
    tempo: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Creates a new exercise (admin only)
 */
export async function createExercise(
  supabase: SupabaseClient,
  command: CreateExerciseCommand,
  currentUser: AuthenticatedUser
): Promise<ExerciseDto> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can create exercises");
  }

  // Check name uniqueness
  const { data: existing } = await supabase.from("exercises").select("id").eq("name", command.name).maybeSingle();

  if (existing) {
    throw new ConflictError("Exercise with this name already exists");
  }

  // Insert exercise
  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({
      name: command.name,
      description: command.description || null,
      vimeo_token: command.vimeoToken,
      default_weight: command.defaultWeight || null,
      tempo: command.tempo || null,
      is_hidden: false,
    })
    .select()
    .single();

  if (error || !exercise) {
    console.error("Failed to create exercise:", error);
    throw new DatabaseError("Failed to create exercise");
  }

  return mapExerciseToDTO(exercise);
}

/**
 * Gets a single exercise by ID with usage count
 * Non-admin users cannot see hidden exercises
 */
export async function getExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  currentUser: AuthenticatedUser
): Promise<ExerciseViewModel> {
  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch exercise
  const { data: exercise, error } = await supabase.from("exercises").select("*").eq("id", exerciseId).single();

  if (error || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // Check if hidden (non-admins can't see)
  if (exercise.is_hidden && currentUser.role !== "admin") {
    throw new NotFoundError("Exercise not found");
  }

  // Fetch usage count
  const { count: usageCount } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("exercise_id", exerciseId);

  return {
    ...mapExerciseToDTO(exercise),
    usageCount: usageCount || 0,
  };
}

/**
 * Updates an existing exercise (admin only)
 */
export async function updateExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  command: UpdateExerciseCommand,
  currentUser: AuthenticatedUser
): Promise<ExerciseDto> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can update exercises");
  }

  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch existing exercise
  const { data: existing, error: fetchError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Exercise not found");
  }

  // Check name uniqueness (if name is being changed)
  if (command.name && command.name !== existing.name) {
    const { data: duplicate } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", command.name)
      .neq("id", exerciseId)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError("Exercise with this name already exists");
    }
  }

  // Build update data
  const updateData: Database["public"]["Tables"]["exercises"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (command.name !== undefined) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description || null;
  if (command.vimeoToken !== undefined) updateData.vimeo_token = command.vimeoToken;
  if (command.defaultWeight !== undefined) updateData.default_weight = command.defaultWeight || null;
  if (command.tempo !== undefined) updateData.tempo = command.tempo || null;

  // Execute update
  const { data: updated, error } = await supabase
    .from("exercises")
    .update(updateData)
    .eq("id", exerciseId)
    .select()
    .single();

  if (error || !updated) {
    console.error("Failed to update exercise:", error);
    throw new DatabaseError("Failed to update exercise");
  }

  return mapExerciseToDTO(updated);
}

/**
 * Deletes an exercise (soft delete by default, hard delete if specified)
 * Admin only
 */
export async function deleteExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  currentUser: AuthenticatedUser,
  hard = false
): Promise<void> {
  // Check admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete exercises");
  }

  // Validate UUID
  if (!isValidUUID(exerciseId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch exercise
  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // If already soft deleted
  if (exercise.is_hidden && !hard) {
    throw new NotFoundError("Exercise not found");
  }

  // Execute delete
  if (hard) {
    // Hard delete - check if used in plans
    const { count } = await supabase
      .from("plan_exercises")
      .select("id", { count: "exact", head: true })
      .eq("exercise_id", exerciseId);

    if (count && count > 0) {
      throw new ConflictError("Cannot delete exercise that is used in plans");
    }

    const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);

    if (error) {
      console.error("Failed to delete exercise:", error);
      throw new DatabaseError("Failed to delete exercise");
    }
  } else {
    // Soft delete
    const { error } = await supabase
      .from("exercises")
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exerciseId);

    if (error) {
      console.error("Failed to soft delete exercise:", error);
      throw new DatabaseError("Failed to delete exercise");
    }
  }
}

/**
 * List exercises with pagination and search
 *
 * Authorization:
 * - All authenticated users can list exercises
 * - Admin sees all exercises (including hidden)
 * - Trainers and clients see only visible exercises (is_hidden=false)
 *
 * @param supabase - Supabase client instance
 * @param query - Query parameters for filtering and pagination
 * @param currentUser - Current authenticated user
 * @returns Paginated list of exercises with usage counts
 */
export async function listExercises(
  supabase: SupabaseClient,
  query: ListExercisesQuery,
  currentUser: AuthenticatedUser
): Promise<PaginatedResponse<ExerciseViewModel>> {
  const { search, page = 1, limit = 20 } = query;

  // Determine if user can view hidden exercises
  const canViewHidden = currentUser.role === "admin";

  // Build Supabase query
  let dbQuery = supabase.from("exercises").select("*", { count: "exact", head: false });

  // Filter hidden exercises for non-admins
  if (!canViewHidden) {
    dbQuery = dbQuery.eq("is_hidden", false);
  }

  // Apply search filter (case-insensitive)
  if (search) {
    dbQuery = dbQuery.ilike("name", `%${search}%`);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listExercises:", error);
    throw new DatabaseError("Failed to fetch exercises");
  }

  // Fetch usage counts for all exercises in a single query
  const exerciseIds = (data || []).map((ex) => ex.id);
  const usageCounts: Record<string, number> = {};

  if (exerciseIds.length > 0) {
    const { data: usageData, error: usageError } = await supabase
      .from("plan_exercises")
      .select("exercise_id")
      .in("exercise_id", exerciseIds);

    if (!usageError && usageData) {
      // Count occurrences of each exercise_id
      usageData.forEach((item) => {
        usageCounts[item.exercise_id] = (usageCounts[item.exercise_id] || 0) + 1;
      });
    }
  }

  // Map to DTOs with usage counts
  const exerciseDTOs = (data || []).map((exercise) => ({
    ...mapExerciseToDTO(exercise),
    usageCount: usageCounts[exercise.id] || 0,
  }));

  return {
    data: exerciseDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}
