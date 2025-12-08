import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Authentication middleware - COMMENTED OUT FOR NOW
  // Uncomment when authentication is ready
  /*
  try {
    // Get the access token from Authorization header
    const authHeader = context.request.headers.get("Authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      
      if (user && !error) {
        // Fetch full user details from the users table
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("id, email, role")
          .eq("id", user.id)
          .single();
        
        if (userData && !userError) {
          // Store user in locals for use in API routes
          context.locals.user = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
          };
        }
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    // Don't block the request, just continue without user
  }
  */

  // TEMPORARY: Mock admin user for testing
  // Remove this when authentication is enabled
  context.locals.user = {
    id: "b13d7140-3dee-47d2-b395-1c676baaffc1",
    email: "admin@example.com",
    role: "admin",
  };

  return next();
});
