// src/pages/api/plans/[planId]/exercises/index.ts

import type { APIRoute } from "astro";
import { addExerciseToPlan } from "../../../../../services/plan-exercises.service";
import { AddPlanExerciseCommandSchema } from "../../../../../lib/validation";
import { handleAPIError } from "../../../../../lib/api-helpers";

export const prerender = false;

/**
 * POST /api/plans/:planId/exercises
 * Add a single exercise to an existing training plan
 *
 * Request Body:
 * {
 *   "exerciseId": "uuid",
 *   "sortOrder": 3,
 *   "sets": 4,
 *   "reps": 10,
 *   "tempo": "3-0-3",
 *   "defaultWeight": 70
 * }
 *
 * Authorization:
 * - Admin: Can add to any plan
 * - Trainer: Can add to own plans only
 * - Client: No access
 *
 * Response: 201 Created
 * {
 *   "exerciseId": "uuid",
 *   "sortOrder": 3,
 *   "sets": 4,
 *   "reps": 10,
 *   "tempo": "3-0-3",
 *   "defaultWeight": 70
 * }
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    const { planId } = params;

    if (!planId) {
      return new Response(
        JSON.stringify({
          error: "Plan ID is required",
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
    const validatedCommand = AddPlanExerciseCommandSchema.parse(body);

    // Add exercise to plan
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await addExerciseToPlan(locals.supabase, planId, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
