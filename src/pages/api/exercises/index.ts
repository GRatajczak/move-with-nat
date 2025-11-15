// src/pages/api/exercises/index.ts

import type { APIRoute } from "astro";
import { createExercise, CreateExerciseCommandSchema } from "../../../lib/exercises.service";
import { handleAPIError } from "../../../lib/api-helpers";

export const prerender = false;

/**
 * POST /api/exercises
 * Creates a new exercise (admin only)
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

    // Create exercise
    // Using mock user for testing
    const mockUser = { id: "test-id", role: "admin" as const };
    const result = await createExercise(locals.supabase, validatedCommand, mockUser);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
