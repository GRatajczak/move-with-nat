/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all types used for API requests and responses.
 * All types are derived from the database schema defined in database.types.ts
 */

import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// Base Entity Types (directly from database)
// ============================================================================

/**
 * User entity - represents a user in the system
 * Roles: administrator, trener (trainer), podopieczny (trainee)
 */
export type User = Tables<"users">;

/**
 * Exercise entity - represents a workout exercise with video
 */
export type Exercise = Tables<"exercises">;

/**
 * Plan entity - represents a workout plan created by a trainer
 */
export type Plan = Tables<"plans">;

/**
 * PlanExercise entity - junction table linking plans to exercises with workout details
 */
export type PlanExercise = Tables<"plan_exercises">;

/**
 * User role enumeration
 */
export type UserRole = Enums<"user_role">;

// ============================================================================
// Common Types
// ============================================================================

/**
 * UUID type for ID fields
 */
export type UUID = string;

/**
 * ISO 8601 datetime string
 */
export type ISODateTime = string;

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Sort query parameters
 */
export interface SortQuery {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Generic error response
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Generic success message response
 */
export interface MessageResponse {
  message: string;
}

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * POST /auth/request-link
 * Request a magic link for login or account activation
 */
export interface RequestLinkCommand {
  email: string;
}

/**
 * POST /auth/verify
 * Verify a token and receive JWT
 */
export interface VerifyTokenCommand {
  token: string;
}

/**
 * Response for successful token verification
 */
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * POST /auth/reset-request
 * Request a password reset link
 */
export interface RequestPasswordResetCommand {
  email: string;
}

/**
 * POST /auth/reset
 * Reset password using token
 */
export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
}

// ============================================================================
// User DTOs
// ============================================================================

/**
 * POST /users
 * Create a new user (Administrator only)
 *
 * Note: API uses firstName/lastName but DB stores as full_name.
 * Service layer should concatenate firstName + lastName -> full_name
 */
export interface CreateUserCommand {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  trainerId?: UUID;
}

/**
 * PUT /users/:id
 * Update user (Administrator or assigned trainer)
 */
export interface UpdateUserCommand {
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  trainerId?: UUID;
}

/**
 * PUT /users/:id/profile
 * Update own profile (Podopieczny only)
 */
export interface UpdateProfileCommand {
  firstName: string;
  lastName: string;
  contact?: string; // phone or other contact info
}

/**
 * GET /users
 * Query parameters for listing users
 */
export interface UserListQuery extends PaginationQuery, SortQuery {
  role?: UserRole;
  status?: "active" | "inactive";
}

/**
 * User DTO for API responses
 * Transforms DB full_name to firstName/lastName for frontend consumption
 */
export interface UserDTO {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  trainerId: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// Exercise DTOs
// ============================================================================

/**
 * POST /exercises
 * Create a new exercise (Administrator only)
 *
 * Note: API uses vimeoToken (camelCase) but DB stores as vimeo_token (snake_case)
 */
export interface CreateExerciseCommand {
  name: string;
  description?: string;
  vimeoToken: string;
  tempo?: string;
}

/**
 * PUT /exercises/:id
 * Update exercise (Administrator only)
 */
export interface UpdateExerciseCommand {
  name?: string;
  description?: string;
  vimeoToken?: string;
  tempo?: string;
}

/**
 * GET /exercises
 * Query parameters for listing exercises
 */
export interface ExerciseListQuery extends PaginationQuery, SortQuery {
  search?: string;
}

/**
 * Exercise DTO for API responses
 * Transforms DB snake_case to camelCase
 */
export interface ExerciseDTO {
  id: UUID;
  name: string;
  description: string | null;
  vimeoToken: string;
  tempo: string | null;
  createdBy: UUID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// Plan DTOs
// ============================================================================

/**
 * Exercise item within a plan creation request
 */
export interface PlanExerciseItemCommand {
  exerciseId: UUID;
  sortOrder: number;
  sets: number;
  reps: number;
}

/**
 * POST /plans
 * Create a new workout plan with exercises (Trainer only)
 */
export interface CreatePlanCommand {
  name: string;
  description?: string;
  assignedTo: UUID; // trainee user ID
  exercises: PlanExerciseItemCommand[];
}

/**
 * PATCH /plans/:id
 * Update plan fields or visibility (Trainer only)
 */
export interface UpdatePlanCommand {
  name?: string;
  description?: string;
  isVisible?: boolean;
}

/**
 * GET /plans
 * Query parameters for listing plans
 */
export interface PlanListQuery extends PaginationQuery, SortQuery {
  assignedTo?: UUID;
  visible?: boolean;
}

/**
 * Plan DTO for API responses
 * Transforms DB snake_case to camelCase
 */
export interface PlanDTO {
  id: UUID;
  name: string;
  description: string | null;
  trainerId: UUID;
  isVisible: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Exercise with workout details within a plan
 */
export interface PlanExerciseDetailDTO {
  exerciseId: UUID;
  exerciseName: string;
  exerciseDescription: string | null;
  vimeoToken: string;
  tempo: string | null;
  sortOrder: number;
  sets: number;
  reps: number;
}

/**
 * Plan with nested exercises for detailed view
 * Used in GET /plans/:id response
 */
export interface PlanWithExercisesDTO extends PlanDTO {
  exercises: PlanExerciseDetailDTO[];
}

// ============================================================================
// PlanExercise DTOs
// ============================================================================

/**
 * POST /plans/:planId/exercises
 * Add an exercise to an existing plan (Trainer only)
 */
export interface AddPlanExerciseCommand {
  exerciseId: UUID;
  sortOrder: number;
  sets: number;
  reps: number;
}

/**
 * PUT /plans/:planId/exercises/:exerciseId
 * Update exercise details within a plan (Trainer only)
 */
export interface UpdatePlanExerciseCommand {
  sortOrder?: number;
  sets?: number;
  reps?: number;
}

/**
 * PlanExercise DTO for API responses
 * Transforms DB snake_case to camelCase
 */
export interface PlanExerciseDTO {
  planId: UUID;
  exerciseId: UUID;
  sortOrder: number;
  sets: number;
  reps: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ============================================================================
// Notification DTOs (placeholder for future implementation)
// ============================================================================

/**
 * GET /notifications
 * Query parameters for listing notifications
 */
export interface NotificationListQuery extends PaginationQuery {
  unread?: boolean;
}

/**
 * Notification entity (to be implemented)
 */
export interface NotificationDTO {
  id: UUID;
  userId: UUID;
  message: string;
  read: boolean;
  createdAt: ISODateTime;
}

// ============================================================================
// AuditLog DTOs (placeholder for future implementation)
// ============================================================================

/**
 * GET /audit-logs
 * Query parameters for listing audit logs
 */
export interface AuditLogListQuery extends PaginationQuery, SortQuery {
  entity?: string;
  action?: string;
  since?: ISODateTime;
}

/**
 * AuditLog entity (to be implemented)
 */
export interface AuditLogDTO {
  id: UUID;
  userId: UUID;
  entity: string;
  action: string;
  timestamp: ISODateTime;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if user is administrator
 */
export function isAdministrator(user: User): boolean {
  return user.role === "administrator";
}

/**
 * Type guard to check if user is trainer
 */
export function isTrainer(user: User): boolean {
  return user.role === "trener";
}

/**
 * Type guard to check if user is trainee
 */
export function isTrainee(user: User): boolean {
  return user.role === "podopieczny";
}
