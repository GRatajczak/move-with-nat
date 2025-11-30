import type { Database } from "../types/db";

/** COMPLETION RECORDS **/
export interface MarkExerciseCompletionCommand {
  completed: boolean;
  reasonId?: string;
  customReason?: string;
}

/** Completion record DTO for a single exercise **/
export interface CompletionRecordDto {
  planId: string;
  exerciseId: string;
  isCompleted: boolean;
  reasonId: string | null;
  customReason: string | null;
  completedAt: string;
}

/** Plan completion status with all exercises **/
export interface PlanCompletionDto {
  planId: string;
  completionRecords: CompletionRecordDto[];
}

/** Standard reason DTO **/
export interface ReasonDto {
  id: Database["public"]["Tables"]["standard_reasons"]["Row"]["id"];
  code: Database["public"]["Tables"]["standard_reasons"]["Row"]["code"];
  label: Database["public"]["Tables"]["standard_reasons"]["Row"]["label"];
}

/** Reason ViewModel with additional UI data **/
export interface ReasonViewModel extends ReasonDto {
  id: string; // UUID
  code: string; // alphanumeric_underscore
  label: string; // display text
  usageCount: number; // liczba użyć w plan_exercises
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Command for creating a new reason (API layer) **/
export interface CreateReasonCommand {
  code: string; // lowercase, alphanumeric + underscore
  label: string; // trimmed text, max 200 chars
}

/** Command for updating an existing reason (API layer) **/
export interface UpdateReasonCommand {
  code?: string; // optional, lowercase
  label?: string; // optional, trimmed
}

/** Form data for creating a new reason **/
export interface CreateReasonFormData {
  code: string; // lowercase, alphanumeric + underscore
  label: string; // trimmed text, max 200 chars
}

/** Form data for updating an existing reason **/
export interface UpdateReasonFormData {
  code?: string; // optional, lowercase
  label?: string; // optional, trimmed
}

/** API response for GET /api/reasons **/
export interface ReasonsListResponse {
  data: ReasonViewModel[];
}
