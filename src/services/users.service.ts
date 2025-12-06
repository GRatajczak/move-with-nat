// src/services/users.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  CreateUserCommand,
  UserDto,
  PaginatedResponse,
  ListUsersQuery,
  UpdateUserCommand,
  AuthenticatedUser,
} from "../interface";
import { mapUserToDTO, mapUserRoleFromDTO } from "../lib/mappers";
import { ConflictError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { sendActivationEmail } from "./email.service";
import { isValidUUID } from "../lib/validation";

/**
 * Helper: Check if user is admin
 */
function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === "admin";
}

/**
 * Helper: Check if user is trainer
 */
function isTrainer(user: AuthenticatedUser): boolean {
  return user.role === "trainer";
}

/**
 * Helper: Check if user is client
 */
function isClient(user: AuthenticatedUser): boolean {
  return user.role === "client";
}

/**
 * Helper: Check if email already exists in the database
 * @param excludeUserId - Optional user ID to exclude from the check (for updates)
 */
async function checkEmailExists(supabase: SupabaseClient, email: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase.from("users").select("id").eq("email", email.toLowerCase());

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query.single();

  if (error) {
    // PGRST116 = no rows returned, which means email doesn't exist (good)
    if (error.code === "PGRST116") {
      return false;
    }
    console.error("Error checking email existence:", error);
    throw new DatabaseError("Failed to check email uniqueness");
  }

  return !!data;
}

/**
 * Helper: Validate that trainer exists and has trainer role
 */
async function validateTrainer(supabase: SupabaseClient, trainerId: string): Promise<void> {
  if (!isValidUUID(trainerId)) {
    throw new ValidationError({ trainerId: "Invalid trainer ID format" });
  }

  const { data: trainer, error } = await supabase.from("users").select("id, role").eq("id", trainerId).single();

  if (error || !trainer) {
    throw new NotFoundError("Trainer not found");
  }

  if (trainer.role !== "trainer") {
    throw new ValidationError({ trainerId: "User is not a trainer" });
  }
}

/**
 * Create new user (admin only)
 *
 * @param supabase - Supabase client instance
 * @param command - User creation data
 * @param currentUser - Currently authenticated user
 * @returns Created user DTO
 *
 * @throws {ForbiddenError} If current user is not an admin
 * @throws {NotFoundError} If trainer doesn't exist (when creating client)
 * @throws {ConflictError} If email already exists
 * @throws {DatabaseError} If database operation fails
 */
export async function createUser(
  supabase: SupabaseClient,
  command: CreateUserCommand,
  currentUser: AuthenticatedUser
): Promise<UserDto> {
  // Authorization check: only admins can create users
  if (!isAdmin(currentUser)) {
    throw new ForbiddenError("Only administrators can create users");
  }

  // Validate trainer if role is client
  if (command.role === "client" && command.trainerId) {
    await validateTrainer(supabase, command.trainerId);
  }

  // Check email uniqueness
  const emailExists = await checkEmailExists(supabase, command.email);
  if (emailExists) {
    throw new ConflictError("Email already exists");
  }

  // Map API role to database role
  const dbRole = mapUserRoleFromDTO(command.role);

  // Step 1: Create user in Supabase Auth first
  // This generates the UUID that will be used in public.users
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: command.email.toLowerCase(),
    email_confirm: false, // User must activate account via email
    user_metadata: {
      first_name: command.firstName,
      last_name: command.lastName,
      role: dbRole,
    },
  });

  if (authError || !authUser.user) {
    console.error("Failed to create auth user:", {
      error: authError,
      message: authError?.message,
      status: authError?.status,
      code: authError?.code,
    });
    throw new DatabaseError("Failed to create user in authentication system");
  }

  // Step 2: Create profile in public.users with the auth user's ID
  const insertData: Database["public"]["Tables"]["users"]["Insert"] = {
    id: authUser.user.id, // Use the ID from auth.users
    email: command.email.toLowerCase(),
    role: dbRole,
    is_active: false,
    first_name: command.firstName,
    last_name: command.lastName,
  };

  // Add trainer_id for clients
  if (command.role === "client" && command.trainerId) {
    insertData.trainer_id = command.trainerId;
  }

  // Insert user profile
  const { data: newUser, error } = await supabase.from("users").insert(insertData).select().single();

  if (error) {
    console.error("Failed to create user profile:", error);

    // Cleanup: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authUser.user.id);

    throw new DatabaseError("Failed to create user profile");
  }

  // Send activation email (non-blocking for MVP)
  // In production, this should be handled by a background job
  try {
    await sendActivationEmail(command.email, command.firstName, newUser.id);
  } catch (emailError) {
    console.error("Failed to send activation email:", emailError);
    // Don't fail the request if email sending fails
    // The user was created successfully
  }

  return mapUserToDTO(newUser);
}

/**
 * List users with pagination and filtering
 *
 * @param supabase - Supabase client instance
 * @param query - Query parameters for filtering and pagination
 * @param currentUser - Currently authenticated user
 * @returns Paginated list of users
 *
 * @throws {ForbiddenError} If current user is a client
 * @throws {DatabaseError} If database operation fails
 */
export async function listUsers(
  supabase: SupabaseClient,
  query: ListUsersQuery,
  currentUser: AuthenticatedUser
): Promise<PaginatedResponse<UserDto>> {
  // Authorization check: clients cannot list users
  if (isClient(currentUser)) {
    throw new ForbiddenError("Clients cannot list users");
  }

  const { search, role, status, trainerId, page = 1, limit = 20 } = query;

  // Force filters for trainers: they can only see their own clients
  let effectiveRole = role;
  let effectiveTrainerId = trainerId;

  if (isTrainer(currentUser)) {
    effectiveRole = "client";
    effectiveTrainerId = currentUser.id;
  }

  // Build Supabase query
  let dbQuery = supabase.from("users").select("*", { count: "exact", head: false });

  // Apply search filter (email, first_name, last_name)
  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    dbQuery = dbQuery.or(
      `email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
    );
  }

  // Apply role filter
  if (effectiveRole) {
    const dbRole = mapUserRoleFromDTO(effectiveRole);
    dbQuery = dbQuery.eq("role", dbRole);
  }

  // Apply trainer filter
  if (effectiveTrainerId) {
    dbQuery = dbQuery.eq("trainer_id", effectiveTrainerId);
  }

  // Apply status filter
  if (status) {
    if (status === "suspended") {
      dbQuery = dbQuery.eq("is_active", false);
    } else if (status === "active") {
      dbQuery = dbQuery.eq("is_active", true);
      // Active means they have completed their profile
      dbQuery = dbQuery.not("first_name", "is", null);
      dbQuery = dbQuery.not("last_name", "is", null);
    } else if (status === "pending") {
      dbQuery = dbQuery.eq("is_active", true);
      // Pending means they haven't completed their profile
      dbQuery = dbQuery.or("first_name.is.null,last_name.is.null");
    }
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database error in listUsers:", error);
    throw new DatabaseError("Failed to fetch users");
  }

  // Map to DTOs
  const userDTOs = (data || []).map(mapUserToDTO);

  return {
    data: userDTOs,
    meta: {
      page,
      limit,
      total: count || 0,
    },
  };
}

/**
 * Get user by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch
 * @param currentUser - Currently authenticated user
 * @returns User DTO
 *
 * @throws {ValidationError} If user ID format is invalid
 * @throws {NotFoundError} If user doesn't exist or access is denied
 * @throws {DatabaseError} If database operation fails
 */
export async function getUser(
  supabase: SupabaseClient,
  userId: string,
  currentUser: AuthenticatedUser
): Promise<UserDto> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Early authorization check for clients
  if (isClient(currentUser) && currentUser.id !== userId) {
    throw new NotFoundError("User not found");
  }

  // Query user from database
  const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new NotFoundError("User not found");
    }
    console.error("Database error in getUser:", error);
    throw new DatabaseError("Failed to fetch user");
  }

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Authorization checks
  // Admins can see all users
  if (isAdmin(currentUser)) {
    return mapUserToDTO(user);
  }

  // Users can see their own profile
  if (currentUser.id === userId) {
    return mapUserToDTO(user);
  }

  // Trainers can see their clients
  if (isTrainer(currentUser)) {
    if (!isClient(user)) {
      throw new NotFoundError("User not found");
    }

    if (user.trainer_id !== currentUser.id) {
      throw new NotFoundError("User not found");
    }

    return mapUserToDTO(user);
  }

  // Default: access denied (return not found for security)
  throw new NotFoundError("User not found");
}

/**
 * Update user by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to update
 * @param command - Update data
 * @param currentUser - Currently authenticated user
 * @returns Updated user DTO
 *
 * @throws {ValidationError} If user ID or data is invalid
 * @throws {ForbiddenError} If current user doesn't have permission
 * @throws {NotFoundError} If user doesn't exist
 * @throws {ConflictError} If email already exists
 * @throws {DatabaseError} If database operation fails
 */
export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  command: UpdateUserCommand,
  currentUser: AuthenticatedUser
): Promise<UserDto> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch target user
  const { data: targetUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single();

  if (fetchError || !targetUser) {
    throw new NotFoundError("User not found");
  }

  // Authorization check
  if (isClient(currentUser)) {
    throw new ForbiddenError("Access denied");
  }

  if (isTrainer(currentUser)) {
    // Trainers can only update their clients
    if (!isClient(targetUser) || targetUser.trainer_id !== currentUser.id) {
      throw new ForbiddenError("Access denied");
    }

    // Trainers cannot change isActive or trainerId
    if (command.isActive !== undefined || command.trainerId !== undefined) {
      throw new ForbiddenError("Only administrators can change active status or trainer assignment");
    }
  }

  // Validate email uniqueness (if being changed)
  if (command.email && command.email !== targetUser.email) {
    const emailExists = await checkEmailExists(supabase, command.email, userId);
    if (emailExists) {
      throw new ConflictError("Email already exists");
    }
  }

  // Validate trainerId (if being changed, admin only)
  if (command.trainerId !== undefined && isAdmin(currentUser)) {
    await validateTrainer(supabase, command.trainerId);
  }

  // Build update data
  const updateData: Database["public"]["Tables"]["users"]["Update"] = {};

  if (command.email !== undefined) {
    updateData.email = command.email.toLowerCase();
  }

  if (command.firstName !== undefined) {
    updateData.first_name = command.firstName;
  }

  if (command.lastName !== undefined) {
    updateData.last_name = command.lastName;
  }

  // Only admins can change is_active and trainer assignment
  if (isAdmin(currentUser)) {
    if (command.isActive !== undefined) {
      updateData.is_active = command.isActive;
    }

    if (command.trainerId !== undefined) {
      updateData.trainer_id = command.trainerId;
    }
  }

  // Execute update
  const { data: updatedUser, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update user:", error);
    throw new DatabaseError("Failed to update user");
  }

  return mapUserToDTO(updatedUser);
}

/**
 * Delete user by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to delete
 * @param currentUser - Currently authenticated user
 * @returns void
 *
 * @throws {ValidationError} If user ID format is invalid
 * @throws {ForbiddenError} If current user doesn't have permission
 * @throws {NotFoundError} If user doesn't exist
 * @throws {DatabaseError} If database operation fails
 */
export async function deleteUser(
  supabase: SupabaseClient,
  userId: string,
  currentUser: AuthenticatedUser
): Promise<void> {
  // Authorization check: only admins can delete users
  if (!isAdmin(currentUser)) {
    throw new ForbiddenError("Only administrators can delete users");
  }

  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch target user to ensure they exist
  const { data: targetUser, error: fetchError } = await supabase.from("users").select("id").eq("id", userId).single();

  if (fetchError || !targetUser) {
    throw new NotFoundError("User not found");
  }

  // Delete from public.users (will cascade if needed)
  const { error: deleteError } = await supabase.from("users").delete().eq("id", userId);

  if (deleteError) {
    console.error("Failed to delete user from database:", deleteError);
    throw new DatabaseError("Failed to delete user");
  }

  // Delete from auth.users
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error("Failed to delete user from auth:", authDeleteError);
    // Don't throw here - user profile is already deleted
    // This is a cleanup operation that can fail without breaking the main operation
  }
}
