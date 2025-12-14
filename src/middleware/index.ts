import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { UserRole } from "@/types";
import { hasRequiredRole } from "@/lib/auth.utils";

const AUTH_PAGES = ["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/activate"];
const PUBLIC_PATHS = ["/", ...AUTH_PAGES];

const ADMIN_PATH = "/admin";
const TRAINER_PATH = "/trainer";
const CLIENT_PATH = "/client";

const API_ROLES: { path: string; method: string; role: UserRole }[] = [
  // Admin permissions
  { path: "/api/exercises", method: "DELETE", role: "admin" },
  { path: "/api/reasons", method: "POST", role: "admin" },
  { path: "/api/reasons", method: "PUT", role: "admin" },
  { path: "/api/reasons", method: "DELETE", role: "admin" },
  { path: "/api/users", method: "POST", role: "admin" },
  { path: "/api/users", method: "DELETE", role: "admin" },
  { path: "/api/trainer/clients", method: "DELETE", role: "admin" },

  // Trainer permissions
  { path: "/api/exercises", method: "GET", role: "trainer" },
  { path: "/api/exercises", method: "POST", role: "trainer" },
  { path: "/api/exercises", method: "PUT", role: "trainer" },
  { path: "/api/plans", method: "POST", role: "trainer" },
  { path: "/api/plans", method: "PUT", role: "trainer" },
  { path: "/api/plans", method: "DELETE", role: "trainer" },
  { path: "/api/reasons", method: "GET", role: "trainer" },
  { path: "/api/trainer/clients", method: "GET", role: "trainer" },
  { path: "/api/trainer/clients", method: "POST", role: "trainer" },
  { path: "/api/trainer/clients", method: "PUT", role: "trainer" },

  // Client permissions
  { path: "/api/plans", method: "GET", role: "client" },
  { path: "/api/users", method: "GET", role: "client" },
  { path: "/api/users", method: "PUT", role: "client" },
];

const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/invite", "/api/auth/activate", "/api/auth/reset-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  if (PUBLIC_API_PATHS.some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isUserLoggedIn = !!user;

  if (!isUserLoggedIn) {
    if (!PUBLIC_PATHS.includes(url.pathname)) {
      if (url.pathname.startsWith("/api")) {
        return new Response(JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return redirect("/auth/login");
    }
    return next();
  }

  if (!user) {
    return redirect("/auth/login");
  }

  // OPTIMIZATION: Fetch all user data in one query instead of separate queries in layouts
  const { data: userDetails } = await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!userDetails?.role) {
    await supabase.auth.signOut();
    return redirect("/auth/login");
  }

  const userRole = userDetails.role as UserRole;
  locals.user = {
    id: user.id,
    email: user.email ?? "",
    role: userRole,
    firstName: userDetails.first_name ?? undefined,
    lastName: userDetails.last_name ?? undefined,
  };
  locals.supabase = supabase;

  if (url.pathname.startsWith("/api")) {
    const matchedRule = API_ROLES.find((r) => url.pathname.startsWith(r.path) && request.method === r.method);

    if (matchedRule && !hasRequiredRole(matchedRule.role, userRole)) {
      return new Response("Forbidden", { status: 403 });
    }

    return next();
  }

  if (PUBLIC_PATHS.includes(url.pathname)) {
    switch (userRole) {
      case "admin":
        return redirect(ADMIN_PATH);
      case "trainer":
        return redirect(TRAINER_PATH);
      case "client":
        return redirect(CLIENT_PATH);
      default:
        return redirect(CLIENT_PATH);
    }
  }

  if (url.pathname.startsWith(ADMIN_PATH) && userRole !== "admin") {
    return redirect("/");
  }
  if (url.pathname.startsWith(TRAINER_PATH) && userRole !== "trainer") {
    return redirect("/");
  }
  if (url.pathname.startsWith(CLIENT_PATH) && userRole !== "client") {
    return redirect("/");
  }

  return next();
});
