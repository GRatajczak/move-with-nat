// src/pages/api/auth/reset-password.ts

import type { APIRoute } from "astro";
import { getSupabaseAdminClient } from "../../../db/supabase.client";
import { requestPasswordReset } from "../../../services/auth.service";
import { handleAPIError } from "../../../lib/api-helpers";
import { z } from "zod";
import { ValidationError } from "../../../lib/errors";

const RequestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * POST /api/auth/reset-password
 *
 * Request password reset email
 *
 * @description
 * Sends a password reset email with a token to the specified user.
 * Always returns success to prevent email enumeration.
 *
 * @body {RequestPasswordResetCommand}
 * - email: User's email address
 *
 * @returns {MessageResponse} - Success message (200 OK)
 *
 * @throws {400} Validation error
 */
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = RequestPasswordResetSchema.parse(body);

    const supabaseAdmin = getSupabaseAdminClient();
    // Call service to send password reset email
    const result = await requestPasswordReset(supabaseAdmin, validated);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError(new ValidationError(error.flatten().fieldErrors));
    }
    return handleAPIError(error);
  }
};
