import type { Database } from "../db/database.types";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

export type UserRole = Database["public"]["Enums"]["user_role"];

// Re-export Database type for convenience
export type { Database };

/** SUPABASE CLIENT **/
export type SupabaseClient = BaseSupabaseClient<Database>;

/** DB ROW TYPES (Mappers) **/
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
export type PlanExerciseRow = Database["public"]["Tables"]["plan_exercises"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type StandardReasonRow = Database["public"]["Tables"]["standard_reasons"]["Row"];
export type DbUserRole = Database["public"]["Enums"]["user_role"];
