import type { Database } from "../types/db";
import type { IsHidden } from "../types/plans";

/** PLANS **/
/** List plans query **/
export interface ListPlansQuery {
  trainerId?: string;
  clientId?: string;
  visible?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "created_at";
}

/** Summary DTO for plan list **/
export interface PlanSummaryDto {
  id: Database["public"]["Tables"]["plans"]["Row"]["id"];
  name: Database["public"]["Tables"]["plans"]["Row"]["name"];
  isHidden: IsHidden;
}

/** Nested exercise in plan **/
export interface PlanExerciseDto {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: Database["public"]["Tables"]["plan_exercises"]["Row"]["tempo"];
  defaultWeight?: Database["public"]["Tables"]["plan_exercises"]["Row"]["default_weight"];
}

export interface Exercise {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight?: number | null;
}

/** Create plan **/
export interface CreatePlanCommand {
  name: Database["public"]["Tables"]["plans"]["Insert"]["name"];
  clientId: Database["public"]["Tables"]["plans"]["Insert"]["client_id"];
  trainerId: Database["public"]["Tables"]["plans"]["Insert"]["trainer_id"];
  isHidden?: IsHidden;
  description?: string | null;
  exercises: Exercise[];
}

/** Full DTO for single plan **/
export interface PlanDto {
  id: Database["public"]["Tables"]["plans"]["Row"]["id"];
  name: Database["public"]["Tables"]["plans"]["Row"]["name"];
  clientId: Database["public"]["Tables"]["plans"]["Row"]["client_id"];
  trainerId: Database["public"]["Tables"]["plans"]["Row"]["trainer_id"];
  isHidden: IsHidden;
  exercises: PlanExerciseDto[];
}

/** Toggle visibility **/
export interface TogglePlanVisibilityCommand {
  id: string;
  isHidden: IsHidden;
}

/** PLAN EXERCISES (nested) **/
export interface AddExerciseToPlanCommand {
  exerciseId: string;
  sortOrder: number;
  sets?: number;
  reps?: number;
  tempo?: string;
  defaultWeight?: number | null;
}
export interface UpdateExerciseInPlanCommand {
  sortOrder?: number;
  sets?: number;
  reps?: number;
  tempo?: string;
  defaultWeight?: number | null;
}
