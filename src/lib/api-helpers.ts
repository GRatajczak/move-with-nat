// src/lib/api-helpers.ts

import { ZodError } from "zod";
import { AppError, ValidationError } from "./errors";

/**
 * Handles API errors and converts them to HTTP responses
 */
export function handleAPIError(error: unknown): Response {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.reduce(
      (acc, err) => {
        const field = err.path.join(".");
        acc[field] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    return new Response(
      JSON.stringify({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Custom application errors
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Unknown errors
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (uuid === null || uuid === undefined) {
    throw new Error("UUID cannot be null or undefined");
  }
  if (typeof uuid !== "string" || uuid === "") {
    return false;
  }

  // Special case: nil UUID (all zeros)
  if (uuid === "00000000-0000-0000-0000-000000000000") {
    return true;
  }

  // UUID format: xxxxxxxx-xxxx-Vxxx-Nxxx-xxxxxxxxxxxx
  // V = version (1-5), N = variant (8, 9, a, b for RFC 4122)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Checks if user is authenticated
 */
export function requireAuth(locals: App.Locals): asserts locals is App.Locals & {
  user: NonNullable<App.Locals["user"]>;
  supabase: NonNullable<App.Locals["supabase"]>;
} {
  if (!locals.user || !locals.supabase) {
    throw new ValidationError({ auth: "Authentication required" });
  }
}

/**
 * Checks if user has admin role
 */
export function requireAdmin(user: NonNullable<App.Locals["user"]>): void {
  if (user.role !== "admin") {
    throw new ValidationError({ role: "Administrator access required" });
  }
}

/**
 * Safely parses API error response
 * Handles both JSON and plain text responses
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const error = await response.json();
    return error.message || error.error || "Request failed";
  }
  const text = await response.text();
  return text || "Request failed";
}
