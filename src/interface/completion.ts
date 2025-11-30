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
