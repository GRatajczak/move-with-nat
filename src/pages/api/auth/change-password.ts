// src/pages/api/auth/change-password.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { handleAPIError } from "../../../lib/api-helpers";
import { UnauthorizedError } from "../../../lib/errors";

export const prerender = false;

// Schema for API endpoint (without confirmPassword)
const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    newPassword: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
      .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być różne od obecnego",
    path: ["newPassword"],
  });

/**
 * POST /api/auth/change-password
 * Change user password
 *
 * Request Body:
 * - currentPassword: string (required) - Current password for verification
 * - newPassword: string (required) - New password
 *
 * Authorization:
 * - User must be authenticated
 *
 * Response: 200 OK
 * - Returns success message
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Parse and validate request body
    const body = await request.json();
    const { currentPassword, newPassword } = ChangePasswordRequestSchema.parse(body);

    // Get current user from Supabase Auth
    const {
      data: { user: authUser },
      error: getUserError,
    } = await locals.supabase.auth.getUser();

    if (getUserError || !authUser?.email) {
      throw new UnauthorizedError("User not found");
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await locals.supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          message: "Obecne hasło jest nieprawidłowe",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password
    const { error: updateError } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(updateError.message || "Nie udało się zmienić hasła");
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleAPIError(error);
  }
};
