// src/pages/api/plans/[id].ts

import type { APIRoute } from "astro";
import { getPlan, updatePlan, deletePlan } from "../../../services/plans.service";
import { handleAPIError } from "../../../lib/api-helpers";
import { parseQueryParams, UpdatePlanCommandSchema } from "../../../lib/validation";
import { z } from "zod";

export const prerender = false;

/**
 * GET /api/plans/:id
 * Get a single plan by ID with exercises
 *
 * URL Parameters:
 * - id: string (required) - Plan UUID
 *
 * Authorization:
 * - Admin: Can view any plan
 * - Trainer: Can view own plans only
 * - Client: Can view own plans only
 *
 * Response: 200 OK
 * {
 *   "id": "uuid",
 *   "name": "Plan name",
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "isHidden": false,
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
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const planId = params.id;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required", code: "VALIDATION_ERROR" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get plan
    const result = await getPlan(locals.supabase, planId, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT /api/plans/:id
 * Update an existing plan (metadata and/or exercises)
 *
 * URL Parameters:
 * - id: string (required) - Plan UUID
 *
 * Request Body (all fields optional):
 * {
 *   "name": "Updated name",
 *   "description": "Updated description",
 *   "isHidden": false,
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "exercises": [
 *     {
 *       "exerciseId": "uuid",
 *       "sortOrder": 1,
 *       "sets": 4,
 *       "reps": 10,
 *       "tempo": "4-0-2",
 *       "defaultWeight": 70
 *     }
 *   ]
 * }
 *
 * Authorization:
 * - Admin: Can update any plan
 * - Trainer: Can update own plans only
 * - Client: Cannot update plans
 *
 * Response: 200 OK
 * {
 *   "id": "uuid",
 *   "name": "Updated name",
 *   "trainerId": "uuid",
 *   "clientId": "uuid",
 *   "isHidden": false
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const planId = params.id;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required", code: "VALIDATION_ERROR" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = UpdatePlanCommandSchema.parse(body);

    // Update plan
    const result = await updatePlan(locals.supabase, planId, { ...validatedCommand, id: planId }, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/plans/:id
 * Delete a plan (soft delete by default)
 *
 * URL Parameters:
 * - id: string (required) - Plan UUID
 *
 * Query Parameters:
 * - hard: boolean (optional, default: false) - Perform hard delete if true
 *
 * Authorization:
 * - Admin: Can delete any plan
 * - Trainer: Can delete own plans only
 * - Client: Cannot delete plans
 *
 * Response: 204 No Content
 */
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const planId = params.id;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required", code: "VALIDATION_ERROR" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters for hard delete option
    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const hardDeleteSchema = z.object({
      hard: z.coerce.boolean().default(false),
    });
    const { hard } = hardDeleteSchema.parse(rawQuery);

    // Delete plan
    await deletePlan(locals.supabase, planId, locals.user, hard);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
