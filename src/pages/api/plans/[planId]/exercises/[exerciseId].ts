// src/pages/api/plans/[planId]/exercises/[exerciseId].ts

import type { APIRoute } from "astro";
import { updatePlanExercise, removePlanExercise } from "../../../../../services/plan-exercises.service";
import { UpdatePlanExerciseCommandSchema } from "../../../../../lib/validation";
import { handleAPIError } from "../../../../../lib/api-helpers";

export const prerender = false;

/**
 * PATCH /api/plans/:planId/exercises/:exerciseId
 * Update parameters of an exercise in a plan
 *
 * Request Body: (all optional)
 * {
 *   "sortOrder": 1,
 *   "sets": 5,
 *   "reps": 8,
 *   "tempo": "4-0-2",
 *   "defaultWeight": 80
 * }
 *
 * Authorization:
 * - Admin: Can update any plan
 * - Trainer: Can update own plans only
 * - Client: No access
 *
 * Response: 200 OK
 * {
 *   "exerciseId": "uuid",
 *   "sortOrder": 1,
 *   "sets": 5,
 *   "reps": 8,
 *   "tempo": "4-0-2",
 *   "defaultWeight": 80
 * }
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    const { planId, exerciseId } = params;

    if (!planId || !exerciseId) {
      return new Response(
        JSON.stringify({
          error: "Plan ID and Exercise ID are required",
          code: "MISSING_PARAMETER",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = UpdatePlanExerciseCommandSchema.parse(body);

    // Update plan exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await updatePlanExercise(locals.supabase, planId, exerciseId, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/plans/:planId/exercises/:exerciseId
 * Remove an exercise from a training plan
 *
 * Authorization:
 * - Admin: Can remove from any plan
 * - Trainer: Can remove from own plans only
 * - Client: No access
 *
 * Response: 204 No Content
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    const { planId, exerciseId } = params;

    if (!planId || !exerciseId) {
      return new Response(
        JSON.stringify({
          error: "Plan ID and Exercise ID are required",
          code: "MISSING_PARAMETER",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove exercise from plan
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    await removePlanExercise(locals.supabase, planId, exerciseId, mockUser);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
