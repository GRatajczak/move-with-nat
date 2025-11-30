// src/services/reasons.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  ReasonDto,
  ReasonViewModel,
  CreateReasonCommand,
  UpdateReasonCommand,
  AuthenticatedUser,
} from "../interface";
import { ConflictError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { isValidUUID } from "../lib/api-helpers";
import { mapStandardReasonToDTO } from "../lib/mappers";

/**
 * Lists all standard reasons with basic info (for dropdowns, etc.)
 *
 * Authorization:
 * - All authenticated users can view reasons
 *
 * @param supabase - Supabase client instance
 * @returns Array of reason DTOs
 */
export async function listReasons(supabase: SupabaseClient): Promise<ReasonDto[]> {
  const { data, error } = await supabase.from("standard_reasons").select("*").order("code");

  if (error) {
    console.error("Failed to fetch reasons:", error);
    throw new DatabaseError("Failed to fetch reasons");
  }

  return (data || []).map(mapStandardReasonToDTO);
}

/**
 * Lists all standard reasons with extended info (usage count, timestamps)
 * Useful for admin UI views
 *
 * Authorization:
 * - All authenticated users can view reasons
 *
 * @param supabase - Supabase client instance
 * @returns Array of ReasonViewModel
 */
export async function listReasonsWithMetadata(supabase: SupabaseClient): Promise<ReasonViewModel[]> {
  // Fetch all reasons
  const { data: reasons, error: reasonsError } = await supabase.from("standard_reasons").select("*").order("code");

  if (reasonsError) {
    console.error("Failed to fetch reasons:", reasonsError);
    throw new DatabaseError("Failed to fetch reasons with metadata");
  }

  if (!reasons || reasons.length === 0) {
    return [];
  }

  // Get usage counts for all reasons in one query
  const reasonIds = reasons.map((r) => r.id);
  const { data: usageCounts, error: usageError } = await supabase
    .from("plan_exercises")
    .select("reason_id")
    .in("reason_id", reasonIds)
    .not("reason_id", "is", null);

  if (usageError) {
    console.error("Failed to fetch usage counts:", usageError);
    // Continue with zero counts if usage query fails
  }

  // Count occurrences of each reason_id
  const usageMap = new Map<string, number>();
  (usageCounts || []).forEach((record) => {
    if (record.reason_id) {
      usageMap.set(record.reason_id, (usageMap.get(record.reason_id) || 0) + 1);
    }
  });

  // Map to ReasonViewModel
  return reasons.map((reason) => ({
    id: reason.id,
    code: reason.code,
    label: reason.label,
    usageCount: usageMap.get(reason.id) || 0,
    createdAt: reason.created_at,
    updatedAt: reason.updated_at,
  }));
}

/**
 * Creates a new standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Business Rules:
 * - Code must be unique
 * - Code will be automatically converted to lowercase
 *
 * @param supabase - Supabase client instance
 * @param command - Command with code and label
 * @param currentUser - Current authenticated user
 * @returns Created reason DTO
 */
export async function createReason(
  supabase: SupabaseClient,
  command: CreateReasonCommand,
  currentUser: AuthenticatedUser
): Promise<ReasonDto> {
  // Authorization: Admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can create reasons");
  }

  // Check code uniqueness
  const { data: existing } = await supabase
    .from("standard_reasons")
    .select("id")
    .eq("code", command.code)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("Reason code already exists");
  }

  // Insert new reason
  const { data: reason, error } = await supabase
    .from("standard_reasons")
    .insert({
      code: command.code,
      label: command.label,
    })
    .select()
    .single();

  if (error || !reason) {
    console.error("Failed to create reason:", error);
    throw new DatabaseError("Failed to create reason");
  }

  return mapStandardReasonToDTO(reason);
}

/**
 * Updates an existing standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Business Rules:
 * - If code is changed, new code must be unique
 * - At least one field must be provided for update
 *
 * @param supabase - Supabase client instance
 * @param reasonId - UUID of the reason to update
 * @param command - Command with optional code and label
 * @param currentUser - Current authenticated user
 * @returns Updated reason DTO
 */
export async function updateReason(
  supabase: SupabaseClient,
  reasonId: string,
  command: UpdateReasonCommand,
  currentUser: AuthenticatedUser
): Promise<ReasonDto> {
  // Authorization: Admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can update reasons");
  }

  // Validate UUID
  if (!isValidUUID(reasonId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch existing reason
  const { data: existing, error: fetchError } = await supabase
    .from("standard_reasons")
    .select("*")
    .eq("id", reasonId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Reason not found");
  }

  // Check code uniqueness (if changing code)
  if (command.code && command.code !== existing.code) {
    const { data: duplicate } = await supabase
      .from("standard_reasons")
      .select("id")
      .eq("code", command.code)
      .neq("id", reasonId)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError("Reason code already exists");
    }
  }

  // Build update data
  const updateData: Database["public"]["Tables"]["standard_reasons"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (command.code !== undefined) updateData.code = command.code;
  if (command.label !== undefined) updateData.label = command.label;

  // Execute update
  const { data: updated, error } = await supabase
    .from("standard_reasons")
    .update(updateData)
    .eq("id", reasonId)
    .select()
    .single();

  if (error || !updated) {
    console.error("Failed to update reason:", error);
    throw new DatabaseError("Failed to update reason");
  }

  return mapStandardReasonToDTO(updated);
}

/**
 * Deletes a standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Business Rules:
 * - Cannot delete a reason that is in use (referenced in plan_exercises)
 *
 * @param supabase - Supabase client instance
 * @param reasonId - UUID of the reason to delete
 * @param currentUser - Current authenticated user
 */
export async function deleteReason(
  supabase: SupabaseClient,
  reasonId: string,
  currentUser: AuthenticatedUser
): Promise<void> {
  // Authorization: Admin only
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete reasons");
  }

  // Validate UUID
  if (!isValidUUID(reasonId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Check if reason exists
  const { data: reason, error: fetchError } = await supabase
    .from("standard_reasons")
    .select("id")
    .eq("id", reasonId)
    .single();

  if (fetchError || !reason) {
    throw new NotFoundError("Reason not found");
  }

  // Check if reason is in use in plan_exercises
  const { count } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("reason_id", reasonId);

  if (count && count > 0) {
    throw new ConflictError("Cannot delete reason that is in use");
  }

  // Execute delete
  const { error } = await supabase.from("standard_reasons").delete().eq("id", reasonId);

  if (error) {
    console.error("Failed to delete reason:", error);
    throw new DatabaseError("Failed to delete reason");
  }
}
