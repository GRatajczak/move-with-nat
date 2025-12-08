// src/lib/mappers.ts

import type { ExerciseRow } from "@/types/db";
import type { ExerciseDto, ExerciseSummaryDto, PlanDto, PlanExerciseDto, UserDto } from "@/interface";
import type { PlanRow, PlanExerciseRow, StandardReasonRow } from "@/types/db";
import type { DbUserRole, UserRole, UserRow } from "@/types/db";
import type { ReasonDto } from "@/interface";

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
    tempo: exercise.tempo,
    createdAt: exercise.created_at,
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
export function mapPlanToDTO(
  plan: PlanRow,
  clientData?: { first_name: string | null; last_name: string | null } | null
): PlanDto {
  const clientName =
    clientData && (clientData.first_name || clientData.last_name)
      ? `${clientData.first_name || ""} ${clientData.last_name || ""}`.trim()
      : null;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    clientId: plan.client_id,
    clientName,
    trainerId: plan.trainer_id,
    isHidden: plan.is_hidden,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    exercises: [],
  };
}

/**
 * Maps plan exercise with nested exercise data to PlanExerciseDto
 */
export function mapPlanExerciseToDTO(planExercise: PlanExerciseRow & { exercise?: ExerciseRow }): PlanExerciseDto {
  const dto: PlanExerciseDto = {
    id: planExercise.id,
    exerciseId: planExercise.exercise_id,
    sortOrder: planExercise.exercise_order,
    sets: planExercise.sets || 0,
    reps: planExercise.reps || 0,
    tempo: planExercise.tempo,
    defaultWeight: planExercise.default_weight,
  };

  // Add full exercise details if available
  if (planExercise.exercise) {
    dto.exercise = mapExerciseToDTO(planExercise.exercise);
  }

  return dto;
}

/**
 * Maps database plan row with exercises to full PlanDto
 */
export function mapPlanWithExercisesToDTO(
  plan: PlanRow,
  planExercises: PlanExerciseRow[],
  clientData?: { first_name: string | null; last_name: string | null } | null
): PlanDto {
  return {
    ...mapPlanToDTO(plan, clientData),
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
    status: user.status,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    dateOfBirth: user.date_of_birth,
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
