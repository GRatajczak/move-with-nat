// src/services/reasons.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type { CreateReasonCommand, ReasonDto, UpdateReasonCommand, UserDto } from "../types";
import { DatabaseError, ForbiddenError, NotFoundError, ConflictError, ValidationError } from "../lib/errors";
import { mapStandardReasonToDTO } from "../lib/mappers";
import { isValidUUID } from "../lib/validation";

/**
 * Lists all standard reasons
 * Authorization: All authenticated users
 */
export async function listReasons(supabase: SupabaseClient): Promise<ReasonDto[]> {
  const { data, error } = await supabase.from("standard_reasons").select("*").order("code");

  if (error) {
    throw new DatabaseError("Failed to fetch reasons");
  }

  return (data || []).map(mapStandardReasonToDTO);
}

/**
 * Creates a new standard reason
 * Authorization: Admin only
 */
export async function createReason(
  supabase: SupabaseClient,
  command: CreateReasonCommand,
  currentUser: UserDto
): Promise<ReasonDto> {
  // Authorization check
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

  if (error) {
    throw new DatabaseError("Failed to create reason");
  }

  return mapStandardReasonToDTO(reason);
}

/**
 * Updates an existing standard reason
 * Authorization: Admin only
 */
export async function updateReason(
  supabase: SupabaseClient,
  reasonId: string,
  command: UpdateReasonCommand,
  currentUser: UserDto
): Promise<ReasonDto> {
  // Authorization check
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can update reasons");
  }

  // Validate UUID format
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

  // Check code uniqueness if code is being changed
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

  // Update reason
  const { data: updated, error } = await supabase
    .from("standard_reasons")
    .update(updateData)
    .eq("id", reasonId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to update reason");
  }

  return mapStandardReasonToDTO(updated);
}

/**
 * Deletes a standard reason
 * Authorization: Admin only
 * Cannot delete if reason is in use
 */
export async function deleteReason(supabase: SupabaseClient, reasonId: string, currentUser: UserDto): Promise<void> {
  // Authorization check
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete reasons");
  }

  // Validate UUID format
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

  // Check if reason is used in plan_exercises
  const { count } = await supabase
    .from("plan_exercises")
    .select("id", { count: "exact", head: true })
    .eq("reason_id", reasonId);

  if (count && count > 0) {
    throw new ConflictError("Cannot delete reason that is in use");
  }

  // Delete reason
  const { error } = await supabase.from("standard_reasons").delete().eq("id", reasonId);

  if (error) {
    throw new DatabaseError("Failed to delete reason");
  }
}
