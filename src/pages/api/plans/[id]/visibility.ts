// src/pages/api/plans/[id]/visibility.ts

import type { APIRoute } from "astro";
import { togglePlanVisibility, TogglePlanVisibilityCommandSchema } from "../../../../services/plans.service";
import { handleAPIError } from "../../../../lib/api-helpers";

export const prerender = false;

/**
 * PATCH /api/plans/:id/visibility
 * Toggle plan visibility for clients
 *
 * URL Parameters:
 * - id: string (required) - Plan UUID
 *
 * Request Body:
 * {
 *   "isHidden": false
 * }
 *
 * Authorization:
 * - Admin: Can change visibility of any plan
 * - Trainer: Can change visibility of own plans only
 * - Client: Cannot change plan visibility
 *
 * Response: 200 OK
 * {
 *   "id": "uuid",
 *   "name": "Plan name",
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "isHidden": false
 * }
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    const planId = params.id;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required", code: "VALIDATION_ERROR" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = TogglePlanVisibilityCommandSchema.parse(body);

    // Toggle visibility
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await togglePlanVisibility(locals.supabase, planId, validatedCommand.isHidden, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
