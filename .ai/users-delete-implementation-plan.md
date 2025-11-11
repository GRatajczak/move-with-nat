# API Endpoint Implementation Plan: DELETE /users/:id

## Przegląd

Endpoint DELETE /users/:id służy do usuwania użytkowników (soft delete - oznaczenie jako hidden). Tylko administratorzy mają dostęp.

## Request

- **Method:** DELETE
- **URL:** `/api/users/:id`
- **Query Params:** `?hard=true` (optional, physical delete)
- **Auth:** Admin only

## Response

- **204 No Content** (empty body)
- Alternative: **200 OK** with `{"message": "User deleted successfully"}`

## Authorization

- **Admin**: ✅ Full access
- **Trainer**: ❌ No access
- **Client**: ❌ No access

## Validation Rules

- Cannot delete self (optional safety rule)
- Cannot delete last admin
- Cannot delete trainer with active trainees
- Hard delete requires no related data

## Implementation

```typescript
export async function deleteUser(
  supabase: SupabaseClient,
  userId: string,
  currentUser: User,
  hard: boolean = false
): Promise<void> {
  // Authorization
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only administrators can delete users");
  }

  // Validate UUID
  if (!isValidUUID(userId)) {
    throw new ValidationError({ id: "Invalid UUID format" });
  }

  // Fetch target user
  const { data: targetUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single();

  if (fetchError || !targetUser) {
    throw new NotFoundError("User not found");
  }

  if (targetUser.is_hidden && !hard) {
    throw new NotFoundError("User not found");
  }

  // Cannot delete self
  if (targetUser.id === currentUser.id) {
    throw new ForbiddenError("Cannot delete your own account");
  }

  // Cannot delete last admin
  if (targetUser.role === "admin") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_hidden", false);

    if (count <= 1) {
      throw new ForbiddenError("Cannot delete the last administrator");
    }
  }

  // Trainer with trainees check
  if (targetUser.role === "trainer") {
    const { count: traineeCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client")
      .eq("trainer_id", userId)
      .eq("is_hidden", false);

    if (traineeCount > 0) {
      throw new ConflictError("Cannot delete trainer with active trainees", {
        traineeCount,
      });
    }
  }

  // Execute delete
  if (hard) {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      if (error.code === "23503") {
        throw new ConflictError("Cannot delete user with related data");
      }
      throw new DatabaseError("Failed to delete user");
    }
  } else {
    const { error } = await supabase
      .from("users")
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new DatabaseError("Failed to delete user");
    }
  }

  // Audit log
  console.log({
    timestamp: new Date().toISOString(),
    action: hard ? "USER_HARD_DELETE" : "USER_SOFT_DELETE",
    actorId: currentUser.id,
    targetUserId: userId,
  });
}
```

## API Route Handler

```typescript
// src/pages/api/users/[id].ts

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user || !locals.supabase) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: userId } = UserIdParamSchema.parse(params);
    const url = new URL(request.url);
    const hard = url.searchParams.get("hard") === "true";

    await deleteUser(locals.supabase, userId, locals.user, hard);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

## Error Responses

- **400**: Invalid UUID format
- **401**: Unauthorized (no JWT)
- **403**: Forbidden (not admin, self-delete, last admin)
- **404**: User not found
- **409**: Conflict (trainer with trainees)
- **500**: Internal server error

## Testing

```bash
# Soft delete user
curl -X DELETE "http://localhost:4321/api/users/{user_id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content

# Hard delete user
curl -X DELETE "http://localhost:4321/api/users/{user_id}?hard=true" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 204 No Content

# Non-admin tries to delete (should fail)
curl -X DELETE "http://localhost:4321/api/users/{user_id}" \
  -H "Authorization: Bearer {trainer_jwt}"
# Expected: 403 Forbidden

# Delete trainer with trainees (should fail)
curl -X DELETE "http://localhost:4321/api/users/{trainer_id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 409 Conflict

# Delete last admin (should fail)
curl -X DELETE "http://localhost:4321/api/users/{only_admin_id}" \
  -H "Authorization: Bearer {admin_jwt}"
# Expected: 403 Forbidden
```

## Key Points

✅ Soft delete by default (is_hidden=true)  
✅ Hard delete optional (?hard=true)  
✅ Cannot delete self  
✅ Cannot delete last admin  
✅ Cannot delete trainer with trainees  
✅ Audit logging  
✅ Foreign key cascade for hard delete

## Security Considerations

- Admin-only access
- Self-delete protection
- Last admin protection
- Referential integrity checks
- Audit trail

## Edge Cases

- Already deleted user: 404
- Concurrent delete: handled by DB
- Trainer with trainees: 409 Conflict
- Plans cascade delete on hard delete
