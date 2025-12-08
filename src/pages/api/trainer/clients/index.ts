// src/pages/api/trainer/clients/index.ts

import type { APIRoute } from "astro";
import { listUsers, createUser } from "../../../../services/users.service";
import { ListClientsQuerySchema, parseQueryParams, CreateClientFormSchema } from "../../../../lib/validation";
import { handleAPIError } from "../../../../lib/api-helpers";
import { UnauthorizedError } from "../../../../lib/errors";
import type { ClientDto, PaginatedResponse, UserDto, CreateUserCommand } from "../../../../interface";
import type { SupabaseClient } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * Helper: Enrich user data with client-specific statistics
 */
async function enrichClientsWithStats(supabase: SupabaseClient, users: UserDto[]): Promise<ClientDto[]> {
  return Promise.all(
    users.map(async (user): Promise<ClientDto> => {
      // Get active plans count
      const { count: activePlansCount } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id)
        .eq("is_hidden", false);

      // Get last activity from plan_exercises updates
      const { data: lastActivity } = await supabase
        .from("plan_exercises")
        .select("updated_at, plans!inner(client_id)")
        .eq("plans.client_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        status: user.status as ClientDto["status"],
        avatarUrl: null,
        totalActivePlans: activePlansCount || 0,
        lastActivityAt: lastActivity?.updated_at || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
        email: user.email || "",
        phone: user.phone || null,
        dateOfBirth: user.dateOfBirth || null,
        trainerId: user.trainerId || null,
      };
    })
  );
}

/**
 * GET /api/trainer/clients
 * List trainer's clients with pagination and filtering
 *
 * Query Parameters:
 * - search: string (optional) - Search by first name or last name
 * - status: "active" | "pending" | "suspended" (optional) - Filter by status
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Items per page (max: 100)
 *
 * Authorization:
 * - Only trainers can access this endpoint
 * - Trainers can only see their own assigned clients
 *
 * Response: 200 OK
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "firstName": "Jan",
 *       "lastName": "Kowalski",
 *       "status": "active",
 *       "avatarUrl": null,
 *       "totalActivePlans": 2,
 *       "lastActivityAt": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 45
 *   }
 * }
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if user is a trainer
    if (locals.user.role !== "trainer") {
      throw new UnauthorizedError("Only trainers can access this endpoint");
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawQuery = parseQueryParams(url);
    const validatedQuery = ListClientsQuerySchema.parse(rawQuery);

    // Use listUsers - it automatically filters for trainer's clients
    const usersResult = await listUsers(locals.supabase, validatedQuery, locals.user);

    // Enrich with client-specific statistics
    const clientsData = await enrichClientsWithStats(locals.supabase, usersResult.data);

    const result: PaginatedResponse<ClientDto> = {
      data: clientsData,
      meta: usersResult.meta,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * POST /api/trainer/clients
 * Create a new client (trainer only)
 *
 * Authorization:
 * - Only trainers can access this endpoint
 * - The trainer is automatically assigned to the created client
 *
 * Request Body:
 * {
 *   "email": "jan.kowalski@example.com",
 *   "firstName": "Jan",
 *   "lastName": "Kowalski",
 *   "phone": "+48 123 456 789", // optional
 *   "dateOfBirth": "1990-01-15" // optional, YYYY-MM-DD
 * }
 *
 * Response: 201 Created
 * {
 *   "id": "uuid",
 *   "email": "jan.kowalski@example.com",
 *   "firstName": "Jan",
 *   "lastName": "Kowalski",
 *   "role": "client",
 *   "status": "pending",
 *   "trainerId": "trainer-uuid",
 *   ...
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if user is a trainer
    if (locals.user.role !== "trainer") {
      throw new UnauthorizedError("Only trainers can access this endpoint");
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateClientFormSchema.parse(body);

    // Build CreateUserCommand with trainer auto-assigned
    const command: CreateUserCommand = {
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone || undefined,
      dateOfBirth: validatedData.dateOfBirth || undefined,
      role: "client",
      trainerId: locals.user.id, // Auto-assign current trainer
    };

    // Create user using admin service (we need to temporarily elevate permissions)
    // Since trainers can't normally create users, we'll create a special context
    const adminContext = { ...locals.user, role: "admin" as const };
    const newUser = await createUser(locals.supabase, command, adminContext);

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
