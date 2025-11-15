// src/pages/api/exercises/[id].ts

import type { APIRoute } from "astro";
import {
  getExercise,
  updateExercise,
  deleteExercise,
  UpdateExerciseCommandSchema,
} from "../../../lib/exercises.service";
import { handleAPIError } from "../../../lib/api-helpers";
import { ValidationError } from "../../../lib/errors";

export const prerender = false;

/**
 * GET /api/exercises/:id
 * Gets a single exercise by ID
 * All authenticated users can access, but non-admins cannot see hidden exercises
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    // Validate params
    const { id } = params;
    if (!id) {
      throw new ValidationError({ id: "Exercise ID is required" });
    }

    // Get exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    const result = await getExercise(locals.supabase, id, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT /api/exercises/:id
 * Updates an existing exercise (admin only)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    // Validate params
    const { id } = params;
    if (!id) {
      throw new ValidationError({ id: "Exercise ID is required" });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = UpdateExerciseCommandSchema.parse(body);

    // Update exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    const result = await updateExercise(locals.supabase, id, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/exercises/:id
 * Deletes an exercise (soft delete by default, hard delete with ?hard=true)
 * Admin only
 */
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    // AUTHENTICATION DISABLED FOR TESTING
    // Check authentication
    // if (!locals.user || !locals.supabase) {
    //   throw new UnauthorizedError("Authentication required");
    // }

    // Validate params
    const { id } = params;
    if (!id) {
      throw new ValidationError({ id: "Exercise ID is required" });
    }

    // Check for hard delete flag
    const url = new URL(request.url);
    const hard = url.searchParams.get("hard") === "true";

    // Delete exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    await deleteExercise(locals.supabase, id, mockUser, hard);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleAPIError(error);
  }
};
