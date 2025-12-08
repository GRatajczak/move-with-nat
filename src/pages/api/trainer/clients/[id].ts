// src/pages/api/trainer/clients/[id].ts

import type { APIRoute } from "astro";
import { getUser, updateUser } from "../../../../services/users.service";
import { UpdateClientFormSchema } from "../../../../lib/validation";
import { handleAPIError } from "../../../../lib/api-helpers";
import { UnauthorizedError, ValidationError } from "../../../../lib/errors";
import type { UpdateUserCommand, ClientDto } from "../../../../interface";
import type { SupabaseClient } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * Helper: Get last active plan for client
 */
async function getLastActivePlan(supabase: SupabaseClient, clientId: string) {
  const { data: lastPlan } = await supabase
    .from("plans")
    .select("id, name, created_at")
    .eq("client_id", clientId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastPlan) return null;

  return {
    id: lastPlan.id,
    name: lastPlan.name,
    createdAt: lastPlan.created_at,
  };
}

/**
 * GET /api/trainer/clients/:id
 * Get client details (trainer only)
 *
 * Authorization:
 * - Only trainers can access this endpoint
 * - Trainers can only see their own assigned clients
 *
 * Response: 200 OK
 * {
 *   "id": "uuid",
 *   "email": "jan.kowalski@example.com",
 *   "firstName": "Jan",
 *   "lastName": "Kowalski",
 *   "role": "client",
 *   "status": "active",
 *   "trainerId": "trainer-uuid",
 *   ...
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if user is a trainer
    if (locals.user.role !== "trainer") {
      throw new UnauthorizedError("Only trainers can access this endpoint");
    }

    // Validate client ID
    const clientId = params.id;
    if (!clientId) {
      throw new ValidationError({ id: "Client ID is required" });
    }

    // Get user - the service will check if trainer has access to this client
    const user = await getUser(locals.supabase, clientId, locals.user);

    // Get last active plan
    const lastActivePlan = await getLastActivePlan(locals.supabase, clientId);

    // Build ClientDto with additional fields
    const client: ClientDto = {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      status: user.status as ClientDto["status"],
      avatarUrl: null,
      totalActivePlans: 0, // Will be calculated if needed
      lastActivityAt: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      trainerId: user.trainerId,
      lastActivePlan,
    };

    return new Response(JSON.stringify(client), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};

/**
 * PUT /api/trainer/clients/:id
 * Update client (trainer only)
 *
 * Authorization:
 * - Only trainers can access this endpoint
 * - Trainers can only update their own assigned clients
 * - Trainers cannot change status or trainer assignment
 *
 * Request Body:
 * {
 *   "firstName": "Jan",
 *   "lastName": "Kowalski",
 *   "phone": "+48 123 456 789", // optional
 *   "dateOfBirth": "1990-01-15" // optional, YYYY-MM-DD
 * }
 *
 * Response: 200 OK
 * {
 *   "id": "uuid",
 *   "email": "jan.kowalski@example.com",
 *   "firstName": "Jan",
 *   "lastName": "Kowalski",
 *   "role": "client",
 *   "status": "active",
 *   "trainerId": "trainer-uuid",
 *   ...
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.supabase) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if user is a trainer
    if (locals.user.role !== "trainer") {
      throw new UnauthorizedError("Only trainers can access this endpoint");
    }

    // Validate client ID
    const clientId = params.id;
    if (!clientId) {
      throw new ValidationError({ id: "Client ID is required" });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateClientFormSchema.parse(body);

    // Build UpdateUserCommand
    // Note: email is read-only in the form but included in the schema
    // We don't include it in the update command to prevent changes
    const command: UpdateUserCommand = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone || null,
      dateOfBirth: validatedData.dateOfBirth || null,
    };

    // Update user - the service will check if trainer has access to this client
    const updatedClient = await updateUser(locals.supabase, clientId, command, locals.user);

    return new Response(JSON.stringify(updatedClient), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
