// src/pages/api/exercises/index.ts

import type { APIRoute } from "astro";
import { CreateExerciseCommandSchema, createExercise, listExercises } from "../../../services/exercises.service";
import { ListExercisesQuerySchema, parseQueryParams } from "../../../lib/validation";
import { handleAPIError } from "../../../lib/api-helpers";
import { UnauthorizedError } from "../../../lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const validatedQuery = ListExercisesQuerySchema.parse(rawQuery);

    const result = await listExercises(locals.supabase, validatedQuery, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    const body = await request.json();
    const validatedCommand = CreateExerciseCommandSchema.parse(body);

    const result = await createExercise(locals.supabase, validatedCommand, locals.user);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
