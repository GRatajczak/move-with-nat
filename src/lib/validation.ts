// src/lib/validation.ts

import { z } from "zod";

/**
 * Validation schema for GET /api/exercises query parameters
 * Validates pagination and search parameters for listing exercises
 */
export const ListExercisesQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .transform((val) => val.trim())
    .optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
});

/**
 * Parses query parameters from URL
 * Converts URLSearchParams to a plain object for Zod validation
 */
export function parseQueryParams(url: URL): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}
