import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

// Export typed SupabaseClient for use across the application
export type SupabaseClient = BaseSupabaseClient<Database>;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// For development/testing: Use service_role key to bypass RLS if available
// For production: Always use anon key with proper authentication
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);

export const DEFAULT_USER_ID = "c8296dc9-d343-4514-a74f-ab893aad7b19";
