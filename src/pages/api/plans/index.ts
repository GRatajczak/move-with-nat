// src/pages/api/plans/index.ts

import type { APIRoute } from "astro";
import { listPlans, createPlan, CreatePlanCommandSchema } from "../../../services/plans.service";
import { ListPlansQuerySchema, parseQueryParams } from "../../../lib/validation";
import { handleAPIError } from "../../../lib/api-helpers";

export const prerender = false;

/**
 * GET /api/plans
 * List plans with pagination and filtering
 *
 * Query Parameters:
 * - trainerId: string (optional) - Filter by trainer ID
 * - clientId: string (optional) - Filter by client ID
 * - visible: boolean (optional) - Filter by visibility
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Items per page (max: 100)
 * - sortBy: string (optional, default: "created_at") - Sort field
 *
 * Authorization:
 * - Admin: Can view all plans
 * - Trainer: Can view own plans only (trainer_id = user.id)
 * - Client: Can view own plans only (client_id = user.id)
 *
 * Response: 200 OK
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "Plan name",
 *       "trainerId": "uuid",
 *       "clientId": "uuid",
 *       "isHidden": false
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 100
 *   }
 * }
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const validatedQuery = ListPlansQuerySchema.parse(rawQuery);

    // Call service layer
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    const result = await listPlans(locals.supabase, validatedQuery, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST /api/plans
 * Create a new plan with exercises
 *
 * Request Body:
 * {
 *   "name": "Plan name",
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "isHidden": false,
 *   "description": "Optional description",
 *   "exercises": [
 *     {
 *       "exerciseId": "uuid",
 *       "sortOrder": 1,
 *       "sets": 3,
 *       "reps": 12,
 *       "tempo": "3-0-3",
 *       "defaultWeight": 60
 *     }
 *   ]
 * }
 *
 * Authorization:
 * - Admin: Can create plans for any trainer/client
 * - Trainer: Can create plans for self and own clients only
 * - Client: Cannot create plans
 *
 * Response: 201 Created
 * {
 *   "id": "uuid",
 *   "name": "Plan name",
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "isHidden": false
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = CreatePlanCommandSchema.parse(body);

    // Create plan
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    const result = await createPlan(locals.supabase, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

