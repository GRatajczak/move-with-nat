// src/pages/api/plans/[planId]/exercises/[exerciseId]/completion.ts

import type { APIRoute } from "astro";
import { markExerciseCompletion } from "../../../../../../services/plan-exercises.service";
import { MarkCompletionCommandSchema } from "../../../../../../lib/validation";
import { handleAPIError } from "../../../../../../lib/api-helpers";

export const prerender = false;

/**
 * POST /api/plans/:planId/exercises/:exerciseId/completion
 * Mark an exercise as completed or not completed (with optional reason)
 *
 * Request Body:
 * {
 *   "completed": true,
 *   "reasonId": "uuid",       // optional, required if completed=false
 *   "customReason": "string"  // optional, required if completed=false
 * }
 *
 * Validation:
 * - If completed: false, either reasonId OR customReason is required
 * - If completed: true, reason fields are ignored
 *
 * Authorization:
 * - Admin: Can mark completion for any plan
 * - Trainer: No access (can't mark completion for clients)
 * - Client: Can mark only for own plans
 *
 * Response: 201 Created
 * {
 *   "planId": "uuid",
 *   "exerciseId": "uuid",
 *   "isCompleted": true,
 *   "reasonId": null,
 *   "customReason": null,
 *   "completedAt": "2025-01-20T15:30:00.000Z"
 * }
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const validatedCommand = MarkCompletionCommandSchema.parse(body);

    // Mark exercise completion
    // Using mock user for testing - using client role as this is typically done by clients
    const mockUser = { id: "test-id", role: "client" as const, email: "test@example.com" };
    const result = await markExerciseCompletion(locals.supabase, planId, exerciseId, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
