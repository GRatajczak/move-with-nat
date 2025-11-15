// src/types.ts

import type { Database } from "./db/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

/** AUTHENTICATION & ACCOUNT ACTIVATION COMMANDS **/
/** 1. Invite user (trainer|client) **/
export interface InviteUserCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
  role: Extract<UserRole, "trainer" | "client">;
  resend?: boolean;
}

/** 2. Activate account **/
export interface ActivateAccountCommand {
  token: string;
}

/** 3. Request password reset **/
export interface RequestPasswordResetCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
}

/** 4. Confirm password reset **/
export interface ConfirmPasswordResetCommand {
  token: string;
  newPassword: string;
}

/** USERS **/
/** List users query parameters **/
export interface ListUsersQuery {
  role?: UserRole;
  status?: "active" | "pending" | "suspended";
  trainerId?: string;
  page?: number;
  limit?: number;
}

/** User DTO for responses **/
export interface UserDto {
  id: Database["public"]["Tables"]["users"]["Row"]["id"];
  email: Database["public"]["Tables"]["users"]["Row"]["email"];
  role: Database["public"]["Tables"]["users"]["Row"]["role"];
  status: "active" | "pending" | "suspended";
}

/** Create user **/
export interface CreateUserCommand {
  email: Database["public"]["Tables"]["users"]["Insert"]["email"];
  role: Extract<UserRole, "trainer" | "client">;
  firstName: string;
  lastName: string;
  trainerId?: string; // required when role='client'
}

/** Update user **/
export type UpdateUserCommand = Partial<CreateUserCommand> & {
  id: string;
};

/** EXERCISES **/
/** List exercises query **/
export interface ListExercisesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** Summary DTO for exercise list **/
export interface ExerciseSummaryDto {
  id: Database["public"]["Tables"]["exercises"]["Row"]["id"];
  name: Database["public"]["Tables"]["exercises"]["Row"]["name"];
  defaultWeight: Database["public"]["Tables"]["exercises"]["Row"]["default_weight"];
}

/** Create exercise **/
export interface CreateExerciseCommand {
  name: Database["public"]["Tables"]["exercises"]["Insert"]["name"];
  description?: Database["public"]["Tables"]["exercises"]["Insert"]["description"];
  vimeoToken: Database["public"]["Tables"]["exercises"]["Insert"]["vimeo_token"];
  defaultWeight?: Database["public"]["Tables"]["exercises"]["Insert"]["default_weight"];
}

/** Full DTO for single exercise **/
export interface ExerciseDto {
  id: Database["public"]["Tables"]["exercises"]["Row"]["id"];
  name: Database["public"]["Tables"]["exercises"]["Row"]["name"];
  description: Database["public"]["Tables"]["exercises"]["Row"]["description"];
  vimeoToken: Database["public"]["Tables"]["exercises"]["Row"]["vimeo_token"];
  defaultWeight: Database["public"]["Tables"]["exercises"]["Row"]["default_weight"];
  isHidden: Database["public"]["Tables"]["exercises"]["Row"]["is_hidden"];
}

/** Update exercise **/
export type UpdateExerciseCommand = Partial<CreateExerciseCommand>;

/** PLANS **/
/** List plans query **/
export interface ListPlansQuery {
  trainerId?: string;
  traineeId?: string;
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

export type IsHidden = Database["public"]["Tables"]["plans"]["Insert"]["is_hidden"];

/** Create plan **/
export interface CreatePlanCommand {
  name: Database["public"]["Tables"]["plans"]["Insert"]["name"];
  clientId: Database["public"]["Tables"]["plans"]["Insert"]["client_id"];
  trainerId: Database["public"]["Tables"]["plans"]["Insert"]["trainer_id"];
  isHidden?: IsHidden;
  description?: string;
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

/** Update plan **/
export type UpdatePlanCommand = Partial<Omit<CreatePlanCommand, "exercises">> & {
  id: string;
  exercises?: PlanExerciseDto[];
};

/** Toggle visibility **/
export interface TogglePlanVisibilityCommand {
  id: string;
  isHidden: IsHidden;
}

/** PLAN EXERCISES (nested) **/
export interface AddExerciseToPlanCommand {
  planId: string;
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight?: number | null;
}
export type UpdateExerciseInPlanCommand = Partial<AddExerciseToPlanCommand> & {
  planId: string;
  exerciseId: string;
};

/** COMPLETION RECORDS **/
export interface MarkExerciseCompletionCommand {
  planId: string;
  exerciseId: string;
  completed: boolean;
  reasonId?: string;
  customReason?: string;
}

/** Standard reason DTO **/
export interface ReasonDto {
  id: Database["public"]["Tables"]["standard_reasons"]["Row"]["id"];
  code: Database["public"]["Tables"]["standard_reasons"]["Row"]["code"];
  label: Database["public"]["Tables"]["standard_reasons"]["Row"]["label"];
}

/** Create / Update reason **/
export type CreateReasonCommand = Pick<Database["public"]["Tables"]["standard_reasons"]["Insert"], "code" | "label">;
export type UpdateReasonCommand = Partial<CreateReasonCommand> & {
  id: string;
};

/** Pagination DTO **/
export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
}
