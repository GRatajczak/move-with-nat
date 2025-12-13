import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * E2E Test Supabase Client Fixture
 *
 * Creates a Supabase client for E2E tests using credentials from .env.test.
 * This client uses the service role key for admin access, allowing cleanup operations.
 */

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env.test. Please check .env.test.example.`);
  }
  return value;
};

export type SupabaseTestClient = ReturnType<typeof createSupabaseTestClient>;

/**
 * Create a Supabase client for E2E tests with admin privileges
 */
export const createSupabaseTestClient = () => {
  const url = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
