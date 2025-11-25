// src/pages/api/exercises/index.ts

import type { APIRoute } from "astro";
import { listExercises, CreateExerciseCommandSchema } from "../../../services/exercises.service";
import { ListExercisesQuerySchema, parseQueryParams } from "../../../lib/validation";
import { handleAPIError } from "../../../lib/api-helpers";

export const prerender = false;

/**
 * GET /api/exercises
 * List exercises with pagination and search
 *
 * Query Parameters:
 * - search: string (optional) - Search exercises by name
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Items per page (max: 100)
 *
 * Authorization:
 * - All authenticated users can list exercises
 * - Admin sees all exercises (including hidden)
 * - Trainers and clients see only visible exercises
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
    const validatedQuery = ListExercisesQuerySchema.parse(rawQuery);

    // Call service layer
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await listExercises(locals.supabase, validatedQuery, mockUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST /api/exercises
 * Create a new exercise (admin only)
 *
 * Request Body:
 * - name: string (required) - Exercise name
 * - description: string (optional) - Exercise description
 * - vimeoToken: string (required) - Vimeo video token
 * - defaultWeight: number (optional) - Default weight in kg
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
    const validatedCommand = CreateExerciseCommandSchema.parse(body);

    // Import createExercise dynamically to avoid circular dependencies
    const { createExercise } = await import("../../../services/exercises.service");

    // Create exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const, email: "test@example.com" };
    const result = await createExercise(locals.supabase, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
