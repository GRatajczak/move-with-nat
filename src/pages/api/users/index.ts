// src/pages/api/users/index.ts

import type { APIRoute } from "astro";
import { createUser, listUsers } from "../../../services/users.service";
import { CreateUserCommandSchema, ListUsersQuerySchema, parseQueryParams } from "../../../lib/validation";
import { handleAPIError } from "../../../lib/api-helpers";
import { UnauthorizedError } from "../../../lib/errors";

export const prerender = false;

/**
 * POST /api/users
 * Create a new user (admin only)
 *
 * Request Body:
 * - email: string (required) - User email address
Użytkownik utworzony
 * - role: "admin" | "trainer" | "client" (required) - User role
 * - firstName: string (required) - User's first name
 * - lastName: string (required) - User's last name
 * - trainerId: string (required if role="client") - ID of assigned trainer
 *
 * Authorization:
 * - Only administrators can create users
 *
 * Response: 201 Created
 * - Returns created user with status "pending"
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = CreateUserCommandSchema.parse(body);

    // Create user
    const result = await createUser(locals.supabase, validatedCommand, locals.user);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * GET /api/users
 * List users with pagination and filtering
 *
 * Query Parameters:
 * - role: "admin" | "trainer" | "client" (optional) - Filter by role
 * - status: "active" | "pending" | "suspended" (optional) - Filter by status
 * - trainerId: string (optional) - Filter by trainer ID (for clients)
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Items per page (max: 100)
 *
 * Authorization:
 * - Administrators: Can see all users
 * - Trainers: Can only see their own clients (filters are forced)
 * - Clients: Cannot access this endpoint
 *
 * Response: 200 OK
 * - Returns paginated list of users with metadata
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const validatedQuery = ListUsersQuerySchema.parse(rawQuery);

    // Call service layer
    const result = await listUsers(locals.supabase, validatedQuery, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
