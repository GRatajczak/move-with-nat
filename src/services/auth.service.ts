// src/services/auth.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type {
  InviteUserCommand,
  ActivateAccountCommand,
  RequestPasswordResetCommand,
  ConfirmPasswordResetCommand,
  MessageResponse,
} from "../types";
import { ConflictError, DatabaseError, NotFoundError, UnauthorizedError, ValidationError } from "../lib/errors";
import { sendActivationEmail, sendPasswordResetEmail } from "./email.service";

/**
 * JWT token payload for activation and password reset
 */
interface TokenPayload {
  userId: string;
  email: string;
  purpose: "activation" | "password-reset";
  exp: number;
}

/**
 * Generate JWT token for activation or password reset
 * For MVP: using base64 encoding. In production, use proper JWT library with signing
 *
 * @param userId - User ID
 * @param email - User email
 * @param purpose - Token purpose (activation or password-reset)
 * @param expiryHours - Token expiry in hours (24h for activation, 1h for reset)
 * @returns JWT-like token string
 */
function generateToken(
  userId: string,
  email: string,
  purpose: "activation" | "password-reset",
  expiryHours: number
): string {
  const payload: TokenPayload = {
    userId,
    email,
    purpose,
    exp: Math.floor(Date.now() / 1000) + expiryHours * 3600,
  };

  // MVP: simple base64 encoding
  // TODO: Replace with proper JWT library (jsonwebtoken or jose) with signing
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Verify and decode token
 *
 * @param token - Token string to verify
 * @param expectedPurpose - Expected token purpose
 * @returns Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
function verifyToken(token: string, expectedPurpose: "activation" | "password-reset"): TokenPayload {
  try {
    // MVP: decode base64
    // TODO: Use proper JWT verification with signature check
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString()) as TokenPayload;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      throw new UnauthorizedError("Token has expired");
    }

    // Check purpose
    if (decoded.purpose !== expectedPurpose) {
      throw new UnauthorizedError("Invalid token purpose");
    }

    return decoded;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Invalid token format");
  }
}

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns true if password meets requirements
 */
function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

/**
 * Send activation/invitation email to user
 *
 * POST /api/auth/invite
 *
 * @param supabase - Supabase client instance
 * @param command - Invite command with email, role, and resend flag
 * @returns Success message
 *
 * @throws {NotFoundError} If user not found (when resend=true or user must exist)
 * @throws {ConflictError} If user is already active
 * @throws {EmailError} If email sending fails
 */
export async function sendInvite(supabase: SupabaseClient, command: InviteUserCommand): Promise<MessageResponse> {
  // Fetch user by email
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, first_name, is_active")
    .eq("email", command.email.toLowerCase())
    .single();

  // Handle resend scenario
  if (command.resend) {
    if (error || !user) {
      throw new NotFoundError("User not found");
    }

    // Check if already active
    if (user.is_active) {
      throw new ConflictError("User is already active");
    }
  } else {
    // New invite scenario - user must exist in database
    if (!user) {
      throw new NotFoundError("User must be created before sending invite");
    }

    if (user.is_active) {
      throw new ConflictError("User is already active");
    }
  }

  // Generate activation token (24h expiry)
  const activationToken = generateToken(user.id, user.email, "activation", 24);

  // Send activation email
  const firstName = user.first_name || "User";
  await sendActivationEmail(user.email, firstName, activationToken);

  return { message: "Activation link sent" };
}

/**
 * Activate user account using token from email
 *
 * POST /api/auth/activate
 *
 * @param supabase - Supabase client instance
 * @param command - Activation command with token
 * @returns Success message
 *
 * @throws {UnauthorizedError} If token is invalid or expired
 * @throws {NotFoundError} If user not found
 * @throws {ConflictError} If user is already active
 * @throws {DatabaseError} If database operation fails
 */
export async function activateAccount(
  supabase: SupabaseClient,
  command: ActivateAccountCommand
): Promise<MessageResponse> {
  // Verify and decode token
  const decoded = verifyToken(command.token, "activation");

  // Fetch user
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("id", decoded.userId)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError("User not found");
  }

  // Check if already activated
  if (user.is_active) {
    throw new ConflictError("Account already activated");
  }

  // Activate user (set is_active = true)
  const { error } = await supabase
    .from("users")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to activate account:", error);
    throw new DatabaseError("Failed to activate account");
  }

  // TODO: Send welcome email

  return { message: "Account activated" };
}

/**
 * Request password reset email
 *
 * POST /api/auth/reset-password/request
 *
 * Always returns success to prevent email enumeration
 *
 * @param supabase - Supabase client instance
 * @param command - Password reset request with email
 * @returns Success message (always, even if email doesn't exist)
 */
export async function requestPasswordReset(
  supabase: SupabaseClient,
  command: RequestPasswordResetCommand
): Promise<MessageResponse> {
  // Fetch user (but don't reveal if exists)
  const { data: user } = await supabase
    .from("users")
    .select("id, email, first_name, is_active")
    .eq("email", command.email.toLowerCase())
    .single();

  // Always return success to prevent email enumeration
  if (!user || !user.is_active) {
    // Log attempt but return success
    console.log(`Password reset requested for non-existent or inactive email: ${command.email}`);
    return { message: "If your email exists in our system, you will receive a password reset link" };
  }

  // Generate reset token (1h expiry)
  const resetToken = generateToken(user.id, user.email, "password-reset", 1);

  // Send password reset email
  const firstName = user.first_name || "User";
  await sendPasswordResetEmail(user.email, firstName, resetToken);

  return { message: "If your email exists in our system, you will receive a password reset link" };
}

/**
 * Confirm password reset using token
 *
 * POST /api/auth/reset-password/confirm
 *
 * @param supabase - Supabase client instance
 * @param command - Password reset confirmation with token and new password
 * @returns Success message
 *
 * @throws {UnauthorizedError} If token is invalid or expired
 * @throws {ValidationError} If password doesn't meet requirements
 * @throws {NotFoundError} If user not found
 * @throws {DatabaseError} If password update fails
 */
export async function confirmPasswordReset(
  supabase: SupabaseClient,
  command: ConfirmPasswordResetCommand
): Promise<MessageResponse> {
  // Verify and decode token
  const decoded = verifyToken(command.token, "password-reset");

  // Validate password strength (additional check beyond schema)
  if (!isStrongPassword(command.newPassword)) {
    throw new ValidationError({
      newPassword: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    });
  }

  // Fetch user
  const { data: user } = await supabase.from("users").select("id").eq("id", decoded.userId).single();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Update password in Supabase Auth
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: command.newPassword,
  });

  if (error) {
    console.error("Failed to update password:", error);
    throw new DatabaseError("Failed to update password");
  }

  // TODO: Send password changed confirmation email
  // TODO: Invalidate all existing sessions (optional security enhancement)

  return { message: "Password updated successfully" };
}
