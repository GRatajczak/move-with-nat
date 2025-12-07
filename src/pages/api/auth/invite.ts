// src/pages/api/auth/invite.ts

import type { APIRoute } from "astro";
import { InviteUserCommandSchema } from "../../../lib/validation";
import { sendInvite } from "../../../services/auth.service";
import { handleAPIError } from "../../../lib/api-helpers";

/**
 * POST /api/auth/invite
 *
 * Send activation/invitation email to user
 *
 * @description
 * Sends an activation email with a token to the specified user.
 * The user must already exist in the database with status='pending' or status='suspended'.
 * Can be used to resend activation emails.
 *
 * @body {InviteUserCommand}
 * - email: User's email address
 * - role: User role (trainer or client)
 * - resend: Whether this is a resend request (default: false)
 *
 * @returns {MessageResponse} - Success message (202 Accepted)
 *
 * @throws {400} Validation error
 * @throws {404} User not found
 * @throws {409} User already active
 * @throws {500} Email sending failed
 */
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = InviteUserCommandSchema.parse(body);

    // Call service to send invitation
    const result = await sendInvite(locals.supabase, validated);

    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
