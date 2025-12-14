// src/services/auth.service.ts

import type { SupabaseClient } from "../db/supabase.client";
import type {
  InviteUserCommand,
  ActivateAccountCommand,
  RequestPasswordResetCommand,
  ConfirmPasswordResetCommand,
  MessageResponse,
  TokenPayload,
} from "../types";
import { ConflictError, DatabaseError, NotFoundError, UnauthorizedError, ValidationError } from "../lib/errors";
import { sendActivationEmail, sendPasswordResetEmail } from "./email.service";

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
export function generateToken(
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
    .select("id, email, first_name, status")
    .eq("email", command.email.toLowerCase())
    .single();

  // Handle resend scenario
  if (command.resend) {
    if (error || !user) {
      throw new NotFoundError("User not found");
    }

    // Check if already active
    if (user.status === "active") {
      throw new ConflictError("User is already active");
    }
  } else {
    // New invite scenario - user must exist in database
    if (!user) {
      throw new NotFoundError("User must be created before sending invite");
    }

    if (user.status === "active") {
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
 * @throws {ConflictError} If user is already active (only for activation tokens)
 * @throws {DatabaseError} If database operation fails
 */
export async function activateAccount(
  supabase: SupabaseClient,
  command: ActivateAccountCommand
): Promise<MessageResponse> {
  // Try to verify token - it can be either activation or password-reset token
  let decoded: TokenPayload;
  try {
    decoded = verifyToken(command.token, "activation");
  } catch {
    // If it's not an activation token, try password-reset token
    decoded = verifyToken(command.token, "password-reset");
  }

  // Fetch user
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, status")
    .eq("id", decoded.userId)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError("User not found");
  }

  // Only check activation status for activation tokens
  if (decoded.purpose === "activation" && user.status === "active") {
    throw new ConflictError("Account already activated");
  }

  // If new password is provided, update it first
  if (command.newPassword) {
    await confirmPasswordReset(supabase, {
      token: command.token,
      newPassword: command.newPassword,
    });
  }

  // Only activate account for activation tokens, not for password-reset tokens
  if (decoded.purpose === "activation") {
    // Confirm the user's email in Supabase Auth
    const { error: authUserError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (authUserError) {
      console.error("Failed to confirm user email in Auth:", authUserError);
      throw new DatabaseError("Failed to confirm user email");
    }

    // Activate user (set status = 'active')
    const { error } = await supabase
      .from("users")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to activate account:", error);
      throw new DatabaseError("Failed to activate account");
    }

    return { message: "Account activated successfully" };
  } else {
    // For password-reset tokens, just update the password (already done above)
    return { message: "Password reset successfully" };
  }
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
    .select("id, email, first_name, status")
    .eq("email", command.email.toLowerCase())
    .single();

  // Always return success to prevent email enumeration
  if (!user || user.status !== "active") {
    // Log attempt but return success
    console.log(`Password reset requested for non-existent or inactive email: ${command.email}`);
    return { message: "Jeśli twój adres email istnieje w naszym systemie, otrzymasz link do resetowania hasła" };
  }

  // Generate reset token (1h expiry)
  const resetToken = generateToken(user.id, user.email, "password-reset", 1);

  // Send password reset email
  const firstName = user.first_name || "User";
  await sendPasswordResetEmail(user.email, firstName, resetToken);

  return { message: "Jeśli twój adres email istnieje w naszym systemie, otrzymasz link do resetowania hasła" };
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
  // Verify and decode token - try password-reset first, then activation
  let decoded: TokenPayload;
  try {
    decoded = verifyToken(command.token, "password-reset");
  } catch {
    // If it's not a password-reset token, try activation token
    decoded = verifyToken(command.token, "activation");
  }

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
