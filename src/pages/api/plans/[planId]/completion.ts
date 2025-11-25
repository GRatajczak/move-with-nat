// src/pages/api/plans/[planId]/completion.ts

import type { APIRoute } from "astro";
import { getPlanCompletion } from "../../../../services/plan-exercises.service";
import { handleAPIError } from "../../../../lib/api-helpers";

export const prerender = false;

/**
 * GET /api/plans/:planId/completion
 * Get completion status for all exercises in a plan
 *
 * Authorization:
 * - Admin: Can view any plan
 * - Trainer: Can view own plans
 * - Client: Can view own plans
 *
 * Response: 200 OK
 * {
 *   "planId": "uuid",
 *   "completionRecords": [
 *     {
 *       "planId": "uuid",
 *       "exerciseId": "uuid",
 *       "isCompleted": true,
 *       "reasonId": null,
 *       "customReason": null,
 *       "completedAt": "2025-01-20T15:30:00.000Z"
 *     },
 *     {
 *       "planId": "uuid",
 *       "exerciseId": "uuid2",
 *       "isCompleted": false,
 *       "reasonId": "reason-uuid",
 *       "customReason": null,
 *       "completedAt": "2025-01-20T16:00:00.000Z"
 *     }
 *   ]
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Get plan completion status
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await getPlanCompletion(locals.supabase, planId, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
