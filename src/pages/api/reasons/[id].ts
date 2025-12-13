// src/pages/api/reasons/[id].ts

import type { APIRoute } from "astro";
import { updateReason, deleteReason } from "@/services/reasons.service";
import { UpdateReasonCommandSchema } from "@/lib/validation";
import { handleAPIError } from "@/lib/api-helpers";

export const prerender = false;

/**
 * PUT /api/reasons/:id
 *
 * Updates an existing standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Request Body:
 * {
 *   "code": "updated_code",     // optional
 *   "label": "Updated label"    // optional
 * }
 *
 * Response (200):
 * {
 *   "id": "uuid",
 *   "code": "updated_code",
 *   "label": "Updated label"
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Authentication check
    if (!locals.user || !locals.supabase) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get reason ID from params
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Reason ID is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = UpdateReasonCommandSchema.parse(body);

    // Update reason
    const result = await updateReason(locals.supabase, id, validated, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/reasons/:id
 *
 * Deletes a standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Business Rules:
 * - Cannot delete a reason that is in use
 *
 * Response (204):
 * No content
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Authentication check
    if (!locals.user || !locals.supabase) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get reason ID from params
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Reason ID is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete reason
    await deleteReason(locals.supabase, id, locals.user);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
