// src/pages/api/auth/activate.ts
import type { APIRoute } from "astro";
import { getSupabaseAdminClient } from "../../../db/supabase.client";
import { activateAccount } from "../../../services/auth.service";
import type { ActivateAccountCommand } from "../../../types";
import { ConflictError, DatabaseError, NotFoundError, UnauthorizedError, ValidationError } from "../../../lib/errors";

export const POST: APIRoute = async ({ request }) => {
  try {
    const command: ActivateAccountCommand = await request.json();

    if (!command.token) {
      return new Response(
        JSON.stringify({
          error: "Token is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const result = await activateAccount(supabaseAdmin, command);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    let statusCode = 500;
    let errorMessage = "An unexpected error occurred.";

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = JSON.stringify(error.details);
    } else if (error instanceof UnauthorizedError) {
      statusCode = 401;
      errorMessage = error.message;
    } else if (error instanceof NotFoundError) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error instanceof ConflictError) {
      statusCode = 409;
      errorMessage = error.message;
    } else if (error instanceof DatabaseError) {
      statusCode = 500;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
