/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        role: Database["public"]["Enums"]["user_role"];
        email: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string; // Optional: for bypassing RLS during development
  readonly SUPABASE_URL_OVERRIDE?: string;
  readonly SUPABASE_KEY_OVERRIDE?: string;
  readonly SUPABASE_URL_TEST?: string;
  readonly SUPABASE_KEY_TEST?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY_TEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
