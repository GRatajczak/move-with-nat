// src/pages/api/reasons/index.ts

import type { APIRoute } from "astro";
import { listReasonsWithMetadata, createReason } from "@/services/reasons.service";
import { CreateReasonCommandSchema } from "@/lib/validation";
import { handleAPIError } from "@/lib/api-helpers";

export const prerender = false;

/**
 * GET /api/reasons
 *
 * Lists all standard reasons with metadata
 *
 * Authorization:
 * - All authenticated users can view reasons
 *
 * Response (200):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "code": "pain",
 *       "label": "Felt pain during exercise",
 *       "usageCount": 5,
 *       "createdAt": "2024-01-01T00:00:00Z",
 *       "updatedAt": "2024-01-01T00:00:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "total": 10,
 *     "page": 1,
 *     "limit": 10,
 *     "totalPages": 1
 *   }
 * }
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // Fetch reasons with metadata (usage count, timestamps)
    const result = await listReasonsWithMetadata(locals.supabase);

    return new Response(
      JSON.stringify({
        data: result,
        meta: {
          total: result.length,
          page: 1,
          limit: result.length,
          totalPages: 1,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST /api/reasons
 *
 * Creates a new standard reason
 *
 * Authorization:
 * - Admin only
 *
 * Request Body:
 * {
 *   "code": "equipment_unavailable",
 *   "label": "Equipment was not available"
 * }
 *
 * Response (201):
 * {
 *   "id": "uuid",
 *   "code": "equipment_unavailable",
 *   "label": "Equipment was not available"
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate request body
    const body = await request.json();
    const validated = CreateReasonCommandSchema.parse(body);

    // Create reason
    const result = await createReason(locals.supabase, validated, locals.user);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
