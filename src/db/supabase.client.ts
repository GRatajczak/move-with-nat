import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

export type SupabaseClient = SupabaseClientType<Database>;

const resolveSupabaseEnv = () => {
  const overrideUrl = import.meta.env.SUPABASE_URL_OVERRIDE;
  const overrideKey = import.meta.env.SUPABASE_KEY_OVERRIDE;
  const isTestMode = import.meta.env.MODE === "test";

  const url =
    overrideUrl ?? import.meta.env.SUPABASE_URL ?? (isTestMode ? import.meta.env.SUPABASE_URL_TEST : undefined);

  const key =
    overrideKey ?? import.meta.env.SUPABASE_KEY ?? (isTestMode ? import.meta.env.SUPABASE_KEY_TEST : undefined);

  if (!url || !key) {
    throw new Error("Missing Supabase configuration. Check SUPABASE_URL/SUPABASE_KEY (or *_TEST) in env files.");
  }

  return { url, key };
};

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) {
    return [];
  }
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const { url, key } = resolveSupabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

let supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdminClient = () => {
  if (!supabaseAdmin) {
    const { url } = resolveSupabaseEnv();
    const supabaseServiceRoleKey =
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY_TEST;

    if (!url || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase URL or Service Role Key");
    }

    supabaseAdmin = createClient<Database>(url, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
};
