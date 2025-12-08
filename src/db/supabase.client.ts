import type { AstroCookies } from "astro";
import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

// Standard (anon) client for client-side and per-request server-side operations
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

// Admin client for elevated privileges on the server-side
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdminClientInstance: SupabaseClientType<Database> | null = null;
let supabaseClientInstance: SupabaseClientType<Database> | null = null;

export const getSupabaseClient = (): SupabaseClientType<Database> => {
  if (!supabaseClientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and Anon Key are required.");
    }
    supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
};

/**
 * Returns a Supabase client with admin privileges (uses service_role key).
 * This should only be used in server-side code for operations requiring elevated permissions.
 *
 * @returns {SupabaseClientType<Database>} The admin Supabase client.
 */
export const getSupabaseAdminClient = (): SupabaseClientType<Database> => {
  if (!supabaseAdminClientInstance) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase URL and Service Role Key are required for the admin client.");
    }
    supabaseAdminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClientInstance;
};

/**
 * Creates a Supabase client for server-side rendering (SSR) contexts.
 * This is designed to be used in Astro middleware or API endpoints.
 * It properly handles cookies for authentication.
 *
 * @param {any} cookies - The cookie object from the request context (e.g., Astro's `Astro.cookies`).
 * @returns {SupabaseClientType<Database>} A Supabase client configured for SSR.
 */
export const createSupabaseServerClient = ({ cookies }: { cookies: AstroCookies }): SupabaseClientType<Database> => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key) {
        return cookies.get(key)?.value;
      },
      set(key, value, options) {
        cookies.set(key, value, options);
      },
      remove(key, options) {
        cookies.delete(key, options);
      },
    },
  });
};

export type SupabaseClient = SupabaseClientType<Database>;
