// src/lib/mappers.ts

import type { Database } from "../db/database.types";
import type { ExerciseDto, ExerciseSummaryDto, PlanDto, PlanExerciseDto, ReasonDto, UserDto, UserRole } from "../types";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type PlanExerciseRow = Database["public"]["Tables"]["plan_exercises"]["Row"] & { exercise: ExerciseRow };
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type StandardReasonRow = Database["public"]["Tables"]["standard_reasons"]["Row"];
type DbUserRole = Database["public"]["Enums"]["user_role"];

/**
 * Maps database exercise row to ExerciseDto
 */
export function mapExerciseToDTO(exercise: ExerciseRow): ExerciseDto {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    vimeoToken: exercise.vimeo_token,
    defaultWeight: exercise.default_weight,
    isHidden: exercise.is_hidden,
  };
}

/**
 * Maps database exercise row to ExerciseSummaryDto
 */
export function mapExerciseToSummaryDTO(exercise: ExerciseRow): ExerciseSummaryDto {
  return {
    id: exercise.id,
    name: exercise.name,
    defaultWeight: exercise.default_weight,
  };
}

/**
 * Maps database plan row to PlanDto (without exercises)
 */
export function mapPlanToDTO(plan: PlanRow): PlanDto {
  return {
    id: plan.id,
    name: plan.name,
    clientId: plan.client_id,
    trainerId: plan.trainer_id,
    isHidden: plan.is_hidden,
    exercises: [],
  };
}

/**
 * Maps plan exercise with nested exercise data to PlanExerciseDto
 */
export function mapPlanExerciseToDTO(planExercise: PlanExerciseRow): PlanExerciseDto {
  return {
    exerciseId: planExercise.exercise_id,
    sortOrder: planExercise.exercise_order,
    sets: 0, // These fields are not stored in DB yet, default to 0
    reps: 0,
    tempo: planExercise.tempo,
    defaultWeight: planExercise.default_weight,
  };
}

/**
 * Maps database plan row with exercises to full PlanDto
 */
export function mapPlanWithExercisesToDTO(plan: PlanRow, planExercises: PlanExerciseRow[]): PlanDto {
  return {
    ...mapPlanToDTO(plan),
    exercises: planExercises.map(mapPlanExerciseToDTO),
  };
}

/**
 * Maps API user role (from DTO) to database user role
 * API uses "client" terminology, database uses "client" as well
 */
export function mapUserRoleFromDTO(apiRole: "admin" | "trainer" | "client"): DbUserRole {
  // In our case, they match 1:1
  return apiRole as DbUserRole;
}

/**
 * Maps database user role to API user role (for DTOs)
 */
export function mapUserRoleToDTO(dbRole: DbUserRole): UserRole {
  // They match 1:1
  return dbRole as UserRole;
}

/**
 * Maps database user row to UserDto
 */
export function mapUserToDTO(user: UserRow): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: mapUserRoleToDTO(user.role),
    isActive: user.is_active,
    firstName: user.first_name,
    lastName: user.last_name,
    trainerId: user.trainer_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Maps database standard_reason row to ReasonDto
 */
export function mapStandardReasonToDTO(reason: StandardReasonRow): ReasonDto {
  return {
    id: reason.id,
    code: reason.code,
    label: reason.label,
  };
}
