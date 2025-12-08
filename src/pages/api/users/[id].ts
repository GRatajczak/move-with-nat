// src/pages/api/users/[id].ts

import type { APIRoute } from "astro";
import { getUser, updateUser, deleteUser } from "../../../services/users.service";
import { UserIdParamSchema, UpdateUserCommandSchema } from "../../../lib/validation";
import { handleAPIError } from "../../../lib/api-helpers";
import { UnauthorizedError } from "../../../lib/errors";

export const prerender = false;

/**
 * GET /api/users/:id
 * Get user details by ID
 *
 * URL Parameters:
 * - id: string (required) - User ID (UUID)
 *
 * Authorization:
 * - Administrators: Can view any user
 * - Trainers: Can view their own profile and their clients
 * - Clients: Can only view their own profile
 *
 * Response: 200 OK
 * - Returns user details
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Validate user ID parameter
    const { id: userId } = UserIdParamSchema.parse(params);

    // Get user
    const result = await getUser(locals.supabase, userId, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT /api/users/:id
 * Update user by ID
 *
 * URL Parameters:
 * - id: string (required) - User ID (UUID)
 *
 * Request Body (all fields optional):
 * - email: string - New email address (admin only)
 * - firstName: string - New first name
 * - lastName: string - New last name
 * - phone: string - Phone number
 * - dateOfBirth: string - Date of birth (YYYY-MM-DD)
 * - status: "pending" | "active" | "suspended" - User status (admin only)
 * - trainerId: string - New trainer ID (admin only, for clients)
 *
 * Authorization:
 * - All users: Can update their own profile (firstName, lastName, phone, dateOfBirth)
 * - Administrators: Can update any user and all fields
 * - Trainers: Can update their clients (limited fields)
 *
 * Response: 200 OK
 * - Returns updated user details
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Validate user ID parameter
    const { id: userId } = UserIdParamSchema.parse(params);

    // Parse and validate request body
    const body = await request.json();
    const validatedCommand = UpdateUserCommandSchema.parse(body);

    // Update user
    const result = await updateUser(locals.supabase, userId, validatedCommand, locals.user);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * DELETE /api/users/:id
 * Delete user by ID
 *
 * URL Parameters:
 * - id: string (required) - User ID (UUID)
 *
 * Authorization:
 * - Only administrators can delete users
 *
 * Response: 204 No Content
 * - Returns empty response on success
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Validate user ID parameter
    const { id: userId } = UserIdParamSchema.parse(params);

    // Delete user
    await deleteUser(locals.supabase, userId, locals.user);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
